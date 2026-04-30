/**
 * generateFictionalProfiles.js
 *
 * Generates 50 fictional/historical profiles (25 men, 25 women) by:
 *   1. Prompting the LLM to answer the universal questions in-character.
 *   2. Sending the profile to POST /api/analyze to get personality analysis.
 *   3. Combining the profile + analysis into a single object.
 *   4. Writing the result to src/data/fictionalProfiles.json.
 *
 * Usage:
 *   1. Start the backend:  npm run server
 *   2. Run this script:    node scripts/generateFictionalProfiles.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { getQuestions } from '../shared/questions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ── Configuration ──────────────────────────────────────────────────────────
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'fictionalProfiles.json');
const BATCH_SIZE = 1;           // Process figures in small batches
const DELAY_BETWEEN_MS = 5000;  // Delay between batches to respect rate limits
const MAX_RETRIES = 3;          // Retries for LLM JSON parsing failures

// ── OpenAI client ────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const llmClient = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// ── 50 Figures (25 men, 25 women) ──────────────────────────────────────────
const FIGURES = [
  // ── Spec-defined figures ──
  { name: 'Marcus Aurelius',     gender: 'male',   era: 'Ancient Rome',          type: 'historical', brief: 'Stoic philosopher-emperor of Rome; authored Meditations on duty and self-mastery.' },
  { name: 'Atticus Finch',       gender: 'male',   era: '1930s Alabama',         type: 'fictional',  brief: 'Quiet moral hero in To Kill a Mockingbird; single father, lawyer.' },
  { name: 'Frodo Baggins',       gender: 'male',   era: 'Middle-earth',          type: 'fictional',  brief: 'Reluctant hero of The Lord of the Rings; carried the One Ring.' },
  { name: 'Sherlock Holmes',     gender: 'male',   era: 'Victorian London',      type: 'fictional',  brief: 'Brilliant, emotionally detached detective; craves intellectual stimulation.' },
  { name: 'Gandhi',              gender: 'male',   era: '20th century India',    type: 'historical', brief: 'Leader of Indian independence through non-violence; deeply spiritual.' },
  { name: 'Steve Jobs',          gender: 'male',   era: 'Modern Silicon Valley', type: 'historical', brief: 'Apple co-founder; visionary perfectionist, intense and demanding.' },
  { name: 'APJ Abdul Kalam',     gender: 'male',   era: 'Modern India',          type: 'historical', brief: 'India\'s "Missile Man" and beloved president; humble scientist-teacher.' },
  { name: 'Rumi',                gender: 'male',   era: '13th century Persia',   type: 'historical', brief: 'Sufi mystic poet; wrote ecstatically about love, loss, and divine union.' },
  { name: 'Bruce Lee',           gender: 'male',   era: '20th century',          type: 'historical', brief: 'Martial artist and philosopher; "Be water, my friend." Intense self-discipline.' },
  { name: 'Nelson Mandela',      gender: 'male',   era: 'Modern South Africa',   type: 'historical', brief: '27 years imprisoned; emerged without bitterness to lead reconciliation.' },
  { name: 'Nikola Tesla',        gender: 'male',   era: 'Late 19th / early 20th century', type: 'historical', brief: 'Visionary inventor; brilliant but isolated, chose work over intimacy.' },

  { name: 'Khadijah',            gender: 'female', era: '6th century Arabia',    type: 'historical', brief: 'Successful merchant; first wife of Prophet Muhammad; bold, independent.' },
  { name: 'Noor Inayat Khan',    gender: 'female', era: 'World War II',          type: 'historical', brief: 'SOE spy in occupied France; Sufi pacifist who chose dangerous resistance.' },
  { name: 'Kannagi',             gender: 'female', era: 'Ancient Tamil Nadu',    type: 'literary',   brief: 'Heroine of Silappatikaram; patient devotion that turned to righteous fury.' },
  { name: 'Arwen',               gender: 'female', era: 'Middle-earth',          type: 'fictional',  brief: 'Elven princess who chose mortality for love; quiet, unwavering.' },
  { name: 'Elizabeth Bennet',    gender: 'female', era: 'Regency England',       type: 'fictional',  brief: 'Pride and Prejudice heroine; witty, independent, emotionally honest.' },
  { name: 'Hermione Granger',   gender: 'female', era: 'Wizarding World',       type: 'fictional',  brief: 'Brilliant, driven, fiercely loyal; proves herself in a world that underestimates her.' },
  { name: 'Cleopatra',           gender: 'female', era: 'Ancient Egypt',         type: 'historical', brief: 'Last pharaoh of Egypt; strategic, multilingual, navigated empires through intellect.' },
  { name: 'Frida Kahlo',         gender: 'female', era: '20th century Mexico',   type: 'historical', brief: 'Painter who turned pain into art; passionate, unflinching self-portraitist.' },
  { name: 'Joan of Arc',         gender: 'female', era: '15th century France',   type: 'historical', brief: 'Teenage mystic who led armies; absolute conviction, refused to recant.' },
  { name: 'Virginia Woolf',      gender: 'female', era: 'Early 20th century England', type: 'historical', brief: 'Modernist writer; brilliant mind haunted by depression; explored consciousness.' },
  { name: 'Simone de Beauvoir',  gender: 'female', era: '20th century France',   type: 'historical', brief: 'Existentialist philosopher; "One is not born, but rather becomes, a woman."' },
  { name: 'Ada Lovelace',        gender: 'female', era: 'Victorian England',     type: 'historical', brief: 'First computer programmer; mathematician who imagined computing\'s potential.' },
  { name: 'Toni Morrison',       gender: 'female', era: 'Modern America',        type: 'historical', brief: 'Nobel laureate novelist; excavated the inner lives of Black Americans.' },

  // ── Additional men (14 more to reach 25) ──
  { name: 'Odysseus',            gender: 'male',   era: 'Ancient Greece',        type: 'literary',   brief: 'Homeric hero; cunning, restless wanderer torn between adventure and home.' },
  { name: 'Leonardo da Vinci',   gender: 'male',   era: 'Renaissance Italy',     type: 'historical', brief: 'Polymath artist-scientist; insatiably curious, famously private.' },
  { name: 'Frederick Douglass',  gender: 'male',   era: '19th century America',  type: 'historical', brief: 'Escaped slavery, became orator and abolitionist; self-made through language.' },
  { name: 'Hamlet',              gender: 'male',   era: 'Medieval Denmark (fiction)', type: 'fictional', brief: 'Shakespeare\'s overthinking prince; paralyzed between thought and action.' },
  { name: 'Jay Gatsby',          gender: 'male',   era: '1920s America',         type: 'fictional',  brief: 'Self-invented romantic; organized his entire life around one lost love.' },
  { name: 'Martin Luther King Jr.', gender: 'male', era: 'Modern America',       type: 'historical', brief: 'Civil rights leader; dream of beloved community; bore immense personal cost.' },
  { name: 'Miyamoto Musashi',    gender: 'male',   era: 'Feudal Japan',          type: 'historical', brief: 'Legendary swordsman and author of The Book of Five Rings; solitary perfectionist.' },
  { name: 'Siddhartha Gautama',  gender: 'male',   era: 'Ancient India',         type: 'historical', brief: 'The Buddha; left privilege to understand suffering; taught the middle way.' },
  { name: 'Mr. Darcy',           gender: 'male',   era: 'Regency England',       type: 'fictional',  brief: 'Pride and Prejudice hero; proud exterior hiding deep loyalty and feeling.' },
  { name: 'Santiago',            gender: 'male',   era: 'The Alchemist (fiction)', type: 'fictional', brief: 'Shepherd who followed his Personal Legend; trusts the universe despite setbacks.' },
  { name: 'Viktor Frankl',       gender: 'male',   era: '20th century',          type: 'historical', brief: 'Holocaust survivor; psychiatrist who found meaning in suffering.' },
  { name: 'Bob Marley',          gender: 'male',   era: '20th century Jamaica',  type: 'historical', brief: 'Reggae icon and spiritual voice; preached love, unity, and resistance.' },
  { name: 'Aragorn',             gender: 'male',   era: 'Middle-earth',          type: 'fictional',  brief: 'Ranger-king in exile; carried duty quietly, loved deeply, led reluctantly.' },
  { name: 'Albert Einstein',     gender: 'male',   era: '20th century',          type: 'historical', brief: 'Genius physicist; playful mind, complicated personal relationships.' },

  // ── Additional women (11 more to reach 25) ──
  { name: 'Hypatia',             gender: 'female', era: 'Ancient Alexandria',    type: 'historical', brief: 'Mathematician-philosopher; last great thinker of ancient Alexandria.' },
  { name: 'Marie Curie',         gender: 'female', era: 'Early 20th century',    type: 'historical', brief: 'Two-time Nobel laureate; relentless scientist, sacrificed health for discovery.' },
  { name: 'Murasaki Shikibu',    gender: 'female', era: 'Heian Japan',           type: 'historical', brief: 'Author of The Tale of Genji, the world\'s first novel; court observer.' },
  { name: 'Harriet Tubman',      gender: 'female', era: '19th century America',  type: 'historical', brief: 'Escaped slavery; led hundreds to freedom on the Underground Railroad.' },
  { name: 'Anne Frank',          gender: 'female', era: 'World War II',          type: 'historical', brief: 'Teenage diarist in hiding; chose hope and introspection facing annihilation.' },
  { name: 'Jane Eyre',           gender: 'female', era: 'Victorian England (fiction)', type: 'fictional', brief: 'Brontë\'s heroine; plain, fierce, chose self-respect over passion.' },
  { name: 'Scheherazade',        gender: 'female', era: 'One Thousand and One Nights', type: 'literary', brief: 'Saved her life through storytelling; intelligence as survival.' },
  { name: 'Maya Angelou',        gender: 'female', era: 'Modern America',        type: 'historical', brief: 'Poet, memoirist; rose through trauma to become a voice of resilience and grace.' },
  { name: 'Eowyn',               gender: 'female', era: 'Middle-earth',          type: 'fictional',  brief: 'Shield-maiden of Rohan; fought despair and expectation to find her own valor.' },
  { name: 'Amelia Earhart',      gender: 'female', era: 'Early 20th century',    type: 'historical', brief: 'Aviation pioneer; restless, brave, refused to live within limits.' },
  { name: 'Hedy Lamarr',         gender: 'female', era: '20th century',          type: 'historical', brief: 'Hollywood star and secret inventor; co-created frequency-hopping technology.' },
  { name: 'Wangari Maathai',     gender: 'female', era: 'Modern Kenya',          type: 'historical', brief: 'Nobel Peace Prize laureate; founded the Green Belt Movement; fierce environmental activist.' },
];

// ── MODULE 5: FICTIONAL PROFILE AGENT prompt ──────────────────────────────
function buildAnswerGenerationPrompt(figure, questions) {
  const questionList = questions
    .map((q, i) => `  Q${i + 1} (${q.label}): "${q.text}"`)
    .join('\n');

  return `You are a world-class character psychologist and literary analyst. Your task is to answer a set of deeply personal relationship questions AS IF you were the following figure, speaking honestly in first person.

═══════════════════════════════════════
CHARACTER
═══════════════════════════════════════
Name: ${figure.name}
Gender: ${figure.gender}
Era/Context: ${figure.era}
Type: ${figure.type}
Brief: ${figure.brief}

═══════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════

1. Inhabit this character fully. Draw on everything known about their life, psychology, writings, behavior, and inner world.
2. Answer each question in first person, as this character would if they were being completely honest — not performing, not posing, but truly revealing themselves.
3. Each answer should be 2-4 sentences. Be specific and psychologically revealing, not generic.
4. Reflect their actual psychological patterns, fears, desires, and contradictions — not a sanitized version.
5. For fictional characters, stay true to the source material. For historical figures, draw on documented behavior, writings, and known personality traits.
6. Do NOT break character. Do NOT add meta-commentary.

═══════════════════════════════════════
QUESTIONS
═══════════════════════════════════════
${questionList}

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════
Respond ONLY with a JSON array of strings — one answer per question, in order. No object keys, no preamble, no markdown. Example:
["Answer to Q1...", "Answer to Q2...", "Answer to Q3...", ...]

Return exactly ${questions.length} answers.`;
}

// ── LLM call with retry ────────────────────────────────────────────────────
async function callLLM(systemPrompt, userMessage, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const completion = await llmClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.85,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0].message.content.trim();

      // Parse JSON — handle markdown code blocks
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const cleaned = raw
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        parsed = JSON.parse(cleaned);
      }

      return parsed;
    } catch (err) {
      console.error(`  ⚠ LLM attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) throw err;
      // Wait before retry (exponential backoff)
      await sleep(1000 * attempt);
    }
  }
}

// ── Generate answers for a figure ──────────────────────────────────────────
async function generateAnswers(figure) {
  const questions = getQuestions(figure.gender, true); // All figures assumed to have relationship history
  const prompt = buildAnswerGenerationPrompt(figure, questions);

  const answers = await callLLM(prompt, 'Generate the answers now.');

  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw new Error(
      `Expected ${questions.length} answers for ${figure.name}, got ${Array.isArray(answers) ? answers.length : typeof answers}`
    );
  }

  // Ensure all answers are non-empty strings
  for (let i = 0; i < answers.length; i++) {
    if (typeof answers[i] !== 'string' || answers[i].trim().length === 0) {
      throw new Error(`Empty answer at index ${i} for ${figure.name}`);
    }
  }

  return answers;
}

// ── Send profile to backend for analysis ───────────────────────────────────
async function analyzeProfile(profile) {
  // The /api/analyze endpoint requires both personA and personB.
  // We send the same profile as both to extract the individual analysis for personA.
  const payload = {
    personA: profile,
    personB: profile,
    relationshipStatus: 'new_match',
  };

  const res = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Analyze API returned ${res.status}: ${errBody}`);
  }

  const result = await res.json();
  return result.personA;
}

// ── Utilities ──────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(name) {
  return 'fictional-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Fictional Profile Generator');
  console.log(`  Generating ${FIGURES.length} profiles`);
  console.log(`  Backend: ${BACKEND_URL}`);
  console.log(`  Output:  ${OUTPUT_PATH}`);
  console.log('═══════════════════════════════════════\n');

  // Validate figure count
  const men = FIGURES.filter((f) => f.gender === 'male');
  const women = FIGURES.filter((f) => f.gender === 'female');
  console.log(`  Men: ${men.length} | Women: ${women.length}\n`);
  if (men.length !== 25 || women.length !== 25) {
    console.error(`ERROR: Expected 25 men and 25 women, got ${men.length} men and ${women.length} women`);
    process.exit(1);
  }

  // Check backend is reachable
  try {
    const healthCheck = await fetch(`${BACKEND_URL}/api/models`);
    if (!healthCheck.ok) throw new Error(`Status ${healthCheck.status}`);
    console.log('  ✓ Backend is reachable\n');
  } catch (err) {
    console.error(`ERROR: Cannot reach backend at ${BACKEND_URL} — is the server running?\n  ${err.message}`);
    console.error('  Start it with: npm run server');
    process.exit(1);
  }

  // Load existing progress if any (for resumability)
  let profiles = [];
  const completedNames = new Set();
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
      if (Array.isArray(existing) && existing.length > 0) {
        profiles = existing;
        for (const p of profiles) {
          completedNames.add(p.name);
        }
        console.log(`  ↻ Resuming: ${profiles.length} profiles already generated\n`);
      }
    } catch {
      // Corrupted file, start fresh
    }
  }

  const remaining = FIGURES.filter((f) => !completedNames.has(f.name));

  // Process in small batches
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);

    for (const figure of batch) {
      const idx = FIGURES.indexOf(figure) + 1;
      console.log(`[${idx}/${FIGURES.length}] ${figure.name} (${figure.gender}, ${figure.era})`);

      try {
        // Step 1: Generate answers
        console.log('  → Generating answers...');
        const answers = await generateAnswers(figure);
        console.log(`  ✓ Got ${answers.length} answers`);

        // Step 2: Build profile object
        const profile = {
          id: generateId(figure.name),
          name: figure.name,
          gender: figure.gender,
          answers,
          hasRelationshipHistory: true,
          schemaVersion: 2,
          createdAt: new Date().toISOString(),
          fictional: true,
          era: figure.era,
          type: figure.type,
          brief: figure.brief,
        };

        // Step 3: Analyze through backend
        console.log('  → Analyzing profile...');
        const analysis = await analyzeProfile(profile);
        console.log(`  ✓ Archetype: ${analysis.archetype || '(generated)'}`);

        // Step 4: Combine
        const complete = { ...profile, analysis };
        profiles.push(complete);

        // Save progress after each successful profile
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(profiles, null, 2));
        console.log(`  ✓ Saved (${profiles.length}/${FIGURES.length} total)\n`);
      } catch (err) {
        console.error(`  ✗ FAILED for ${figure.name}: ${err.message}`);
        console.error(`    Skipping and continuing...\n`);
      }
    }

    // Delay between batches (skip after last batch)
    if (i + BATCH_SIZE < remaining.length) {
      console.log(`  ⏳ Waiting ${DELAY_BETWEEN_MS}ms before next batch...\n`);
      await sleep(DELAY_BETWEEN_MS);
    }
  }

  // Final summary
  console.log('═══════════════════════════════════════');
  console.log(`  Done! ${profiles.length}/${FIGURES.length} profiles generated.`);
  console.log(`  Output: ${OUTPUT_PATH}`);
  if (profiles.length < FIGURES.length) {
    const missing = FIGURES.filter((f) => !profiles.find((p) => p.name === f.name));
    console.log(`  Missing: ${missing.map((f) => f.name).join(', ')}`);
    console.log('  Re-run the script to retry failed profiles.');
  }
  console.log('═══════════════════════════════════════');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
