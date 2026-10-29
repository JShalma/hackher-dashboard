"use client"

import { Button } from "@/components/ui/button";
import { updateApplicationStatus, flagApplication, Status } from "@/app/(site)/organizer/apps/actions";

type Props = {
  actionName: string,
  userId: string;
  status: Status;
};

export function ChangeUserStatusButton({
  actionName,
  userId,
  status,
}: Props) { 
    return (
    <Button className="min-w-28" variant={status === 'accepted' ? 'secondary' : 'destructive'} onClick={() => updateApplicationStatus(status, userId)}>
      {actionName}
    </Button>
  );
}

export function FlagUserButton({
  userId,
}: { userId: string }) { 
    return (
    <Button className="min-w-28" variant="default" onClick={() => flagApplication(userId)}>
      Flag
    </Button>
  );
}