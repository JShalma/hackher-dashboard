/**
 * Team content. Organizers grouped by team (committee). Solo `image` is
 * optional - OrganizerCard falls back to a monogram avatar so the page looks
 * intentional before real headshots are added.
 *
 * Optional `teamIntro.groupImage` = full-org hero under the page header.
 *
 * Headshots in /public/team/2027 are face-centered chest-up crops.
 */

export type Organizer = {
  name: string;
  role: string;
  pronouns?: string;
  /** Path under /public, e.g. "/team/jane.jpg". Optional. */
  image?: string;
  linkedin?: string;
};

export type TeamGroup = {
  name: string;
  members: Organizer[];
};

export const teamIntro: {
  title: string;
  lead: string;
  groupImage?: string;
} = {
  title: "The students who put this on.",
  lead: "Hack(H)er413 is organized entirely by UMass Amherst students who volunteer their time to build something bigger than themselves.",
};

export const team: TeamGroup[] = [
  {
    name: "Directors",
    members: [
      {
        name: "Vidhika Tiwari",
        role: "Co-Director",
        pronouns: "she/her",
        image: "/team/2027/vidhika-tiwari.jpg",
        linkedin: "https://www.linkedin.com/in/vidhika-tiwari05/",
      },
      {
        name: "Niharika Elangovan",
        role: "Co-Director",
        pronouns: "she/her",
        image: "/team/2027/niharika-elangovan.jpg",
        linkedin: "https://www.linkedin.com/in/niharika-elangovan-a90a1a293/",
      },
    ],
  },
  {
    name: "Sponsorship & Finance",
    members: [
      {
        name: "Parisa Singh",
        role: "Head of Sponsorship",
        pronouns: "she/her",
        image: "/team/2027/parisa-singh.jpg",
        linkedin: "https://www.linkedin.com/in/parisa-singh/",
      },
      {
        name: "Iris Cabral",
        role: "Assistant Head of Sponsorship",
        pronouns: "she/her",
        image: "/team/2027/iris-cabral.jpg",
        linkedin: "https://www.linkedin.com/in/iriscabral/",
      },
      {
        name: "Bhashita Sri Golla",
        role: "Assistant Head of Sponsorship",
        pronouns: "she/her",
        image: "/team/2027/bhashita-sri-golla.jpg",
        linkedin: "https://www.linkedin.com/in/bhashita-sri-golla-07089231a/",
      },
      {
        name: "Naysa Arora",
        role: "Head of Finance",
        pronouns: "she/her",
        image: "/team/2027/naysa-arora.jpg",
        linkedin: "https://www.linkedin.com/in/naysa-arora",
      },
    ],
  },
  {
    name: "Outreach & Marketing",
    members: [
      {
        name: "Rakshita Saroha",
        role: "Head of Outreach",
        pronouns: "she/her",
        image: "/team/2027/rakshita-saroha.jpg",
        linkedin: "https://www.linkedin.com/in/rakshita-saroha/",
      },
      {
        name: "Nandita Lajeesh",
        role: "Assistant Head of Outreach",
        pronouns: "she/her",
        image: "/team/2027/nandita-lajeesh.jpg",
        linkedin: "https://www.linkedin.com/in/nandita-lajeesh/",
      },
      {
        name: "Hiya Dagli",
        role: "Head of Marketing",
        pronouns: "she/her",
        image: "/team/2027/hiya-dagli.jpg",
        linkedin: "https://www.linkedin.com/in/hiyadagli/",
      },
      {
        name: "Miranda Liskov",
        role: "Head of Social Media",
        pronouns: "she/her",
        image: "/team/2027/miranda-liskov.jpg",
        linkedin: "https://www.linkedin.com/in/miranda-liskov-05a230376/",
      },
    ],
  },
  {
    name: "Technology",
    members: [
      {
        name: "Jennifer Ye",
        role: "Head of Technology",
        pronouns: "she/her",
        image: "/team/2027/jennifer-ye.jpg",
        linkedin: "https://www.linkedin.com/in/jenniferye1t/",
      },
      {
        name: "Jeba Shalin",
        role: "Assistant Head of Technology",
        pronouns: "she/her",
        image: "/team/2027/jeba-shalin.jpg",
        linkedin: "https://www.linkedin.com/in/jeba-shalin-562466314/",
      },
      {
        name: "Linh Dang",
        role: "Assistant Head of Technology",
        pronouns: "she/her",
        image: "/team/2027/linh-dang.jpg",
        linkedin: "https://www.linkedin.com/in/linhdang-felix/",
      },
    ],
  },
  {
    name: "Hardware",
    members: [
      {
        name: "Anaika Pathak",
        role: "Co-Head of Hardware",
        pronouns: "she/her",
        image: "/team/2027/anaika-pathak.jpg",
        linkedin: "https://www.linkedin.com/in/anaikapathak/",
      },
      {
        name: "Rajarshi Das",
        role: "Co-Head of Hardware",
        pronouns: "he/him",
        image: "/team/2027/rajarshi-das.jpg",
        linkedin: "https://www.linkedin.com/in/rajarshi-das-rjds/",
      },
    ],
  },
  {
    name: "Logistics",
    members: [
      {
        name: "Shriya Gautam",
        role: "Head of Logistics",
        pronouns: "she/her",
        image: "/team/2027/shriya-gautam.jpg",
        linkedin: "https://www.linkedin.com/in/shriyagautam5/",
      },
      {
        name: "Soumya Shelke",
        role: "Assistant Head of Logistics",
        pronouns: "she/her",
        image: "/team/2027/soumya-shelke.jpg",
        linkedin: "https://www.linkedin.com/in/soumya-shelke-703830394/",
      },
    ],
  },
];
