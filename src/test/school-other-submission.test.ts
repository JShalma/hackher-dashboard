import { renderToStaticMarkup } from "react-dom/server";
import { zodResolver } from "@hookform/resolvers/zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Application } from "@/db/schema";
import { applicationFixture } from "./application-fixture";

const boundary = vi.hoisted(() => ({
  protect: vi.fn(), currentUser: vi.fn(), redirect: vi.fn(),
  select: vi.fn(), selectWhere: vi.fn(), limit: vi.fn(),
  update: vi.fn(), set: vi.fn(), updateWhere: vi.fn(), returning: vi.fn(),
  isOpen: true,
}));

// Never import the real database client or load .env.local in this suite.
vi.mock("@/db", () => ({ db: { select: boundary.select, update: boundary.update } }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: { protect: boundary.protect }, currentUser: boundary.currentUser,
}));
vi.mock("next/navigation", () => ({
  redirect: boundary.redirect,
  forbidden: () => { throw new Error("403"); },
  notFound: () => { throw new Error("404"); },
}));
// Test-only dependency fixture: no application settings or source flags change.
// Most cases exercise an open window; a separate case verifies the closed gate.
vi.mock("@/content/apply", () => ({
  applyStatus: { get isOpen() { return boundary.isOpen; } },
}));
vi.mock("@/components/layout", async () => ({
  ...await import("@/components/layout/container"),
  ...await import("@/components/layout/section"),
}));
vi.mock("@/components/content", async () => import("@/components/content/page-header"));
vi.mock("@/components/organizer/application-actions", () => ({
  ApplicationDecisionActions: () => null,
}));

import { applicationSchema } from "@/lib/applications/application-schema";
import { splitApplicationFormValues } from "@/lib/applications/map-form-to-db";
import { submitApplicationLimiter } from "@/lib/rate-limit";
import { submitApplication } from "@/app/(site)/apply/actions";
import DetailPage from "@/app/(site)/organizer/apps/[id]/page";

const customSchool = "Test University of Massachusetts";
const applicantId = "user_school_other_integration";
const redirectSignal = new Error("test redirect");
let saved: Application;

function formInput(): Record<string, unknown> {
  // Flat values represent the applicant form's actual submitted value shape.
  // This is deliberately not built from the organizer page or storage mapper.
  return {
    firstName: "SchoolOtherTest", lastName: "Integration", age: "21",
    gender: "non_binary", levelOfStudy: "undergrad", school: "other",
    schoolOther: customSchool, major: "computer_science",
    dietaryRestrictions: ["vegetarian"], tshirtSize: "m",
    hackherTerms: true, mlhTerms: true,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  submitApplicationLimiter.reset();
  boundary.isOpen = true;
  // No school answers are pre-seeded: the detail view can receive them only
  // from the patch produced by the real submission handler.
  saved = applicationFixture({
    clerkUserId: applicantId, email: "school-other-integration@example.test",
    firstName: "", lastName: "", customFields: {}, resumeUrl: null,
    status: "draft", submittedAt: null,
  });
  boundary.protect.mockResolvedValue({ userId: applicantId });
  boundary.currentUser.mockResolvedValue({ publicMetadata: { role: "attendee" } });
  boundary.select.mockReturnValue({
    from: vi.fn().mockReturnValue({ where: boundary.selectWhere }),
  });
  boundary.selectWhere.mockReturnValue({ limit: boundary.limit });
  boundary.limit.mockImplementation(async () => [structuredClone(saved)]);
  boundary.update.mockReturnValue({ set: boundary.set });
  boundary.set.mockReturnValue({ where: boundary.updateWhere });
  boundary.updateWhere.mockReturnValue({ returning: boundary.returning });
  boundary.returning.mockImplementation(async () => {
    // Store ONLY the actual update payload, never reconstruct school answers
    // from formInput(). This keeps a dropped field from passing via the mock.
    const patch = boundary.set.mock.lastCall?.[0] as Partial<Application>;
    saved = { ...saved, ...structuredClone(patch) };
    return [{ id: saved.id }];
  });
  boundary.redirect.mockImplementation(() => { throw redirectSignal; });
});

function renderedField(html: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(
    `<dt\\b[^>]*>${escaped}</dt>\\s*<dd\\b[^>]*>([\\s\\S]*?)</dd>`,
  ));
  expect(match, `Missing detail field: ${label}`).not.toBeNull();
  return match![1].replace(/<[^>]*>/g, "");
}

