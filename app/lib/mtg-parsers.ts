import scryfallSets from "./scryfall-sets.json";

export interface ParsedCard {
  count: number;
  name: string;
  edition: string;
  condition: string;
  language: string;
  foil: string;
  collectorNumber?: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  errors: string[];
}

// Moxfield conditions: Mint, Near Mint, Lightly Played, Played, Heavily Played, Damaged
const CONDITION_MAP: Record<string, string> = {
  "Near Mint": "Near Mint",
  "NM-Mint": "Near Mint",
  NM: "Near Mint",
  Mint: "Mint",
  M: "Mint",
  "Slight Play": "Lightly Played",
  "Light Play": "Lightly Played",
  "Lightly Played": "Lightly Played",
  LP: "Lightly Played",
  SP: "Lightly Played",
  "Slightly Played": "Lightly Played",
  "Moderate Play": "Played",
  "Moderately Played": "Played",
  Played: "Played",
  MP: "Played",
  "Heavy Play": "Heavily Played",
  "Heavily Played": "Heavily Played",
  HP: "Heavily Played",
  Damaged: "Damaged",
  DMG: "Damaged",
  D: "Damaged",
  DM: "Damaged",
  Poor: "Damaged",
};

// Build a case-insensitive set name → code lookup
const setNameToCode: Record<string, string> = {};
for (const [name, code] of Object.entries(
  scryfallSets as Record<string, string>
)) {
  setNameToCode[name.toLowerCase()] = code;
}

export function resolveSetCode(setName: string): string {
  const lower = setName.toLowerCase();
  if (setNameToCode[lower]) return setNameToCode[lower];

  // Try partial match (e.g. "Commander Masters" might be stored differently)
  for (const [name, code] of Object.entries(setNameToCode)) {
    if (name === lower || lower === name) return code;
  }

  // Return as-is if no match found (might already be a code)
  return setName;
}

export function parseBruteForce(text: string): ParseResult {
  const entries = text.split(/(?:^|\n)\s*- /).filter((entry) => entry.trim());
  const cards: ParsedCard[] = [];
  const errors: string[] = [];

  for (const entry of entries) {
    const normalized = entry.replace(/\n\s*/g, " ").trim();
    if (!normalized) continue;

    const qtyMatch = normalized.match(/^(\d+)x\s+/);
    if (!qtyMatch) {
      errors.push(
        `Could not parse quantity: ${normalized.substring(0, 50)}...`
      );
      continue;
    }
    const count = parseInt(qtyMatch[1]);
    const remaining = normalized.slice(qtyMatch[0].length);

    const isFoil =
      /- Foil[,\s-]/.test(remaining) || remaining.includes("- Foil,");

    const conditionSplit = remaining.split(/\s*Condition:\s*/);
    if (conditionSplit.length < 2) {
      errors.push(
        `Could not find Condition in: ${normalized.substring(0, 50)}...`
      );
      continue;
    }

    const cardPart = conditionSplit[0].replace(/,\s*$/, "").trim();
    const conditionPart = conditionSplit[1];

    const condLangMatch = conditionPart.match(
      /^([^|]+)\s*\|\s*Language:\s*([^,]+)/
    );
    if (!condLangMatch) {
      errors.push(
        `Could not parse condition/language: ${conditionPart.substring(0, 50)}...`
      );
      continue;
    }

    const condition =
      CONDITION_MAP[condLangMatch[1].trim()] || condLangMatch[1].trim();
    const language = condLangMatch[2].trim();

    let cleanCardPart = cardPart
      .replace(/ - Foil - /g, " - ")
      .replace(/ - Foil,/g, ",")
      .replace(/ - Foil$/g, "");

    const lastCommaIndex = cleanCardPart.lastIndexOf(",");
    if (lastCommaIndex === -1) {
      errors.push(
        `Could not find set separator: ${cardPart.substring(0, 50)}...`
      );
      continue;
    }

    let cardName = cleanCardPart.substring(0, lastCommaIndex).trim();
    const setName = cleanCardPart.substring(lastCommaIndex + 1).trim();

    // Strip collector numbers in parentheses, e.g. "Island (270)" → "Island"
    let collectorNumber: string | undefined;
    const collectorMatch = cardName.match(/^(.+?)\s*\((\d+)\)$/);
    if (collectorMatch) {
      cardName = collectorMatch[1].trim();
      collectorNumber = collectorMatch[2];
    }

    const variantMatch = cardName.match(
      / - (Extended Art|Borderless|Showcase|Retro Frame|Full Art|Prerelease Promo)$/i
    );
    if (variantMatch) {
      cardName = cardName.replace(variantMatch[0], "");
    }

    cards.push({
      count,
      name: cardName,
      edition: resolveSetCode(setName),
      condition,
      language,
      foil: isFoil ? "foil" : "",
      ...(collectorNumber && { collectorNumber }),
    });
  }

  return { cards, errors };
}

