import { loadEnvConfig } from "@next/env";


// loadEnv({ path: ".env" });
// loadEnv({ path: ".env.local" });
loadEnvConfig(process.cwd());

import { faker } from '@faker-js/faker';


const GENDER_OPTIONS = [
  "Woman",
  "Man",
  "Non-binary",
  "Prefer not to say",
  "Other",
];

const SCHOOL_OPTIONS = [
  "MIT",
  "Harvard University",
  "Boston University",
  "Northeastern University",
  "Boston College",
  "UMass Amherst",
  "Amherst College",
  "Smith College",
  "Other",
];

const LEVEL_OF_STUDY_OPTIONS = [
  "High School",
  "Undergraduate",
  "Graduate",
  "Recent Graduate",
];

const MAJOR_OPTIONS = [
  "Computer Science",
  "Software Engineering",
  "Data Science",
  "Electrical Engineering",
  "Computer Engineering",
  "Mathematics",
  "Business",
  "Design",
  "Other",
];

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Halal",
  "Kosher",
  "Nut allergy",
  "Dairy-free",
];

const RACE_OPTIONS = [
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "White",
  "Middle Eastern or North African",
  "Multiracial",
  "Prefer not to say",
  "Other",
];

const TEAM_OPTIONS = [
  "Yes, I have a team",
  "No, I'm participating individually",
  "I'm looking for teammates",
];

export function generateSampleApplication(i: number) {
  return {

    clerkUserId: `seed_user_${i}`,
    email: `person${i}@gmail.com`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    status: "draft" as const,
    resumeUrl: null,
    customFields: {
      phone: faker.phone.number(),
      gender: faker.helpers.arrayElement(GENDER_OPTIONS),
      school: faker.helpers.arrayElement(SCHOOL_OPTIONS),
      levelOfStudy: faker.helpers.arrayElement(
        LEVEL_OF_STUDY_OPTIONS,
      ),
      major: faker.helpers.arrayElement(MAJOR_OPTIONS),
      dietaryRestrictions: faker.helpers.arrayElements(
        DIETARY_OPTIONS,
        { min: 0, max: 2 },
      ),
      githubURL: `https://github.com/${faker.string.alphanumeric(8)}`,
      demographicsRace: faker.helpers.arrayElement(RACE_OPTIONS),
      workshopInterest: faker.datatype.boolean(),
      hasTeam: faker.helpers.arrayElement(TEAM_OPTIONS),
      agreeTerms: true,
    },
  };
}

export async function seedApplications() {
    const { db } = await import("@/db");
    const { applications } = await import("@/db/schema");

    const sampleApplications = Array.from(
        { length: 15 },
        (_, index) => generateSampleApplication(index + 1),
    );

    await db.insert(applications).values(sampleApplications);

    console.log(`Seeded ${sampleApplications.length} applications.`);
}

seedApplications().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})