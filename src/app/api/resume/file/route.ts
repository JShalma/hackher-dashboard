import { get } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { applications } from "@/db/schema";
import { getCurrentRole, isOrganizerRole } from "@/lib/auth";
import {
  isVercelBlobUrl,
  resumeContentDisposition,
} from "@/lib/applications/resume-url";

/**
 * Stream a private Blob resume. Organizers may open any app's resume;
 * applicants may only open their own.
 * Response filename is standardized to `First Last.pdf`.
 */
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url || !isVercelBlobUrl(url)) {
    return NextResponse.json({ error: "Invalid resume URL." }, { status: 400 });
  }

  const role = await getCurrentRole();
  const isOrganizer = isOrganizerRole(role);

  // Resolve applicant name for Content-Disposition (and ownership for non-organizers).
  const [byUrl] = await db
    .select({
      firstName: applications.firstName,
      lastName: applications.lastName,
      clerkUserId: applications.clerkUserId,
      resumeUrl: applications.resumeUrl,
    })
    .from(applications)
    .where(eq(applications.resumeUrl, url))
    .limit(1);

  if (!isOrganizer) {
    const underOwnPrefix = url.includes(`/resumes/${userId}/`);
    const ownsByUrl = byUrl?.clerkUserId === userId;
    if (!underOwnPrefix && !ownsByUrl) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let firstName = byUrl?.firstName;
  let lastName = byUrl?.lastName;

  // Pre-save preview: resume URL not on the row yet — use the signed-in user's draft names.
  if ((!firstName || !lastName) && !isOrganizer) {
    const [ownDraft] = await db
      .select({
        firstName: applications.firstName,
        lastName: applications.lastName,
      })
      .from(applications)
      .where(eq(applications.clerkUserId, userId))
      .limit(1);
    firstName = firstName || ownDraft?.firstName;
    lastName = lastName || ownDraft?.lastName;
  }

  const result = await get(url, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/pdf",
      "Content-Disposition": resumeContentDisposition(firstName, lastName),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=60",
    },
  });
}
