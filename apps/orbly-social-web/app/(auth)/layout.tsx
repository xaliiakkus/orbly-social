import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-bg-secondary border-r border-border p-12">
        <div className="max-w-md">
          <Logo size="xl" linked={false} className="mb-6" />
          <h1 className="text-4xl font-bold mb-4">Orbly</h1>
          <p className="text-xl text-text-secondary leading-relaxed">
            Niş topluluklarda keşfet, paylaş ve bağlan.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">{children}</div>
    </div>
  );
}
