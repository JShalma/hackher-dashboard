/** True when the URL points at a Vercel Blob object (public or private host). */
export function isVercelBlobUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Organizer/applicant "open resume" href.
 * Private Blob URLs need our authenticated proxy; external links open as-is.
 */
export function resumeViewHref(resumeUrl: string): string {
  if (isVercelBlobUrl(resumeUrl)) {
    return `/api/resume/file?url=${encodeURIComponent(resumeUrl)}`;
  }
  return resumeUrl;
}

/** Display/download name: `First Last.pdf` (falls back to `resume.pdf`). */
export function resumeDownloadFilename(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const first = (firstName ?? "").trim();
  const last = (lastName ?? "").trim();
  const base = [first, last].filter(Boolean).join(" ") || "resume";
  const safe = base.replace(/["\\/<>:|?*\x00-\x1f]/g, "").trim() || "resume";
  return `${safe}.pdf`;
}

/** Content-Disposition so the browser tab/download uses the applicant name. */
export function resumeContentDisposition(
  firstName?: string | null,
  lastName?: string | null,
): string {
  const filename = resumeDownloadFilename(firstName, lastName);
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
