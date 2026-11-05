"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  flagApplication,
  updateApplicationStatus,
} from "@/app/(site)/organizer/apps/actions";
import type { DecisionStatus } from "@/lib/applications/review-status";

type Props = {
  clerkUserId: string;
  flagged: boolean;
  status: string;
};

export function ApplicationDecisionActions({
  clerkUserId,
  flagged,
  status,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  function setStatus(next: DecisionStatus) {
    run(() => updateApplicationStatus(next, clerkUserId));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        className="min-w-28"
        variant="secondary"
        disabled={pending || status === "accepted"}
        onClick={() => setStatus("accepted")}
      >
        Accept
      </Button>
      <Button
        className="min-w-28"
        variant="destructive"
        disabled={pending || status === "denied"}
        onClick={() => setStatus("denied")}
      >
        Deny
      </Button>
      <Button
        className="min-w-28"
        variant="default"
        disabled={pending}
        onClick={() => run(() => flagApplication(clerkUserId))}
      >
        {flagged ? "Unflag" : "Flag"}
      </Button>
    </div>
  );
}
