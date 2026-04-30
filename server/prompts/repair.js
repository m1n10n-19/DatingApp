import { THEORETICAL_FOUNDATION } from './foundation.js';

const REPAIR_SCHEMA_INSTRUCTION = `
═══════════════════════════════════════
REPAIR GUIDANCE TASK
═══════════════════════════════════════

You are given two people's profiles, their compatibility analysis, and their relationship status. Generate a tailored repair and growth plan for this specific pair.

RELATIONSHIP STATUS ADAPTATION:
- When relationshipStatus is 'existing_couple': Emphasize de-escalation techniques, Gottman antidotes for their specific horseman cycle, repair attempts that work for their attachment styles, and concrete daily practices to reverse negative sentiment override. Assume they have existing patterns that need interruption.
- When relationshipStatus is 'new_match': Emphasize prevention and shadow-awareness. Help them see the collision points before they calcify into patterns. Focus on building a culture of appreciation early, naming shadow material before it goes underground, and establishing communication norms before defaults take over.

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

Respond ONLY in this exact JSON structure. No preamble. No backticks. No markdown. Pure JSON only.

{
  "repair": {
    "realBreak": "The actual underlying break in this relationship — not the surface fights but the structural fracture underneath. 2-3 sentences.",
    "emotionalCalibration": {
      "personA": "Where Person A sits on the emotional calibration scale under relationship stress and what they need to shift. 2-3 sentences.",
      "personB": "Where Person B sits on the emotional calibration scale under relationship stress and what they need to shift. 2-3 sentences."
    },
    "dailyPractice": "One specific daily practice tailored to this pair's dynamic — not generic mindfulness but something that targets their specific pattern. 2-3 sentences.",
    "cognitiveRepair": "The specific cognitive distortion each person needs to catch and reframe, using Burns' framework. 2-3 sentences.",
    "revisionPractice": "The core assumption each person needs to revise using Goddard's revision technique — the specific belief about love that is generating their current reality. 2-3 sentences.",
    "equanimityPractice": "A Vipassana-informed practice for this pair — how to build the capacity to observe their trigger without reacting. Specific to their reactivity patterns. 2-3 sentences.",
    "shadowWork": "The specific shadow integration work each person needs — using IFS parts language, name the protector to befriend and the exile to welcome. 2-3 sentences.",
    "communicationRepair": "An NVC-structured reframe of their most common destructive exchange — translate their typical blame/defend cycle into observations, feelings, needs, requests. 3-4 sentences."
  }
}

All 8 fields must be present. emotionalCalibration must contain both personA and personB as strings.`;

export const REPAIR_PROMPT = THEORETICAL_FOUNDATION + '\n\n' + REPAIR_SCHEMA_INSTRUCTION;
