import * as React from "react";
import Link from "next/link";

import { Section } from "@/components/layout";
import { Button } from "@/components/ui/button";

export type CtaLink = {
  label: string;
  href: string;
  external?: boolean;
};

type CtaBandProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  primary: CtaLink;
};

/**
 * Closing call-to-action on espresso + honeycomb lattice.
 * Single CTA, left-aligned - not a centered SaaS dual-button band.
 */
export function CtaBand({ title, description, primary }: CtaBandProps) {
  const button = (
    <Button asChild size="xl" variant="honey">
      {primary.external ? (
        <a href={primary.href} target="_blank" rel="noopener noreferrer">
          {primary.label}
        </a>
      ) : (
        <Link href={primary.href}>{primary.label}</Link>
      )}
    </Button>
  );

  return (
    <Section tone="honeycomb" spacing="lg">
      <div className="flex max-w-xl flex-col items-start gap-6">
        <h2 className="text-display text-balance">{title}</h2>
        {description ? (
          <p className="text-lead text-cream/75 text-pretty">{description}</p>
        ) : null}
        <div>{button}</div>
      </div>
    </Section>
  );
}
