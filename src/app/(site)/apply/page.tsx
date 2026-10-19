import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/layout";
import { PageHeader, HexMark } from "@/components/content";
import { ApplySteps } from "@/components/apply/steps";
import { Button } from "@/components/ui/button";
import {
  applyIntro,
  applyStatus,
  applyEligibility,
  mailingListUrl,
} from "@/content/apply";

export const metadata: Metadata = {
  title: "Apply",
  description: applyIntro.lead,
};

function ApplyCta({
  isOpen,
  label,
}: {
  isOpen: boolean;
  label: string;
}) {
  return (
    <Button asChild size="xl" variant="honey">
      {isOpen ? (
        <Link href="/apply/form">{label}</Link>
      ) : (
        <a href={mailingListUrl} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      )}
    </Button>
  );
}

export default function ApplyPage() {
  const isOpen = applyStatus.isOpen;
  const ctaLabel = isOpen ? "Start your application" : "Join the mailing list";

  return (
    <>
      <PageHeader title={applyIntro.title} lead={applyIntro.lead} />

      <Section spacing="md" className="pt-4 sm:pt-8">
        <div className="flex flex-col items-start gap-4">
          <ApplyCta isOpen={isOpen} label={ctaLabel} />
          <p className="text-sm text-muted-foreground">{applyStatus.deadline}</p>
        </div>
      </Section>

      <Section tone="sky" spacing="lg" className="bg-honeycomb-sky">
        <h2 className="flex items-start gap-3 text-display text-balance">
          <HexMark size="md" tone="honey" className="mt-[0.55em]" />
          <span>How it works</span>
        </h2>
        <ApplySteps />
      </Section>

      <Section spacing="lg">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="flex items-start gap-3 text-display text-balance">
              <HexMark size="md" tone="sky" className="mt-[0.55em]" />
              <span>Who should apply</span>
            </h2>
            <p className="mt-4 pl-[1.625rem] text-lead text-muted-foreground text-pretty">
              If any of this sounds like you, we want to hear from you next
              cycle.
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {applyEligibility.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <HexMark size="sm" tone="honey" className="mt-1.5" />
                <span className="text-lg text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="honeycomb" spacing="lg">
        <div className="flex max-w-xl flex-col items-start gap-4">
          <p className="text-lg text-cream/75 text-pretty">
            {isOpen
              ? "Ten minutes on the form. Then show up and build."
              : "Applications for 2026 have closed - join the list and we'll reach out when 2027 opens."}
          </p>
          <ApplyCta isOpen={isOpen} label={ctaLabel} />
          <p className="text-sm text-cream/55">
            Questions first?{" "}
            <Link
              href="/faq"
              className="underline underline-offset-4 hover:text-cream"
            >
              Read the FAQ
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
