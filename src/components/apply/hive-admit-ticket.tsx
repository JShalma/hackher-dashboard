"use client";

import * as React from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { emailBrand } from "@/lib/emails/chrome";
import { cn } from "@/lib/utils";

export type HiveAdmitTicketProps = {
  firstName: string;
  lastName?: string;
  role?: string;
  /** When true, skip entrance and show the settled ticket. */
  preferReducedMotion?: boolean;
  className?: string;
};

/**
 * Interactive Hive Admit card for the applicant status page.
 * Email keeps the static PNG; this is the celebratory dashboard reveal.
 */
export function HiveAdmitTicket({
  firstName,
  lastName,
  role = "Hacker",
  preferReducedMotion = false,
  className,
}: HiveAdmitTicketProps) {
  const [playId, setPlayId] = React.useState(0);
  const name = [firstName.trim() || "Hacker", lastName?.trim()]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div
        key={playId}
        className={cn(
          "relative overflow-hidden rounded-2xl bg-espresso px-3 py-6 sm:px-6 sm:py-8",
          "bg-honeycomb shadow-[0_18px_50px_rgba(0,0,0,0.25)]",
        )}
      >
        <div
          className={cn(
            "relative mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border-[3px] border-gold bg-cream shadow-lg sm:flex-row",
            !preferReducedMotion && "animate-hive-admit-in",
          )}
        >
          {/* Main panel */}
          <div className="relative flex flex-1 flex-col justify-between gap-6 p-5 sm:gap-8 sm:p-7">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-1/3 h-28 bg-gradient-to-b from-transparent via-honey-soft/80 to-transparent"
            />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/brand/bee-mark.png"
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="size-10 sm:size-12"
                  style={{ imageRendering: "pixelated" }}
                />
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-bold tracking-tight text-espresso sm:text-lg">
                    Hack(H)er413
                    <span className="ml-2 text-sm font-normal text-brand/60">
                      {emailBrand.cycleYear}
                    </span>
                  </p>
                  <p className="text-[0.7rem] font-bold tracking-[0.28em] text-gold">
                    HIVE ADMIT
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full bg-espresso px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.18em] text-cream sm:text-xs",
                  !preferReducedMotion && "animate-hive-admit-badge",
                )}
              >
                YOU&apos;RE IN
              </span>
            </div>

            <div className="relative flex flex-col gap-1">
              <p className="text-xs font-bold tracking-[0.28em] text-brand/55">
                POLLINATOR
              </p>
              <p className="text-3xl font-bold tracking-tight text-espresso sm:text-4xl md:text-5xl">
                {name}
              </p>
            </div>

            <div className="relative grid grid-cols-3 gap-3 border-t-2 border-sky pt-4 sm:gap-6">
              {[
                { label: "DATE", value: emailBrand.eventDatesShort },
                { label: "CLASS", value: role.toUpperCase() },
                { label: "VENUE", value: "UMass Amherst" },
              ].map((field) => (
                <div key={field.label} className="flex flex-col gap-1">
                  <span className="text-[0.65rem] font-bold tracking-[0.2em] text-brand/55">
                    {field.label}
                  </span>
                  <span className="text-xs font-bold text-espresso sm:text-sm">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Perforation */}
          <div
            aria-hidden
            className="relative hidden w-7 flex-col items-center justify-between bg-gradient-to-r from-cream to-honey-soft py-2 sm:flex"
          >
            <span className="absolute -top-3 size-7 rounded-full bg-espresso" />
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className="h-3.5 w-1 rounded-full bg-brand/30"
              />
            ))}
            <span className="absolute -bottom-3 size-7 rounded-full bg-espresso" />
          </div>

          {/* Stub */}
          <div className="flex w-full flex-col items-center justify-center gap-3 bg-honey-soft px-4 py-6 sm:w-44 sm:py-4">
            <div
              className={cn(
                "relative flex size-[7.5rem] items-center justify-center",
                !preferReducedMotion && "animate-hive-admit-stamp",
              )}
            >
              <svg
                viewBox="0 0 120 132"
                className="absolute inset-0 size-full drop-shadow-sm"
                aria-hidden
              >
                <polygon
                  points="60,4 114,34 114,98 60,128 6,98 6,34"
                  fill="var(--color-honey)"
                  stroke="var(--color-gold)"
                  strokeWidth="4"
                />
              </svg>
              <div className="relative flex flex-col items-center gap-1">
                <Image
                  src="/brand/bee-mark.png"
                  alt=""
                  width={32}
                  height={32}
                  unoptimized
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="text-2xl font-bold tracking-wide text-espresso">
                  IN
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5 text-center">
              <span className="text-[0.65rem] font-bold tracking-[0.28em] text-brand/60">
                KEEP THIS
              </span>
              <span className="text-sm font-bold text-espresso">
                Pass to the hive
              </span>
            </div>
          </div>
        </div>
      </div>

      {!preferReducedMotion ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPlayId((n) => n + 1)}
          >
            Replay admit
          </Button>
        </div>
      ) : null}
    </div>
  );
}
