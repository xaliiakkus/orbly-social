import { useDeviceAccountsStore } from "@/lib/device-accounts-store";
import { applyAccountSession } from "@/lib/switch-account";
import { useAuthStore } from "@/lib/auth-store";
import { clearAddAccountFlow, getReturnUserId } from "@/lib/add-account-flow";

export async function cancelAddAccount(): Promise<{ path: string }> {
  const returnId = await getReturnUserId();
  await clearAddAccountFlow();

  const current = useAuthStore.getState().user;
  if (returnId && current?.id === returnId) {
    return { path: "/(tabs)" };
  }

  if (returnId) {
    const account = useDeviceAccountsStore
      .getState()
      .accounts.find((a) => a.userId === returnId);
    if (account) {
      applyAccountSession(account);
      return { path: "/(tabs)" };
    }
  }

  if (useAuthStore.getState().isAuthenticated()) {
    return { path: "/(tabs)" };
  }

  return { path: "/login" };
}
