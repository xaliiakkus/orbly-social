export class RpcError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "RpcError";
  }
}

export function isRpcTransportError(error: unknown): error is RpcError {
  return error instanceof RpcError && error.status === 0;
}

const TRANSPORT_LABEL: Record<string, string> = {
  timeout: "zaman aşımı",
  connection: "bağlantı hatası",
  rpc: "RPC zaman aşımı",
};

export function warnRpcTransportError(error: unknown, action?: string): void {
  if (!isRpcTransportError(error)) return;
  const rpcErr = error;
  const detail = TRANSPORT_LABEL[rpcErr.message] ?? rpcErr.message;
  const suffix = action ? ` (${action})` : "";
  console.warn(`[Orbly socket] Geçici bağlantı sorunu${suffix}: ${detail}`);
}

export type RpcCaller = <T>(
  action: string,
  data?: Record<string, unknown>,
) => Promise<T>;

export interface SocketLike {
  connected: boolean;
  connect(): void;
  once?(event: string, listener: (...args: unknown[]) => void): void;
  off?(event: string, listener: (...args: unknown[]) => void): void;
  timeout(ms: number): {
    emit(
      event: string,
      payload: unknown,
      ack: (err: Error | null, response?: RpcResponse) => void,
    ): void;
  };
}

const CONNECT_TIMEOUT_MS = 12_000;
const RPC_ACK_TIMEOUT_MS = 20_000;

function ensureSocketConnected(socket: SocketLike): Promise<void> {
  if (socket.connected) return Promise.resolve();

  if (!socket.once || !socket.off) {
    socket.connect();
    return new Promise((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        done = true;
        reject(new RpcError(0, "timeout"));
      }, CONNECT_TIMEOUT_MS);
      const tick = () => {
        if (done) return;
        if (socket.connected) {
          done = true;
          clearTimeout(timer);
          resolve();
        } else {
          setTimeout(tick, 50);
        }
      };
      tick();
    });
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new RpcError(0, "timeout"));
    }, CONNECT_TIMEOUT_MS);

    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new RpcError(0, "connection"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.off!("connect", onConnect);
      socket.off!("connect_error", onError);
    };

    socket.once!("connect", onConnect);
    socket.once!("connect_error", onError);
    socket.connect();
  });
}

interface RpcResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
  status?: number;
}

function emitRpc<T>(
  socket: SocketLike,
  action: string,
  data: Record<string, unknown>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    socket.timeout(RPC_ACK_TIMEOUT_MS).emit("rpc", { action, data }, (err, response) => {
      if (err instanceof Error) {
        reject(new RpcError(0, "rpc"));
        return;
      }
      const res = (response ?? err) as RpcResponse | undefined;
      if (!res?.ok) {
        reject(new RpcError(res?.status ?? 500, res?.error ?? ""));
        return;
      }
      resolve(res.data as T);
    });
  });
}

/** En fazla bir yeniden deneme — çift timeout uyarısını önler */
export function socketRpc<T>(
  socket: SocketLike,
  action: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  let retried = false;

  const attempt = (): Promise<T> =>
    ensureSocketConnected(socket)
      .then(() => emitRpc<T>(socket, action, data))
      .catch((err) => {
        if (!isRpcTransportError(err) || retried) throw err;
        retried = true;
        if (socket.connected) {
          return emitRpc<T>(socket, action, data);
        }
        return ensureSocketConnected(socket).then(() => emitRpc<T>(socket, action, data));
      });

  return attempt();
}
