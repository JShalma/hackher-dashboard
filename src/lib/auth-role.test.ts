import { describe, expect, it } from "vitest";

import { isOrganizerRole, roleFromPublicMetadata } from "@/lib/auth-role";

describe("isOrganizerRole", () => {
  it("allows organizer and admin", () => {
    expect(isOrganizerRole("organizer")).toBe(true);
    expect(isOrganizerRole("admin")).toBe(true);
  });

  it("rejects attendee and unknown values", () => {
    expect(isOrganizerRole("attendee")).toBe(false);
    expect(isOrganizerRole(undefined)).toBe(false);
    expect(isOrganizerRole(null)).toBe(false);
    expect(isOrganizerRole("superuser")).toBe(false);
    expect(isOrganizerRole(1)).toBe(false);
  });
});

describe("roleFromPublicMetadata (role-gate regression)", () => {
  it("reads a valid role from Clerk publicMetadata", () => {
    expect(roleFromPublicMetadata({ role: "organizer" })).toBe("organizer");
    expect(roleFromPublicMetadata({ role: "admin" })).toBe("admin");
    expect(roleFromPublicMetadata({ role: "attendee" })).toBe("attendee");
  });

  it("rejects missing or forged metadata shapes", () => {
    expect(roleFromPublicMetadata(undefined)).toBeUndefined();
    expect(roleFromPublicMetadata(null)).toBeUndefined();
    expect(roleFromPublicMetadata({})).toBeUndefined();
    expect(roleFromPublicMetadata({ role: "Organizer" })).toBeUndefined();
    expect(roleFromPublicMetadata({ role: ["organizer"] })).toBeUndefined();
    expect(roleFromPublicMetadata("organizer")).toBeUndefined();
  });

  it("does not treat attendees as organizers", () => {
    const role = roleFromPublicMetadata({ role: "attendee" });
    expect(isOrganizerRole(role)).toBe(false);
  });
});
