/**
 * @file JSDoc type definitions for the Complement platform.
 * Pure documentation — no runtime exports.
 */

/**
 * @typedef {Object} Profile
 * @property {string} id - UUID v4 identifier.
 * @property {string} name - Display name.
 * @property {string} gender - Gender identity string.
 * @property {string[]} enabledModules - Optional module keys the user completed (e.g. ['kokology', 'shadow', 'desire', 'contradictions']).
 * @property {Object} moduleAnswers - Answers keyed by module.
 * @property {string[]} moduleAnswers.core - 3 core answers (always present).
 * @property {string[]} [moduleAnswers.kokology] - 4 Kokology projection answers.
 * @property {string[]} [moduleAnswers.shadow] - 3 Shadow-work answers.
 * @property {string[]} [moduleAnswers.desire] - 2 Desire-mapping answers.
 * @property {string[]} [moduleAnswers.contradictions] - 6 Contradiction-pair answers (first1, first2, first3, second1, second2, second3).
 * @property {number} schemaVersion - Currently 1.
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
 */

/**
 * @typedef {Object} Compatibility
 * @property {string} verdict - One of 'COMPLEMENT', 'COMBUSTION', 'MIRROR', 'MISFIRE'.
 * @property {number} score - 0-100 compatibility score.
 * @property {string} dynamic - How these two interact.
 * @property {string} magnetism - What draws them together.
 * @property {string} friction - Where they'll clash.
 * @property {string} shadowCollision - How their shadow patterns collide.
 * @property {string} breakingPoint - What could break them.
 * @property {string} repairLever - The key lever for repairing conflict.
 * @property {string[]} earlyWarnings - Exactly 3 early warning signs.
 * @property {string} closingLine - Final assessment line.
 */

/**
 * @typedef {Object} Repair
 * @property {string} realBreak - The actual break point (not the surface complaint).
 * @property {Object} emotionalCalibration - Per-person emotional calibration guidance.
 * @property {string} emotionalCalibration.personA - Guidance for person A.
 * @property {string} emotionalCalibration.personB - Guidance for person B.
 * @property {string} dailyPractice - A daily practice recommendation.
 * @property {string} cognitiveRepair - Cognitive distortion repair guidance.
 * @property {string} revisionPractice - Assumption/revision practice.
 * @property {string} equanimityPractice - Equanimity/mindfulness practice.
 * @property {string} shadowWork - Shadow-work exercise.
 * @property {string} communicationRepair - NVC-based communication repair.
 */

/**
 * @typedef {Object} Simulation
 * @property {string} year1 - Year 1 projection.
 * @property {string} year3 - Year 3 projection.
 * @property {string} year5 - Year 5 projection.
 * @property {string} year7 - Year 7 projection.
 * @property {Object} year10 - Year 10 projection with two scenarios.
 * @property {string} year10.bestCase - Best-case year 10 scenario.
 * @property {string} year10.worstCase - Worst-case year 10 scenario.
 * @property {string} oneIntervention - The single most impactful intervention.
 */

/**
 * @typedef {Object} AnalysisData
 * @property {ProfileOutput} personA - Profile output for person A.
 * @property {ProfileOutput} personB - Profile output for person B.
 * @property {Compatibility} compatibility - Compatibility analysis.
 * @property {Repair|null} repair - Repair guidance (null until requested).
 * @property {Simulation|null} simulation - Simulation projection (null until requested).
 */
