import { describe, it, expect } from "vitest";
import {
  parseBruteForce,
  parseCardKingdom,
  parseCardTrader,
  generateMoxfieldCSV,
  resolveSetCode,
} from "./mtg-parsers";

describe("resolveSetCode", () => {
  it("resolves known set names to codes", () => {
    expect(resolveSetCode("Commander Masters")).toBe("cmm");
    expect(resolveSetCode("Core Set 2020")).toBe("m20");
    expect(resolveSetCode("Modern Horizons 2")).toBe("mh2");
  });

  it("is case-insensitive", () => {
    expect(resolveSetCode("commander masters")).toBe("cmm");
  });

  it("returns input as-is if not found", () => {
    expect(resolveSetCode("xyz")).toBe("xyz");
  });
});

describe("parseBruteForce", () => {
  it("parses a standard card entry with set code resolution", () => {
    const input = `- 1x Melek, Izzet Paragon, Commander Masters
  Condition: Near Mint | Language: English, $0.75`;
    const { cards, errors } = parseBruteForce(input);
    expect(errors).toEqual([]);
    expect(cards).toEqual([
      {
        count: 1,
        name: "Melek, Izzet Paragon",
        edition: "cmm",
        condition: "Near Mint",
        language: "English",
        foil: "",
      },
    ]);
  });

  it("parses foil cards", () => {
    const input = `- 2x Lightning Bolt - Foil, Modern Horizons
  Condition: Near Mint | Language: English, $5.00`;
    const { cards, errors } = parseBruteForce(input);
    expect(errors).toEqual([]);
    expect(cards[0].foil).toBe("foil");
    expect(cards[0].count).toBe(2);
    expect(cards[0].name).toBe("Lightning Bolt");
  });

  it("maps Slight Play to Lightly Played", () => {
    const input = `- 1x Sol Ring, Commander Legends
  Condition: Slight Play | Language: English, $1.00`;
    const { cards } = parseBruteForce(input);
    expect(cards[0].condition).toBe("Lightly Played");
  });

  it("strips variant suffixes like Extended Art", () => {
    const input = `- 1x Jeweled Lotus - Extended Art, Commander Legends
  Condition: Near Mint | Language: English, $50.00`;
    const { cards } = parseBruteForce(input);
    expect(cards[0].name).toBe("Jeweled Lotus");
  });

  it("parses multiple cards", () => {
    const input = `- 1x Card A, Set A
  Condition: Near Mint | Language: English, $1.00
- 3x Card B, Set B
  Condition: Heavy Play | Language: Japanese, $2.00`;
    const { cards } = parseBruteForce(input);
    expect(cards).toHaveLength(2);
    expect(cards[1].count).toBe(3);
    expect(cards[1].condition).toBe("Heavily Played");
    expect(cards[1].language).toBe("Japanese");
  });

  it("strips collector numbers in parentheses from card names", () => {
    const input = `- 3x Island (270), Innistrad: Crimson Vow
  Condition: Near Mint | Language: English, $1.50
- 1x Island (270) - Foil, Innistrad: Crimson Vow
  Condition: Near Mint | Language: English, $0.99
- 4x Island (271), Innistrad: Midnight Hunt
  Condition: Near Mint | Language: English, $1.96`;
    const { cards, errors } = parseBruteForce(input);
    expect(errors).toEqual([]);
    expect(cards).toHaveLength(3);
    expect(cards[0].name).toBe("Island");
    expect(cards[0].edition).toBe("vow");
    expect(cards[0].collectorNumber).toBe("270");
    expect(cards[1].name).toBe("Island");
    expect(cards[1].foil).toBe("foil");
    expect(cards[1].collectorNumber).toBe("270");
    expect(cards[2].name).toBe("Island");
    expect(cards[2].edition).toBe("mid");
    expect(cards[2].collectorNumber).toBe("271");
  });

  it("reports errors for malformed entries", () => {
    const input = `- no quantity here, Some Set
  Condition: Near Mint | Language: English, $1.00`;
    const { cards, errors } = parseBruteForce(input);
    expect(cards).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });
});

describe("parseCardKingdom", () => {
  it("parses a standard card line with set code", () => {
    const input = `Jumpstart 2022: Augury Owl NM 1 0.35 0.35`;
    const { cards, errors } = parseCardKingdom(input);
    expect(errors).toEqual([]);
    expect(cards).toEqual([
      {
        count: 1,
        name: "Augury Owl",
        edition: "j22",
        condition: "Near Mint",
        language: "English",
        foil: "",
      },
    ]);
  });

  it("handles condition section headers", () => {
    const input = `EX SINGLES
Jumpstart 2022: Augury Owl EX 2 0.25 0.50`;
    const { cards } = parseCardKingdom(input);
    expect(cards[0].condition).toBe("Lightly Played");
    expect(cards[0].count).toBe(2);
  });

  it("detects foil in parenthetical variant", () => {
    const input = `Modern Horizons 2: Ragavan, Nimble Pilferer (Foil) NM 1 50.00 50.00`;
    const { cards } = parseCardKingdom(input);
    expect(cards[0].foil).toBe("foil");
    expect(cards[0].name).toBe("Ragavan, Nimble Pilferer");
  });

  it("handles set names with colons", () => {
    const input = `Ravnica: Clue Edition: Some Card NM 1 1.00 1.00`;
    const { cards } = parseCardKingdom(input);
    expect(cards[0].edition).toBe("clu");
    expect(cards[0].name).toBe("Some Card");
  });

  it("skips header and summary lines", () => {
    const input = `Description Style Qty Price Total
Jumpstart 2022: Augury Owl NM 1 0.35 0.35
Subtotal $0.35`;
    const { cards } = parseCardKingdom(input);
    expect(cards).toHaveLength(1);
  });
});

