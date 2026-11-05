import type { Metadata } from "next";

import { Section } from "@/components/layout";
import { PageHeader, FaqAccordion, HexMark } from "@/components/content";
import { siteConfig } from "@/lib/site";
import { faq, faqIntro } from "@/content/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description: faqIntro.lead,
};

export default function FaqPage() {
  return (
    <>
      <PageHeader title={faqIntro.title} lead={faqIntro.lead} />

      <Section spacing="lg" className="pt-4 sm:pt-8">
        <div className="flex flex-col gap-14">
          {faq.map((category, i) => (
            <div
              key={category.name}
              className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_1fr] lg:gap-12"
            >
              <h2 className="text-sm font-medium text-muted-foreground lg:pt-4">
                {category.name}
              </h2>
              <FaqAccordion items={category.items} idPrefix={`faq-${i}`} />
            </div>
          ))}
        </div>
      </Section>

      <Section tone="espresso" spacing="lg">
        <p className="flex items-start gap-3 text-lg text-cream/75 text-pretty">
          <HexMark size="sm" tone="honey" className="mt-1.5" />
          <span>
            Still stuck? We&apos;re real people -{" "}
            <a
              href={siteConfig.social.email}
              className="font-medium text-cream underline underline-offset-4 hover:text-honey"
            >
              email us
            </a>{" "}
            anytime.
          </span>
        </p>
      </Section>
    </>
  );
}
