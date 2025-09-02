export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type Hours = Record<Day, string>;

export type Builder = {
  appType: "new" | "variation" | "review";
  premisesName: string;
  premisesAddress: {
    line1: string;
    line2?: string;
    line3?: string;
    city: string;
    postcode: string;
  };
  activities: string[];
  openingHours: Hours;
  alcoholHours?: Hours;
  seasonal?: string;
  dps?: string;
  howToRep?: string;
  repDeadline: string; // ISO date string
  locality?: string;
};

const days: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const fmtHours = (h: Hours): string =>
  days.map((d) => `${d}: ${h[d] || "Closed"}`).join("; ");

/** Compose a Licensing Act premises notice from structured details. */
export function composePremisesNotice(b: Builder): string {
  const addr = [
    b.premisesAddress.line1,
    b.premisesAddress.line2,
    b.premisesAddress.line3,
    b.premisesAddress.city,
    b.premisesAddress.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const activities = b.activities.join("; ");
  const open = fmtHours(b.openingHours);
  const alcohol = b.alcoholHours
    ? `Hours for the sale of alcohol: ${fmtHours(b.alcoholHours)}.\n`
    : "";
  const seasonal = b.seasonal ? `Seasonal variations: ${b.seasonal}.\n` : "";
  const dps = b.dps ? `Designated premises supervisor: ${b.dps}.\n` : "";

  const head =
    b.appType === "new"
      ? "LICENSING ACT 2003 – APPLICATION FOR A NEW PREMISES LICENCE"
      : b.appType === "variation"
      ? "LICENSING ACT 2003 – APPLICATION TO VARY A PREMISES LICENCE"
      : "LICENSING ACT 2003 – REVIEW OF PREMISES LICENCE";

  return `${head}

Notice is hereby given that ${b.premisesName} has applied to the Licensing Authority for ${
    b.appType === "new"
      ? "a new"
      : b.appType === "variation"
      ? "a variation of a"
      : "a review of a"
  } premises licence at: ${addr}.

Proposed licensable activities: ${activities}.
Opening hours of the premises: ${open}.
${alcohol}${seasonal}${dps}Any person wishing to make representations must do so in writing by ${b.repDeadline}.
${
    b.howToRep ||
    "Representations should be sent to the Licensing Team at the relevant Council. Please note it is an offence to knowingly or recklessly make a false statement in connection with an application (maximum fine on summary conviction unlimited)."
  }
This notice is for information only.`;
}

export default composePremisesNotice;
