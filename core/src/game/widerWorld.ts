import type { CanonDataBundle } from "../data/types.js";

/**
 * Maps a Hogwarts school year (Sept-start label, e.g. 1994 = the 1994-95
 * school year) to the `timeline.json` events that belong to it.
 *
 * This is a hand-placed lookup rather than an automatic "timeline event
 * year === school year" filter, because timeline events are dated by their
 * literal real-world calendar year (e.g. `battle-of-hogwarts` is tagged
 * 1998, since it happens in May 1998) while a school year spans two
 * calendar years — several major events (Sirius's death, Dumbledore's
 * death, the Battle of Hogwarts) land in the second half of a school year,
 * so a naive equality filter would surface them one school year late. This
 * table encodes the correct placement once, explicitly.
 */
const WIDER_WORLD_EVENTS_BY_SCHOOL_YEAR: Record<number, string[]> = {
  1991: ["harry-starts-hogwarts"],
  1992: ["chamber-reopened-1993"],
  1993: ["sirius-escapes-azkaban"],
  1994: ["triwizard-tournament", "voldemort-returns"],
  1995: ["battle-department-of-mysteries"],
  1996: ["dumbledore-dies"],
  1997: ["ministry-falls", "muggle-born-registration", "battle-of-hogwarts"],
};

const QUIET_YEAR_FALLBACK =
  "It's a quiet year, by the standards of the world you've grown up hearing about — the kind that doesn't end up in any history book, and nobody at Hogwarts seems to mind that one bit.";

/** A short in-voice paragraph summarizing canon events relevant to the given school year, or a graceful fallback. */
export function buildWiderWorldParagraph(schoolYear: number, data: CanonDataBundle): string {
  const eventIds = WIDER_WORLD_EVENTS_BY_SCHOOL_YEAR[schoolYear];
  if (!eventIds || eventIds.length === 0) return QUIET_YEAR_FALLBACK;

  const sentences = eventIds
    .map((id) => data.timeline.find((e) => e.id === id))
    .filter((event): event is NonNullable<typeof event> => Boolean(event))
    .map((event) => `${event.title}: ${event.description}`);

  if (sentences.length === 0) return QUIET_YEAR_FALLBACK;
  return `Word reaches even first-years eventually. This year: ${sentences.join(" ")}`;
}

/** The professor teaching a given subject in a given school year, from subjects.json's professorsByEra — or a graceful generic fallback. */
export function getSubjectProfessor(subjectId: string, schoolYear: number, data: CanonDataBundle): string {
  const subject = data.subjects.find((s) => s.id === subjectId);
  const tenure = subject?.professorsByEra.find(
    (p) => (p.eraStart ?? -Infinity) <= schoolYear && schoolYear <= (p.eraEnd ?? Infinity)
  );
  if (tenure) return tenure.name;
  return subject ? `this year's ${subject.name} teacher` : "this year's teacher";
}

/** The Defence Against the Dark Arts professor for a given school year, per the famously rotating post — or a graceful generic fallback. */
export function getDadaProfessor(schoolYear: number, data: CanonDataBundle): string {
  return getSubjectProfessor("defence-against-the-dark-arts", schoolYear, data);
}
