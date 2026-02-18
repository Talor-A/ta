import { useState } from "react";
import type { Route } from "./+types/mtg-importer";
import {
  parseBruteForce,
  parseCardKingdom,
  parseCardTrader,
  generateMoxfieldCSV,
  type ParsedCard,
} from "../lib/mtg-parsers";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MTG Importer - Talor Anderson" },
    {
      name: "description",
      content: "Convert card lists to Moxfield CSV import format",
    },
  ];
}

export default function MtgImporter() {
  const [activeTab, setActiveTab] = useState<
    "bruteforce" | "cardkingdom" | "cardtrader"
  >("bruteforce");
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedCard[]>([]);
  const [error, setError] = useState("");

  const handleParse = () => {
    const parsers = {
      bruteforce: parseBruteForce,
      cardkingdom: parseCardKingdom,
      cardtrader: parseCardTrader,
    };
    const { cards, errors } = parsers[activeTab](input);
    setParsed(cards);
    setError(errors.length > 0 ? errors.join("\n") : "");
  };

  const downloadCSV = () => {
    const csv = generateMoxfieldCSV(parsed);
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = "moxfield_import.csv";
    link.click();
  };

  return (
    <main>
      <h1>
        <a className="link-plain" href="/">
          Talor Anderson
        </a>{" "}
        <span className="dimmer">|</span> MTG Importer
      </h1>
      <p className="dimmer">
        Convert card lists to Moxfield CSV import format.
      </p>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <button
          onClick={() => {
            setActiveTab("bruteforce");
            setParsed([]);
            setError("");
          }}
          className={
            activeTab === "bruteforce" ? "link-underline" : "link-plain"
          }
        >
          Brute Force Games
        </button>
        <button
          onClick={() => {
            setActiveTab("cardkingdom");
            setParsed([]);
            setError("");
          }}
          className={
            activeTab === "cardkingdom" ? "link-underline" : "link-plain"
          }
        >
          Card Kingdom
        </button>
        <button
          onClick={() => {
            setActiveTab("cardtrader");
            setParsed([]);
            setError("");
          }}
          className={
            activeTab === "cardtrader" ? "link-underline" : "link-plain"
          }
        >
          CardTrader
        </button>
      </div>

      <div style={{ maxWidth: "100%" }}>
        <label>
          Paste your{" "}
          {activeTab === "bruteforce"
            ? "Brute Force Games"
            : activeTab === "cardkingdom"
              ? "Card Kingdom"
              : "CardTrader"}{" "}
          order
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={10}
          placeholder={
            activeTab === "bruteforce"
              ? "- 1x Melek, Izzet Paragon - Foil, Commander Masters\n  Condition: Near Mint | Language: English, $0.75"
              : activeTab === "cardkingdom"
                ? "NM SINGLES\nJumpstart 2022: Augury Owl NM 1 0.35 0.35"
                : "1x Audacious Thief (Core Set 2020) - 84 - Near Mint - EN"
          }
          style={{ fontFamily: "monospace", fontSize: "0.9em" }}
        />
      </div>

      <button
        onClick={handleParse}
        style={{
          marginTop: "0.5rem",
          padding: "8px 16px",
          background: "var(--link-color)",
          color: "var(--background-color)",
          borderRadius: "4px",
          fontWeight: "bold",
        }}
      >
        Parse Cards
      </button>

      {error && (
        <div className="error mt-1">
          <p style={{ fontWeight: "bold", marginTop: 0 }}>Parsing warnings:</p>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{error}</pre>
        </div>
      )}

      {parsed.length > 0 && (
        <div className="mt-2">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>
              Parsed Cards ({parsed.reduce((sum, c) => sum + c.count, 0)} total)
            </h2>
            <button
              onClick={downloadCSV}
              style={{
                padding: "8px 16px",
                background: "var(--link-color)",
                color: "var(--background-color)",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              Download CSV
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    "Qty",
                    "Name",
                    "Edition",
                    "Condition",
                    "Language",
                    "Foil",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px",
                        borderBottom: "1px solid var(--dimmer-color)",
                        fontWeight: "bold",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.map((card, i) => (
                  <tr key={i}>
                    <td style={{ padding: "8px" }}>{card.count}</td>
                    <td style={{ padding: "8px", fontWeight: "bold" }}>
                      {card.name}
                    </td>
                    <td style={{ padding: "8px" }} className="dimmer">
                      {card.edition}
                    </td>
                    <td style={{ padding: "8px" }} className="dimmer">
                      {card.condition}
                    </td>
                    <td style={{ padding: "8px" }} className="dimmer">
                      {card.language}
                    </td>
                    <td style={{ padding: "8px" }}>{card.foil || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-1">
            <p className="dimmer" style={{ fontSize: "0.9em" }}>
              CSV Preview:
            </p>
            <pre style={{ fontSize: "0.8em" }}>
              {generateMoxfieldCSV(parsed).substring(0, 500)}...
            </pre>
          </div>
        </div>
      )}
    </main>
  );
}
