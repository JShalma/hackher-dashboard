import type { Metadata } from "next";

import { ApplyForm } from "@/components/apply/application-form";
import { PageHeader } from "@/components/content";
import { Section } from "@/components/layout";
import { applyPrivacyNote, applyStatus } from "@/content/apply";
import { requireUser } from "@/lib/auth";

import { mapApplicationToFormValues } from "@/lib/applications/map-db-to-form";
import { defaultApplicationValues } from "@/lib/applications/application-schema";

import { getApplication, submitApplication } from "../actions";

export const metadata: Metadata = {
  title: "Application form",
  description: "Start or continue your Hack(H)er413 application.",
  robots: { index: false, follow: false },
};

/**
 * Auth-gated apply form. Open/closed comes from `applyStatus` (same toggle as
 * marketing CTAs); submit is also rejected server-side when closed.
 */
export default async function ApplyFormPage() {
  await requireUser();
  const application = await getApplication();
  const applicationFormValues = application
    ? mapApplicationToFormValues(application)
    : { ...defaultApplicationValues };

  const submissionsOpen = applyStatus.isOpen;

  return (
    <>
      <PageHeader
        title="Your application"
        lead={
          submissionsOpen
            ? "About ten minutes. Answer what you can - everything is validated before it counts."
            : applyStatus.deadline
        }
      />

      <Section spacing="md" className="pt-4 sm:pt-8">
        <ApplyForm
          onSubmit={submitApplication}
          defaultValues={applicationFormValues}
          disabled={!submissionsOpen}
          closedMessage={applyStatus.deadline}
          privacyNote={applyPrivacyNote}
        />
      </Section>
    </>
  );
}
