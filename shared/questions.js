/**
 * Universal 5-question sequence for all users, plus gender-specific Q6.
 * Replaces the previous modular questionnaire (core + optional modules).
 *
 * "No History" protocol: when a user has no serious relationship history,
 * Q4 (Template) is replaced with an alternative, and 3 additional questions
 * are appended (Q7-Q9) for a total of up to 9 questions.
 */

export const UNIVERSAL_QUESTIONS = [
  {
    id: 1,
    layer: 'Surface',
    label: 'Layer 1: Surface',
    text: "When something you deeply care about falls apart — a relationship, a project, a belief — what do you actually do? Not what you tell people. What happens in the first 72 hours when no one is watching?",
    placeholder: "Be honest. Not what sounds good — what actually happens...",
  },
  {
    id: 2,
    layer: 'Shadow',
    label: 'Layer 2: Shadow',
    text: "What's the thing you're most afraid someone you love will eventually discover about you? Not a secret — a pattern, a tendency, the thing you manage around so they never quite see it clearly.",
    placeholder: "The thing you work hardest to keep from being seen...",
  },
  {
    id: 3,
    layer: 'Recognition',
    label: 'Layer 3: Recognition',
    text: "Describe the last time you felt genuinely understood by another person. What did they do or say that made you feel that way? If you can't remember a time — that's an answer too.",
    placeholder: "What does being truly seen feel like to you...",
  },
  {
    id: 4,
    layer: 'Template',
    label: 'Layer 4: Template',
    text: "What did love look like in the home you grew up in? Not what you wished it looked like — what you actually saw, day to day, between the people who were supposed to love each other.",
    placeholder: "What love actually looked like, not the ideal...",
  },
  {
    id: 5,
    layer: 'Desire',
    label: 'Layer 5: Desire',
    text: "What do you want from a partner that you've never said out loud? The thing you want but have never actually asked for — because asking would make you too vulnerable, or because you're afraid the answer is that it doesn't exist.",
    placeholder: "The thing you want but have never actually asked for...",
  },
];

/**
 * Replacement Q4 for users with no relationship history.
 */
export const NO_HISTORY_Q4 = {
  id: 4,
  layer: 'Template',
  label: 'Layer 4: Template (No History)',
  text: "You haven't been in a serious relationship yet. What do you think has kept you from one — and be honest: is it circumstance, fear, standards, or something you haven't named yet?",
  placeholder: "What's actually kept you from a serious relationship...",
};

/**
 * Additional questions appended for users with no relationship history (Q7-Q9).
 */
export const NO_HISTORY_EXTRA_QUESTIONS = [
  {
    id: 7,
    layer: 'Projection',
    label: 'Layer 7: Projection',
    text: "When you imagine your future partner, what does a typical weeknight look like? Not the highlight reel — the ordinary. What are you doing at 8pm on a Wednesday with this person?",
    placeholder: "The ordinary, not the fantasy...",
  },
  {
    id: 8,
    layer: 'Avoidance',
    label: 'Layer 8: Avoidance',
    text: "What's the version of a relationship you're most afraid of ending up in? Describe it specifically — not 'a bad one' but the particular kind of bad that haunts you.",
    placeholder: "The specific relationship nightmare, not the generic one...",
  },
  {
    id: 9,
    layer: 'Readiness',
    label: 'Layer 9: Readiness',
    text: "What would need to be true — about you, not about the other person — for you to be ready for a real relationship? What's the gap between who you are now and who you'd need to be?",
    placeholder: "The honest gap between now and ready...",
  },
];

export const GENDER_QUESTIONS = {
  male: {
    id: 6,
    layer: 'Gendered',
    label: 'Layer 6: Gendered',
    text: "Describe a moment when you felt genuinely strong — not performing strength, not being 'the rock,' but actually strong in a way that didn't require you to suppress anything. If you can't think of one, describe what you think it would feel like.",
    placeholder: "Real strength, not performed strength...",
  },
  female: {
    id: 6,
    layer: 'Gendered',
    label: 'Layer 6: Gendered',
    text: "Describe a moment when you felt genuinely safe with another person — not comfortable, not familiar, but actually safe in a way that let you stop performing. If you can't think of one, describe what you think it would feel like.",
    placeholder: "Real safety, not just comfort or familiarity...",
  },
};

