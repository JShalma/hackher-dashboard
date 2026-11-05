"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { bulkUpdateApplicationStatus } from "@/app/(site)/organizer/apps/actions";
import type { DecisionStatus } from "@/lib/applications/review-status";
import { cn } from "@/lib/utils";

export type ReviewListItem = {
  id: string;
  clerkUserId: string;
  name: string;
  email: string;
  school: string;
  levelOfStudy: string;
  flagged: boolean;
  /** Accepted / Not accepted / Flagged — null means still in the open queue. */
  reviewLabel: "Accepted" | "Not accepted" | "Flagged" | null;
};

type Props = {
  apps: ReviewListItem[];
  /** Bulk actions on Submitted and Flagged review queues. */
  allowBulkDecisions: boolean;
};

export function ApplicationsReviewList({ apps, allowBulkDecisions }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  const flaggedIds = useMemo(
    () => apps.filter((app) => app.flagged).map((app) => app.clerkUserId),
    [apps],
  );

  const allSelected =
    apps.length > 0 && apps.every((app) => selected.has(app.clerkUserId));

  function toggle(clerkUserId: string, next: boolean) {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(clerkUserId);
      else copy.delete(clerkUserId);
      return copy;
    });
  }

  function selectAll(next: boolean) {
    setSelected(next ? new Set(apps.map((app) => app.clerkUserId)) : new Set());
  }

  function selectFlagged() {
    setSelected(new Set(flaggedIds));
  }

  function runBulk(status: DecisionStatus) {
    const ids = [...selected];
    if (ids.length === 0) return;
    const label = status === "accepted" ? "accept" : "deny";
    if (
      !window.confirm(
        `${label === "accept" ? "Accept" : "Deny"} ${ids.length} selected application${ids.length === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await bulkUpdateApplicationStatus(ids, status);
        setSelected(new Set());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bulk update failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {allowBulkDecisions ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || apps.length === 0}
              onClick={() => selectAll(!allSelected)}
            >
              {allSelected ? "Clear selection" : "Select all"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending || flaggedIds.length === 0}
              onClick={selectFlagged}
            >
              Select flagged ({flaggedIds.length})
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending || selected.size === 0}
              onClick={() => runBulk("accepted")}
            >
              Accept selected
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={pending || selected.size === 0}
              onClick={() => runBulk("denied")}
            >
              Deny selected
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="divide-y divide-border border-y border-border">
        {apps.map((app) => {
          const isChecked = selected.has(app.clerkUserId);
          return (
            <li key={app.id}>
              <div
                className={cn(
                  "flex items-start gap-3 py-4 sm:items-center",
                  isChecked && "bg-muted/40",
                )}
              >
                {allowBulkDecisions ? (
                  <Checkbox
                    className="mt-1 sm:mt-0"
                    checked={isChecked}
                    disabled={pending}
                    onCheckedChange={(value) =>
                      toggle(app.clerkUserId, value === true)
                    }
                    aria-label={`Select ${app.name}`}
                  />
                ) : null}
                <Link
                  href={`/organizer/apps/${app.id}`}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col gap-2 transition-colors hover:opacity-90 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
                    (app.reviewLabel === "Accepted" ||
                      app.reviewLabel === "Not accepted") &&
                      "opacity-70",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{app.name}</p>
                    <p className="mt-0.5 text-sm text-foreground">
                      {app.school}
                      <span className="text-muted-foreground">
                        {" "}
                        · {app.levelOfStudy}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {app.email}
                    </p>
                  </div>
                  {app.reviewLabel ? (
                    <p
                      className={cn(
                        "shrink-0 text-sm font-semibold tracking-wide",
                        app.reviewLabel === "Accepted" && "text-foreground",
                        app.reviewLabel === "Not accepted" && "text-foreground",
                        app.reviewLabel === "Flagged" && "text-foreground",
                      )}
                    >
                      {app.reviewLabel}
                    </p>
                  ) : null}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
