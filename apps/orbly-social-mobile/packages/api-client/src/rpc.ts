export class RpcError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "RpcError";
  }
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

const CONNECT_TIMEOUT_MS = 15_000;

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
    const onError = (err: unknown) => {
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

export function socketRpc<T>(
  socket: SocketLike,
  action: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  return ensureSocketConnected(socket).then(
    () =>
      new Promise<T>((resolve, reject) => {
        socket.timeout(30_000).emit("rpc", { action, data }, (err, response) => {
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
      }),
  );
}
