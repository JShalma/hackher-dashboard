"use server";

import { and, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  applications,
  type ApplicationStatus,
} from "@/db/schema";
import { requireOrganizer } from "@/lib/auth";

/**
 * Organizer list read. Status update / Accept-Deny actions must also call
 * `requireOrganizer()` and enforce transition rules (task 31/37) — do not
 * add applicant-callable writes here.
 */
export async function fetchAppsList(query = "") {
  await requireOrganizer();
  const terms = query.trim().split(/\s+/).filter(Boolean);
  const filters = terms.map((term) => {
    // Treat LIKE wildcards as literal characters in names and email addresses.
    const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
    return or(
      ilike(applications.firstName, pattern),
      ilike(applications.lastName, pattern),
      ilike(applications.email, pattern),
    );
  });

  return db.select().from(applications)
    .where(and(...filters))
    .orderBy(desc(applications.createdAt), applications.id);
}

/** Decision statuses organizers may set from the review UI. */
export const DECISION_STATUSES = ["accepted", "denied", "waitlisted"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

function isDecisionStatus(status: string): status is DecisionStatus {
  return (DECISION_STATUSES as readonly string[]).includes(status);
}

export async function updateApplicationStatus(
  status: ApplicationStatus,
  clerkUserId: string,
) {
  const admin = await requireOrganizer();

  if (!isDecisionStatus(status)) {
    throw new Error("Invalid application status.");
  }

  const updated = await db
    .update(applications)
    .set({
      status,
      statusUpdatedBy: admin.userId,
      statusUpdatedAt: new Date(),
    })
    .where(eq(applications.clerkUserId, clerkUserId))
    .returning({ id: applications.id });

  if (updated.length === 0) {
    throw new Error("Application not found.");
  }

  revalidatePath("/organizer/apps", "layout");
}

export async function flagApplication(clerkUserId: string) {
  const admin = await requireOrganizer();

  const [existing] = await db
    .select({ flagged: applications.flagged })
    .from(applications)
    .where(eq(applications.clerkUserId, clerkUserId))
    .limit(1);

  if (!existing) {
    throw new Error("Application not found.");
  }

  const nextFlagged = !existing.flagged;

  await db
    .update(applications)
    .set({
      flagged: nextFlagged,
      flaggedBy: nextFlagged ? admin.userId : null,
      flaggedAt: nextFlagged ? new Date() : null,
    })
    .where(eq(applications.clerkUserId, clerkUserId));

  revalidatePath("/organizer/apps", "layout");
}
