import type { BloodStatusEntry } from "../../core/src/data/types.js";

export const bloodStatuses: BloodStatusEntry[] = [
  {
    id: "pure-blood",
    name: "Pure-blood",
    description: "A witch or wizard with no Muggle or Muggle-born ancestors, so far as is known.",
    eraNotes: [
      {
        era: "throughout",
        note: "Some pure-blood families (e.g. the Malfoys, the Blacks) treat blood purity as a mark of superiority; others (e.g. the Weasleys) reject that ideology entirely.",
        canonTier: "book",
        source: "Chamber of Secrets; Order of the Phoenix",
      },
    ],
    canonTier: "book",
    source: "Chamber of Secrets, ch. 4",
  },
  {
    id: "half-blood",
    name: "Half-blood",
    description: "A witch or wizard with one Muggle (or Muggle-born) parent/grandparent and one wizarding parent/grandparent, broadly speaking.",
    eraNotes: [
      {
        era: "throughout",
        note: "Most named characters, including Harry Potter, Severus Snape, and Voldemort himself, are half-blood — undercutting blood-purist ideology from within.",
        canonTier: "book",
        source: "All seven novels",
      },
    ],
    canonTier: "book",
    source: "Chamber of Secrets, ch. 6",
  },
  {
    id: "muggle-born",
    name: "Muggle-born",
    description: "A witch or wizard born to two Muggle parents, with no known magical ancestry.",
    eraNotes: [
      {
        era: "1997-1998",
        note: "Under the Death Eater-controlled Ministry, Muggle-borns are forced to appear before the Muggle-born Registration Commission and prove magical heritage or face imprisonment; being caught without a registered exemption is extremely dangerous.",
        canonTier: "book",
        source: "Deathly Hallows, ch. 12-13",
      },
    ],
    canonTier: "book",
    source: "Chamber of Secrets, ch. 6",
  },
  {
    id: "squib",
    name: "Squib",
    description: "A person born to magical parents who has no magical ability themselves; not a blood status in the ancestry sense, but grouped with it in wizarding social discourse.",
    eraNotes: [],
    canonTier: "book",
    source: "Chamber of Secrets, ch. 8 (Filch); Order of the Phoenix (Mrs Figg)",
  },
];
