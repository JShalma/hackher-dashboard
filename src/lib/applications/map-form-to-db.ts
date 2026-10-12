import {
  applicationFormFields,
  type ApplicationField,
} from "@/content/application-form";

/**
 * Form field id → DB mapping (task 16).
 *
 * Core `applications` columns (form-backed):
 * - firstName, lastName, resumeUrl
 *
 * System columns (not on the form - set by server):
 * - id, clerkUserId, email, status, flagged, submittedAt, createdAt, updatedAt
 *
 * Everything else → `applications.custom_fields` JSON (keys = field ids).
 */

/** Form fields that write to dedicated columns. */
export const CORE_FORM_FIELD_IDS = [
  "firstName",
  "lastName",
  "resumeUrl",
] as const;

export type CoreFormFieldId = (typeof CORE_FORM_FIELD_IDS)[number];

/** Shape stored in `applications.custom_fields`. */
export type ApplicationCustomFields = {
  phone?: string;
  age?: string;
  gender?: string;
  levelOfStudy?: string;
  school?: string;
  schoolOther?: string;
  major?: string;
  majorOther?: string;
  dietaryRestrictions?: string[];
  dietaryNotes?: string;
  tshirtSize?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  race?: string;
  sexuality?: string;
  underrepresented?: string;
  workshopInterest?: boolean;
  workshopDetails?: string;
  projectType?: string;
  hasTeam?: string;
  howHeard?: string;
  hackherTerms?: boolean;
  mlhTerms?: boolean;
  mlhCommunications?: boolean;
};

export type ApplicationCoreFormValues = {
  firstName?: string;
  lastName?: string;
  resumeUrl?: string | null;
};

export function customKeyFor(field: ApplicationField): string {
  return field.customKey ?? field.id;
}

/** Split flat form values into core columns + customFields JSON. */
export function splitApplicationFormValues(
  values: Record<string, unknown>,
): {
  core: ApplicationCoreFormValues;
  customFields: ApplicationCustomFields;
} {
  const core: ApplicationCoreFormValues = {};
  const customFields: ApplicationCustomFields = {};

  for (const field of applicationFormFields) {
    if (!(field.id in values)) continue;
    const value = values[field.id];
    if (value === undefined) continue;

    if (field.storage === "core") {
      if (field.id === "firstName" && typeof value === "string") {
        core.firstName = value;
      } else if (field.id === "lastName" && typeof value === "string") {
        core.lastName = value;
      } else if (field.id === "resumeUrl") {
        core.resumeUrl =
          typeof value === "string" && value.length > 0 ? value : null;
      }
      continue;
    }

    const key = customKeyFor(field) as keyof ApplicationCustomFields;
    (customFields as Record<string, unknown>)[key] = value;
  }

  return { core, customFields };
}

/** Guard: every form field declares storage, and core ids match columns. */
export function assertApplicationFormDbMapping(): void {
  const coreIds = new Set<string>(CORE_FORM_FIELD_IDS);

  for (const field of applicationFormFields) {
    if (field.storage !== "core" && field.storage !== "customFields") {
      throw new Error(`Field ${field.id} has invalid storage`);
    }
    if (field.storage === "core" && !coreIds.has(field.id)) {
      throw new Error(
        `Core form field "${field.id}" is not in CORE_FORM_FIELD_IDS / applications columns`,
      );
    }
    if (field.storage === "customFields" && coreIds.has(field.id)) {
      throw new Error(
        `Field "${field.id}" is listed as core but storage is customFields`,
      );
    }
  }
}
