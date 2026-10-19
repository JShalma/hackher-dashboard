"use client";

import * as React from "react";
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ResumeUploadField } from "@/components/apply/resume-upload-field";
import type { ApplicationField as ApplicationFieldConfig } from "@/content/application-form";
import type { ApplicationFormValues } from "@/lib/applications/application-schema";

type ApplicationFieldProps = {
  field: ApplicationFieldConfig;
  control: Control<ApplicationFormValues>;
  register: UseFormRegister<ApplicationFormValues>;
  errors: FieldErrors<ApplicationFormValues>;
};

function RequiredMark() {
  return (
    <span aria-hidden className="text-destructive">
      *
    </span>
  );
}

export function ApplicationField(props: ApplicationFieldProps) {
  if (!props.field.showWhen) {
    return <ApplicationFieldBody {...props} />;
  }
  return <ConditionalApplicationField {...props} />;
}

function ConditionalApplicationField({
  field,
  control,
  ...rest
}: ApplicationFieldProps) {
  const showWhen = field.showWhen;
  const dependentValue = useWatch({
    control,
    name: showWhen?.fieldId ?? field.id,
  });

  if (!showWhen || dependentValue !== showWhen.equals) {
    return null;
  }

  return <ApplicationFieldBody field={field} control={control} {...rest} />;
}

function ApplicationFieldBody({
  field,
  control,
  register,
  errors,
}: ApplicationFieldProps) {
  const error = errors[field.id];
  const invalid = Boolean(error);
  const helpId = field.helpText ? `${field.id}-help` : undefined;

  if (field.id === "resumeUrl") {
    return (
      <ResumeUploadField
        control={control}
        errors={errors}
        required={field.required}
        helpText={field.helpText}
      />
    );
  }

  if (field.type === "toggle") {
    return (
      <Controller
        control={control}
        name={field.id}
        render={({ field: input }) => (
          <Field orientation="horizontal" data-invalid={invalid}>
            <FieldContent>
              <FieldLabel htmlFor={field.id} className="font-normal">
                {field.label}
                {field.required ? <RequiredMark /> : null}
              </FieldLabel>
              {field.helpText ? (
                <FieldDescription id={helpId}>
                  {field.helpText}
                </FieldDescription>
              ) : null}
              <FieldError errors={[error]} />
            </FieldContent>
            <Switch
              id={field.id}
              checked={Boolean(input.value)}
              onCheckedChange={input.onChange}
              aria-invalid={invalid}
              aria-describedby={helpId}
            />
          </Field>
        )}
      />
    );
  }

  if (field.type === "checkbox") {
    const linksId = field.links?.length ? `${field.id}-links` : undefined;
    const describedBy = [helpId, linksId].filter(Boolean).join(" ") || undefined;

    return (
      <Controller
        control={control}
        name={field.id}
        render={({ field: input }) => (
          <Field data-invalid={invalid}>
            <div className="flex items-start gap-3">
              <Checkbox
                id={field.id}
                checked={Boolean(input.value)}
                onCheckedChange={input.onChange}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                className="mt-0.5"
              />
              <FieldLabel
                htmlFor={field.id}
                className="items-start font-normal leading-snug"
              >
                <span>
                  {field.label}
                  {field.required ? <RequiredMark /> : null}
                </span>
              </FieldLabel>
            </div>
            {field.helpText ? (
              <FieldDescription id={helpId}>{field.helpText}</FieldDescription>
            ) : null}
            {field.links?.length ? (
              <FieldDescription id={linksId} className="flex flex-wrap gap-x-3 gap-y-1">
                {field.links.map((link) => {
                  const external = link.href.startsWith("http");
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className="underline underline-offset-2 hover:text-foreground"
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </FieldDescription>
            ) : null}
            <FieldError errors={[error]} />
          </Field>
        )}
      />
    );
  }

  const label = (
    <FieldLabel htmlFor={field.id}>
      {field.label}
      {field.required ? <RequiredMark /> : null}
    </FieldLabel>
  );

  let control_: React.ReactNode;

  if (field.type === "textarea") {
    control_ = (
      <Textarea
        id={field.id}
        placeholder={field.placeholder}
        aria-invalid={invalid}
        aria-describedby={helpId}
        {...register(field.id)}
      />
    );
  } else if (field.type === "select") {
    control_ = (
      <Controller
        control={control}
        name={field.id}
        render={({ field: input }) => (
          <Select
            value={(input.value as string | undefined) ?? ""}
            onValueChange={input.onChange}
          >
            <SelectTrigger
              id={field.id}
              className="w-full"
              aria-invalid={invalid}
              aria-describedby={helpId}
            >
              <SelectValue placeholder={field.placeholder ?? "Select…"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    );
  } else if (field.type === "multiselect") {
    control_ = (
      <Controller
        control={control}
        name={field.id}
        render={({ field: input }) => {
          const selected = (input.value as string[] | undefined) ?? [];
          return (
            <div
              role="group"
              aria-describedby={helpId}
              className="grid gap-2 sm:grid-cols-2"
            >
              {field.options?.map((option) => {
                const optionId = `${field.id}-${option.value}`;
                const checked = selected.includes(option.value);
                return (
                  <label
                    key={option.value}
                    htmlFor={optionId}
                    className="flex items-center gap-2.5 rounded-lg border border-input px-3 py-2 text-sm transition-colors hover:bg-muted/50 has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
                  >
                    <Checkbox
                      id={optionId}
                      checked={checked}
                      onCheckedChange={(next) => {
                        const nextSelected = next
                          ? [...selected, option.value]
                          : selected.filter((value) => value !== option.value);
                        input.onChange(nextSelected);
                      }}
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          );
        }}
      />
    );
  } else {
    const inputType =
      field.type === "tel" ? "tel" : field.type === "url" ? "url" : "text";
    control_ = (
      <Input
        id={field.id}
        type={inputType}
        placeholder={field.placeholder}
        aria-invalid={invalid}
        aria-describedby={helpId}
        {...register(field.id)}
      />
    );
  }

  return (
    <Field data-invalid={invalid}>
      {label}
      {control_}
      {field.helpText ? (
        <FieldDescription id={helpId}>{field.helpText}</FieldDescription>
      ) : null}
      <FieldError errors={[error]} />
    </Field>
  );
}
