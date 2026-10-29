import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/content";
import { Section } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { requireOrganizer } from "@/lib/auth";
import { resumeViewHref } from "@/lib/applications/resume-url";

import { getApplicationById } from "@/app/(site)/apply/actions";
import { ChangeUserStatusButton, FlagUserButton } from "@/components/ui/button-wrapper";

const STUB_APPS: Record<
  string,
  { name: string; email: string; status: string; school: string }
> = {
  "stub-1": {
    name: "Alex Rivera",
    email: "alex@example.com",
    status: "submitted",
    school: "UMass Amherst",
  },
  "stub-2": {
    name: "Jordan Lee",
    email: "jordan@example.com",
    status: "waitlisted",
    school: "Smith College",
  },
  "stub-3": {
    name: "Sam Patel",
    email: "sam@example.com",
    status: "accepted",
    school: "Mount Holyoke",
  },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const app = STUB_APPS[id];
  return {
    title: app ? app.name : "Application",
    robots: { index: false, follow: false },
  };
}

/**
 * Organizer-gated application detail stub (task 15).
 */
export default async function OrganizerAppDetailPage({ params }: PageProps) {
  await requireOrganizer();
  
  const { id } = await params;
  const app = await getApplicationById(id);
  if (!app) notFound();

  return (
    <>
      <PageHeader
        title={`${app.firstName} ${app.lastName}` }
        lead="Detail stub - core + customFields will render here from the DB."
      />

      <Section spacing="md" className="pt-4 sm:pt-8">
        <div className="flex max-w-xl flex-col gap-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-1 font-medium text-foreground">{app.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1 font-medium capitalize text-foreground">
                {app.status}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">School</dt>
              <dd className="mt-1 font-medium text-foreground">
                {typeof app.customFields?.school === "string"
                  ? app.customFields.school
                  : null}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Resume</dt>
              <dd className="mt-1 font-medium text-foreground">
                {app.resumeUrl ? (
                  <a
                    href={resumeViewHref(app.resumeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    View PDF
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not provided</span>
                )}
              </dd>
            </div>
          </dl>
           <div className="flex flex-wrap items-center justify-end gap-3">

            <Button asChild variant="outline" className="min-w-28">
              <Link href="/organizer/apps">Back to list</Link>
            </Button>
            <ChangeUserStatusButton actionName="Accept" userId={app.clerkUserId} status="accepted" />
            <ChangeUserStatusButton actionName="Deny" userId={app.clerkUserId} status="denied" />
            <FlagUserButton userId={app.clerkUserId} />
           </div>
        </div>
      </Section>
    </>
  );
}
