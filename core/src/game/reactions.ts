import type { Upbringing } from "../character/types.js";

/**
 * Short, in-voice reactions that vary by a character's stated upbringing —
 * the first concrete example of `backstory` actually changing displayed
 * prose rather than just being validated and stored. Deliberately small:
 * a template per `Upbringing` value, not a generative system.
 */
const UPBRINGING_REACTIONS: Record<Upbringing, string> = {
  wizarding:
    "Growing up around magic your whole life, none of this is exactly a surprise — but it's still a lot, even for you.",
  muggle:
    "Nothing in your life before this moment prepared you for a ceiling that shows weather it doesn't actually have, and it takes real effort to keep your mouth shut.",
  mixed:
    "Half of this is achingly familiar from a parent's stories; the other half still catches you off guard completely.",
};

export function getUpbringingReaction(upbringing: Upbringing): string {
  return UPBRINGING_REACTIONS[upbringing];
}
