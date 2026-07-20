import type { Character } from "../character/types.js";
import type { CanonDataBundle } from "../data/types.js";
import type { NarratorContext } from "../adapters/NarratorAdapter.js";
import type { Scene } from "./types.js";

/**
 * Mirrors canon/style-bible.md §6's prompt-injection block. Kept as a
 * plain string here (rather than read from the .md file at runtime) so
 * /core has zero dependency on a bundler's raw-file-import support and
 * stays portable to Metro/React Native unchanged. If you edit the voice
 * rules in the style bible, update this constant to match — it is the
 * literal text sent to the model, not a paraphrase of it.
 */
const STYLE_BIBLE_INJECTION_BLOCK = `You are the narrator of a Harry Potter text-RPG. Write strictly in the
voice of the seven Harry Potter novels: third-person limited on the player
character, wry/warm/observational narration, British English spelling and
idiom throughout. Treat magic as mundane to the people living in it.

Current story year: {{calendarYear}} (school year {{hogwartsYear}} of 7)
Player character: {{name}}, House: {{house}}

Hard constraints:
- Use ONLY facts present in the supplied grounding facts. If a fact is not
  supplied, do not invent it — write around the gap or state it is unknown
  in-world.
- Do not have any canonical character appear, speak, or be referenced as
  present after their recorded death year, or act outside their
  established characterization.
- Do not invent spells, houses, subjects, or locations not present in the
  grounding facts.
- No modern slang, no American vocabulary substitutions, no game-mechanic
  vocabulary ("XP", "mana", "level up").
- Keep prose economical: one short paragraph (2-4 sentences) unless asked
  for more.`;

function fillTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.split(`{{${key}}}`).join(value),
    template
  );
}

/**
 * Builds the (system prompt, instruction, grounding facts) triple for a
 * "personal beat" enrichment call: one short paragraph reacting to
 * something specific about *this* character — their backstory, blood
 * status, appearance, or wand — in the context of the current scene.
 * Pure and network-free; the adapter implementation does the actual call.
 */
export function buildNarratorContext(
  scene: Scene,
  character: Character,
  data: CanonDataBundle
): NarratorContext {
  const calendarYear = character.identity.hogwartsStartYear + (scene.hogwartsYear - 1);
  const houseName = character.house[0].toUpperCase() + character.house.slice(1);

  const systemPrompt = fillTemplate(STYLE_BIBLE_INJECTION_BLOCK, {
    calendarYear: String(calendarYear),
    hogwartsYear: String(scene.hogwartsYear),
    name: character.identity.name,
    house: houseName,
  });

  const instruction =
    `Write one short, in-voice paragraph reacting specifically to this character's own backstory, ` +
    `blood status, appearance, or wand — something a generic student in this scene wouldn't say or notice. ` +
    `This is a small added beat, not a replacement for the scene: do not summarize or repeat the scene's ` +
    `own events, do not advance the plot, and do not introduce any named character not already in the ` +
    `grounding facts.`;

  const groundingFacts = {
    sceneTitle: scene.title,
    hogwartsYear: scene.hogwartsYear,
    calendarYear,
    house: houseName,
    bloodStatus: character.bloodStatus,
    upbringing: character.backstory.upbringing,
    familyDescription: character.backstory.familyDescription,
    backstoryFreeText: character.backstory.freeText,
    appearance: character.appearance,
    wand: character.wand,
    availableHouses: data.houses.map((h) => h.id),
  };

  return { systemPrompt, instruction, groundingFacts };
}
