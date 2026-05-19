import { Radio, Shield, Sparkles, Users } from "lucide-react";

import { Logo, OrblyWordmark } from "@/components/ui/logo";

const FEATURES = [
  {
    icon: Users,
    title: "Niş topluluklar",
    desc: "İlgi alanına göre keşfet, paylaş ve bağ kur.",
  },
  {
    icon: Radio,
    title: "Canlı yayın",
    desc: "Anlık yayınlar ve sohbetlerle arada kalma.",
  },
  {
    icon: Shield,
    title: "Güvenli oturum",
    desc: "Cihaz başına akıllı çoklu hesap yönetimi.",
  },
] as const;

const STAGGER = ["auth-delay-2", "auth-delay-3", "auth-delay-4"] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-bg-primary">
      <div className="hidden lg:flex flex-1 relative overflow-hidden border-r border-border bg-bg-primary">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-orbit/10 blur-3xl"
        />
        <div className="relative z-10 flex flex-col justify-center p-14 xl:p-20 max-w-xl">
          <Logo size="xl" linked={false} className="mb-8 auth-animate-in" />
          <div className="auth-animate-in auth-delay-1 max-w-md">
            <OrblyWordmark className="text-5xl font-black tracking-tight auth-wordmark-shine mb-4" />
            <p className="text-lg sm:text-xl text-text-secondary leading-relaxed">
              Sosyal ağın yeni hali — odaklı feed, canlı içerik ve gerçek topluluklar.
            </p>
          </div>
          <ul className="mt-12 space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className={`flex gap-4 auth-animate-in ${STAGGER[i]}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-hover border border-border">
                  <Icon className="h-5 w-5 text-accent" aria-hidden />
                </span>
                <div>
                  <p className="font-bold text-[17px]">{title}</p>
                  <p className="text-text-secondary text-[15px] mt-0.5 leading-snug">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-14 flex items-center gap-2 text-text-tertiary text-sm auth-animate-in auth-delay-5">
            <Sparkles className="h-4 w-4 text-orbit" aria-hidden />
            Binlerce toplulukta seni bekliyoruz
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center bg-bg-primary p-5 sm:p-8">
        <div className="w-full flex justify-center">{children}</div>
      </div>
    </div>
  );
}
