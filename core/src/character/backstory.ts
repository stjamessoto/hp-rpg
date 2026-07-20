import type { UiAdapter } from "../adapters/UiAdapter.js";
import type { Upbringing } from "./types.js";
import type { CharacterBackstory } from "./types.js";

/**
 * Families whose composition is fixed by the books, so free-text backstory
 * can't quietly contradict them (the classic failure mode: "I'm the
 * Potters' second child"). This is deliberately small and literal — it
 * catches the obvious claims, not every possible contradiction.
 */
const CLOSED_FAMILIES: { surname: string; note: string; pattern: RegExp }[] = [
  {
    surname: "Potter",
    note: "James and Lily Potter had exactly one child in canon: Harry Potter. A backstory claiming to be their other child, sibling, or second child contradicts the books.",
    pattern: /potters?['’]?\s+(second|other|another)\s+child|sibling of harry potter|harry potter['’]?s\s+(brother|sister)/i,
  },
  {
    surname: "Dursley",
    note: "Vernon and Petunia Dursley had exactly one child in canon: Dudley. A backstory claiming to be another Dursley child contradicts the books.",
    pattern: /dursleys?['’]?\s+(second|other|another)\s+child|dudley dursley['’]?s\s+(brother|sister)/i,
  },
  {
    surname: "Weasley",
    note: "The Weasley children are fixed in canon (Bill, Charlie, Percy, Fred, George, Ron, Ginny). A backstory claiming to be an additional Weasley sibling contradicts the books.",
    pattern: /weasleys?['’]?\s+(eighth|another|extra)\s+child|another weasley sibling/i,
  },
];

export interface BackstoryViolation {
  message: string;
}

export function validateBackstoryText(freeText: string): BackstoryViolation[] {
  const violations: BackstoryViolation[] = [];
  for (const family of CLOSED_FAMILIES) {
    if (family.pattern.test(freeText)) {
      violations.push({ message: family.note });
    }
  }
  return violations;
}

export async function runBackstoryFlow(ui: UiAdapter): Promise<CharacterBackstory> {
  const upbringing = await ui.choose<Upbringing>(
    "What kind of household did your character grow up in?",
    [
      { id: "wizarding", label: "A wizarding household" },
      { id: "muggle", label: "A Muggle household" },
      { id: "mixed", label: "A mixed wizarding/Muggle household" },
    ]
  );

  const familyDescription = await ui.ask(
    "Briefly describe your character's family (parents' occupations, siblings, home life)."
  );

  let freeText = "";
  for (;;) {
    freeText = await ui.ask(
      "Tell your character's story in a few sentences — how they found out about Hogwarts, what they're hoping for."
    );
    const violations = validateBackstoryText(`${familyDescription} ${freeText}`);
    if (violations.length === 0) break;
    for (const v of violations) {
      await ui.print(`That backstory conflicts with canon: ${v.message}`);
    }
    await ui.print("Try rewriting that part of the backstory.");
  }

  const tags: string[] = [upbringing];
  if (/muggle/i.test(familyDescription)) tags.push("muggle-family-ties");
  if (/only child/i.test(familyDescription)) tags.push("only-child");

  return { upbringing, familyDescription, freeText, tags };
}
