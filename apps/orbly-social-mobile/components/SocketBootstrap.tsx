import { useEffect } from "react";

import { getSocket } from "@/lib/socket";

/** Giriş öncesi anonim socket bağlantısını hazırla (web SessionSync gibi). */
export function SocketBootstrap() {
  useEffect(() => {
    getSocket(null);
  }, []);
  return null;
}
