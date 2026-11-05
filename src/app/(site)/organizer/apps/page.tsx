import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/content";
import { Section } from "@/components/layout";
import {
  ApplicationsReviewList,
  type ReviewListItem,
} from "@/components/organizer/applications-review-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatApplicantSchoolSummary } from "@/lib/applications/display";
import {
  applicationReviewLabel,
  DEFAULT_REVIEW_TAB,
  REVIEW_TAB_LABELS,
  REVIEW_TAB_STATUSES,
  parseReviewTabStatus,
  type ReviewTabStatus,
} from "@/lib/applications/review-status";
import { cn } from "@/lib/utils";

import { fetchAppsList } from "@/app/(site)/organizer/apps/actions";

export const metadata: Metadata = {
  title: "Applications",
  description: "Organizer application queue.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ q?: string | string[]; status?: string | string[] }>;
};

function tabHref(status: ReviewTabStatus, query: string) {
  const params = new URLSearchParams();
  if (status !== DEFAULT_REVIEW_TAB) params.set("status", status);
  if (query) params.set("q", query);
  const qs = params.toString();
  return qs ? `/organizer/apps?${qs}` : "/organizer/apps";
}

function emptyMessage(status: ReviewTabStatus, query: string) {
  if (query) {
    return `No ${REVIEW_TAB_LABELS[status].toLowerCase()} applications match your search.`;
  }
  switch (status) {
    case "submitted":
      return "No submitted applications to review.";
    case "flagged":
      return "No flagged applications waiting for review.";
    case "accepted":
      return "No accepted applications yet.";
    case "denied":
      return "No applications marked not accepted.";
  }
}

/** Authorization lives in `fetchAppsList` (same pattern as the detail loader). */
export default async function OrganizerAppsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim();
  const status = parseReviewTabStatus(params.status);
  const { apps, counts } = await fetchAppsList(query, status);

  const listItems: ReviewListItem[] = apps.map((app) => {
    const summary = formatApplicantSchoolSummary(app.customFields);
    return {
      id: app.id,
      clerkUserId: app.clerkUserId,
      name:
        [app.firstName, app.lastName].filter(Boolean).join(" ") || app.email,
      email: app.email,
      school: summary.school,
      levelOfStudy: summary.levelOfStudy,
      flagged: app.flagged,
      reviewLabel: applicationReviewLabel(app.status, app.flagged),
    };
  });

  return (
    <>
      <PageHeader
        title="Applications"
        lead="Review submitted applications by school. Non-university applicants are auto-flagged for a quick deny pass."
      />

      <Section spacing="md" className="pt-4 sm:pt-8">
        <form action="/organizer/apps" method="get" className="mb-6 flex flex-col gap-3">
          {status !== DEFAULT_REVIEW_TAB ? (
            <input type="hidden" name="status" value={status} />
          ) : null}
          <Label htmlFor="application-search">Search by name or email</Label>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              id="application-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Name or email"
              className="h-10 w-full sm:max-w-md"
            />
            <Button type="submit">Search</Button>
            {query ? (
              <Button asChild variant="outline">
                <Link href={tabHref(status, "")}>Clear search</Link>
              </Button>
            ) : null}
          </div>
        </form>

        <nav aria-label="Application status" className="mb-6 border-b border-border">
          <ul className="flex flex-wrap gap-1">
            {REVIEW_TAB_STATUSES.map((tab) => {
              const active = tab === status;
              return (
                <li key={tab}>
                  <Link
                    href={tabHref(tab, query)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
                      active
                        ? "border-foreground font-medium text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {REVIEW_TAB_LABELS[tab]}
                    <span className="tabular-nums text-muted-foreground">
                      {counts[tab]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="mb-4 text-sm text-muted-foreground">
          {apps.length} {REVIEW_TAB_LABELS[status].toLowerCase()} application
          {apps.length === 1 ? "" : "s"}
          {query ? ` matching “${query}”` : ""}
        </p>
        {apps.length === 0 ? (
          <p className="border-y border-border py-8 text-muted-foreground">
            {emptyMessage(status, query)}
          </p>
        ) : (
          <ApplicationsReviewList
            apps={listItems}
            allowBulkDecisions={status === "submitted" || status === "flagged"}
          />
        )}
      </Section>
    </>
  );
}
