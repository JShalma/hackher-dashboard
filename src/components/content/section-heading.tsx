import * as React from "react";

import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Center-align the block (default left). Prefer left - less template-y. */
  align?: "left" | "center";
  className?: string;
};

/**
 * Section title block. No eyebrow kicker - titles stand alone.
 */
export function SectionHeading({
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col",
        align === "center" && "mx-auto items-center text-center",
        className,
      )}
    >
      <h2 className="text-display text-balance">{title}</h2>
      {description ? (
        <p className="mt-4 text-lead text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}
