# HP-RPG Canon Style Bible

This document constrains any prose generated or written for this game — by
a human author or by an LLM — so that it reads consistently with J.K.
Rowling's seven Harry Potter novels. It is a companion to the canon data
layer (`/data/*.json`): the data layer says *what is true*; this document
says *how to say it*.

Two audiences read this file: a human author extending `/data/scenes/*`,
and an LLM generating scene text at runtime. Both should be able to follow
it without additional context.

## 1. Voice & POV

- **Third-person limited**, tightly anchored to the player character. We
  see, hear, and understand only what they do. Never head-hop into another
  character's thoughts.
- **Narrative stance**: wry, warm, and observational, with a light comic
  touch even in tense scenes. Rowling undercuts danger with humor and
  undercuts humor with real stakes — rarely lets a scene sit in only one
  register.
- **British idiom and spelling throughout**: *colour*, *realise*,
  *jumper* (not sweater), *torch* (not flashlight), *trainers* (not
  sneakers), *toilets* (not bathroom), *Mum*/*Dad* (not Mom/Dad), *rubbish*
  (not trash), *queue* (not line), *fortnight*, *the Underground*. Dialogue
  tags and narration alike hold to British English.
- **The mundane and the magical share a sentence.** A feast is described
  with the same steady, specific attention as a Stunning Spell; a moving
  staircase is a mild inconvenience for someone late to class, not a
  spectacle. Magic is ordinary to the people living inside it — the wonder
  belongs to the reader, not to the characters.

## 2. Diction & vocabulary

**Use these canonical terms, correctly:**

| Term | Meaning |
|---|---|
| Muggle | A person with no magical ability |
| Squib | A person born to magical parents with no magical ability |
| Muggle-born | A witch/wizard born to two Muggle parents |
| O.W.L. | Ordinary Wizarding Level exam, taken in year 5 |
| N.E.W.T. | Nastily Exhausting Wizarding Test, taken in year 7 |
| Galleon / Sickle / Knut | Gold / silver / bronze wizarding currency (17 Sickles to a Galleon, 29 Knuts to a Sickle) |
| Floo (powder) / the Floo Network | Fireplace-based wizarding travel |
| Apparate / Disapparate | Teleport by will (illegal under 17, requires a license) |
| the Ministry | The Ministry of Magic, wizarding Britain's government |
| Quidditch | The wizarding sport played on broomsticks |
| Head Boy/Girl, Prefect | Student leadership roles |
| Sorting | The first-night ceremony assigning students to a house |

**Do-not-use list** — anachronisms and non-canon coinages that break
voice:

- American vocabulary substitutes for the terms above (*sweater*,
  *flashlight*, *candy*, *vacation*, *soccer*).
- Invented spell names, houses, subjects, or Ministry departments not in
  the data layer. If a scene needs a spell that isn't in `spells.json`,
  add it to the data layer first — do not invent it inline in prose.
- Modern slang, internet-era idiom, or texting shorthand — the books are
  contemporary-set (1991-1998) but written with a timeless, slightly
  old-fashioned register even then.
- "Magical energy," "mana," "leveling up," "XP," or other fantasy-game or
  JRPG vocabulary. This is Rowling's magic system, not a generic one:
  magic is cast with a wand, an incantation, and intent, not a resource
  bar.
- Calling the protagonist "the player" or "the user" in narration — always
  refer to them as their character, in-world.

## 3. Description conventions

- **Spells**: describe the incantation, the wand movement (if any), and
  the physical effect in that order, economically. Avoid over-narrating
  the *feeling* of casting — let the effect speak. E.g.: *"Wingardium
  Leviosa!" The feather trembled, then rose, wobbling, into the air.*
- **Food / the feast**: abundance rendered as a concrete list, not a mood.
  Rowling itemizes — roast potatoes, treacle tart, names of dishes — more
  than she adjectives. Let the sheer quantity do the emotional work.
- **Castle spaces**: specific and geographic (which floor, which
  staircase, which portrait) rather than atmospheric generalities. Hogwarts
  is treated as a real building the character navigates, not a painted
  backdrop.
- **Weather**: brief, seasonal, and used to set a scene's mood in a single
  clause, not a paragraph — a grey September drizzle, a hard November
  frost, a hot, restless June.
- **Sensory but economical.** One or two well-chosen sensory details beat
  five generic ones. Smell and sound are underused and effective (the
  smell of the potions dungeon, the creak of a specific stair).
- Magic is treated as **ordinary by its inhabitants** — nobody marvels at
  a moving staircase or a talking portrait; characters react to magic the
  way a Muggle reacts to a bus being late.

## 4. Dialogue rules

- **Honorifics matter and are used consistently**: students say
  "Professor [Surname]" to teachers, never first names; "Headmaster" or
  "Headmistress" to whoever holds that post; "Sir"/nothing casual to
  Ministry officials in a formal setting.
- **House/character speech patterns** (use as a general register, not a
  rigid rule):
  - Gryffindor characters tend toward blunt, quick, emotionally forward
    speech.
  - Slytherin characters tend toward precise, needling, controlled speech
    — cutting rather than shouting.
  - Hufflepuff characters tend toward plain, kind, unpretentious speech.
  - Ravenclaw characters tend toward digressive, curious, reference-heavy
    speech.
  - These are tendencies of the books' characters, not a cage — plenty of
    named characters break their house's pattern (Luna Lovegood, sorted
    Ravenclaw, is dreamy rather than sharp; canon fidelity means writing
    the *individual*, using house as a light default only for original or
    minor characters).
- **Canonical characters must be portrayed consistent with their book
  characterization** — their values, speech habits, and known
  relationships as established in the novels (query `characters.json` for
  house, affiliations, and status/location by year before writing them
  into a scene).
- **Canonical characters must NOT**: be given knowledge they don't yet
  have at the current in-story year (check `timeline.json`); appear in a
  scene after their death year (`characters.json.deathYear`); be paired
  romantically or made to betray relationships not supported by canon; be
  written performing an Unforgivable Curse or other major action canon
  doesn't show them taking, without clear in-fiction justification that
  doesn't contradict the books.

## 5. Tone by era

The tone should track the books' own escalation, anchored to the current
story year (see `timeline.json`):

- **Years 1-2 (1991-1993)**: light, funny, mystery-of-the-week in feel.
  Danger exists but resolves cleanly; the school itself is a source of
  delight.
- **Year 3 (1993-1994)**: darker undercurrent introduced (Azkaban,
  Dementors) but still buoyed by humor and warmth.
- **Year 4 (1994-1995)**: stakes escalate sharply at the climax
  (Cedric Diggory's death, Voldemort's return); the bulk of the year stays
  lighter (the Triwizard spectacle, the Yule Ball) before the tonal break.
- **Year 5 (1995-1996)**: sustained institutional darkness (Umbridge,
  censorship, the DA as resistance) punctuated by real loss.
- **Year 6 (1996-1997)**: grief and dread under a thinning veneer of school
  normalcy; ends in major loss (Dumbledore's death).
- **Years 7 / 1997-1998**: openly wartime. No Hogwarts safety net assumed
  once the Ministry falls; scenes set in this era should reflect genuine
  danger, particularly for Muggle-born characters (see
  `bloodStatus.json`'s 1997-98 era note on the Muggle-born Registration
  Commission).

Never flatten this arc — a scene set in 1991 and a scene set in 1997
should not read in the same register even if the mechanical content
(a class, a corridor conversation) is similar.

## 6. Prompt-injection block

Prepend the block below, verbatim, to any LLM call that generates
in-fiction prose for this game (scene text, NPC dialogue, narration). Fill
in the two bracketed context lines from current game state.

```
You are the narrator of a Harry Potter text-RPG. Write strictly in the
voice of the seven Harry Potter novels: third-person limited on the player
character, wry/warm/observational narration, British English spelling and
idiom throughout. Treat magic as mundane to the people living in it.

Current story year: [YEAR] (tone should match: see style-bible.md §5)
Player character: [NAME], House: [HOUSE], Year: [HOGWARTS_YEAR]

Hard constraints:
- Use ONLY facts present in the supplied canon data (houses, spells,
  characters, timeline, locations). If a fact is not in the data, do not
  invent it — write around the gap or state it is unknown in-world.
- Do not have any canonical character appear, speak, or be referenced as
  present after their recorded death year, or act outside their
  established characterization.
- Do not invent spells, houses, subjects, or locations not present in the
  data layer.
- No modern slang, no American vocabulary substitutions, no game-mechanic
  vocabulary ("XP", "mana", "level up").
- Keep prose economical: 1-3 short paragraphs per beat unless asked for
  more.
```

### In-voice examples

> The staircase shuddered under them and began, with a grinding sigh, to
> swing away from the landing altogether. Ron made a grab for the banister.
> "It does that," said a portrait of a bored-looking knight, not looking
> up from his card game. "Wait it out."

> Dinner arrived the way it always did at Hogwarts: all at once, and too
> much of it. Roast potatoes, a joint of beef going pink at the middle,
> Yorkshire puddings the size of fists, a gravy boat that never seemed to
> empty. Down the table, a first-year Hermione had never spoken to was
> already explaining, at some length, why house-elves ought to be paid.

> "Detention, Longbottom," said Professor Snape, without turning from the
> board, "for existing loudly in my classroom. Ten points from Gryffindor
> for making me say so twice."

### Counter-examples (violations — do not write like this)

> ❌ *Harry felt his mana regenerate as he leveled up his Charms skill to
> 12.* — Game-mechanic vocabulary; magic is not a resource system in this
> voice.

> ❌ *"OMG, that spell was totally awesome," Ron texted Hermione.* —
> Anachronistic slang and a communication method (texting) that doesn't
> exist in this world; breaks British idiom and the 1990s wizarding
> setting.

> ❌ *In 1999, Professor Dumbledore called the school to order.* — Dumbledore
> died in 1997 per `characters.json`; placing him alive and active in 1999
> is a hard canon violation, not a stylistic one.

## 7. Using this document

- **Human authors** writing `/data/scenes/*.json` prose fields: read the
  relevant era (§5) and location/character entries in `/data` before
  drafting, and self-check dialogue against §4.
- **LLM generation**: always prepend §6's block, with the bracketed fields
  filled from the current `GameState`, and pass the relevant slice of
  `/data` (not the whole bundle) as grounding context.
- **Both**: if the data layer doesn't have a fact you need, that's a
  signal to extend `/data` (with correct `canonTier`/`source`) — not to
  improvise it in prose.
