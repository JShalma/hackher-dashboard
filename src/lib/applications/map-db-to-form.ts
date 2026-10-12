import { ApplicationCustomFields, customKeyFor } from "./map-form-to-db";

import {
  type ApplicationFormValues,
  defaultApplicationValues,
} from "./application-schema";

import {
  applicationFormFields,
} from "@/content/application-form";

export function mapApplicationToFormValues(application: {
   firstName: string;
    lastName: string;
    resumeUrl: string | null;
    customFields: ApplicationCustomFields;
    id: string;
    clerkUserId: string;
    email: string;
    status: "draft" | "submitted" | "accepted" | "denied" | "waitlisted";
    flagged: boolean;
    submittedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}) : ApplicationFormValues{

    const values: ApplicationFormValues = {
    ...defaultApplicationValues,
    };

    for (const field of applicationFormFields) {
      if (field.storage === "core") {
        if (field.id === "firstName") {
          values[field.id] = application.firstName;
        } else if (field.id === "lastName") {
          values[field.id] = application.lastName;
        } else if (field.id === "resumeUrl") {
          values[field.id] = application.resumeUrl ?? "";
        }

        continue;
      }

      const key = customKeyFor(field) as keyof ApplicationCustomFields;
      const value = application.customFields?.[key];
      if (value !== undefined && value !== null) {
        values[field.id] = value;
      }
    }
    return values;
}