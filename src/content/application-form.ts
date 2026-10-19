/**
 * Application form config - single source of truth for fields (task 14).
 * UI (Zod + form) and DB mapping should follow this file.
 * Field → column map: `src/lib/applications/map-form-to-db.ts`.
 *
 * Storage:
 * - `core` → dedicated `applications` columns (firstName, lastName, resumeUrl)
 * - `customFields` → `applications.custom_fields` JSON
 */

export type ApplicationFieldType =
  | "text"
  | "tel"
  | "url"
  | "select"
  | "multiselect"
  | "textarea"
  | "toggle"
  | "checkbox";

export type ApplicationFieldStorage = "core" | "customFields";

export type ApplicationFieldOption = {
  value: string;
  label: string;
};

export type ApplicationField = {
  id: string;
  label: string;
  type: ApplicationFieldType;
  required: boolean;
  storage: ApplicationFieldStorage;
  /** JSON key when `storage` is `customFields` (defaults to `id`). */
  customKey?: string;
  options?: ApplicationFieldOption[];
  helpText?: string;
  placeholder?: string;
  /** Show this field only when another field matches. */
  showWhen?: { fieldId: string; equals: string | boolean };
};

export type ApplicationFormSection = {
  id: string;
  title: string;
  description?: string;
  fields: ApplicationField[];
};

const genderOptions: ApplicationFieldOption[] = [
  { value: "woman", label: "Woman" },
  { value: "non_binary", label: "Non-binary" },
  { value: "man", label: "Man" },
  { value: "prefer_not", label: "Prefer not to say" },
  { value: "self_describe", label: "Prefer to self-describe" },
];

const levelOfStudyOptions: ApplicationFieldOption[] = [
  { value: "high_school", label: "High school" },
  { value: "undergrad", label: "Undergraduate" },
  { value: "grad", label: "Graduate" },
  { value: "recent_grad", label: "Recent graduate (within 12 months)" },
  { value: "other", label: "Other" },
];

const tshirtOptions: ApplicationFieldOption[] = [
  { value: "xs", label: "XS" },
  { value: "s", label: "S" },
  { value: "m", label: "M" },
  { value: "l", label: "L" },
  { value: "xl", label: "XL" },
  { value: "2xl", label: "2XL" },
  { value: "3xl", label: "3XL" },
];

const projectTypeOptions: ApplicationFieldOption[] = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
];

const schoolOptions: ApplicationFieldOption[] = [
  { value: "umass_amherst", label: "University of Massachusetts Amherst" },
  { value: "amherst_college", label: "Amherst College" },
  { value: "hampshire_college", label: "Hampshire College" },
  { value: "smith_college", label: "Smith College" },
  { value: "mount_holyoke", label: "Mount Holyoke College" },
  { value: "umass_lowell", label: "UMass Lowell" },
  { value: "umass_boston", label: "UMass Boston" },
  { value: "umass_dartmouth", label: "UMass Dartmouth" },
  { value: "westfield_state", label: "Westfield State University" },
  { value: "springfield_college", label: "Springfield College" },
  { value: "elms_college", label: "Elms College" },
  { value: "holyoke_cc", label: "Holyoke Community College" },
  { value: "greenfield_cc", label: "Greenfield Community College" },
  { value: "other", label: "Other" },
];

const majorOptions: ApplicationFieldOption[] = [
  { value: "computer_science", label: "Computer Science" },
  { value: "data_science", label: "Data Science" },
  { value: "informatics", label: "Informatics" },
  { value: "information_systems", label: "Information Systems" },
  { value: "software_engineering", label: "Software Engineering" },
  { value: "computer_engineering", label: "Computer Engineering" },
  { value: "electrical_engineering", label: "Electrical Engineering" },
  { value: "mechanical_engineering", label: "Mechanical Engineering" },
  { value: "industrial_engineering", label: "Industrial Engineering" },
  { value: "biomedical_engineering", label: "Biomedical Engineering" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "math_statistics", label: "Mathematics / Statistics" },
  { value: "physics", label: "Physics" },
  { value: "chemistry", label: "Chemistry" },
  { value: "biology_biochem", label: "Biology / Biochemistry" },
  { value: "psychology_cogsci", label: "Psychology / Cognitive Science" },
  { value: "economics", label: "Economics" },
  { value: "business_marketing", label: "Business / Marketing" },
  { value: "graphic_design", label: "Graphic Design" },
  { value: "art_media", label: "Art / Media" },
  { value: "undeclared", label: "Undeclared" },
  { value: "other", label: "Other" },
];

const hearAboutOptions: ApplicationFieldOption[] = [
  { value: "friend", label: "Friend / teammate" },
  { value: "social", label: "Social media" },
  { value: "club", label: "Club / org" },
  { value: "professor", label: "Professor / advisor" },
  { value: "mlh", label: "MLH" },
  { value: "email", label: "Email / newsletter" },
  { value: "other", label: "Other" },
];

/**
 * Lean apply form: resume and LinkedIn are optional but suggested.
 * GitHub and portfolio are optional. Demographics and extras are optional.
 */
