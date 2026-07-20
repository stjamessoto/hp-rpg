import type { Faction } from "../../core/src/data/types.js";

export const factions: Faction[] = [
  {
    id: "order-of-the-phoenix",
    name: "The Order of the Phoenix",
    description: "A secret society founded by Albus Dumbledore to fight Voldemort and the Death Eaters.",
    alignment: "light",
    activeYears: { start: null, end: 1998 },
    notableMemberIds: ["albus-dumbledore", "sirius-black", "remus-lupin", "severus-snape"],
    canonTier: "book",
    source: "Order of the Phoenix onward",
  },
  {
    id: "death-eaters",
    name: "The Death Eaters",
    description: "Lord Voldemort's followers, identified by the Dark Mark branded on their forearms.",
    alignment: "dark",
    activeYears: { start: null, end: 1998 },
    notableMemberIds: ["tom-riddle", "bellatrix-lestrange", "lucius-malfoy", "peter-pettigrew"],
    canonTier: "book",
    source: "Goblet of Fire onward",
  },
  {
    id: "dumbledores-army",
    name: "Dumbledore's Army",
    description: "A student defence group formed to learn practical Defence Against the Dark Arts outside Dolores Umbridge's curriculum.",
    alignment: "light",
    activeYears: { start: 1995, end: 1996 },
    notableMemberIds: ["harry-potter", "ron-weasley", "hermione-granger", "neville-longbottom", "luna-lovegood", "ginny-weasley"],
    canonTier: "book",
    source: "Order of the Phoenix, ch. 16-18",
  },
  {
    id: "ministry-of-magic-faction",
    name: "Ministry of Magic",
    description: "The governing body of Britain's wizarding community, headed by a Minister for Magic.",
    alignment: "institutional",
    activeYears: { start: null, end: null },
    notableMemberIds: [],
    canonTier: "book",
    source: "All seven novels",
  },
];
