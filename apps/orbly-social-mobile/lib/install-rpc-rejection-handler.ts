import { isRpcTransportError, warnRpcTransportError } from "@orbly/api-client";

let installed = false;

function findTransportError(args: unknown[]): unknown {
  for (const arg of args) {
    if (isRpcTransportError(arg)) return arg;
  }
  return undefined;
}

/**
 * Expo Go / arka plan: RpcError yakalanmayınca Metro'da kırmızı ERROR yerine warn.
 * Kullanıcıya LogBox gösterilmez.
 */
export function installRpcRejectionHandler() {
  if (installed) return;
  installed = true;

  const prevError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const transport = findTransportError(args);
    if (transport) {
      warnRpcTransportError(transport);
      return;
    }
    const head = typeof args[0] === "string" ? args[0] : "";
    if (/Uncaught \(in promise/i.test(head)) {
      const nested = findTransportError(args.slice(1));
      if (nested) {
        warnRpcTransportError(nested);
        return;
      }
    }
    prevError(...args);
  };
}
