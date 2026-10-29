import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/layout";
import { PageHeader, Timeline, HexMark } from "@/components/content";
import { schedule, scheduleNote, prizeCategories } from "@/content/schedule";
import { event } from "@/content/event";
import { primaryCta } from "@/content/apply";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "The full weekend, hour by hour - ceremonies, workshops, meals, judging, and prizes.",
};

const facts = [
  { label: "Dates", value: event.dates },
  { label: "Length", value: event.duration },
  { label: "Venue", value: `${event.venue.name}, ${event.venue.org}` },
];

export default function SchedulePage() {
  return (
    <>
      <PageHeader
        title="The whole weekend, hour by hour."
        lead="24 hours of building, learning, and community. Here's how it flows."
      />

      <Section spacing="sm" className="pt-4 sm:pt-8">
        <ul className="flex list-none flex-col gap-6 sm:flex-row sm:gap-12">
          {facts.map(({ label, value }) => (
            <li key={label}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 font-medium">{value}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section spacing="lg">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          {schedule.map((day) => (
            <div key={day.label}>
              <div className="mb-8 flex items-baseline gap-3">
                <h2 className="text-display">{day.label}</h2>
                <span className="text-lead text-muted-foreground">
                  {day.date}
                </span>
              </div>
              <Timeline events={day.events} />
            </div>
          ))}
        </div>
        <p className="mt-14 text-sm text-muted-foreground">{scheduleNote}</p>
      </Section>

      <Section tone="sky" spacing="lg" className="bg-honeycomb-sky">
        <h2 className="text-display text-balance">Prizes</h2>
        <p className="mt-4 max-w-2xl text-lead text-sky-foreground/75 text-pretty">
          Winners are crowned at the closing ceremony across these categories,
          plus sponsor challenges.
        </p>
        <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {prizeCategories.map((prize) => (
            <div key={prize.title}>
              <dt className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <HexMark size="sm" tone="honey" />
                {prize.title}
              </dt>
              <dd className="mt-1 pl-[1.375rem] text-sm text-sky-foreground/70 text-pretty">
                {prize.description}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section tone="honeycomb" spacing="lg">
        <div className="flex max-w-md flex-col items-start gap-4">
          <p className="text-lg text-cream/75 text-pretty">
            Want the 2027 dates first? Join the list - we&apos;ll email you when
            applications open.
          </p>
          {primaryCta.external ? (
            <Button asChild size="xl" variant="honey">
              <a
                href={primaryCta.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {primaryCta.label}
              </a>
            </Button>
          ) : (
            <Button asChild size="xl" variant="honey">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
          )}
          <p className="text-sm text-cream/50">
            Or{" "}
            <Link
              href="/faq"
              className="underline underline-offset-4 hover:text-cream"
            >
              read the FAQ
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
