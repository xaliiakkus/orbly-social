import { Rocket } from "lucide-react";
import Link from "next/link";

export function ExploreFeaturedCard() {
  return (
    <Link
      href="/orbits"
      className="block mx-4 mt-3 mb-1 rounded-2xl border border-border overflow-hidden bg-bg-secondary hover:bg-bg-hover/40 transition-colors"
    >
      <div className="h-[140px] flex items-center justify-center bg-orbit/10">
        <Rocket className="h-12 w-12 text-orbit" />
      </div>
      <div className="p-3.5 space-y-1">
        <p className="text-[13px] text-text-secondary">Orbly · Keşfet</p>
        <p className="text-[18px] font-extrabold text-text-primary">Orbit topluluklarına katıl</p>
        <p className="text-[14px] leading-snug text-text-secondary">
          Nişlerde trend gönderileri ve canlı sohbet
        </p>
      </div>
    </Link>
  );
}
