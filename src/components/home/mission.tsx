import { Section } from "@/components/layout";
import { homeMission } from "@/content/home";

/**
 * Mission - espresso band so honeycomb language continues past the hero.
 * Title + prose, no eyebrow kicker.
 */
export function Mission() {
  return (
    <Section tone="espresso" spacing="lg">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_1.1fr] lg:gap-20 lg:items-start">
        <h2 className="text-display text-balance text-cream">
          {homeMission.title}
        </h2>
        <div className="flex flex-col gap-5 text-lg text-cream/75 text-pretty lg:pt-2">
          {homeMission.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </Section>
  );
}
