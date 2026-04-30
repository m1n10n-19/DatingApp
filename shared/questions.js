export const CORE_QUESTIONS = [
  {
    id: 1,
    text: "When something you deeply care about falls apart — a relationship, a project, a belief — what do you actually do? Not what you tell people. What happens in the first 72 hours when no one is watching?",
    placeholder: "Be honest. Not what sounds good — what actually happens...",
    module: 'core',
  },
  {
    id: 2,
    text: "What's the thing you're most afraid someone you love will eventually discover about you? Not a secret — a pattern, a tendency, the thing you manage around so they never quite see it clearly.",
    placeholder: "The thing you work hardest to keep from being seen...",
    module: 'core',
  },
  {
    id: 3,
    text: "Describe the last time you felt genuinely understood by another person. What did they do or say that made you feel that way? If you can't remember a time — that's an answer too.",
    placeholder: "What does being truly seen feel like to you...",
    module: 'core',
  },
];

export const KOKOLOGY_QUESTIONS = [
  {
    id: 'kokology-childhood-box',
    text: "You are a child. You find a box in an attic. Describe the box and what's inside.",
    placeholder: "Describe the box — its size, condition, what you find when you open it...",
    module: 'kokology',
  },
  {
    id: 'kokology-forest-water',
    text: "You walk through a forest and reach water. Describe the forest and the water.",
    placeholder: "What does the forest look like? What kind of water do you find?",
    module: 'kokology',
  },
  {
    id: 'kokology-house-rooms',
    text: "You enter a house. Describe the rooms you walk through and what's in each.",
    placeholder: "Walk through the house in your mind — what do you see in each room?",
    module: 'kokology',
  },
  {
    id: 'kokology-animal-path',
    text: "An animal blocks your path. Describe the animal, what it's doing, what you do.",
    placeholder: "What animal is it? What's its demeanor? How do you respond?",
    module: 'kokology',
  },
];

export const SHADOW_QUESTIONS = [
  {
    id: 'shadow-irritation',
    text: "What trait in other people irritates you most? Be specific.",
    placeholder: "Not a general pet peeve — the specific behavior that gets under your skin...",
    module: 'shadow',
  },
  {
    id: 'shadow-hidden-self',
    text: "Describe the version of yourself you most don't want people to see.",
    placeholder: "The version you hide — not a bad day, but a pattern you manage around...",
    module: 'shadow',
  },
  {
    id: 'shadow-childhood-template',
    text: "What did love look like in the home you grew up in? Not what you wished — what you actually saw.",
    placeholder: "Describe what love actually looked like day to day, not the ideal...",
    module: 'shadow',
  },
];

export const DESIRE_QUESTIONS = [
  {
    id: 'desire-unadmitted',
    text: "What do you want from a partner that you've never said out loud?",
    placeholder: "The thing you want but have never actually asked for...",
    module: 'desire',
  },
  {
    id: 'desire-alive-dead',
    text: "Describe the moment you've felt most alive in a relationship. Then the moment you've felt most dead.",
    placeholder: "Two moments — one where you felt fully alive, one where something in you shut down...",
    module: 'desire',
  },
];

export const CONTRADICTION_PAIRS = [
  {
    pairId: 1,
    first: {
      id: 'contradiction-1a',
      text: "How would you describe yourself in one sentence?",
      placeholder: "One sentence — honest, not polished...",
    },
    second: {
      id: 'contradiction-1b',
      text: "How would your most recent ex describe you in one sentence?",
      placeholder: "What would they actually say — not what you'd want them to say...",
    },
    module: 'contradictions',
  },
  {
    pairId: 2,
    first: {
      id: 'contradiction-2a',
      text: "What do you want most in a relationship?",
      placeholder: "The real answer, not the dating-profile answer...",
    },
    second: {
      id: 'contradiction-2b',
      text: "What scares you most about getting it?",
      placeholder: "What frightens you about actually receiving what you want...",
    },
    module: 'contradictions',
  },
  {
    pairId: 3,
    first: {
      id: 'contradiction-3a',
      text: "Describe a time you gave too much in a relationship.",
      placeholder: "When you over-extended — what did that look like?",
    },
    second: {
      id: 'contradiction-3b',
      text: "Describe a time you didn't give enough.",
      placeholder: "When you held back — what were you protecting?",
    },
    module: 'contradictions',
  },
];

export const MODULE_DEFS = [
  { key: 'core', label: 'Core (required)', required: true, count: 3 },
  { key: 'kokology', label: 'Kokology', required: false, count: 4 },
  { key: 'shadow', label: 'Shadow', required: false, count: 3 },
  { key: 'desire', label: 'Desire', required: false, count: 2 },
  { key: 'contradictions', label: 'Contradiction pairs', required: false, count: 6 },
];

export const TRUTH_PREAMBLE = "This only works if you tell the truth — not the version of yourself you'd put on a resume, but the version that exists when no one's watching. We're going to ask you questions that most people avoid, not because they're cruel, but because honest answers are the only ones worth analyzing. If you perform here, the results will describe whoever you're pretending to be, not who you actually are. That's a waste of everyone's time. So be specific. Be uncomfortable. Say the thing you'd normally edit out. The algorithm can't judge you, but it can see through you — but only if you let it.";

export const INITIAL_PERSON = Object.freeze({
  id: '',
  name: '',
  gender: '',
  enabledModules: [],
  moduleAnswers: Object.freeze({ core: Object.freeze(['', '', '']) }),
  schemaVersion: 1,
  createdAt: null,
});

/**
 * Build the initial person state. Returns a fresh object each time
 * so multiple useState calls don't share the same reference.
 */
export function createInitialPerson() {
  return {
    id: crypto.randomUUID(),
    name: '',
    gender: '',
    enabledModules: [],
    moduleAnswers: { core: ['', '', ''] },
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
  };
}

/** @deprecated Use CORE_QUESTIONS directly. Kept for legacy compatibility. */
export const QUESTIONS = CORE_QUESTIONS;
