import { auth, currentUser } from "@clerk/nextjs/server";
import { forbidden } from "next/navigation";

import {
  isOrganizerRole,
  roleFromPublicMetadata,
  type AppRole,
} from "@/lib/auth-role";

export type { AppRole };
export { isOrganizerRole, roleFromPublicMetadata };

/**
 * Require a signed-in Clerk user. Redirects to sign-in when anonymous.
 * Use in Server Components, Server Actions, and Route Handlers.
 */
export async function requireUser() {
  const { userId } = await auth.protect();
  return { userId };
}

/**
 * Require a signed-in organizer or admin. Anonymous users go to sign-in;
 * signed-in non-organizers get a 403 (`forbidden()`).
 */
export async function requireOrganizer() {
  const { userId } = await requireUser();
  const user = await currentUser();
  const role = roleFromPublicMetadata(user?.publicMetadata);

  if (!isOrganizerRole(role)) {
    forbidden();
  }

  return { userId, role };
}

/** Soft role lookup for UI (never throws). */
export async function getCurrentRole(): Promise<AppRole | undefined> {
  const user = await currentUser();
  return roleFromPublicMetadata(user?.publicMetadata);
}
