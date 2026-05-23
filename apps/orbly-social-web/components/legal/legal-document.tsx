import type { LegalSection } from "@/lib/legal-content";
import { LEGAL_META } from "@/lib/legal-content";

export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <article className="w-full max-w-2xl text-left">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          Son güncelleme: {LEGAL_META.lastUpdated} · {LEGAL_META.productName}
        </p>
        <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">{intro}</p>
      </header>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-6">
            <h2 className="text-lg font-bold text-text-primary mb-3">{section.title}</h2>
            {section.paragraphs.map((p, i) => (
              <p
                key={`${section.id}-p-${i}`}
                className="text-[15px] leading-relaxed text-text-secondary mb-3 last:mb-0"
              >
                {p}
              </p>
            ))}
            {section.bullets?.length ? (
              <ul className="list-disc pl-5 space-y-2 text-[15px] leading-relaxed text-text-secondary">
                {section.bullets.map((item) => (
                  <li key={item.slice(0, 40)}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="mt-10 pt-6 border-t border-border text-sm text-text-tertiary">
        Sorularınız için:{" "}
        <a href={`mailto:${LEGAL_META.contactEmail}`} className="text-accent hover:underline">
          {LEGAL_META.contactEmail}
        </a>
      </footer>
    </article>
  );
}
