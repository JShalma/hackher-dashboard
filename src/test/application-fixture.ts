import type { Application, ApplicationCustomFields } from "@/db/schema";

// Deliberately independent of the detail page and form configuration. `Required`
// makes a newly persisted JSON field require a fixture when typechecking.
export const fullAnswers = {
  phone: "+1 (413) 555-0123", age: "21", gender: "non_binary",
  levelOfStudy: "undergrad", school: "umass_amherst",
  schoolOther: "Olin College of Engineering", major: "computer_science",
  majorOther: "Human-centered robotics",
  dietaryRestrictions: ["vegan", "gluten_free", "nut_allergy"],
  dietaryNotes: "Severe peanut allergy.\nPlease use separate utensils.",
  tshirtSize: "m", linkedinUrl: "https://linkedin.com/in/priya-chen",
  githubUrl: "https://github.com/priya-chen",
  portfolioUrl: "https://priya.example.com/", race: "Asian",
  sexuality: "Queer", underrepresented: "yes", workshopInterest: true,
  workshopDetails: "Accessible robotics with Raspberry Pi",
  projectType: "hardware", softwareType: "front_end",
  hasTeam: "looking", howHeard: "club",
  hackherTerms: true, mlhTerms: true, mlhCommunications: false,
} satisfies Required<ApplicationCustomFields>;

export function applicationFixture(overrides: Partial<Application> = {}): Application {
  return {
    id: "11111111-1111-4111-8111-111111111111", clerkUserId: "user_priya",
    firstName: "Priya", lastName: "Chen", email: "priya.chen@example.edu",
    status: "submitted", flagged: true,
    resumeUrl: "https://resumes.private.blob.vercel-storage.com/priya.pdf",
    createdAt: new Date("2026-10-20T12:00:00Z"),
    submittedAt: new Date("2026-10-21T15:30:00Z"),
    updatedAt: new Date("2026-10-22T18:45:00Z"),
    customFields: structuredClone(fullAnswers), ...overrides,
  };
}

export const expectedColumns = {
  firstName: ["First name", "Priya"], lastName: ["Last name", "Chen"],
  email: ["Email", "priya.chen@example.edu"], status: ["Status", "Submitted"],
  flagged: ["Flagged", "Yes"],
  id: ["Application ID", "11111111-1111-4111-8111-111111111111"],
  clerkUserId: ["Clerk user ID", "user_priya"], resumeUrl: ["Resume", "View PDF"],
  createdAt: ["Created", "Oct 20, 2026, 8:00 AM (America/New_York)"],
  submittedAt: ["Submitted", "Oct 21, 2026, 11:30 AM (America/New_York)"],
  updatedAt: ["Last updated", "Oct 22, 2026, 2:45 PM (America/New_York)"],
} satisfies Record<Exclude<keyof Application, "customFields">, [string, string]>;

// Explicit product expectations, not a call to the production value formatter.
export const expectedAnswers = {
  phone: ["Phone", fullAnswers.phone], age: ["Age", "21"],
  gender: ["Gender", "Non-binary"], levelOfStudy: ["Level of study", "Undergraduate"],
  school: ["School", "University of Massachusetts Amherst"],
  schoolOther: ["School (other)", fullAnswers.schoolOther],
  major: ["Major", "Computer Science"], majorOther: ["Major (other)", fullAnswers.majorOther],
  dietaryRestrictions: ["Food allergies / dietary restrictions", "Vegan, Gluten-free, Nut allergy"],
  dietaryNotes: ["Dietary notes", fullAnswers.dietaryNotes], tshirtSize: ["T-shirt size", "M"],
  linkedinUrl: ["LinkedIn", fullAnswers.linkedinUrl], githubUrl: ["GitHub", fullAnswers.githubUrl],
  portfolioUrl: ["Portfolio", fullAnswers.portfolioUrl], race: ["Race / ethnicity", "Asian"],
  sexuality: ["Sexuality", "Queer"],
  underrepresented: ["Do you identify as underrepresented in tech?", "Yes"],
  workshopInterest: ["Interested in hosting a workshop or talk?", "Yes"],
  workshopDetails: ["What would you talk about?", fullAnswers.workshopDetails],
  projectType: ["Do you want to build a hardware or software project?", "Hardware"],
  softwareType: ["What type of software?", "Front-end development"],
  hasTeam: ["Do you have a team?", "Looking for teammates"],
  howHeard: ["How did you hear about Hack(H)er413?", "Club / org"],
  hackherTerms: ["I agree to the Hack(H)er413 Terms & Conditions (photo consent + liability waiver)", "Yes"],
  mlhTerms: ["I agree to the MLH Code of Conduct, Privacy Policy, and Contest Terms", "Yes"],
  mlhCommunications: ["I authorize MLH to send me occasional emails about their events and opportunities", "No"],
} satisfies Record<keyof Required<ApplicationCustomFields>, [string, string]>;