describe("parseCardTrader", () => {
  it("parses a standard card line with set code", () => {
    const input = `1x Audacious Thief (Core Set 2020) - 84 - Near Mint - EN`;
    const { cards, errors } = parseCardTrader(input);
    expect(errors).toEqual([]);
    expect(cards).toEqual([
      {
        count: 1,
        name: "Audacious Thief",
        edition: "m20",
        condition: "Near Mint",
        language: "English",
        foil: "",
      },
    ]);
  });

  it("parses multiple quantities", () => {
    const input = `3x Lightning Bolt (Modern Horizons 2) - 129 - Near Mint - EN`;
    const { cards } = parseCardTrader(input);
    expect(cards[0].count).toBe(3);
  });

  it("maps language codes", () => {
    const input = `1x Sol Ring (Commander Legends) - 98 - Near Mint - JA`;
    const { cards } = parseCardTrader(input);
    expect(cards[0].language).toBe("Japanese");
  });

  it("maps conditions to Moxfield format", () => {
    const input = `1x Sol Ring (Commander Legends) - 98 - Slight Play - EN`;
    const { cards } = parseCardTrader(input);
    expect(cards[0].condition).toBe("Lightly Played");
  });

  it("parses multiple lines", () => {
    const input = `1x Card A (Set A) - 1 - Near Mint - EN
2x Card B (Set B) - 42 - Heavy Play - FR`;
    const { cards } = parseCardTrader(input);
    expect(cards).toHaveLength(2);
    expect(cards[1].count).toBe(2);
    expect(cards[1].condition).toBe("Heavily Played");
    expect(cards[1].language).toBe("French");
  });

  it("parses lines with trailing Foil flag", () => {
    const input = `1x Jackdaw Savior (Bloomburrow) - 018 - Near Mint - EN - Foil`;
    const { cards, errors } = parseCardTrader(input);
    expect(errors).toEqual([]);
    expect(cards[0].name).toBe("Jackdaw Savior");
    expect(cards[0].foil).toBe("foil");
  });

  it("handles empty collector number", () => {
    const input = `1x Diregraf Horde (The List - Mystery Booster 2) - - Near Mint - EN`;
    const { cards, errors } = parseCardTrader(input);
    expect(errors).toEqual([]);
    expect(cards[0].name).toBe("Diregraf Horde");
  });

  it("maps Slightly Played to Lightly Played", () => {
    const input = `1x Faerie Vandal (Throne of Eldraine) - 045 - Slightly Played - EN`;
    const { cards } = parseCardTrader(input);
    expect(cards[0].condition).toBe("Lightly Played");
  });

  it("handles set names with colons", () => {
    const input = `1x Wayta, Trainer Prodigy (Commander: The Lost Caverns of Ixalan) - 007 - Near Mint - EN - Foil`;
    const { cards, errors } = parseCardTrader(input);
    expect(errors).toEqual([]);
    expect(cards[0].name).toBe("Wayta, Trainer Prodigy");
    expect(cards[0].foil).toBe("foil");
  });

  it("reports errors for malformed lines", () => {
    const input = `not a valid line`;
    const { cards, errors } = parseCardTrader(input);
    expect(cards).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });
});

describe("generateMoxfieldCSV", () => {
  it("generates CSV with Moxfield-spec headers", () => {
    const csv = generateMoxfieldCSV([
      {
        count: 2,
        name: "Lightning Bolt",
        edition: "mh1",
        condition: "Near Mint",
        language: "English",
        foil: "foil",
      },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "Count,Name,Edition,Condition,Language,Foil,Collector Number,Alter,Playtest Card,Purchase Price"
    );
    expect(lines[1]).toContain('"Lightning Bolt"');
    expect(lines[1]).toContain('"foil"');
    expect(lines[1].startsWith('"2"')).toBe(true);
  });

  it("escapes quotes in card names", () => {
    const csv = generateMoxfieldCSV([
      {
        count: 1,
        name: 'Jace, the "Mind" Sculptor',
        edition: "a25",
        condition: "Near Mint",
        language: "English",
        foil: "",
      },
    ]);
    expect(csv).toContain('""Mind""');
  });
});
