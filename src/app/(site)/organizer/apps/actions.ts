"use server";

import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireOrganizer } from "@/lib/auth";

/**
 * Organizer list read. Status update / Accept-Deny actions must also call
 * `requireOrganizer()` and enforce transition rules (task 31/37) — do not
 * add applicant-callable writes here.
 */
export async function fetchAppsList() {
  await requireOrganizer();
  return db.select().from(applications);
}
