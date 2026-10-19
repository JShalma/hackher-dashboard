"use client";

import { useAuth } from "@clerk/nextjs";
import { upload } from "@vercel/blob/client";
import * as React from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
} from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ApplicationFormValues } from "@/lib/applications/application-schema";
import { resumeViewHref } from "@/lib/applications/resume-url";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

type ResumeUploadFieldProps = {
  control: Control<ApplicationFormValues>;
  errors: FieldErrors<ApplicationFormValues>;
  required?: boolean;
  helpText?: string;
};

function RequiredMark() {
  return (
    <span aria-hidden className="text-destructive">
      *
    </span>
  );
}

/** Upload a PDF to Vercel Blob; the resulting URL is stored in `resumeUrl`. */
export function ResumeUploadField({
  control,
  errors,
  required = false,
  helpText,
}: ResumeUploadFieldProps) {
  const { userId } = useAuth();
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const error = errors.resumeUrl;
  const invalid = Boolean(error) || Boolean(uploadError);
  const helpId = "resumeUrl-help";

  return (
    <Controller
      control={control}
      name="resumeUrl"
      render={({ field: input }) => {
        const currentUrl =
          typeof input.value === "string" ? input.value.trim() : "";

        async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;

          setUploadError(null);

          if (file.type !== "application/pdf") {
            setUploadError("Please upload a PDF.");
            return;
          }
          if (file.size > MAX_RESUME_BYTES) {
            setUploadError("Resume must be 5 MB or smaller.");
            return;
          }

          if (!userId) {
            setUploadError("You must be signed in to upload a resume.");
            return;
          }

          setUploading(true);
          try {
            const blob = await upload(`resumes/${userId}/resume.pdf`, file, {
              access: "private",
              handleUploadUrl: "/api/resume/upload",
            });
            input.onChange(blob.url);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Upload failed. Try again.";
            setUploadError(message);
          } finally {
            setUploading(false);
          }
        }

        return (
          <Field data-invalid={invalid}>
            <FieldLabel htmlFor="resume-file">
              Resume
              {required ? <RequiredMark /> : null}
            </FieldLabel>

            <div className="flex flex-col gap-3">
              <Input
                id="resume-file"
                type="file"
                accept="application/pdf,.pdf"
                disabled={uploading}
                onChange={onFileChange}
                aria-invalid={invalid}
                aria-describedby={helpId}
              />

              {uploading ? (
                <p className="text-sm text-muted-foreground">Uploading…</p>
              ) : null}

              {currentUrl ? (
                <p className="text-sm text-foreground">
                  Current resume:{" "}
                  <a
                    href={resumeViewHref(currentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-2"
                  >
                    View PDF
                  </a>
                  {" · "}
                  <button
                    type="button"
                    className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    onClick={() => {
                      input.onChange("");
                      setUploadError(null);
                    }}
                  >
                    Remove
                  </button>
                </p>
              ) : null}
            </div>

            <FieldDescription id={helpId}>
              {helpText ?? "Suggested. PDF up to 5 MB."}
            </FieldDescription>
            <FieldError
              errors={[
                error,
                uploadError ? { message: uploadError } : undefined,
              ]}
            />
          </Field>
        );
      }}
    />
  );
}
