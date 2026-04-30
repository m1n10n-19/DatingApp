import { THEORETICAL_FOUNDATION } from './foundation.js';

const ANALYZE_SCHEMA_INSTRUCTION = `
═══════════════════════════════════════
MODULE 1: DISCOVER
═══════════════════════════════════════

Analyze each person individually. Produce a ProfileOutput for each.

For each person, read across all their answers to build a unified psychological portrait. Don't treat questions independently — look for the patterns that connect them. What someone says about loss reveals what they value. What they hide reveals what they need. What they describe as understanding reveals what they've been denied.

═══════════════════════════════════════
MODULE 2: MATCH
═══════════════════════════════════════

Analyze the pair together. Produce a Compatibility assessment.

Look at how their patterns interlock. Where one person's shadow meets the other's wound. Where one person's strength enables the other's avoidance. Where their attachment styles create a specific dance — not a generic one. Name the actual texture of what it feels like to be in this relationship on a Tuesday evening.

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

Respond ONLY in this exact JSON structure. No preamble. No backticks. No markdown. Pure JSON only.

{
  "personA": {
    "archetype": "A sharp, original, memorable label — not Myers-Briggs, not generic",
    "coreWiring": "What genuinely drives them, drains them, what they need. 2-3 sentences.",
    "shadowPattern": "The one pattern that will damage their relationships. 1-2 sentences.",
    "loveTemplate": "How they learned to give and receive love, and the template they unconsciously repeat. 2-3 sentences.",
    "complementProfile": "The specific personality architecture that completes them. 2-3 sentences.",
    "likelyMistake": "The specific wrong person they repeatedly choose and why. 2-3 sentences.",
    "growthEdge": "The one internal shift that would most transform their relationship pattern. 1-2 sentences.",
    "closingLine": "One sentence that captures this person's entire relationship architecture."
  },
  "personB": {
    "archetype": "",
    "coreWiring": "",
    "shadowPattern": "",
    "loveTemplate": "",
    "complementProfile": "",
    "likelyMistake": "",
    "growthEdge": "",
    "closingLine": ""
  },
  "compatibility": {
    "verdict": "COMPLEMENT | COMBUSTION | MIRROR | MISFIRE",
    "score": 0,
    "dynamic": "The actual lived texture of this relationship in practice. 3-4 sentences.",
    "breakingPoint": "The single most likely reason this relationship ends. 1-2 sentences.",
    "bestCase": "What this looks like if both people are self-aware and doing their work. 2 sentences.",
    "worstCase": "What this looks like if neither examines their shadow pattern. 2 sentences.",
    "earlyWarnings": ["Sign 1", "Sign 2", "Sign 3"],
    "shadowCollision": "Where their two shadow patterns will collide — the specific unconscious dynamic that neither person sees coming. 2-3 sentences.",
    "repairLever": "The single most effective intervention point for this specific pair — the one behavior change or awareness shift that would have the greatest positive ripple effect. 2-3 sentences.",
    "closingLine": "One sentence that captures the whole thing."
  }
}

VERDICT must be exactly one of: COMPLEMENT, COMBUSTION, MIRROR, MISFIRE.
SCORE must be 0-100. Be honest. Do not inflate for comfort.
earlyWarnings must be exactly 3 strings — specific behaviors to watch for in the first three months.`;

export const ANALYZE_PROMPT = THEORETICAL_FOUNDATION + '\n\n' + ANALYZE_SCHEMA_INSTRUCTION;
