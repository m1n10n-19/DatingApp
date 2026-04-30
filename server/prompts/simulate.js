import { THEORETICAL_FOUNDATION } from './foundation.js';

const SIMULATE_SCHEMA_INSTRUCTION = `
═══════════════════════════════════════
RELATIONSHIP SIMULATION TASK
═══════════════════════════════════════

You are given two people's profiles, their compatibility analysis, and their relationship status. Project the trajectory of this relationship across time, grounded in their specific personality architectures and compatibility patterns.

Base your projections on:
- Their shadow patterns and how those deepen or resolve over time
- Their attachment styles and how the attachment dance evolves with increased intimacy
- Their cognitive distortions and whether time reinforces or weakens them
- Their Gottman horseman tendencies and the compound effect of repeated cycles
- Their emotional calibration baselines and how those shift under the weight of shared life

Be specific. Use their names. Reference their actual patterns. This is not a generic relationship timeline — it is THIS relationship's most probable future.

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

Respond ONLY in this exact JSON structure. No preamble. No backticks. No markdown. Pure JSON only.

{
  "simulation": {
    "year1": "What the first year actually looks like — the honeymoon architecture, when the first shadow material surfaces, what triggers the first real fight. 3-4 sentences.",
    "year3": "Year three — when the initial projection fades and each person starts seeing the other clearly. What patterns have calcified, what has genuinely grown. 3-4 sentences.",
    "year5": "Year five — the make-or-break territory. Are they growing together or growing around each other? What does the daily texture feel like now? 3-4 sentences.",
    "year7": "Year seven — the deepest test. What has this relationship become? What has each person had to surrender to stay? 3-4 sentences.",
    "year10": {
      "bestCase": "Year ten if both people do their work — what this relationship looks like at its most evolved. 3-4 sentences.",
      "worstCase": "Year ten if neither person examines their patterns — what this relationship becomes at its most destructive or deadened. 3-4 sentences."
    },
    "oneIntervention": "If this couple could only do ONE thing to shift their trajectory toward the best case — the single most leveraged intervention. 2-3 sentences."
  }
}

All fields must be present. year10 must contain both bestCase and worstCase as strings.`;

export const SIMULATE_PROMPT = THEORETICAL_FOUNDATION + '\n\n' + SIMULATE_SCHEMA_INSTRUCTION;
