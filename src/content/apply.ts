/**
 * Apply-page content. The application itself lives in an external form; this
 * page sets expectations. `applyUrl` is the one link to update each cycle.
 */

export const applyIntro = {
  title: "Applications for 2026 are closed.",
  lead: "Join the mailing list to hear when 2027 opens - no experience required, just curiosity.",
};

/** Application link; the in-repo flow lives at `/apply`. */
export const applyUrl = "/apply";

/**
 * Single toggle for marketing CTAs + apply form + server submit.
 * Flip `isOpen` when the cycle opens/closes; keep `deadline` copy in sync.
 */
export const applyStatus = {
  isOpen: false,
  /** Shown near CTAs and on the form when closed. */
  deadline:
    "Applications for 2026 are now closed. Join our mailing list to be the first to know when 2027 opens.",
};

/** Short privacy note under the apply form submit row. */
export const applyPrivacyNote =
  "We use your information only for Hack(H)er413 admissions and event logistics. We never sell it.";

/** Mailing-list signup, surfaced while applications are closed. */
export const mailingListUrl = "https://forms.gle/YmY38wRxLSWWFQkKA";

/**
 * Sitewide primary conversion action. Navbar, hero, and page CTAs should use
 * this so open/closed state stays consistent.
 */
export const primaryCta = applyStatus.isOpen
  ? {
      label: "Apply now",
      href: "/apply",
      external: false as const,
    }
  : {
      label: "Join the 2027 list",
      href: mailingListUrl,
      external: true as const,
    };

export type ApplyStep = {
  title: string;
  description: string;
};

export const applySteps: ApplyStep[] = [
  {
    title: "Fill out the form",
    description:
      "Tell us a bit about you and why you want to hack with us. It's short, we promise.",
  },
  {
    title: "Get your decision",
    description:
      "We review on a rolling basis and email you with next steps and event details.",
  },
  {
    title: "Show up and build",
    description:
      "Arrive at check-in, meet your people, and make something you're proud of.",
  },
];

export const applyEligibility = [
  "Currently enrolled students, or those who graduated within the last 12 months.",
  "Women and non-binary students - and the allies who support them.",
  "Beginners and first-time hackers are especially encouraged.",
  "All majors and disciplines welcome - not just CS.",
];
