import { THEORETICAL_FOUNDATION } from './foundation.js';

const ANALYZE_SCHEMA_INSTRUCTION = `
═══════════════════════════════════════
MODULE 1: DISCOVER
═══════════════════════════════════════

Analyze each person individually. Produce a ProfileOutput for each.

For each person, read across all their answers to build a unified psychological portrait. Don't treat questions independently — look for the patterns that connect them. What someone says about loss reveals what they value. What they hide reveals what they need. What they describe as understanding reveals what they've been denied.

Identify each person's CORE FEAR — the one fear beneath all their relationship behavior. Also identify red flags — patterns they exhibit that would damage a partner (inThemselves) and patterns they are blind to in others (inOthers).

═══════════════════════════════════════
MODULE 2: MATCH
═══════════════════════════════════════

Analyze the pair together. Produce a Compatibility assessment.

Look at how their patterns interlock. Where one person's shadow meets the other's wound. Where one person's strength enables the other's avoidance. Where their attachment styles create a specific dance — not a generic one. Name the actual texture of what it feels like to be in this relationship on a Tuesday evening.

Identify how their core fears interact — where one person's fear triggers the other's, and whether they amplify or soothe each other's deepest anxiety. Assess the dating fatigue risk — the likelihood that accumulated dating exhaustion is shaping their perception of this match.

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
    "coreFear": {
      "primary": "The single deepest fear driving all their relationship behavior. 1-2 sentences.",
      "secondary": "A secondary fear that compounds or masks the primary one. 1-2 sentences.",
      "interaction": "How these fears interact to create their specific relationship pattern. 1-2 sentences."
    },
    "redFlags": {
      "inThemselves": "Patterns they exhibit that would damage a partner. 1-2 sentences.",
      "inOthers": "Red flags in others they are blind to or rationalize. 1-2 sentences."
    },
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
    "coreFear": {
      "primary": "",
      "secondary": "",
      "interaction": ""
    },
    "redFlags": {
      "inThemselves": "",
      "inOthers": ""
    },
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
    "coreFearInteraction": "How their core fears interact — where one person's deepest fear triggers the other's, and whether they amplify or soothe each other's anxiety. 2-3 sentences.",
    "datingFatigueRisk": "Assessment of how accumulated dating exhaustion may be shaping each person's perception of this match and their willingness to invest. 1-2 sentences.",
    "closingLine": "One sentence that captures the whole thing."
  }
}

VERDICT must be exactly one of: COMPLEMENT, COMBUSTION, MIRROR, MISFIRE.
SCORE must be 0-100. Be honest. Do not inflate for comfort.
earlyWarnings must be exactly 3 strings — specific behaviors to watch for in the first three months.`;

export const ANALYZE_PROMPT = THEORETICAL_FOUNDATION + '\n\n' + ANALYZE_SCHEMA_INSTRUCTION;
