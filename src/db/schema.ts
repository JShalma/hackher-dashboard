import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { ApplicationCustomFields } from "@/lib/applications/map-form-to-db";

export type { ApplicationCustomFields };

/**
 * Application lifecycle. `draft` / `submitted` are applicant-facing;
 * decision statuses are set by organizers later.
 */
export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "accepted",
  "denied",
  "waitlisted",
]);

export type ApplicationStatus =
  (typeof applicationStatusEnum.enumValues)[number];

/**
 * One row per Clerk user.
 *
 * Form → DB (see `src/lib/applications/map-form-to-db.ts`):
 * - core form fields: firstName, lastName, resumeUrl
 * - system: clerkUserId, email, status, flagged, timestamps
 * - all other form answers: customFields JSON
 */
export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    status: applicationStatusEnum("status").notNull().default("draft"),
    customFields: jsonb("custom_fields")
      .$type<ApplicationCustomFields>()
      .notNull()
      .default({}),
    /** Resume PDF URL (Vercel Blob upload or external link). */
    resumeUrl: text("resume_url"),
    flagged: boolean("flagged").notNull().default(false),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    statusUpdatedBy: text("status_updated_by"),
    statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }),
    flaggedBy: text("flagged_by"),
    flaggedAt: timestamp("flagged_at", { withTimezone: true })
  },
  (table) => [
    index("applications_status_idx").on(table.status),
    index("applications_email_idx").on(table.email),
  ],
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
