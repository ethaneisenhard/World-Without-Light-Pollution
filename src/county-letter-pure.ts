/**
 * County / city letter — body, mailto, and lookup links.
 * No I/O. Compose and the copy script consume this.
 */

export type CountyLookupLink = {
  id: string;
  label: string;
  href: string;
  note: string;
};

export const COUNTY_LETTER_SUBJECT =
  "Street lighting in our neighborhood — health and safety";

export const COUNTY_LOOKUP_LINKS: readonly CountyLookupLink[] = [
  {
    id: "usa-elected",
    label: "USA.gov — find elected officials",
    href: "https://www.usa.gov/elected-officials",
    note: "City, county, and state people who represent your address. Often a contact form or email.",
  },
  {
    id: "usa-local",
    label: "USA.gov — local governments by state",
    href: "https://www.usa.gov/local-governments",
    note: "Official city and county websites. Look for Public Works, Transportation, or Street Lighting.",
  },
  {
    id: "openstates",
    label: "Open States — state legislators",
    href: "https://www.openstates.org/find_your_legislator/",
    note: "If the lights are on a state road, your state house or senate office can help.",
  },
];

export function countyLetterSiteLines(input?: {
  siteName?: string;
  siteOrigin?: string;
}): string {
  const site = input?.siteName ?? "World Without Light Pollution";
  const origin = input?.siteOrigin?.replace(/\/+$/, "") ?? "";
  if (!origin) {
    return `I learned more at ${site} — Night light, Health & wildlife, and the Petition.`;
  }
  return [
    `I learned more at ${site}:`,
    `${origin}/what-is-light-pollution`,
    `${origin}/impacts`,
    `${origin}/petition`,
  ].join("\n");
}

export function countyLetterBody(input?: {
  siteName?: string;
  siteOrigin?: string;
}): string {
  return [
    "Dear [Council member or Public Works director],",
    "",
    "I live in [town / county], near [street or area]. I'm a neighbor here. At night the street lights are very bright — glare on the road, and light coming into bedrooms. Light like that is hard on people's sleep and health.",
    "",
    countyLetterSiteLines(input),
    "",
    "Warm, fully shielded lights (3000K or warmer), dimmed after midnight, still light the road and usually cost less to run.",
    "",
    "Neighbors and I are sharing a petition for this neighborhood. Would you look at it, and consider a dark-sky standard for new and replacement fixtures?",
    "",
    "It would mean a lot for our health, safety, and the night we share here.",
    "",
    "Thank you,",
    "[your name]",
    "[your address]",
  ].join("\n");
}

export function countyLetterMailtoHref(input?: {
  siteName?: string;
  siteOrigin?: string;
  to?: string;
}): string {
  const subject = encodeURIComponent(COUNTY_LETTER_SUBJECT);
  const body = encodeURIComponent(countyLetterBody(input));
  const to = input?.to?.trim() ? encodeURIComponent(input.to.trim()) : "";
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
