import type { Metadata } from "next";
import Link from "next/link";
import { cache, type ReactNode } from "react";

import { PageHeader } from "@/components/content";
import { Section } from "@/components/layout";
import { ApplicationDecisionActions } from "@/components/organizer/application-actions";
import { Button } from "@/components/ui/button";
import { applicationFormSections, applicationFormFields } from "@/content/application-form";
import { customKeyFor } from "@/lib/applications/map-form-to-db";
import {
  applicationFieldLabel,
  formatApplicationTimestamp,
  formatApplicationValue,
  safeApplicationLink,
} from "@/lib/applications/display";
import { resumeViewHref } from "@/lib/applications/resume-url";

import { getApplicationById } from "@/app/(site)/apply/actions";

// Share the authorized read between metadata and the page within this request.
const loadApplication = cache(getApplicationById);

type PageProps = {
  params: Promise<{ id: string }>;
};

function applicantName(app: { firstName: string; lastName: string; email: string }) {
  return [app.firstName, app.lastName].filter(Boolean).join(" ") || app.email;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const app = await loadApplication(id);
  return {
    title: `${applicantName(app)} · Application`,
    robots: { index: false, follow: false },
  };
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words font-medium text-foreground">
        {children}
      </dd>
    </div>
  );
}

function Timestamp({ value, empty = "Not provided" }: { value: Date | null; empty?: string }) {
  return value
    ? <time dateTime={value.toISOString()}>{formatApplicationTimestamp(value)}</time>
    : <>{empty}</>;
}

/** Organizer application detail; authorization and missing-id handling live in the loader. */
export default async function OrganizerAppDetailPage({ params }: PageProps) {
  const { id } = await params;
  const app = await loadApplication(id);
  const customFields = app.customFields ?? {};
  const coreValues: Record<string, unknown> = {
    firstName: app.firstName,
    lastName: app.lastName,
    resumeUrl: app.resumeUrl,
  };
  const knownCustomKeys = new Set(applicationFormFields
    .filter((field) => field.storage === "customFields").map(customKeyFor));
  const additionalAnswers = Object.entries(customFields)
    .filter(([key]) => !knownCustomKeys.has(key));

  return (
    <>
      <PageHeader
        title={applicantName(app)}
        lead={`Application for ${app.email}`}
      />

      <Section spacing="md" className="pt-4 sm:pt-8">
        <div className="flex max-w-3xl flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <Link href="/organizer/apps">Back to list</Link>
            </Button>
            <ApplicationDecisionActions
              clerkUserId={app.clerkUserId}
              flagged={app.flagged}
              status={app.status}
            />
          </div>
          <section aria-labelledby="application-record" className="border-t border-border pt-6">
            <h2 id="application-record" className="mb-4 text-xl font-semibold tracking-tight">Application record</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <DetailField label="Email">{app.email}</DetailField>
              <DetailField label="Status">{formatApplicationValue(app.status.charAt(0).toUpperCase() + app.status.slice(1))}</DetailField>
              <DetailField label="Created"><Timestamp value={app.createdAt} /></DetailField>
              <DetailField label="Submitted"><Timestamp value={app.submittedAt} empty="Not submitted" /></DetailField>
              <DetailField label="Last updated"><Timestamp value={app.updatedAt} /></DetailField>
              <DetailField label="Status updated"><Timestamp value={app.statusUpdatedAt} empty="Not set" /></DetailField>
              <DetailField label="Status updated by">{formatApplicationValue(app.statusUpdatedBy)}</DetailField>
              <DetailField label="Flagged">{formatApplicationValue(app.flagged)}</DetailField>
              <DetailField label="Flagged at"><Timestamp value={app.flaggedAt} empty="Not flagged" /></DetailField>
              <DetailField label="Flagged by">{formatApplicationValue(app.flaggedBy)}</DetailField>
              <DetailField label="Application ID">{app.id}</DetailField>
              <DetailField label="Clerk user ID">{app.clerkUserId}</DetailField>
            </dl>
          </section>

          {applicationFormSections.map((section) => (
            <section key={section.id} aria-labelledby={`answers-${section.id}`} className="border-t border-border pt-6">
              <h2 id={`answers-${section.id}`} className="mb-4 text-xl font-semibold tracking-tight">{section.title}</h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {section.fields.map((field) => {
                  const value = field.storage === "core"
                    ? coreValues[field.id]
                    : customFields[customKeyFor(field) as keyof typeof customFields];
                  const text = formatApplicationValue(value, field);
                  const href = field.type === "url" ? safeApplicationLink(value) : undefined;
                  // Include conditional fields even when their controlling answer changed:
                  // organizers must still be able to read every stored answer.
                  return (
                    <DetailField key={field.id} label={field.label}>
                      {href ? (
                        <a
                          href={field.id === "resumeUrl" ? resumeViewHref(href) : href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2"
                        >
                          {field.id === "resumeUrl" ? "View PDF" : text}
                        </a>
                      ) : text}
                    </DetailField>
                  );
                })}
              </dl>
            </section>
          ))}

          {additionalAnswers.length ? (
            <section aria-labelledby="additional-answers" className="border-t border-border pt-6">
              <h2 id="additional-answers" className="mb-4 text-xl font-semibold tracking-tight">Additional answers</h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {additionalAnswers.map(([key, value]) => (
                  <DetailField key={key} label={applicationFieldLabel(key)}>{formatApplicationValue(value)}</DetailField>
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </Section>
    </>
  );
}
