import { readFileSync } from "node:fs";
import { createElement } from "react";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import { getTableColumns } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pg-proxy";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applications, type Application } from "@/db/schema";
import { applicationSchema } from "@/lib/applications/application-schema";
import { applicationFormFields } from "@/content/application-form";
import { applicationFixture, expectedAnswers, expectedColumns, fullAnswers } from "./application-fixture";

const session = vi.hoisted(() => ({
  protect: vi.fn(), currentUser: vi.fn(), query: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: { protect: session.protect }, currentUser: session.currentUser,
}));
vi.mock("next/navigation", () => ({
  forbidden: () => { throw new Error("403"); },
  notFound: () => { throw new Error("404"); },
  redirect: () => { throw new Error("redirect"); },
}));
vi.mock("@/db", () => ({ db: drizzle(session.query) }));
// Avoid importing unrelated client components via the layout/content barrels.
vi.mock("@/components/layout", async () => ({
  ...await import("@/components/layout/container"),
  ...await import("@/components/layout/section"),
}));
vi.mock("@/components/content", async () => import("@/components/content/page-header"));
vi.mock("@/components/organizer/application-actions", () => ({
  ApplicationDecisionActions: () => null,
}));
vi.mock("@/components/organizer/applications-review-list", () => ({
  ApplicationsReviewList: ({
    apps,
  }: {
    apps: Array<{
      id: string;
      name: string;
      email: string;
      school: string;
      levelOfStudy: string;
      flagged: boolean;
      reviewLabel: string | null;
    }>;
  }) =>
    createElement(
      "ul",
      { className: "divide-y divide-border border-y border-border" },
      apps.map((app) =>
        createElement(
          "li",
          { key: app.id },
          createElement(
            "a",
            { href: `/organizer/apps/${app.id}` },
            app.name,
            app.school,
            app.levelOfStudy,
            app.email,
            app.reviewLabel,
          ),
        ),
      ),
    ),
}));

import DetailPage, { generateMetadata } from "@/app/(site)/organizer/apps/[id]/page";
import ListPage from "@/app/(site)/organizer/apps/page";
import { fetchAppsList } from "@/app/(site)/organizer/apps/actions";
import { getApplicationById } from "@/app/(site)/apply/actions";

const props = { params: Promise.resolve({ id: applicationFixture().id }) };
let rows: Application[];

beforeEach(() => {
  vi.clearAllMocks();
  session.protect.mockResolvedValue({ userId: "user_reviewer" });
  session.currentUser.mockResolvedValue({ publicMetadata: { role: "organizer" } });
  rows = [applicationFixture()];
  session.query.mockImplementation(async (sql: string) => {
    // Auto-flag sync for non-university applicants.
    if (/\bupdate\b/i.test(sql)) {
      return { rows: [] };
    }
    // Count/groupBy query for tab badges — return [status, total] rows.
    if (/\bcount\b/i.test(sql)) {
      const totals = new Map<string, number>();
      for (const row of rows) {
        totals.set(row.status, (totals.get(row.status) ?? 0) + 1);
      }
      return { rows: [...totals.entries()].map(([status, total]) => [status, total]) };
    }
    // pg-proxy returns positional column values; Drizzle maps timestamps back.
    return {
      rows: rows.map((row) => Object.keys(getTableColumns(applications)).map((key) => {
        const value = row[key as keyof Application];
        return value instanceof Date ? value.toISOString() : value;
      })),
    };
  });
});

function text(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function detailMarkup(html: string) {
  const entries = [...html.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/g)]
    .map((match) => [text(match[1]), match[2]] as const);
  // A Map alone silently overwrites repeated labels and can hide duplicate rows.
  expect(new Set(entries.map(([label]) => label)).size).toBe(entries.length);
  return new Map(entries);
}
function details(html: string) {
  return new Map([...detailMarkup(html)].map(([label, value]) => [label, text(value)]));
}
async function renderDetail() { return renderToStaticMarkup(await DetailPage(props)); }
async function renderList(q?: string | string[], status?: string | string[]) {
  return renderToStaticMarkup(await ListPage({ searchParams: Promise.resolve({ q, status }) }));
}
function listQueryCall() {
  const call = session.query.mock.calls.find(([sql]) => typeof sql === "string" && sql.includes("order by"));
  if (!call) throw new Error("Expected applications list query");
  return call as [string, unknown[]];
}

