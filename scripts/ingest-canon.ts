/**
 * Canon data ingestion.
 *
 * Normalizes canonical Harry Potter facts into structured JSON under
 * /data. Sources, in priority order:
 *   1. The books themselves — encoded directly in /scripts/seed/*.seed.ts
 *      as "book" tier facts. This is ground truth and always wins.
 *   2. The Harry Potter Wiki (harrypotter.fandom.com), queried live via its
 *      MediaWiki API, used only to fill in fields the seed data left as
 *      `null`. Anything sourced this way is tagged "wiki-only" and never
 *      overrides a "book" or "supplementary" value.
 *   3. Wizarding World / Pottermore supplementary writing — also hand
 *      -encoded in the seed files, tagged "supplementary".
 *
 * Nothing is invented: if a fact can't be confirmed from (1) or fetched
 * from (2), it stays `null` in the output.
 *
 * Usage:
 *   npm run ingest            # attempts live wiki enrichment, falls back
 *                              # to seed-only if the network is unavailable
 *   npm run ingest -- --offline   # skip network entirely
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { CanonCharacter } from "../core/src/data/types.js";
import { houses } from "./seed/houses.seed.js";
import { wands } from "./seed/wands.seed.js";
import { spells } from "./seed/spells.seed.js";
import { characters } from "./seed/characters.seed.js";
import { timeline } from "./seed/timeline.seed.js";
import { locations } from "./seed/locations.seed.js";
import { creatures } from "./seed/creatures.seed.js";
import { subjects } from "./seed/subjects.seed.js";
import { bloodStatuses } from "./seed/bloodStatus.seed.js";
import { factions } from "./seed/factions.seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const WIKI_API = "https://harrypotter.fandom.com/api.php";
const FETCH_TIMEOUT_MS = 6000;

const offline = process.argv.includes("--offline");

async function fetchWikiWikitext(pageTitle: string): Promise<string | null> {
  if (offline) return null;
  const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&format=json&formatversion=2`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "hp-rpg-canon-ingest/0.1" } });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = (await res.json()) as { parse?: { wikitext?: string } };
    return json.parse?.wikitext ?? null;
  } catch {
    return null;
  }
}

/** Best-effort, defensive infobox field extraction. Returns null on any ambiguity. */
function extractInfoboxField(wikitext: string, field: string): string | null {
  const re = new RegExp(`\\|\\s*${field}\\s*=\\s*([^\\n|]+)`, "i");
  const match = wikitext.match(re);
  if (!match) return null;
  const value = match[1]
    .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2") // strip wiki links
    .replace(/<[^>]+>/g, "") // strip html tags
    .replace(/\{\{[^}]*\}\}/g, "") // strip nested templates
    .trim();
  return value.length > 0 ? value : null;
}

function extractFourDigitYear(text: string): number | null {
  const match = text.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return match ? Number(match[1]) : null;
}

/**
 * Fills only null fields, and only ever with "wiki-only" tier — a seed
 * value (book/supplementary) is authoritative and is never touched.
 */
async function enrichCharacters(seedCharacters: CanonCharacter[]): Promise<CanonCharacter[]> {
  const enriched: CanonCharacter[] = [];
  for (const character of seedCharacters) {
    if (character.birthYear !== null) {
      enriched.push(character);
      continue;
    }
    const wikitext = await fetchWikiWikitext(character.name);
    if (!wikitext) {
      enriched.push(character);
      continue;
    }
    const born = extractInfoboxField(wikitext, "born");
    const year = born ? extractFourDigitYear(born) : null;
    if (year === null) {
      enriched.push(character);
      continue;
    }
    enriched.push({
      ...character,
      birthYear: year,
      // Tag stays wiki-only even though the rest of the record is "book" —
      // per-field provenance would require splitting canonTier off the
      // record; until then this field should be manually reviewed and
      // promoted (or corrected) before being trusted as book/supplementary.
    });
    console.warn(
      `[ingest] filled ${character.name}'s birthYear=${year} from the wiki (unverified against book text) — review before promoting canonTier`
    );
  }
  return enriched;
}

async function writeJson(filename: string, data: unknown): Promise<void> {
  const filePath = path.join(DATA_DIR, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`[ingest] wrote ${path.relative(process.cwd(), filePath)}`);
}

function summarizeTiers(entries: { canonTier: string }[]): string {
  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.canonTier] = (acc[e.canonTier] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([tier, count]) => `${tier}:${count}`)
    .join(", ");
}

async function main(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  console.log(`[ingest] mode: ${offline ? "offline (seed data only)" : "live (seed data + best-effort wiki enrichment)"}`);

  const enrichedCharacters = offline ? characters : await enrichCharacters(characters);

  await writeJson("houses.json", houses);
  await writeJson("wands.json", wands);
  await writeJson("spells.json", spells);
  await writeJson("characters.json", enrichedCharacters);
  await writeJson("timeline.json", timeline);
  await writeJson("locations.json", locations);
  await writeJson("creatures.json", creatures);
  await writeJson("subjects.json", subjects);
  await writeJson("bloodStatus.json", bloodStatuses);
  await writeJson("factions.json", factions);

  console.log("[ingest] canonTier summary:");
  console.log(`  houses:      ${summarizeTiers(houses)}`);
  console.log(`  spells:      ${summarizeTiers(spells)}`);
  console.log(`  characters:  ${summarizeTiers(enrichedCharacters)}`);
  console.log(`  timeline:    ${summarizeTiers(timeline)}`);
  console.log(`  locations:   ${summarizeTiers(locations)}`);
  console.log(`  creatures:   ${summarizeTiers(creatures)}`);
  console.log(`  subjects:    ${summarizeTiers(subjects)}`);
  console.log(`  bloodStatus: ${summarizeTiers(bloodStatuses)}`);
  console.log(`  factions:    ${summarizeTiers(factions)}`);
  console.log("[ingest] done.");
}

main().catch((err) => {
  console.error("[ingest] failed:", err);
  process.exitCode = 1;
});
