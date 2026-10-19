/** Roles stored on Clerk `publicMetadata.role` (see .env.example). */
export type AppRole = "attendee" | "organizer" | "admin";

export function isOrganizerRole(role: unknown): role is "organizer" | "admin" {
  return role === "organizer" || role === "admin";
}

/**
 * Pure role parser for Clerk `publicMetadata` (unit-tested).
 * Organizer routes must reject anyone who is not organizer|admin.
 */
export function roleFromPublicMetadata(metadata: unknown): AppRole | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const role = (metadata as { role?: unknown }).role;
  if (role === "attendee" || role === "organizer" || role === "admin") {
    return role;
  }
  return undefined;
}
