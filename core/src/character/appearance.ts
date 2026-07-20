import type { UiAdapter } from "../adapters/UiAdapter.js";
import type { CharacterAppearance } from "./types.js";

export async function runAppearanceFlow(ui: UiAdapter): Promise<CharacterAppearance> {
  const hairColor = await ui.ask("Hair color?");
  const eyeColor = await ui.ask("Eye color?");
  const build = await ui.ask("Build (e.g. tall and gangly, short and sturdy)?");
  const featuresRaw = await ui.ask(
    "Any distinguishing features (scars, freckles, glasses)? Comma-separated, or leave blank."
  );
  const distinguishingFeatures = featuresRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const freeText = await ui.ask("Anything else about how they look or carry themselves?");

  return {
    hairColor: hairColor || "unremarkable",
    eyeColor: eyeColor || "unremarkable",
    build: build || "unremarkable",
    distinguishingFeatures,
    freeText,
  };
}
