"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";

import { ApplicationField } from "@/components/apply/application-field";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { applicationFormSections } from "@/content/application-form";
import {
  applicationSchema,
  defaultApplicationValues,
  type ApplicationFormValues,
} from "@/lib/applications/application-schema";

type ApplyFormProps = {
  onSubmit?: (values: ApplicationFormValues) => void | Promise<void>;
  disabled?: boolean;
  /** Shown when submissions are closed (deadline / mailing-list copy). */
  closedMessage?: string;
  /** Privacy one-liner under the required-fields note. */
  privacyNote?: string;
  statusHref?: string;
  defaultValues?: ApplicationFormValues;
};

const FULL_WIDTH_TYPES = new Set([
  "textarea",
  "multiselect",
  "toggle",
  "checkbox",
]);

const FULL_WIDTH_FIELD_IDS = new Set([
  "schoolOther",
  "majorOther",
  "resumeUrl",
]);

function fieldSpan(field: { id: string; type: string }) {
  if (FULL_WIDTH_FIELD_IDS.has(field.id)) {
    return "sm:col-span-2";
  }
  return FULL_WIDTH_TYPES.has(field.type) ? "sm:col-span-2" : "";
}

export function ApplyForm({
  onSubmit,
  disabled = false,
  closedMessage,
  privacyNote,
  statusHref = "/apply/status",
  defaultValues,
}: ApplyFormProps) {
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema) as Resolver<ApplicationFormValues>,
    defaultValues: defaultValues ?? defaultApplicationValues,
    mode: "onBlur",
    shouldFocusError: true,
  });

  const { control, register } = form;
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
    
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex max-w-3xl flex-col gap-12"
    >
      {applicationFormSections.map((section) => (
        <FieldSet key={section.id}>
          <div>
            <FieldLegend className="text-xl font-semibold tracking-tight">
              {section.title}
            </FieldLegend>
            {section.description ? (
              <FieldDescription>{section.description}</FieldDescription>
            ) : null}
          </div>
          <FieldGroup className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.id} className={fieldSpan(field)}>
                <ApplicationField
                  field={field}
                  control={control}
                  register={register}
                  errors={errors}
                />
              </div>
            ))}
          </FieldGroup>
        </FieldSet>
      ))}

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        {disabled && closedMessage ? (
          <p className="text-sm text-muted-foreground text-pretty">
            {closedMessage}
          </p>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-md flex-col gap-1.5">
            <p className="text-sm text-muted-foreground">
              Fields marked <span className="text-destructive">*</span> are
              required.
            </p>
            {privacyNote ? (
              <p className="text-sm text-muted-foreground text-pretty">
                {privacyNote}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              type="button"
              variant="outline"
              size="xl"
              className="sm:w-auto"
            >
              <Link href={statusHref}>Check status</Link>
            </Button>
            <Button
              type="submit"
              variant="honey"
              size="xl"
              disabled={disabled || isSubmitting}
            >
              {disabled
                ? "Submissions closed"
                : isSubmitting
                  ? "Submitting…"
                  : "Submit application"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
