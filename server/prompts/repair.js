import { THEORETICAL_FOUNDATION } from './foundation.js';

const REPAIR_SCHEMA_INSTRUCTION = `
═══════════════════════════════════════
MODULE 3: REPAIR
═══════════════════════════════════════

You may be given TWO people's profiles (pair repair) or ONE person's profile (individual repair).

PAIR REPAIR (two people provided):
Your job is to identify the ONE structural fracture underneath all the surface fights, and prescribe a specific, actionable repair protocol for THIS pair.

INDIVIDUAL REPAIR (one person provided):
Your job is to identify the core fear, shadow pattern, and trauma driving this person's relationship dysfunction, and prescribe a specific, actionable repair protocol for THIS individual. Focus on what they can do alone — without a partner present — to interrupt their pattern.

RELATIONSHIP STATUS ADAPTATION:
- When relationshipStatus is 'existing_couple': Emphasize de-escalation, Gottman antidotes for their specific horseman cycle, repair attempts for their attachment styles, and concrete daily practices. Assume existing patterns that need interruption.
- When relationshipStatus is 'new_match': Emphasize prevention and shadow-awareness. Help them see collision points before they calcify. Focus on building appreciation early, naming shadow material before it goes underground, and establishing communication norms before defaults take over.
- When only one person is provided: Focus entirely on the individual's internal patterns. Identify the core fear driving their relationship behavior, the shadow pattern they repeat, and the specific trauma response that activates in intimacy. Prescribe individual practices.

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

Respond ONLY in this exact JSON structure. No preamble. No backticks. No markdown. Pure JSON only.

{
  "repair": {
    "realBreak": "The actual underlying break — for pairs: the structural fracture underneath the surface fights. For individuals: the core wound driving their relationship pattern. 2-3 sentences.",
    "breakType": "One of: ATTACHMENT, COMMUNICATION, SHADOW, TRUST, VALUES, DESIRE",
    "primaryMethod": "The single most effective repair method for this specific break — named precisely (e.g., 'Gottman Repair Attempts Protocol', 'IFS Parts Dialogue', 'Vipassana Equanimity Practice'). One phrase.",
    "whyThisMethod": "Why this specific method targets their specific fracture. 2-3 sentences.",
    "practiceInstructions": "Step-by-step instructions for the primary method, specific to this person or pair. Reference their actual patterns. 3-5 sentences.",
    "measurableIndicators": "How they will know it's working — specific behavioral changes to watch for. 2-3 sentences.",
    "timeframe": "Realistic timeline for visible change with consistent practice. 1 sentence.",
    "secondaryMethod": "A complementary method that supports the primary one. One phrase.",
    "secondaryPractice": "Brief instructions for the secondary method. 2-3 sentences.",
    "warningSign": "The specific behavior that signals they are regressing into the old pattern. 1-2 sentences.",
    "repairIsImpossibleIf": "The honest condition under which this repair cannot work — the line that, if crossed, means the structural fracture is load-bearing. 1-2 sentences.",
    "closingLine": "One sentence that captures the repair truth."
  }
}

All 12 fields must be present. breakType must be exactly one of: ATTACHMENT, COMMUNICATION, SHADOW, TRUST, VALUES, DESIRE.`;

export const REPAIR_PROMPT = THEORETICAL_FOUNDATION + '\n\n' + REPAIR_SCHEMA_INSTRUCTION;
