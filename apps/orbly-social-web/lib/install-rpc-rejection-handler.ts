import { RpcError } from "@orbly/api-client";

let installed = false;

function findTransportError(args: unknown[]): RpcError | undefined {
  for (const arg of args) {
    if (arg instanceof RpcError && arg.status === 0) return arg;
  }
  return undefined;
}

/** RpcError promise rejections → console.warn (LogBox/overlay tetiklemez) */
export function installRpcRejectionHandler() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const prevError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const transport = findTransportError(args);
    if (transport) {
      console.warn(
        `[Orbly socket] Geçici bağlantı sorunu: ${transport.message || "rpc"}`,
      );
      return;
    }
    const head = typeof args[0] === "string" ? args[0] : "";
    if (/Uncaught \(in promise/i.test(head)) {
      const nested = findTransportError(args.slice(1));
      if (nested) {
        console.warn(`[Orbly socket] Geçici bağlantı sorunu: ${nested.message || "rpc"}`);
        return;
      }
    }
    prevError(...args);
  };
}
