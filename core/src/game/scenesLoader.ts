import sortingFeast from "@data/scenes/sorting-feast.json";
import firstClass from "@data/scenes/first-class.json";
import flyingLesson from "@data/scenes/flying-lesson.json";
import widerWorldY1 from "@data/scenes/wider-world-y1.json";
import endOfYearOne from "@data/scenes/end-of-year-one.json";

import startOfYearTwo from "@data/scenes/start-of-year-two.json";
import secondYearClass from "@data/scenes/second-year-class.json";
import widerWorldY2 from "@data/scenes/wider-world-y2.json";
import endOfYearTwo from "@data/scenes/end-of-year-two.json";

import startOfYearThree from "@data/scenes/start-of-year-three.json";
import electiveChoice from "@data/scenes/elective-choice.json";
import hogsmeadeVisit from "@data/scenes/hogsmeade-visit.json";
import widerWorldY3 from "@data/scenes/wider-world-y3.json";
import endOfYearThree from "@data/scenes/end-of-year-three.json";

import startOfYearFour from "@data/scenes/start-of-year-four.json";
import widerWorldY4 from "@data/scenes/wider-world-y4.json";
import fourthYearClass from "@data/scenes/fourth-year-class.json";
import endOfYearFour from "@data/scenes/end-of-year-four.json";

import startOfYearFive from "@data/scenes/start-of-year-five.json";
import widerWorldY5 from "@data/scenes/wider-world-y5.json";
import studyGroup from "@data/scenes/study-group.json";
import owlsExams from "@data/scenes/owls-exams.json";
import endOfYearFive from "@data/scenes/end-of-year-five.json";

import startOfYearSix from "@data/scenes/start-of-year-six.json";
import newtElectives from "@data/scenes/newt-electives.json";
import widerWorldY6 from "@data/scenes/wider-world-y6.json";
import endOfYearSix from "@data/scenes/end-of-year-six.json";

import startOfYearSevenWar from "@data/scenes/start-of-year-seven-war.json";
import widerWorldY7War from "@data/scenes/wider-world-y7-war.json";
import muggleBornInHiding from "@data/scenes/muggle-born-in-hiding.json";
import resistanceY7 from "@data/scenes/resistance-y7.json";
import endOfYearSevenBattle from "@data/scenes/end-of-year-seven-battle.json";

import startOfYearSevenPeace from "@data/scenes/start-of-year-seven-peace.json";
import widerWorldY7Peace from "@data/scenes/wider-world-y7-peace.json";
import newtsFinal from "@data/scenes/newts-final.json";
import graduation from "@data/scenes/graduation.json";

import type { Scene, SceneBundle } from "./types.js";

/**
 * Explicit imports rather than a directory glob, so /core stays free of any
 * bundler-specific loading API (Vite's import.meta.glob, Metro's require
 * context, etc.) and the same code runs unchanged on mobile. Adding a new
 * scene is still just: write the JSON file, add one import line here.
 *
 * These 35 scenes cover all seven Hogwarts years as a single continuous
 * chain (see /core/src/game/sceneEngine.ts for how `hogwartsYear`,
 * {{wider-world}}, and the year-six -> year-seven war/peace branch work).
 */
const scenes: Scene[] = [
  sortingFeast as Scene,
  firstClass as Scene,
  flyingLesson as Scene,
  widerWorldY1 as Scene,
  endOfYearOne as Scene,

  startOfYearTwo as Scene,
  secondYearClass as Scene,
  widerWorldY2 as Scene,
  endOfYearTwo as Scene,

  startOfYearThree as Scene,
  electiveChoice as Scene,
  hogsmeadeVisit as Scene,
  widerWorldY3 as Scene,
  endOfYearThree as Scene,

  startOfYearFour as Scene,
  widerWorldY4 as Scene,
  fourthYearClass as Scene,
  endOfYearFour as Scene,

  startOfYearFive as Scene,
  widerWorldY5 as Scene,
  studyGroup as Scene,
  owlsExams as Scene,
  endOfYearFive as Scene,

  startOfYearSix as Scene,
  newtElectives as Scene,
  widerWorldY6 as Scene,
  endOfYearSix as Scene,

  startOfYearSevenWar as Scene,
  widerWorldY7War as Scene,
  muggleBornInHiding as Scene,
  resistanceY7 as Scene,
  endOfYearSevenBattle as Scene,

  startOfYearSevenPeace as Scene,
  widerWorldY7Peace as Scene,
  newtsFinal as Scene,
  graduation as Scene,
];

export const sceneBundle: SceneBundle = Object.fromEntries(scenes.map((s) => [s.id, s]));

/** Every playthrough begins here, regardless of which year the player starts in — Hogwarts year 1 always opens with the Sorting. */
export const INTRO_START_SCENE_ID = "sorting-feast";
