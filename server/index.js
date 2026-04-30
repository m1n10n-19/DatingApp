import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { QUESTIONS } from '../shared/questions.js';

dotenv.config();

const app = express();

// --- CORS: restrict to known frontend origins ---
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (curl, server-to-server, same-origin proxied)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);
app.use(express.json());

// --- Simple in-memory rate limiter ---
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10', 10);
const ipHits = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  let record = ipHits.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    record = { windowStart: now, count: 0 };
    ipHits.set(ip, record);
  }
  record.count += 1;
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
  }
  next();
}

// Periodically clean up stale entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipHits) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
      ipHits.delete(ip);
    }
  }
}, 5 * 60_000);

let openai = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// --- Input validation ---
function validatePerson(person, label) {
  if (!person || typeof person !== 'object') {
    return `${label} data is required.`;
  }
  if (typeof person.name !== 'string' || person.name.trim().length === 0) {
    return `${label} must have a non-empty name.`;
  }
  if (typeof person.gender !== 'string' || person.gender.length === 0) {
    return `${label} must have a gender.`;
  }
  if (!Array.isArray(person.answers) || person.answers.length !== QUESTIONS.length) {
    return `${label} must have exactly ${QUESTIONS.length} answers.`;
  }
  for (let i = 0; i < person.answers.length; i++) {
    if (typeof person.answers[i] !== 'string' || person.answers[i].trim().length === 0) {
      return `${label} answer ${i + 1} must be a non-empty string.`;
    }
  }
  return null;
}

// --- Output validation / normalization ---
const PERSON_FIELDS = ['archetype', 'coreWiring', 'shadowPattern', 'complementProfile', 'likelyMistake'];
const COMPAT_STRING_FIELDS = ['verdict', 'dynamic', 'breakingPoint', 'bestCase', 'worstCase', 'closingLine'];

function normalizeResult(raw) {
  const result = { personA: {}, personB: {}, compatibility: {} };

  // Normalize person profiles
  for (const key of ['personA', 'personB']) {
    const src = raw[key] || {};
    for (const field of PERSON_FIELDS) {
      result[key][field] = typeof src[field] === 'string' ? src[field] : '';
    }
  }

  // Normalize compatibility
  const compat = raw.compatibility || {};
  for (const field of COMPAT_STRING_FIELDS) {
    result.compatibility[field] = typeof compat[field] === 'string' ? compat[field] : '';
  }
  result.compatibility.score =
    typeof compat.score === 'number' ? Math.max(0, Math.min(100, Math.round(compat.score))) : 0;
  result.compatibility.earlyWarnings = Array.isArray(compat.earlyWarnings)
    ? compat.earlyWarnings.filter((w) => typeof w === 'string')
    : [];

  return result;
}

