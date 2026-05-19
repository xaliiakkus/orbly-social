import { useRealtimeSync } from "@orbly/features";

import { useAuthStore } from "@/lib/auth-store";
import { getSocket } from "@/lib/socket";

/** Web RealtimeBridge karşılığı — global socket olayları → React Query */
export function RealtimeBridge() {
  useRealtimeSync(
    () => {
      const token = useAuthStore.getState().accessToken;
      if (!token) return null;
      return getSocket(token);
    },
    () => useAuthStore.getState().user?.id ?? null,
  );
  return null;
}
