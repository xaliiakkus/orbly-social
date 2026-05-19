import { AuthGuard } from "@/components/auth/auth-guard";
import { MainShell } from "@/components/layout/main-shell";
import { RealtimeBridge } from "@/components/layout/realtime-bridge";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RealtimeBridge />
      <MainShell>{children}</MainShell>
    </AuthGuard>
  );
}
