import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { LegalDocument } from "@/components/legal/legal-document";
import { KVKK_INTRO, KVKK_SECTIONS } from "@/lib/legal-content";

export const metadata = {
  title: "KVKK Aydınlatma Metni — Orbly",
};

export default function KvkkPage() {
  return (
    <div className="w-full max-w-2xl">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-2 text-[15px] font-bold text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Giriş / kayıt
      </Link>
      <div className="max-h-[min(78vh,900px)] overflow-y-auto overscroll-contain pr-1 scrollbar-thin">
        <LegalDocument
          title="KVKK Aydınlatma Metni"
          intro={KVKK_INTRO}
          sections={KVKK_SECTIONS}
        />
      </div>
    </div>
  );
}
