import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/content";
import { Section } from "@/components/layout";
import { requireOrganizer } from "@/lib/auth";

import { fetchAppsList } from "@/app/(site)/organizer/apps/actions";

export const metadata: Metadata = {
  title: "Applications",
  description: "Organizer application queue.",
  robots: { index: false, follow: false },
};

/** Placeholder rows until the queue reads live DB data (task 22). */
const STUB_APPS = [
  {
    id: "stub-1",
    name: "Alex Rivera",
    email: "alex@example.com",
    status: "submitted",
  },
  {
    id: "stub-2",
    name: "Jordan Lee",
    email: "jordan@example.com",
    status: "waitlisted",
  },
  {
    id: "stub-3",
    name: "Sam Patel",
    email: "sam@example.com",
    status: "accepted",
  },
] as const;

/**
 * Organizer-gated applications list stub (task 15).
 * Non-organizers hit `forbidden()` → 403.
 */
export default async function OrganizerAppsPage() {
  await requireOrganizer();
  const appLst = await fetchAppsList();

  return (
    <>
      <PageHeader
        title="Applications"
        lead="Organizer queue stub - fake rows for layout. Live data comes later."
      />

      <Section spacing="md" className="pt-4 sm:pt-8">
        <ul className="divide-y divide-border border-y border-border">
          {appLst.map((app) => (
            <li key={app.id}>
              <Link
                href={`/organizer/apps/${app.id}`}
                className="flex flex-col gap-1 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div>
                  <p className="font-medium text-foreground">{app.firstName} {app.lastName}</p>
                  <p className="text-sm text-muted-foreground">{app.email}</p>
                </div>
                <p className="text-sm capitalize text-muted-foreground">
                  {app.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