export function parseCardKingdom(text: string): ParseResult {
  const cards: ParsedCard[] = [];
  const errors: string[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  let currentCondition = "Near Mint";

  for (const line of lines) {
    if (line.match(/^Description\s+Style\s+Qty\s+Price\s+Total$/i)) continue;
    if (line.match(/^Subtotal|^Shipping|^Sales Tax|^Total/i)) continue;

    if (line === "NM SINGLES") {
      currentCondition = "Near Mint";
      continue;
    }
    if (line === "EX SINGLES") {
      currentCondition = "Lightly Played";
      continue;
    }
    if (line === "VG SINGLES") {
      currentCondition = "Played";
      continue;
    }
    if (line === "G SINGLES") {
      currentCondition = "Heavily Played";
      continue;
    }

    const match =
      line.match(/^(.+?)\s+(NM|EX|VG|G)\s+(\d+)\s+([\d.]+)\s+([\d.]+)$/) ||
      line.match(/^(.+?)\s+(NM|EX|VG|G)\s+(\d+)\s+([\d.]+)$/);

    if (!match) {
      errors.push(`Could not parse: ${line.substring(0, 60)}...`);
      continue;
    }

    const cardInfo = match[1].trim();
    const condCode = match[2];
    const qty = parseInt(match[3]);

    const conditionMap: Record<string, string> = {
      NM: "Near Mint",
      EX: "Lightly Played",
      VG: "Played",
      G: "Heavily Played",
    };
    const condition = conditionMap[condCode] || currentCondition;

    const lastColonIndex = cardInfo.lastIndexOf(":");
    if (lastColonIndex === -1) {
      errors.push(
        `Could not find set separator: ${cardInfo.substring(0, 50)}...`
      );
      continue;
    }

    const setName = cardInfo.substring(0, lastColonIndex).trim();
    let cardName = cardInfo.substring(lastColonIndex + 1).trim();

    const isFoil =
      /\(.*Foil.*\)/i.test(cardName) ||
      setName.toLowerCase().includes("foil") ||
      cardName.toLowerCase().includes("foil etched");

    const isEtched = cardName.toLowerCase().includes("foil etched");

    const parenMatch = cardName.match(/^([^(]+?)(?:\s*\([^)]+\))?$/);
    if (parenMatch) {
      cardName = parenMatch[1].trim();
    }

    cards.push({
      count: qty,
      name: cardName,
      edition: resolveSetCode(setName),
      condition,
      language: "English",
      foil: isEtched ? "etched" : isFoil ? "foil" : "",
    });
  }

  return { cards, errors };
}

const LANGUAGE_MAP: Record<string, string> = {
  EN: "English",
  FR: "French",
  DE: "German",
  ES: "Spanish",
  IT: "Italian",
  PT: "Portuguese",
  JA: "Japanese",
  JP: "Japanese",
  KO: "Korean",
  ZH: "Chinese",
  RU: "Russian",
};

export function parseCardTrader(text: string): ParseResult {
  const cards: ParsedCard[] = [];
  const errors: string[] = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  for (const line of lines) {
    // Format: 1x Card Name (Set Name) - 84 - Near Mint - EN [- Foil]
    // Collector number may be empty (e.g. "- -")
    const match = line.match(
      /^(\d+)x\s+(.+?)\s+\(([^)]+)\)\s+-\s*(\d*)\s*-\s+(.+?)\s+-\s+(\w+)(?:\s+-\s+(.+))?$/
    );
    if (!match) {
      errors.push(`Could not parse: ${line.substring(0, 60)}...`);
      continue;
    }

    const count = parseInt(match[1]);
    const name = match[2].trim();
    const edition = match[3].trim();
    const condition = CONDITION_MAP[match[5].trim()] || match[5].trim();
    const language =
      LANGUAGE_MAP[match[6].trim().toUpperCase()] || match[6].trim();
    const extra = match[7]?.trim() || "";

    const isFoil = /\bfoil\b/i.test(name) || /\bfoil\b/i.test(extra);

    cards.push({
      count,
      name: name.replace(/\s*\(?\bfoil\b\)?\s*/i, " ").trim(),
      edition: resolveSetCode(edition),
      condition,
      language,
      foil: isFoil ? "foil" : "",
    });
  }

  return { cards, errors };
}

export function generateMoxfieldCSV(cards: ParsedCard[]): string {
  const headers = [
    "Count",
    "Name",
    "Edition",
    "Condition",
    "Language",
    "Foil",
    "Collector Number",
    "Alter",
    "Playtest Card",
    "Purchase Price",
  ];

  const rows = cards.map((card) => [
    card.count,
    card.name,
    card.edition,
    card.condition,
    card.language,
    card.foil,
    card.collectorNumber || "",
    "",
    "",
    "",
  ]);

  return [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");
}
