"use server";

import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { applyStatus } from "@/content/apply";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { applicationSchema } from "@/lib/applications/application-schema";
import { splitApplicationFormValues } from "@/lib/applications/map-form-to-db";
import { requireOrganizer, requireUser } from "@/lib/auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Load or create the signed-in user's own application row (never another user's). */
export async function getApplication() {
  const { userId } = await requireUser();

  const [existingApplication] = await db
    .select()
    .from(applications)
    .where(eq(applications.clerkUserId, userId))
    .limit(1);

  if (existingApplication) {
    return existingApplication;
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  if (!email || !user) {
    throw new Error("A valid email address is required.");
  }

  // Clerk profile names are optional; the apply form collects/requires them on submit.
  const [newApplication] = await db
    .insert(applications)
    .values({
      clerkUserId: userId,
      email,
      firstName: user.firstName?.trim() || "",
      lastName: user.lastName?.trim() || "",
    })
    .onConflictDoNothing({
      target: applications.clerkUserId,
    })
    .returning();

  if (newApplication) {
    return newApplication;
  }

  const [concurrentApplication] = await db
    .select()
    .from(applications)
    .where(eq(applications.clerkUserId, userId))
    .limit(1);
  if (!concurrentApplication) {
    throw new Error("Unable to create or retrieve your application");
  }
  return concurrentApplication;
}

/** Organizer-only read by id. Applicants cannot fetch arbitrary apps this way. */
export async function getApplicationById(applicationId: string) {
  await requireOrganizer();

  if (!UUID_RE.test(applicationId)) {
    notFound();
  }

  const [currentApp] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!currentApp) {
    notFound();
  }

  return currentApp;
}

/**
 * Submit the signed-in user's draft only.
 * Own-row updates: clerkUserId + id + status=draft in the WHERE clause.
 * Organizer status transitions live in a separate action (not here).
 */
export async function submitApplication(values: Record<string, unknown>) {
  const { userId } = await requireUser();

  if (!applyStatus.isOpen) {
    throw new Error("Applications are currently closed.");
  }

  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Application is incomplete.";
    throw new Error(message);
  }

  if (parsed.data.hackherTerms !== true || parsed.data.mlhTerms !== true) {
    throw new Error("You must accept the required agreements to submit.");
  }

  const { core, customFields } = splitApplicationFormValues(parsed.data);

  const [existingApplication] = await db
    .select()
    .from(applications)
    .where(eq(applications.clerkUserId, userId))
    .limit(1);

  if (!existingApplication) {
    throw new Error("No application found to submit.");
  }

  if (existingApplication.status !== "draft") {
    throw new Error("This application has already been submitted.");
  }

  const submittedAt = new Date();
  const [updated] = await db
    .update(applications)
    .set({
      ...core,
      customFields,
      status: "submitted",
      submittedAt,
      updatedAt: submittedAt,
    })
    .where(
      and(
        eq(applications.clerkUserId, userId),
        eq(applications.id, existingApplication.id),
        eq(applications.status, "draft"),
      ),
    )
    .returning({ id: applications.id });

  if (!updated) {
    throw new Error("Unable to submit application. Please try again.");
  }

  redirect("/apply/status");
}