/**
 * Returns the full question list for a person, given their gender and
 * relationship history status.
 *
 * @param {string} gender - 'male', 'female', or other
 * @param {boolean} [hasHistory=true] - Whether the user has relationship history
 * @returns {Array} question list
 *
 * With history (default): Q1-Q5 + optional Q6 gendered = 5 or 6
 * Without history: Q1-Q3, alt-Q4, Q5, optional Q6 gendered, Q7-Q9 = 8 or 9
 */
export function getQuestions(gender, hasHistory = true) {
  let questions;

  if (hasHistory) {
    questions = [...UNIVERSAL_QUESTIONS];
  } else {
    // Replace Q4 with No History variant
    questions = [
      UNIVERSAL_QUESTIONS[0], // Q1
      UNIVERSAL_QUESTIONS[1], // Q2
      UNIVERSAL_QUESTIONS[2], // Q3
      NO_HISTORY_Q4,          // alt-Q4
      UNIVERSAL_QUESTIONS[4], // Q5
    ];
  }

  // Append gendered Q6
  const genderKey = typeof gender === 'string' ? gender.toLowerCase() : '';
  if (GENDER_QUESTIONS[genderKey]) {
    questions.push(GENDER_QUESTIONS[genderKey]);
  }

  // Append No History extra questions (Q7-Q9) after gendered Q6
  if (!hasHistory) {
    questions.push(...NO_HISTORY_EXTRA_QUESTIONS);
  }

  return questions;
}

/** @deprecated Use getQuestions(gender, hasHistory). Kept for backward compatibility. */
export function getQuestionsForGender(gender) {
  return getQuestions(gender, true);
}

export const TRUTH_PREAMBLE = "This only works if you tell the truth — not the version of yourself you'd put on a resume, but the version that exists when no one's watching. We're going to ask you questions that most people avoid, not because they're cruel, but because honest answers are the only ones worth analyzing. If you perform here, the results will describe whoever you're pretending to be, not who you actually are. That's a waste of everyone's time. So be specific. Be uncomfortable. Say the thing you'd normally edit out. The algorithm can't judge you, but it can see through you — but only if you let it.";

/**
 * Answers count:
 * With history: 5 universal + up to 1 gendered = 5 or 6 total.
 * Without history: 5 (modified) + up to 1 gendered + 3 extra = 8 or 9 total.
 */
export const MIN_ANSWERS = 5;
export const MAX_ANSWERS = 9;

export const INITIAL_PERSON = Object.freeze({
  id: '',
  name: '',
  gender: '',
  answers: Object.freeze(['', '', '', '', '', '']),
  hasRelationshipHistory: true,
  schemaVersion: 2,
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
    answers: ['', '', '', '', '', ''],
    hasRelationshipHistory: true,
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
  };
}

// ── Legacy / backward-compatible re-exports ──
// These are kept so that the existing frontend (Task 3 will remove these imports)
// and other consumers don't break during the migration.

/** @deprecated Use UNIVERSAL_QUESTIONS. Kept for legacy compatibility. */
export const CORE_QUESTIONS = UNIVERSAL_QUESTIONS.slice(0, 3).map((q) => ({
  ...q,
  module: 'core',
}));

/** @deprecated Removed in v2 schema. Kept as empty array for compatibility. */
export const KOKOLOGY_QUESTIONS = [];

/** @deprecated Removed in v2 schema. Kept as empty array for compatibility. */
export const SHADOW_QUESTIONS = [];

/** @deprecated Removed in v2 schema. Kept as empty array for compatibility. */
export const DESIRE_QUESTIONS = [];

/** @deprecated Removed in v2 schema. Kept as empty array for compatibility. */
export const CONTRADICTION_PAIRS = [];

/** @deprecated Removed in v2 schema. Kept as empty array for compatibility. */
export const MODULE_DEFS = [];

/** @deprecated Use UNIVERSAL_QUESTIONS directly. Kept for legacy compatibility. */
export const QUESTIONS = CORE_QUESTIONS;