describe("persisted field coverage (independent of the detail page)", () => {
  it("covers every DB column and every declared JSON property", () => {
    expect(Object.keys(applicationFixture()).sort()).toEqual(Object.keys(getTableColumns(applications)).sort());
    expect([...Object.keys(expectedColumns), "customFields"].sort()).toEqual(Object.keys(getTableColumns(applications)).sort());
    // Read the persisted JSON type, NOT the organizer page's form-field list.
    // This fails at runtime when the persisted shape grows, even without tsc.
    const source = ts.createSourceFile("mapping.ts", readFileSync(
      new URL("../lib/applications/map-form-to-db.ts", import.meta.url), "utf8",
    ), ts.ScriptTarget.Latest, true);
    const declaration = source.statements.find((node): node is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(node) && node.name.text === "ApplicationCustomFields");
    expect(declaration && ts.isTypeLiteralNode(declaration.type)).toBe(true);
    if (!declaration || !ts.isTypeLiteralNode(declaration.type)) throw new Error("Missing persisted JSON type");
    const keys = declaration.type.members.map((member) => member.name?.getText(source)).sort();
    expect(Object.keys(fullAnswers).sort()).toEqual(keys);
    expect(Object.keys(expectedAnswers).sort()).toEqual(keys);
  });

  it("uses valid, complete submitted form data", () => {
    const app = applicationFixture();
    const input = { ...app.customFields, firstName: app.firstName, lastName: app.lastName, resumeUrl: app.resumeUrl };
    expect(applicationSchema.safeParse(input).success).toBe(true);
    expect(Object.keys(applicationSchema.shape).sort()).toEqual(Object.keys(input).sort());
  });

  it.each(Object.entries({ ...expectedColumns, ...expectedAnswers }))(
    "renders persisted field %s with its expected value",
    async (_key, [label, value]) => {
      expect(details(await renderDetail()).get(label), label).toBe(value);
    },
  );
});

