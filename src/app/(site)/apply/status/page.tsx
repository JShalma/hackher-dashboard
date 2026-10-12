import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

import { HiveAdmitTicket } from "@/components/apply/hive-admit-ticket";
import { PageHeader } from "@/components/content";
import { Section } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { emailBrand } from "@/lib/emails/chrome";

import { getApplication } from "../actions";

export const metadata: Metadata = {
  title: "Application status",
  description: "See the status of your Hack(H)er413 application.",
  robots: { index: false, follow: false },
};

type StatusPageProps = {
  searchParams: Promise<{ preview?: string }>;
};

/**
 * Auth-gated apply status (task 13).
 * Live status from the DB lands after submit/server actions.
 *
 * Preview the accepted Hive Admit reveal (design spike, no DB):
 *   /apply/status?preview=admit
 */
export default async function ApplyStatusPage({ searchParams }: StatusPageProps) {
  await requireUser();
  const application = await getApplication()
  const params = await searchParams;
  const showAdmitPreview = params.preview === "admit";

  const user = await currentUser();
  const firstName = user?.firstName?.trim() || "Alex";
  const lastName = user?.lastName?.trim() || (user?.firstName ? undefined : "Bee");

  if (showAdmitPreview) {
    return (
      <>
        <PageHeader
          title="You're in the hive"
          lead={`Preview of the acceptance reveal for ${emailBrand.name} ${emailBrand.cycleYear}. Wire this to live status later — not a real decision.`}
        />

        <Section spacing="md" className="pt-4 sm:pt-8">
          <div className="flex flex-col gap-6">
            <p className="rounded-lg border border-honey bg-honey-soft/80 px-4 py-3 text-sm text-brand">
              Design preview only (<code className="text-xs">?preview=admit</code>
              ). Organizer accept + email send still land separately.
            </p>
            <HiveAdmitTicket firstName={firstName} lastName={lastName} />
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/apply/status">Back to status stub</Link>
              </Button>
            </div>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Application status"
        lead="Signed in. Status will read from your application row once submits exist."
      />

      <Section spacing="md" className="pt-4 sm:pt-8">
        <div className="flex max-w-xl flex-col gap-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1 text-lg font-medium text-foreground">
                { application ? application.status.charAt(0).toUpperCase() + application.status.slice(1): "No application yet"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="mt-1 text-lg font-medium text-foreground">-</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="honey" size="lg">
              <Link href="/apply/form">Go to form</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/apply/status?preview=admit">Preview Hive Admit</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
