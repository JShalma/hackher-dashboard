import type { Metadata } from "next";

import { Section } from "@/components/layout";
import {
  PageHeader,
  ProjectCard,
  CtaBand,
  RevealGrid,
} from "@/components/content";
import {
  projectYears,
  projectYearOrder,
  projectsCta,
} from "@/content/projects";
import { primaryCta } from "@/content/apply";

export const metadata: Metadata = {
  title: "Winners",
  description:
    "The standout projects built at Hack(H)er413 - a look at what our hackers made over one weekend.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="What our hackers built."
        lead="A weekend, an idea, and a room full of people cheering you on. Here are the projects that stood out."
      />

      <Section
        tone="sky"
        spacing="lg"
        className="bg-honeycomb-sky pt-4 sm:pt-8"
      >
        <div className="flex flex-col gap-16">
          {projectYearOrder.map((year) => {
            const group = projectYears.find((y) => y.year === year);
            if (!group || group.projects.length === 0) return null;

            return (
              <div key={year}>
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-sky-foreground/70">
                    {year} winners
                  </h2>
                </div>
                <RevealGrid className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.projects.map((project, index) => (
                    <ProjectCard
                      key={project.name}
                      project={project}
                      priority={year === projectYearOrder[0] && index === 0}
                    />
                  ))}
                </RevealGrid>
              </div>
            );
          })}
        </div>
      </Section>

      <CtaBand
        title={projectsCta.title}
        description={projectsCta.description}
        primary={primaryCta}
      />
    </>
  );
}