describe("organizer detail rendering", () => {
  it.each([null, undefined, "", "   "])("keeps legacy applications with school Other and custom name %s viewable", async (schoolOther) => {
    rows[0].customFields = { school: "other" };
    if (schoolOther !== undefined) {
      (rows[0].customFields as Record<string, unknown>).schoolOther = schoolOther;
    }
    expect(text(await renderList())).toContain(rows[0].email);
    const fields = details(await renderDetail());
    expect(fields.get("School")).toBe("Other");
    expect(fields.get("School (other)")).toBe("Not provided");
  });

  it("renders every dedicated column, timestamps, and the protected resume link", async () => {
    const html = await renderDetail();
    const fields = details(html);
    for (const [label, value] of Object.values(expectedColumns)) expect(fields.get(label), label).toBe(value);
    expect(html).toContain('href="/api/resume/file?url=https%3A%2F%2Fresumes.private.blob.vercel-storage.com%2Fpriya.pdf"');
    for (const date of [rows[0].createdAt, rows[0].submittedAt!, rows[0].updatedAt]) {
      expect(html.toLowerCase()).toContain(`datetime="${date.toISOString().toLowerCase()}"`);
    }
    expect(await generateMetadata(props)).toMatchObject({ title: "Priya Chen · Application", robots: { index: false, follow: false } });
  });

  it("links each optional profile URL and external resume to its stored destination", async () => {
    rows[0].resumeUrl = "https://priya.example.com/resume.pdf";
    const fields = detailMarkup(await renderDetail());
    for (const [label, url] of [
      ["Resume", rows[0].resumeUrl], ["LinkedIn", fullAnswers.linkedinUrl],
      ["GitHub", fullAnswers.githubUrl], ["Portfolio", fullAnswers.portfolioUrl],
    ]) {
      expect(fields.get(label)).toContain(`href="${url}" target="_blank" rel="noopener noreferrer"`);
    }
  });

  it.each(["workshopInterest", "hackherTerms", "mlhTerms", "mlhCommunications"] as const)(
    "reads %s independently of other boolean answers", async (key) => {
      // Several baseline answers are true. Flip one at a time so accidentally
      // rendering a different agreement's value cannot pass on equal fixtures.
      rows[0].customFields[key] = !fullAnswers[key];
      const fields = details(await renderDetail());
      for (const [answer, [label, baseline]] of Object.entries(expectedAnswers)) {
        expect(fields.get(label), answer).toBe(answer === key
          ? (fullAnswers[key] ? "No" : "Yes") : baseline);
      }
    },
  );

  it.each(["umass_amherst", "smith_college", "other", "legacy_unknown_school"])("renders school %s readably with unknown-ID fallback", async (school) => {
    rows[0].customFields.school = school;
    const names: Record<string, string> = {
      umass_amherst: "University of Massachusetts Amherst", smith_college: "Smith College", other: "Other",
    };
    expect(details(await renderDetail()).get("School")).toBe(names[school] ?? school);
  });

  it.each([true, false])("keeps all conditional stored answers visible with branches active=%s", async (active) => {
    Object.assign(rows[0].customFields, {
      school: active ? "other" : "smith_college", major: active ? "other" : "computer_science",
      workshopInterest: active,
    });
    const fields = details(await renderDetail());
    for (const key of ["schoolOther", "majorOther", "workshopDetails"] as const) {
      const [label, value] = expectedAnswers[key];
      expect(fields.get(label)).toBe(value);
    }
    expect(fields.get(expectedAnswers.workshopInterest[0])).toBe(active ? "Yes" : "No");
  });

  it.each([null, undefined, "", "   "])("shows a placeholder for every optional answer set to %s", async (empty) => {
    // Requiredness comes from the form contract, while field coverage above
    // independently comes from the database schema and JSON type.
    const optionalFields = applicationFormFields.filter((field) => !field.required);
    for (const field of optionalFields) {
      if (field.storage === "core") rows[0].resumeUrl = empty as string | null;
      else {
        const answers = rows[0].customFields as Record<string, unknown>;
        if (empty === undefined) delete answers[field.customKey ?? field.id];
        else answers[field.customKey ?? field.id] = empty;
      }
    }
    const fields = details(await renderDetail());
    for (const field of optionalFields) expect(fields.get(field.label), field.id).toBe("Not provided");
  });

  it("handles historical empty JSON, arrays, false agreements and unsubmitted records", async () => {
    rows[0].customFields = { dietaryRestrictions: [], hackherTerms: false, mlhTerms: false, workshopInterest: false };
    rows[0].submittedAt = null;
    rows[0].flagged = false;
    const fields = details(await renderDetail());
    expect(fields.get("Food allergies / dietary restrictions")).toBe("Not provided");
    for (const key of ["hackherTerms", "mlhTerms", "workshopInterest"] as const) expect(fields.get(expectedAnswers[key][0])).toBe("No");
    expect(fields.get("Flagged")).toBe("No");
    expect(fields.get("Submitted")).toBe("Not submitted");
    rows[0].customFields = null as unknown as Application["customFields"];
    expect(details(await renderDetail()).get("School")).toBe("Not provided");
  });

  it("preserves historical JSON fields, zero, and structured answers", async () => {
    Object.assign(rows[0].customFields, { legacyAnswer: "Needs wheelchair access", previousEvents: 0, legacyObject: { mentor: true } });
    const fields = details(await renderDetail());
    expect(fields.get("Legacy Answer")).toBe("Needs wheelchair access");
    expect(fields.get("Previous Events")).toBe("0");
    expect(fields.get("Legacy Object")).toBe('{\n  "mentor": true\n}');
  });

  it("escapes applicant text and avoids executable link schemes", async () => {
    rows[0].customFields.dietaryNotes = '<script>alert("x")</script>';
    rows[0].customFields.githubUrl = "javascript:alert(1)";
    const html = await renderDetail();
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('href="javascript:');
    expect(details(html).get("GitHub")).toBe("javascript:alert(1)");
    expect(details(html).get("Dietary notes")).toBe('<script>alert("x")</script>');
  });
});