export const applicationFormSections: ApplicationFormSection[] = [
  {
    id: "basics",
    title: "About you",
    fields: [
      {
        id: "firstName",
        label: "First name",
        type: "text",
        required: true,
        storage: "core",
      },
      {
        id: "lastName",
        label: "Last name",
        type: "text",
        required: true,
        storage: "core",
      },
      {
        id: "phone",
        label: "Phone",
        type: "tel",
        required: false,
        storage: "customFields",
        helpText: "Optional. Used only for day-of logistics if needed.",
      },
      {
        id: "age",
        label: "Age",
        type: "text",
        required: true,
        storage: "customFields",
        helpText: "Whole number. Helps us check eligibility.",
      },
      {
        id: "gender",
        label: "Gender",
        type: "select",
        required: true,
        storage: "customFields",
        options: genderOptions,
      },
    ],
  },
  {
    id: "school",
    title: "School",
    fields: [
      {
        id: "levelOfStudy",
        label: "Level of study",
        type: "select",
        required: true,
        storage: "customFields",
        options: levelOfStudyOptions,
      },
      {
        id: "school",
        label: "School",
        type: "select",
        required: true,
        storage: "customFields",
        options: schoolOptions,
        placeholder: "Select your school",
      },
      {
        id: "schoolOther",
        label: "School (other)",
        type: "text",
        required: false,
        storage: "customFields",
        placeholder: "Name of your school",
        showWhen: { fieldId: "school", equals: "other" },
      },
      {
        id: "major",
        label: "Major",
        type: "select",
        required: true,
        storage: "customFields",
        options: majorOptions,
        placeholder: "Select your major",
      },
      {
        id: "majorOther",
        label: "Major (other)",
        type: "text",
        required: false,
        storage: "customFields",
        placeholder: "Your major",
        showWhen: { fieldId: "major", equals: "other" },
      },
    ],
  },
  {
    id: "event",
    title: "Event logistics",
    fields: [
      {
        id: "dietaryRestrictions",
        label: "Food allergies / dietary restrictions",
        type: "multiselect",
        required: true,
        storage: "customFields",
        options: [
          { value: "none", label: "None" },
          { value: "vegetarian", label: "Vegetarian" },
          { value: "vegan", label: "Vegan" },
          { value: "gluten_free", label: "Gluten-free" },
          { value: "halal", label: "Halal" },
          { value: "kosher", label: "Kosher" },
          { value: "nut_allergy", label: "Nut allergy" },
          { value: "other", label: "Other (tell us below)" },
        ],
        helpText: "Select all that apply.",
      },
      {
        id: "dietaryNotes",
        label: "Dietary notes",
        type: "textarea",
        required: false,
        storage: "customFields",
        placeholder: "Anything else we should know about food?",
      },
      {
        id: "tshirtSize",
        label: "T-shirt size",
        type: "select",
        required: true,
        storage: "customFields",
        options: tshirtOptions,
      },
    ],
  },
  {
    id: "links",
    title: "Links",
    description:
      "Resume and LinkedIn are optional but strongly suggested. GitHub and portfolio are optional too.",
    fields: [
      {
        id: "resumeUrl",
        label: "Resume",
        type: "url",
        required: false,
        storage: "core",
        helpText: "Suggested. Upload a PDF (up to 5 MB).",
      },
      {
        id: "linkedinUrl",
        label: "LinkedIn",
        type: "url",
        required: false,
        storage: "customFields",
        helpText: "Suggested.",
        placeholder: "https://linkedin.com/in/...",
      },
      {
        id: "githubUrl",
        label: "GitHub",
        type: "url",
        required: false,
        storage: "customFields",
        placeholder: "https://github.com/...",
      },
      {
        id: "portfolioUrl",
        label: "Portfolio",
        type: "url",
        required: false,
        storage: "customFields",
        placeholder: "https://",
      },
    ],
  },
  {
    id: "demographics",
    title: "Demographics (optional)",
    description: "Used for aggregate reporting only. Skip anything you prefer not to share.",
    fields: [
      {
        id: "race",
        label: "Race / ethnicity",
        type: "text",
        required: false,
        storage: "customFields",
      },
      {
        id: "sexuality",
        label: "Sexuality",
        type: "text",
        required: false,
        storage: "customFields",
      },
      {
        id: "underrepresented",
        label: "Do you identify as underrepresented in tech?",
        type: "select",
        required: false,
        storage: "customFields",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "prefer_not", label: "Prefer not to say" },
        ],
      },
    ],
  },
  {
    id: "extras",
    title: "Optional extras",
    fields: [
      {
        id: "workshopInterest",
        label: "Interested in hosting a workshop or talk?",
        type: "toggle",
        required: false,
        storage: "customFields",
      },
      {
        id: "workshopDetails",
        label: "What would you talk about?",
        type: "textarea",
        required: false,
        storage: "customFields",
        showWhen: { fieldId: "workshopInterest", equals: true },
      },
      {
        id: "projectType",
        label: "Do you want to build a hardware or software project?",
        type: "select",
        required: false,
        storage: "customFields",
        options: projectTypeOptions,
      },
      {
        id: "hasTeam",
        label: "Do you have a team?",
        type: "select",
        required: false,
        storage: "customFields",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "looking", label: "Looking for teammates" },
        ],
      },
      {
        id: "howHeard",
        label: "How did you hear about Hack(H)er413?",
        type: "select",
        required: false,
        storage: "customFields",
        options: hearAboutOptions,
      },
    ],
  },
  {
    id: "agreements",
    title: "Agreements",
    fields: [
      {
        id: "hackherTerms",
        label:
          "I agree to the Hack(H)er413 Terms & Conditions (photo consent + liability waiver)",
        type: "checkbox",
        required: true,
        storage: "customFields",
      },
      {
        id: "mlhTerms",
        label:
          "I agree to the MLH Code of Conduct, Privacy Policy, and Contest Terms",
        type: "checkbox",
        required: true,
        storage: "customFields",
      },
      {
        id: "mlhCommunications",
        label:
          "I authorize MLH to send me occasional emails about their events and opportunities",
        type: "checkbox",
        required: false,
        storage: "customFields",
      },
    ],
  },
];

export const applicationFormFields: ApplicationField[] =
  applicationFormSections.flatMap((section) => section.fields);

export function getApplicationField(id: string): ApplicationField | undefined {
  return applicationFormFields.find((field) => field.id === id);
}
