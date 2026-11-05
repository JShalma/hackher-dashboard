import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  protect: vi.fn(),
  currentUser: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  updateWhere: vi.fn(),
  returning: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: { protect: session.protect },
  currentUser: session.currentUser,
}));
vi.mock("next/navigation", () => ({
  forbidden: () => {
    throw new Error("403");
  },
}));
vi.mock("next/cache", () => ({
  revalidatePath: session.revalidatePath,
}));
vi.mock("@/db", () => ({
  db: {
    select: session.select,
    update: session.update,
  },
}));

import {
  flagApplication,
  updateApplicationStatus,
} from "@/app/(site)/organizer/apps/actions";

beforeEach(() => {
  vi.clearAllMocks();
  session.protect.mockResolvedValue({ userId: "user_reviewer" });
  session.currentUser.mockResolvedValue({ publicMetadata: { role: "organizer" } });
  session.select.mockReturnValue({ from: session.from });
  session.from.mockReturnValue({ where: session.where });
  session.where.mockReturnValue({ limit: session.limit });
  session.update.mockReturnValue({ set: session.set });
  session.set.mockReturnValue({ where: session.updateWhere });
  session.updateWhere.mockReturnValue({ returning: session.returning });
  session.returning.mockResolvedValue([{ id: "11111111-1111-4111-8111-111111111111" }]);
});

describe("updateApplicationStatus", () => {
  it.each(["accepted", "denied", "waitlisted"] as const)(
    "allows decision status %s and records audit fields",
    async (status) => {
      await updateApplicationStatus(status, "user_priya");

      expect(session.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status,
          statusUpdatedBy: "user_reviewer",
          statusUpdatedAt: expect.any(Date),
        }),
      );
      expect(session.revalidatePath).toHaveBeenCalledWith("/organizer/apps", "layout");
    },
  );

  it.each(["draft", "submitted"] as const)("rejects non-decision status %s", async (status) => {
    await expect(updateApplicationStatus(status, "user_priya")).rejects.toThrow(
      "Invalid application status.",
    );
    expect(session.update).not.toHaveBeenCalled();
  });

  it("rejects missing applications", async () => {
    session.returning.mockResolvedValue([]);
    await expect(updateApplicationStatus("accepted", "missing")).rejects.toThrow(
      "Application not found.",
    );
  });

  it("requires an organizer", async () => {
    session.currentUser.mockResolvedValue({ publicMetadata: { role: "attendee" } });
    await expect(updateApplicationStatus("accepted", "user_priya")).rejects.toThrow("403");
    expect(session.update).not.toHaveBeenCalled();
  });
});

describe("flagApplication", () => {
  it("flags an unflagged application and records who flagged it", async () => {
    session.limit.mockResolvedValue([{ flagged: false }]);

    await flagApplication("user_priya");

    expect(session.set).toHaveBeenCalledWith({
      flagged: true,
      flaggedBy: "user_reviewer",
      flaggedAt: expect.any(Date),
    });
    expect(session.revalidatePath).toHaveBeenCalledWith("/organizer/apps", "layout");
  });

  it("unflags a flagged application and clears audit fields", async () => {
    session.limit.mockResolvedValue([{ flagged: true }]);

    await flagApplication("user_priya");

    expect(session.set).toHaveBeenCalledWith({
      flagged: false,
      flaggedBy: null,
      flaggedAt: null,
    });
  });

  it("rejects missing applications", async () => {
    session.limit.mockResolvedValue([]);
    await expect(flagApplication("missing")).rejects.toThrow("Application not found.");
    expect(session.update).not.toHaveBeenCalled();
  });

  it("requires an organizer", async () => {
    session.currentUser.mockResolvedValue({ publicMetadata: { role: "attendee" } });
    await expect(flagApplication("user_priya")).rejects.toThrow("403");
    expect(session.select).not.toHaveBeenCalled();
  });
});
