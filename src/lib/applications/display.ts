import {
  getApplicationField,
  type ApplicationField,
} from "@/content/application-form";
import type { ApplicationCustomFields } from "@/db/schema";

/** Keep false/zero distinct from unanswered fields, including historical JSON. */
export function formatApplicationValue(
  value: unknown,
  field?: ApplicationField,
): string {
  if (value == null || (typeof value === "string" && !value.trim())) {
    return "Not provided";
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value.length
      ? value.map((item) => formatApplicationValue(item, field)).join(", ")
      : "Not provided";
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  const text = String(value);
  return field?.options?.find((option) => option.value === text)?.label ?? text;
}

const UNIVERSITY_LEVELS = new Set(["undergrad", "grad", "recent_grad"]);

/** Map form values, option labels, and legacy seed strings to canonical level ids. */
function resolveLevelOfStudy(
  value: unknown,
  field?: ApplicationField,
): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const text = value.trim();
  const byValue = field?.options?.find((option) => option.value === text);
  if (byValue) return byValue.value;
  const byLabel = field?.options?.find(
    (option) => option.label.toLowerCase() === text.toLowerCase(),
  );
  if (byLabel) return byLabel.value;

  const normalized = text.toLowerCase();
  if (normalized.includes("high school")) return "high_school";
  if (normalized.includes("undergrad")) return "undergrad";
  if (normalized.includes("recent grad")) return "recent_grad";
  if (normalized === "graduate" || normalized.includes("grad")) return "grad";
  if (normalized === "other") return "other";
  return undefined;
}

/** School + level line for organizer list scanning (accept = university student). */
export function formatApplicantSchoolSummary(
  customFields: ApplicationCustomFields | null | undefined,
): {
  school: string;
  levelOfStudy: string;
  /** Only true for known non-university levels (e.g. high school). Missing data is not "not university". */
  isNotUniversityStudent: boolean;
} {
  const fields = customFields ?? {};
  const schoolField = getApplicationField("school");
  const levelField = getApplicationField("levelOfStudy");
  const schoolValue = fields.school;
  const schoolOther =
    typeof fields.schoolOther === "string" ? fields.schoolOther.trim() : "";

  const school =
    schoolValue === "other" && schoolOther
      ? schoolOther
      : formatApplicationValue(schoolValue, schoolField);

  const levelOfStudy = formatApplicationValue(fields.levelOfStudy, levelField);
  const resolvedLevel = resolveLevelOfStudy(fields.levelOfStudy, levelField);

  return {
    school,
    levelOfStudy,
    isNotUniversityStudent:
      resolvedLevel != null && !UNIVERSITY_LEVELS.has(resolvedLevel),
  };
}

export function isNotUniversityStudent(
  customFields: ApplicationCustomFields | null | undefined,
): boolean {
  return formatApplicantSchoolSummary(customFields).isNotUniversityStudent;
}

/** Sentinel written when submit auto-flags a non-university applicant. */
export const SYSTEM_FLAGGED_BY = "system";

export function applicationFieldLabel(key: string): string {
  const label = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function safeApplicationLink(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function formatApplicationTimestamp(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(value) + " (America/New_York)";
}
