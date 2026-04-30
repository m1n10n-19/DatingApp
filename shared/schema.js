/**
 * @file JSDoc type definitions for the Complement platform (v2 schema).
 * Pure documentation — no runtime exports.
 */

/**
 * @typedef {Object} Profile
 * @property {string} id - UUID v4 identifier.
 * @property {string} name - Display name.
 * @property {string} gender - Gender identity string.
 * @property {string[]} answers - Flat array of 5 or 6 answer strings (Q1-Q5 universal, Q6 gender-specific).
 * @property {number} schemaVersion - Currently 2.
 * @property {string|null} createdAt - ISO 8601 timestamp or null for the empty template.
 */

/**
 * @typedef {Object} ProfileOutput
 * @property {string} archetype - One-line archetype label (e.g. "The Quiet Architect").
 * @property {string} coreWiring - Description of how this person is fundamentally wired.
 * @property {string} shadowPattern - Primary shadow pattern identified.
 * @property {string} loveTemplate - How they learned to give and receive love.
 * @property {string} complementProfile - What kind of person complements them.
 * @property {string} likelyMistake - The mistake they're most likely to make in relationships.
 * @property {string} growthEdge - Where their biggest growth opportunity lies.
 * @property {string} closingLine - One sentence capturing this person's relationship architecture.
 */

/**
 * @typedef {Object} Compatibility
 * @property {string} verdict - One of 'COMPLEMENT', 'COMBUSTION', 'MIRROR', 'MISFIRE'.
 * @property {number} score - 0-100 compatibility score.
 * @property {string} dynamic - How these two interact.
 * @property {string} breakingPoint - What could break them.
 * @property {string} bestCase - Best case scenario description.
 * @property {string} worstCase - Worst case scenario description.
 * @property {string[]} earlyWarnings - Exactly 3 early warning signs.
 * @property {string} shadowCollision - How their shadow patterns collide.
 * @property {string} repairLever - The key lever for repairing conflict.
 * @property {string} closingLine - Final assessment line.
 */

/**
 * @typedef {Object} Repair
 * @property {string} realBreak - The actual structural fracture underneath.
 * @property {string} breakType - One of: ATTACHMENT, COMMUNICATION, SHADOW, TRUST, VALUES, DESIRE.
 * @property {string} primaryMethod - The single most effective repair method.
 * @property {string} whyThisMethod - Why this method targets their specific fracture.
 * @property {string} practiceInstructions - Step-by-step instructions for the primary method.
 * @property {string} measurableIndicators - How they'll know it's working.
 * @property {string} timeframe - Realistic timeline for visible change.
 * @property {string} secondaryMethod - A complementary method.
 * @property {string} secondaryPractice - Brief instructions for the secondary method.
 * @property {string} warningSign - Behavior signaling regression into old pattern.
 * @property {string} repairIsImpossibleIf - Condition under which repair cannot work.
 * @property {string} closingLine - One sentence capturing the repair truth.
 */

/**
 * @typedef {Object} YearProjection
 * @property {string} examined - Trajectory if both people do their work.
 * @property {string} unexamined - Trajectory on autopilot.
 */

/**
 * @typedef {Object} Year10Projection
 * @property {string} bestCase - Best-case year 10 scenario.
 * @property {string} worstCase - Worst-case year 10 scenario.
 */

/**
 * @typedef {Object} OneIntervention
 * @property {string} when - The moment where intervention has maximum leverage.
 * @property {string} what - The single most leveraged intervention.
 * @property {string} why - Why this intervention shifts the trajectory.
 */

/**
 * @typedef {Object} Simulation
 * @property {YearProjection} year1 - Year 1 dual-path projection.
 * @property {YearProjection} year3 - Year 3 dual-path projection.
 * @property {YearProjection} year5 - Year 5 dual-path projection.
 * @property {YearProjection} year7 - Year 7 dual-path projection.
 * @property {Year10Projection} year10 - Year 10 best/worst case projection.
 * @property {OneIntervention} oneIntervention - The single most impactful intervention.
 * @property {string} closingLine - One sentence capturing the simulation truth.
 */

/**
 * @typedef {Object} AnalysisData
 * @property {ProfileOutput} personA - Profile output for person A.
 * @property {ProfileOutput} personB - Profile output for person B.
 * @property {Compatibility} compatibility - Compatibility analysis.
 * @property {Repair|null} repair - Repair guidance (null until requested).
 * @property {Simulation|null} simulation - Simulation projection (null until requested).
 */
