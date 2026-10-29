import type { Metadata } from "next";
import Link from "next/link";

import { Section } from "@/components/layout";
import { PageHeader, OrganizerCard, RevealGrid } from "@/components/content";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { team, teamIntro } from "@/content/team";

export const metadata: Metadata = {
  title: "Team",
  description: teamIntro.lead,
};

export default function TeamPage() {
  return (
    <>
      <PageHeader title={teamIntro.title} lead={teamIntro.lead} />

      <Section spacing="lg" className="pt-4 sm:pt-8">
        <div className="flex flex-col gap-12">
          {team.map((group) => {
            const featured = group.name === "Directors";
            return (
              <div key={group.name}>
                <h2
                  className={
                    featured
                      ? "mb-6 text-center text-sm font-medium text-muted-foreground"
                      : "mb-6 text-sm font-medium text-muted-foreground"
                  }
                >
                  {group.name}
                </h2>
                <RevealGrid
                  className={
                    featured
                      ? "flex flex-wrap justify-center gap-x-12 gap-y-10"
                      : // Shared track: 2-up until lg, then 4-up so fours fill a row (no 3+1 orphan).
                        "grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12"
                  }
                >
                  {group.members.map((member) => (
                    <OrganizerCard
                      key={member.name}
                      organizer={member}
                      featured={featured}
                    />
                  ))}
                </RevealGrid>
              </div>
            );
          })}
        </div>
      </Section>

      <Section tone="honeycomb" spacing="lg">
        <div className="flex max-w-lg flex-col items-start gap-4">
          <h2 className="text-display text-balance">
            Want to organize with us?
          </h2>
          <p className="text-cream/70 text-pretty">
            Mentors, volunteers, and future organizers - email us and we&apos;ll
            point you to the right place.
          </p>
          <div>
            <Button asChild size="xl" variant="honey">
              <a href={siteConfig.social.email}>Email the team</a>
            </Button>
          </div>
          <p className="text-sm text-cream/50">
            Or{" "}
            <Link
              href="/sponsors"
              className="underline underline-offset-4 hover:text-cream"
            >
              see our sponsors
            </Link>
            .
          </p>
        </div>
      </Section>
    </>
  );
}
