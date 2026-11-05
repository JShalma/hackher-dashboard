import type { Metadata } from "next";

import { Section } from "@/components/layout";
import {
  PageHeader,
  StatGrid,
  CtaBand,
  RevealProse,
} from "@/components/content";
import { Values } from "@/components/about/values";
import { primaryCta } from "@/content/apply";
import { aboutStats } from "@/content/event";
import { aboutIntro, aboutStory } from "@/content/about";

export const metadata: Metadata = {
  title: "About",
  description: aboutIntro.lead,
};

export default function AboutPage() {
  return (
    <>
      <PageHeader title={aboutIntro.title} lead={aboutIntro.lead} />

      <Section tone="honey" spacing="md">
        <StatGrid stats={aboutStats} />
      </Section>

      <Section spacing="lg">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_1.1fr] lg:gap-16">
          <h2 className="text-display text-balance">{aboutStory.title}</h2>
          <RevealProse paragraphs={aboutStory.body} className="lg:pt-2" />
        </div>
      </Section>

      <Section tone="espresso" spacing="lg">
        <h2 className="text-display text-balance text-cream">
          What shapes the weekend
        </h2>
        <Values tone="onDark" />
      </Section>

      <CtaBand
        title="Come see what we mean."
        description="The best way to understand Hack(H)er413 is to be there. Get on the list for 2027."
        primary={primaryCta}
      />
    </>
  );
}