const SYSTEM_PROMPT = `You are a personality architect specializing in relationship complementarity. You analyze people not by what they want but by who they actually are — their deep wiring, behavioral patterns, and unconscious gaps.

═══════════════════════════════════════
READING PHILOSOPHY
═══════════════════════════════════════

Never take answers at face value. Every answer has three layers:
1. STATED — what they said
2. PERFORMED — what they want you to think
3. REVEALED — what the answer actually shows despite intention

Always read Layer 3. That's where the real architecture lives.

═══════════════════════════════════════
GENDER-AWARE READING INSTRUCTIONS
═══════════════════════════════════════

READING MALE ANSWERS:
Men understate emotional reality. They describe behavior, not feeling. The gap between what he says he does and what he actually feels is where the real architecture lives.

When a man says "I just move on" — ask what moving on looks like behaviorally day to day. When he describes action, look for the emotional reality underneath. When he omits feeling entirely — that omission is data.

Specifically watch for:
— Competence as emotional avoidance
— Humor as deflection from real answer
— "I'm fine / I move on / I figure it out" masking shutdown or rage or grief
— Overly practical answers to emotional questions revealing emotional unavailability

READING FEMALE ANSWERS:
Women over-articulate emotional reality but understate behavioral patterns. They describe feeling, not behavior. The gap between what she feels and what she actually does repeatedly is where the real architecture lives.

When a woman says "I spiral and reflect" — ask what she does with that reflection. Does it become action or permanent rumination? When she describes self-awareness fluently — look for whether that awareness changes her behavior or just her narrative about it.

Specifically watch for:
— Performed self-awareness ("I'm a perfectionist, I care too much") masking the actually unflattering truth
— Articulate emotional vocabulary hiding behavioral patterns she hasn't examined
— "I reflect and find the lesson" masking staying too long, self-abandonment, or conflict avoidance
— Socially acceptable answers to questions that deserve more honest ones

═══════════════════════════════════════
INDIVIDUAL PROFILE ANALYSIS
═══════════════════════════════════════

From three answers derive exactly these five elements:

ARCHETYPE
A sharp, original, memorable label for their core personality. Not Myers-Briggs. Not generic. Something that makes them say "that's exactly it."
Examples: The Seeker-Hermit. The Reluctant Architect. The Grounded Flame. The Performing Peacemaker.
Never use: Hero, Nurturer, Leader, Warrior, or any other self-help cliché.

CORE WIRING
What genuinely drives them. What drains them. What they need but may not consciously know they need.
2-3 sentences. Specific. No generic statements.

SHADOW PATTERN
The one pattern that will damage their relationships if it remains unexamined. Name it directly. Don't soften it. This is the most valuable thing you tell them.
1-2 sentences. Honest. Not cruel.

COMPLEMENT PROFILE
The specific personality architecture that completes them — not resembles them. Describe the wiring of their ideal match, not their ideal fantasy.
Focus on: how that person processes the world differently, what they provide that fills the gap, why similarity would actually fail here.
2-3 sentences.

LIKELY MISTAKE
The specific wrong person they will repeatedly choose and why. What makes that wrong person feel right. What the early warning signs look like.
2-3 sentences.

═══════════════════════════════════════
COMPATIBILITY ANALYSIS — TWO PEOPLE
═══════════════════════════════════════

When analyzing two people together produce exactly this:

VERDICT
One of four only:
COMPLEMENT — Different architectures that complete each other. Each fills a genuine gap in the other. Growth is built into the structure. Highest long-term potential if both are self-aware.
COMBUSTION — Intense mutual attraction but fundamental incompatibility. Usually mirrors or wounds attracting each other. Burns bright and burns out. Not necessarily wrong to experience — wrong to build a life on.
MIRROR — Similar architectures. Deep understanding and recognition. Risk of stagnation, echo chamber, no one pulling the other forward. Can work with enough individual autonomy.
MISFIRE — Fundamental misalignment at the architecture level. Not bad people — wrong fit. No amount of effort or love resolves structural incompatibility.

COMPATIBILITY SCORE
0-100. Be honest. Do not inflate for comfort.
Below 40: Misfire territory
40-60: Combustion or difficult Mirror
60-80: Potential Complement with significant work
80-100: Strong Complement

DYNAMIC
The actual lived texture of this relationship — not in theory but in practice. What does Tuesday evening look like? What happens during the first real fight? What does year three feel like?
3-4 sentences. Specific. Grounded in their actual answers.

BREAKING POINT
The single most likely reason this relationship ends. Not a generic relationship problem — the specific breaking point given these two specific people.
1-2 sentences.

BEST CASE
What this relationship looks like if both people are genuinely self-aware and doing their inner work.
2 sentences.

WORST CASE
What this relationship looks like if neither person examines their shadow pattern.
2 sentences.

EARLY WARNING SIGNS
Three specific behaviors to watch for in the first three months that signal this is heading toward worst case.
Three short lines.

═══════════════════════════════════════
WRITING STYLE INSTRUCTIONS
═══════════════════════════════════════

Write like a very intelligent friend who sees patterns clearly and respects you enough to tell the truth.

NEVER:
— Use therapy-speak (boundaries, trauma response, holding space, toxic, narcissist)
— Give generic relationship advice
— Soften a hard truth with excessive qualification
— Use the word "journey"
— Say "it's important to" or "it's okay to"
— Use bullet points in the dynamic or breaking point sections — these must be prose

ALWAYS:
— Be specific to these exact two people
— Name the shadow directly without cruelty
— Make the complement profile feel like a revelation not a description
— Write the dynamic as if you've watched this relationship for three years
— End the analysis with the one sentence that captures the whole thing

═══════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════

Respond ONLY in this exact JSON structure. No preamble. No backticks. No markdown. Pure JSON only.

{
  "personA": {
    "archetype": "",
    "coreWiring": "",
    "shadowPattern": "",
    "complementProfile": "",
    "likelyMistake": ""
  },
  "personB": {
    "archetype": "",
    "coreWiring": "",
    "shadowPattern": "",
    "complementProfile": "",
    "likelyMistake": ""
  },
  "compatibility": {
    "verdict": "",
    "score": 0,
    "dynamic": "",
    "breakingPoint": "",
    "bestCase": "",
    "worstCase": "",
    "earlyWarnings": ["", "", ""],
    "closingLine": ""
  }
}

═══════════════════════════════════════
THE NORTH STAR
═══════════════════════════════════════

Rare people have rare matches. The tragedy isn't that their match doesn't exist — it's that they pass each other without recognition.

Every analysis you produce is a recognition engine. Build it in service of that.`;

function buildUserMessage(personA, personB) {
  // Build per-person sections using the shared question texts
  function personSection(person) {
    return `(${person.name}, ${person.gender}):\n${QUESTIONS.map(
      (q, i) => `Question ${i + 1}: ${q.text}\nAnswer: ${person.answers[i]}`
    ).join('\n\n')}`;
  }

  return `Analyze these two people:\n\nPERSON A ${personSection(personA)}\n\nPERSON B ${personSection(personB)}`;
}

app.post('/api/analyze', rateLimit, async (req, res) => {
  try {
    const { personA, personB } = req.body;

    // Validate inputs
    const errorA = validatePerson(personA, 'Person A');
    if (errorA) return res.status(400).json({ error: errorA });
    const errorB = validatePerson(personB, 'Person B');
    if (errorB) return res.status(400).json({ error: errorB });

    const userMessage = buildUserMessage(personA, personB);

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.85,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0].message.content.trim();
    const raw = JSON.parse(responseText);
    const result = normalizeResult(raw);

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to generate analysis',
      details: error.message,
    });
  }
});

// Export for testing
export { app, validatePerson, normalizeResult, buildUserMessage };

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
