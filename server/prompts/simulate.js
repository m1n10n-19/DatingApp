import { THEORETICAL_FOUNDATION } from './foundation.js';

const SIMULATE_SCHEMA_INSTRUCTION = `
═══════════════════════════════════════
MODULE 4: SIMULATE
═══════════════════════════════════════

You are given two people's profiles, their compatibility analysis, and their relationship status. Project the trajectory of this relationship across time, grounded in their specific personality architectures and compatibility patterns.

For each time horizon, project TWO parallel paths:
- EXAMINED: What happens if both people are actively doing their work — therapy, shadow integration, communication practice, genuine self-examination.
- UNEXAMINED: What happens if neither person examines their patterns — the relationship on autopilot, driven by unconscious defaults.

Be specific. Use their names. Reference their actual patterns. This is not a generic relationship timeline — it is THIS relationship's most probable future.

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

Respond ONLY in this exact JSON structure. No preamble. No backticks. No markdown. Pure JSON only.

{
  "simulation": {
    "year1": {
      "examined": "Year 1 if both people are doing their work. What the first year looks like with active self-awareness. 3-4 sentences.",
      "unexamined": "Year 1 on autopilot. When the first shadow material surfaces, what triggers the first real fight. 3-4 sentences."
    },
    "year3": {
      "examined": "Year 3 with ongoing growth work. What has genuinely transformed. 3-4 sentences.",
      "unexamined": "Year 3 without examination. What patterns have calcified. 3-4 sentences."
    },
    "year5": {
      "examined": "Year 5 with continued self-examination. Are they growing together? 3-4 sentences.",
      "unexamined": "Year 5 on autopilot. Are they growing around each other? 3-4 sentences."
    },
    "year7": {
      "examined": "Year 7 with deep work. What has this relationship become at its most intentional? 3-4 sentences.",
      "unexamined": "Year 7 without examination. What has each person had to numb to stay? 3-4 sentences."
    },
    "year10": {
      "bestCase": "Year 10 if both people do their work — what this relationship looks like at its most evolved. 3-4 sentences.",
      "worstCase": "Year 10 if neither person examines their patterns — what this relationship becomes at its most destructive or deadened. 3-4 sentences."
    },
    "oneIntervention": {
      "when": "The specific moment or trigger point where this intervention has maximum leverage. 1-2 sentences.",
      "what": "The single most leveraged intervention for this couple. 1-2 sentences.",
      "why": "Why this specific intervention shifts the trajectory. 1-2 sentences."
    },
    "closingLine": "One sentence that captures the entire simulation truth for this pair."
  }
}

All fields must be present. year1, year3, year5, year7 must each contain both "examined" and "unexamined" as strings. year10 must contain both "bestCase" and "worstCase" as strings. oneIntervention must contain "when", "what", and "why" as strings.`;

export const SIMULATE_PROMPT = THEORETICAL_FOUNDATION + '\n\n' + SIMULATE_SCHEMA_INSTRUCTION;
