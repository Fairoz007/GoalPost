export const COUNTRY_TO_ISO: Record<string, string> = {
  "Argentina": "ar",
  "Brazil": "br",
  "Portugal": "pt",
  "India": "in",
  "France": "fr",
  "Germany": "de",
  "Spain": "es",
  "Italy": "it",
  "England": "gb-eng",
  "Netherlands": "nl",
  "Belgium": "be",
  "Uruguay": "uy",
  "Croatia": "hr",
  "Morocco": "ma",
  "Japan": "jp",
  "South Korea": "kr",
  "USA": "us",
  "Mexico": "mx",
  "Colombia": "co",
  "Chile": "cl",
  "Peru": "pe",
  "Switzerland": "ch",
  "Denmark": "dk",
  "Sweden": "se",
  "Poland": "pl",
  "Senegal": "sn",
  "Egypt": "eg",
  "Nigeria": "ng",
  "Ivory Coast": "ci",
  "Cameroon": "cm",
  "Ghana": "gh",
  "Algeria": "dz",
  "Turkey": "tr",
  "Greece": "gr",
  "Austria": "at",
  "Czech Republic": "cz",
  "Serbia": "rs",
  "Ukraine": "ua",
  "Wales": "gb-wls",
  "Scotland": "gb-sct",
  "Ireland": "ie",
  "Canada": "ca",
  "Australia": "au",
  "Iran": "ir",
  "Saudi Arabia": "sa",
  "Oman": "om",
  "United Arab Emirates": "ae",
  "Qatar": "qa",
  "Bahrain": "bh",
  "Kuwait": "kw",
};

export const COUNTRY_OPTIONS = Object.entries(COUNTRY_TO_ISO)
  .map(([name, code]) => ({ name, code: code.toUpperCase() }))
  .sort((first, second) => first.name.localeCompare(second.name));

export function getIsoFromFlagString(flagString: string | undefined): string | null {
  if (!flagString) return null;
  // flagString is typically like "🇦🇷 Argentina"
  // We can just strip emojis and trim, or match the keys
  for (const [country, iso] of Object.entries(COUNTRY_TO_ISO)) {
    if (flagString.includes(country)) {
      return iso;
    }
  }
  return null;
}

export function getNameFromFlagString(flagString: string | undefined): string | null {
  if (!flagString) return null;
  for (const country of Object.keys(COUNTRY_TO_ISO)) {
    if (flagString.includes(country)) {
      return country;
    }
  }
  // fallback: try to extract text after emoji
  const textMatch = flagString.match(/[a-zA-Z\s]+/);
  return textMatch ? textMatch[0].trim() : "Unknown";
}
