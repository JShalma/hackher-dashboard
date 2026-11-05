"use server";

import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  applications,
  type ApplicationStatus,
} from "@/db/schema";
import {
  isNotUniversityStudent,
  SYSTEM_FLAGGED_BY,
} from "@/lib/applications/display";
import {
  isDecisionStatus,
  type ReviewTabStatus,
} from "@/lib/applications/review-status";
import { requireOrganizer } from "@/lib/auth";

const BULK_LIMIT = 100;

function searchFilters(query: string): SQL[] {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  return terms.map((term) => {
    // Treat LIKE wildcards as literal characters in names and email addresses.
    const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
    return or(
      ilike(applications.firstName, pattern),
      ilike(applications.lastName, pattern),
      ilike(applications.email, pattern),
    )!;
  });
}

function statusFilter(status: ReviewTabStatus): SQL {
  // Flagged queue = still needs a decision (exclude already accepted/denied).
  if (status === "flagged") {
    return and(
      eq(applications.flagged, true),
      eq(applications.status, "submitted"),
    )!;
  }
  // Legacy waitlisted rows surface under Not accepted.
  if (status === "denied") {
    return inArray(applications.status, ["denied", "waitlisted"]);
  }
  return eq(applications.status, status);
}

export type AppsListCounts = Record<ReviewTabStatus, number>;

/** Flag known non-university rows that are not flagged yet (idempotent). */
async function syncNonUniversityFlags(
  apps: (typeof applications.$inferSelect)[],
) {
  const toFlag = apps.filter(
    (app) => !app.flagged && isNotUniversityStudent(app.customFields),
  );
  if (toFlag.length === 0) return apps;

  const now = new Date();
  await db
    .update(applications)
    .set({
      flagged: true,
      flaggedBy: SYSTEM_FLAGGED_BY,
      flaggedAt: now,
    })
    .where(
      inArray(
        applications.id,
        toFlag.map((app) => app.id),
      ),
    );

  const flaggedIds = new Set(toFlag.map((app) => app.id));
  return apps.map((app) =>
    flaggedIds.has(app.id)
      ? { ...app, flagged: true, flaggedBy: SYSTEM_FLAGGED_BY, flaggedAt: now }
      : app,
  );
}

/**
 * Organizer list read. Status update / Accept-Deny actions must also call
 * `requireOrganizer()` and enforce transition rules (task 31/37) — do not
 * add applicant-callable writes here.
 */
export async function fetchAppsList(
  query = "",
  status: ReviewTabStatus = "submitted",
) {
  await requireOrganizer();
  const filters = searchFilters(query);

  const searchWhere = filters.length ? and(...filters) : undefined;

  const [rawApps, countRows, flaggedCountRows] = await Promise.all([
    db
      .select()
      .from(applications)
      .where(and(statusFilter(status), ...filters))
      .orderBy(desc(applications.createdAt), applications.id),
    db
      .select({
        status: applications.status,
        total: count(),
      })
      .from(applications)
      .where(searchWhere)
      .groupBy(applications.status),
    db
      .select({ total: count() })
      .from(applications)
      .where(
        and(
          eq(applications.flagged, true),
          eq(applications.status, "submitted"),
          ...filters,
        ),
      ),
  ]);

  const apps = await syncNonUniversityFlags(rawApps);

  const counts: AppsListCounts = {
    submitted: 0,
    flagged: Number(flaggedCountRows[0]?.total ?? 0),
    accepted: 0,
    denied: 0,
  };
  for (const row of countRows) {
    if (row.status === "waitlisted") {
      counts.denied += Number(row.total);
      continue;
    }
    if (row.status === "submitted" || row.status === "accepted" || row.status === "denied") {
      counts[row.status] = Number(row.total);
    }
  }

  return { apps, counts };
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

export async function bulkUpdateApplicationStatus(
  clerkUserIds: string[],
  status: ApplicationStatus,
) {
  const admin = await requireOrganizer();

  if (!isDecisionStatus(status)) {
    throw new Error("Invalid application status.");
  }

  const ids = [...new Set(clerkUserIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return { updated: 0 };
  }
  if (ids.length > BULK_LIMIT) {
    throw new Error(`You can update at most ${BULK_LIMIT} applications at once.`);
  }

  const updated = await db
    .update(applications)
    .set({
      status,
      statusUpdatedBy: admin.userId,
      statusUpdatedAt: new Date(),
    })
    .where(inArray(applications.clerkUserId, ids))
    .returning({ id: applications.id });

  revalidatePath("/organizer/apps", "layout");
  return { updated: updated.length };
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
