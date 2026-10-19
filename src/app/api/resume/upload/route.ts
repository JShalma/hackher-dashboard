import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Client-upload token route for applicant resumes (Vercel Blob).
 * Auth runs before a token is issued so anonymous uploads are rejected.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const { userId } = await auth();
        if (!userId) {
          throw new Error("You must be signed in to upload a resume.");
        }

        const lower = pathname.toLowerCase();
        if (!lower.endsWith(".pdf")) {
          throw new Error("Only PDF resumes are allowed.");
        }
        // Fixed path per user so re-uploads replace; display name is set on view.
        const expectedPath = `resumes/${userId}/resume.pdf`;
        if (pathname !== expectedPath) {
          throw new Error("Invalid resume upload path.");
        }

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_RESUME_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async () => {
        // DB is updated when the applicant submits/saves the form with resumeUrl.
        // onUploadCompleted does not reliably fire in local dev without a tunnel.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Resume upload failed.";
    const status = message.includes("signed in") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