describe("application search SQL", () => {
  it.each(["Priya", "Chen", "priya.chen@example.edu", "pRiYa"])("searches first name, last name, and email for %s", async (term) => {
    await fetchAppsList(term);
    const [sql, params] = listQueryCall();
    expect(sql).toContain('"applications"."status" = ');
    expect(sql).toContain('("applications"."first_name" ilike');
    expect(sql).toContain('order by "applications"."created_at" desc, "applications"."id"');
    expect(params[0]).toBe("submitted");
    expect(params.slice(1)).toEqual(Array(3).fill(`%${term}%`));
  });
  it("ANDs full-name terms so they can match separate columns", async () => {
    await fetchAppsList("  Priya \t Chen\n");
    const [sql, params] = listQueryCall();
    expect(sql).toContain('ilike');
    expect(params[0]).toBe("submitted");
    expect(params.slice(1)).toEqual(["%Priya%", "%Priya%", "%Priya%", "%Chen%", "%Chen%", "%Chen%"]);
  });
  it.each([undefined, "", " \t\n"])("filters by submitted status when search is empty (%s)", async (query) => {
    await fetchAppsList(query);
    const [sql, params] = listQueryCall();
    expect(sql).toContain('"applications"."status" = ');
    expect(params).toEqual(["submitted"]);
  });
  it("filters by the requested review tab status", async () => {
    await fetchAppsList("", "draft");
    const [sql, params] = listQueryCall();
    expect(sql).toContain('"applications"."status" = ');
    expect(params).toEqual(["draft"]);
  });
  it("includes legacy waitlisted rows in the not-accepted tab", async () => {
    await fetchAppsList("", "denied");
    const [sql, params] = listQueryCall();
    expect(sql).toMatch(/in\s*\(/i);
    expect(params).toEqual(expect.arrayContaining(["denied", "waitlisted"]));
  });
  it("filters the flagged tab to flagged apps still awaiting review", async () => {
    await fetchAppsList("", "flagged");
    const [sql, params] = listQueryCall();
    expect(sql).toContain('"applications"."flagged" = ');
    expect(sql).toContain('"applications"."status" = ');
    expect(params).toEqual(expect.arrayContaining([true, "submitted"]));
  });
  it("escapes literal percent, underscore, and backslash", async () => {
    await fetchAppsList("a%b_c\\d");
    expect(listQueryCall()[1].slice(1)).toEqual(Array(3).fill("%a\\%b\\_c\\\\d%"));
  });
  it("parameterizes SQL-looking input", async () => {
    await fetchAppsList("x' OR 1=1--");
    const [sql, params] = listQueryCall();
    expect(sql).not.toContain("1=1");
    expect(params).toContain("%x'%");
    expect(params).toContain("%1=1--%");
  });
});

describe("search page", () => {
  it("submits q through GET, preserves the query, and links results to their detail pages", async () => {
    const html = await renderList("  Priya  ");
    expect(html).toContain('action="/organizer/apps" method="get"');
    expect(html).toContain('name="q"');
    expect(html).toContain('value="Priya"');
    expect(text(html)).toContain("1 submitted application matching “Priya”");
    expect(text(html)).toContain("Priya Chen");
    expect(text(html)).toContain("University of Massachusetts Amherst");
    expect(text(html)).toContain("Undergraduate");
    expect(text(html)).toContain(rows[0].email);
    expect(html).toContain(`href="/organizer/apps/${rows[0].id}"`);
    expect(text(html)).toContain("Clear search");
    expect(text(html)).toContain("Submitted");
    expect(text(html)).toContain("Flagged");
    expect(text(html)).toContain("Not accepted");
    expect(text(html)).not.toContain("Drafts");
    expect(listQueryCall()[1].slice(1)).toEqual(Array(3).fill("%Priya%"));
  });
  it("distinguishes no search results from an empty submitted queue", async () => {
    rows = [];
    const noMatch = await renderList("nobody");
    expect(text(noMatch)).toContain("No submitted applications match your search.");
    expect(noMatch).not.toContain('divide-y divide-border border-y');
    const html = await renderList();
    expect(text(html)).toContain("No submitted applications to review.");
    expect(text(html)).not.toContain("Clear search");
    expect(html).not.toContain('divide-y divide-border border-y');
  });
  it("handles repeated query parameters and multiple results", async () => {
    rows.push(applicationFixture({ id: "22222222-2222-4222-8222-222222222222", firstName: "Sam" }));
    const html = await renderList(["Priya", "Sam"]);
    expect(text(html)).toContain("2 submitted applications");
    expect(text(html)).toContain("Sam Chen");
    expect(listQueryCall()[1]).toEqual(["submitted"]);
  });
  it("keeps the active tab when clearing search", async () => {
    const html = await renderList("Priya", "flagged");
    expect(html).toContain('name="status"');
    expect(html).toContain('value="flagged"');
    expect(html).toContain('href="/organizer/apps?status=flagged"');
  });
  it("shows flagged apps in the current tab", async () => {
    const html = await renderList();
    expect(text(html)).toContain("Flagged");
  });
});

describe("protected organizer data (real authorization helper, mocked Clerk)", () => {
  const entryPoints = [
    ["detail loader", () => getApplicationById(rows[0].id)],
    ["detail page", () => DetailPage(props)],
    ["detail metadata", () => generateMetadata(props)],
    ["search action", () => fetchAppsList("Priya")],
    ["list page", () => ListPage({ searchParams: Promise.resolve({ q: "Priya" }) })],
  ] as const;
  for (const [name, call] of entryPoints) {
    it.each(["attendee", undefined, "Organizer", "superuser"])(`${name} denies role %s before reading the database`, async (role) => {
      session.currentUser.mockResolvedValue({ publicMetadata: { role } });
      await expect(call()).rejects.toThrow("403");
      expect(session.query).not.toHaveBeenCalled();
    });
    it(`${name} denies anonymous users before reading the database`, async () => {
      session.protect.mockRejectedValue(new Error("sign-in required"));
      await expect(call()).rejects.toThrow("sign-in required");
      expect(session.query).not.toHaveBeenCalled();
    });
    it.each(["organizer", "admin"])(`${name} permits %s`, async (role) => {
      session.currentUser.mockResolvedValue({ publicMetadata: { role } });
      await expect(call()).resolves.toBeDefined();
      expect(session.query).toHaveBeenCalled();
    });
  }
  it("denies a deleted or missing Clerk user", async () => {
    session.currentUser.mockResolvedValue(null);
    await expect(getApplicationById(rows[0].id)).rejects.toThrow("403");
    expect(session.query).not.toHaveBeenCalled();
  });
  it("returns 404 for malformed IDs without querying, and authorizes first", async () => {
    await expect(getApplicationById("stub-1")).rejects.toThrow("404");
    expect(session.query).not.toHaveBeenCalled();
    session.currentUser.mockResolvedValue({ publicMetadata: { role: "attendee" } });
    await expect(getApplicationById("stub-1")).rejects.toThrow("403");
  });
  it("queries only the requested ID and returns 404 for missing applications", async () => {
    rows = [];
    await expect(getApplicationById(applicationFixture().id)).rejects.toThrow("404");
    const [sql, params] = session.query.mock.calls[0];
    expect(sql).toContain('where "applications"."id" = $1 limit $2');
    expect(params).toEqual([applicationFixture().id, 1]);
  });
});