async function submitAndReadAsOrganizer(input: Record<string, unknown>) {
  // Next's redirect throws after a successful save. Check the exact sentinel
  // so validation/DB errors cannot be mistaken for a successful redirect.
  await expect(submitApplication(input)).rejects.toBe(redirectSignal);
  expect(boundary.redirect).toHaveBeenCalledExactlyOnceWith("/apply/status");
  expect(boundary.set).toHaveBeenCalledTimes(1);
  expect(boundary.returning).toHaveBeenCalledTimes(1);
  expect(saved.status).toBe("submitted");
  expect(saved.submittedAt).toBeInstanceOf(Date);

  boundary.protect.mockResolvedValue({ userId: "user_school_other_reviewer" });
  boundary.currentUser.mockResolvedValue({ publicMetadata: { role: "organizer" } });
  const readsBefore = boundary.select.mock.calls.length;
  const html = renderToStaticMarkup(await DetailPage({
    params: Promise.resolve({ id: saved.id }),
  }));
  expect(boundary.select).toHaveBeenCalledTimes(readsBefore + 1);
  return html;
}

describe("School = Other submission integration (mocked database)", () => {
  it("validates and maps both school values into customFields", () => {
    const parsed = applicationSchema.parse(formInput());
    const mapped = splitApplicationFormValues(parsed);
    expect(mapped.customFields).toMatchObject({ school: "other", schoolOther: customSchool });
    expect(mapped.core).not.toHaveProperty("school");
    expect(mapped.core).not.toHaveProperty("schoolOther");
  });

  it("preserves both school values through the real handler and organizer loader/render", async () => {
    const html = await submitAndReadAsOrganizer(formInput());
    const patch = boundary.set.mock.calls[0][0];
    expect(patch.customFields).toMatchObject({ school: "other", schoolOther: customSchool });
    expect(saved.customFields).toMatchObject({ school: "other", schoolOther: customSchool });
    expect(renderedField(html, "School")).toBe("Other");
    expect(renderedField(html, "School (other)")).toBe(customSchool);
    expect(renderedField(html, "First name")).toBe("SchoolOtherTest");
    expect(renderedField(html, "Last name")).toBe("Integration");
  });

  it.each(["", "   ", undefined])(
    "rejects an empty/missing custom name (%s) with a field-specific error before saving",
    async (schoolOther) => {
      const input = formInput();
      if (schoolOther === undefined) delete input.schoolOther;
      else input.schoolOther = schoolOther;
      const result = applicationSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (result.success) throw new Error("Expected missing custom school name to fail validation");
      expect(result.error.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: ["schoolOther"], message: "School (other) is required." }),
      ]));
      // This is the same resolver used by ApplyForm; FieldError receives the
      // schoolOther error rather than an unrelated form-level error.
      const resolved = await zodResolver(applicationSchema)(input, {}, {
        fields: {}, shouldUseNativeValidation: false,
      });
      expect(resolved.errors.schoolOther).toMatchObject({ message: "School (other) is required." });
      await expect(submitApplication(input)).rejects.toThrow("School (other) is required.");
      expect(boundary.select).not.toHaveBeenCalled();
      expect(boundary.update).not.toHaveBeenCalled();
      expect(boundary.redirect).not.toHaveBeenCalled();
      expect(saved.status).toBe("draft");
    },
  );

  it("rejects null as an invalid submitted text value without updating the database", async () => {
    const input = { ...formInput(), schoolOther: null };
    const result = applicationSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (result.success) throw new Error("Expected null schoolOther to fail validation");
    expect(result.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ["schoolOther"] }),
    ]));
    await expect(submitApplication(input)).rejects.toThrow(result.error.issues[0].message);
    expect(boundary.select).not.toHaveBeenCalled();
    expect(boundary.update).not.toHaveBeenCalled();
    expect(boundary.redirect).not.toHaveBeenCalled();
    expect(saved.status).toBe("draft");
  });

  it.each(["", "   ", undefined])("allows a listed school with custom name %s", async (schoolOther) => {
    const input = formInput();
    input.school = "umass_amherst";
    if (schoolOther === undefined) delete input.schoolOther;
    else input.schoolOther = schoolOther;
    const html = await submitAndReadAsOrganizer(input);
    expect(saved.customFields.school).toBe("umass_amherst");
    if (schoolOther === undefined) expect(saved.customFields).not.toHaveProperty("schoolOther");
    else expect(saved.customFields.schoolOther).toBe(schoolOther);
    expect(renderedField(html, "School")).toBe("University of Massachusetts Amherst");
    expect(renderedField(html, "School (other)")).toBe("Not provided");
  });

  it("still rejects submissions during a closed window before any database access", async () => {
    boundary.isOpen = false;
    await expect(submitApplication(formInput())).rejects.toThrow("Applications are currently closed.");
    expect(boundary.select).not.toHaveBeenCalled();
    expect(boundary.update).not.toHaveBeenCalled();
    expect(boundary.redirect).not.toHaveBeenCalled();
  });
});
