import * as React from "react";

import { Container } from "@/components/layout";

/**
 * Top-of-page header for interior pages.
 * Solid espresso band + cream type - brand surface, not a cream eyebrow stack.
 * Static markup so the H1 paints immediately on mobile (LCP).
 */
export function PageHeader({
  title,
  lead,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
}) {
  return (
    <div className="bg-espresso text-cream">
      <Container>
        <div className="max-w-3xl pt-16 pb-12 sm:pt-20 sm:pb-16">
          <h1 className="text-display-xl text-balance">{title}</h1>
          {lead ? (
            <p className="mt-5 max-w-2xl text-lead text-cream/70 text-pretty">
              {lead}
            </p>
          ) : null}
        </div>
      </Container>
    </div>
  );
}
