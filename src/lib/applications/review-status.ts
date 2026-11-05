/** Organizer review queue tabs (URL `?status=`). */
export const REVIEW_TAB_STATUSES = [
  "submitted",
  "flagged",
  "accepted",
  "denied",
] as const;

export type ReviewTabStatus = (typeof REVIEW_TAB_STATUSES)[number];

export const REVIEW_TAB_LABELS: Record<ReviewTabStatus, string> = {
  submitted: "Submitted",
  flagged: "Flagged",
  accepted: "Accepted",
  denied: "Not accepted",
};

export const DEFAULT_REVIEW_TAB: ReviewTabStatus = "submitted";

/** Decision statuses organizers may set from the review UI. */
export type DecisionStatus = "accepted" | "denied";

export const DECISION_STATUSES: readonly DecisionStatus[] = [
  "accepted",
  "denied",
];

export function isReviewTabStatus(value: string): value is ReviewTabStatus {
  return (REVIEW_TAB_STATUSES as readonly string[]).includes(value);
}

export function isDecisionStatus(value: string): value is DecisionStatus {
  return (DECISION_STATUSES as readonly string[]).includes(value);
}

export function parseReviewTabStatus(
  value: string | string[] | undefined,
): ReviewTabStatus {
  const raw = typeof value === "string" ? value : undefined;
  return raw && isReviewTabStatus(raw) ? raw : DEFAULT_REVIEW_TAB;
}

/** Obvious list label for organizers after a decision (or flagged pending review). */
export function applicationReviewLabel(
  status: string,
  flagged: boolean,
): "Accepted" | "Not accepted" | "Flagged" | null {
  if (status === "accepted") return "Accepted";
  if (status === "denied" || status === "waitlisted") return "Not accepted";
  if (flagged) return "Flagged";
  return null;
}
