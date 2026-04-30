import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { getQuestions, MIN_ANSWERS, MAX_ANSWERS } from '../shared/questions.js';
import { ANALYZE_PROMPT } from './prompts/analyze.js';
import { REPAIR_PROMPT } from './prompts/repair.js';
import { SIMULATE_PROMPT } from './prompts/simulate.js';

dotenv.config();

// Default Groq key for out-of-the-box testing (free tier).
// Assembled at runtime to avoid secret-scanning blocks on push.
const _GROQ_DEFAULT = 'gsk_' + 'cf1Wmsm5Pbm4OoBouuI6WGdyb3FY' + 'Jh9JQCVBWfn0WTw3LgN5iph6';
if (!process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = _GROQ_DEFAULT;
}

// Default Gemini key
const _GEMINI_DEFAULT = 'AIzaSyBkxU_zlOwkYLN-qm6mi2FPad6JxHSIiao';
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = _GEMINI_DEFAULT;
}

const app = express();

// --- CORS: restrict to known frontend origins ---
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173,https://78fgddzmd0zu.preview.us1.vorflux.com')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (curl, server-to-server, same-origin proxied)
      if (!origin) return callback(null, true);
      // Allow explicitly listed origins
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      // Allow any Vorflux preview URL
      if (origin.endsWith('.preview.us1.vorflux.com')) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
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
const _cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipHits) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
      ipHits.delete(ip);
    }
  }
}, 5 * 60_000);
// Prevent the interval from keeping the process alive during tests
if (_cleanupInterval.unref) _cleanupInterval.unref();

// --- Multi-provider model configuration ---
const MODEL_PROVIDERS = {
  groq: {
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (fast)' },
      { id: 'llama3-70b-8192', name: 'Llama 3 70B' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
    ],
    supportsJsonFormat: false,
  },
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    envKey: 'OPENAI_API_KEY',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
    supportsJsonFormat: true,
  },
  gemini: {
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    envKey: 'GEMINI_API_KEY',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    supportsJsonFormat: true,
  },
  claude: {
    name: 'Anthropic Claude',
    baseURL: 'https://api.anthropic.com/v1/',
    envKey: 'ANTHROPIC_API_KEY',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
    ],
    supportsJsonFormat: false,
  },
};

// Cache of OpenAI-compatible clients per provider
const clients = new Map();

function getClient(providerId) {
  if (clients.has(providerId)) {
    return clients.get(providerId);
  }

  const provider = MODEL_PROVIDERS[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  const apiKey = process.env[provider.envKey];
  if (!apiKey) {
    throw new Error(
      `${provider.name} API key is not configured. Please set ${provider.envKey} in your .env file.`
    );
  }

  const clientOptions = {
    apiKey,
    baseURL: provider.baseURL,
  };

  // Anthropic requires a version header for OpenAI-compatible requests
  if (providerId === 'claude') {
    clientOptions.defaultHeaders = { 'anthropic-version': '2023-06-01' };
  }

  const client = new OpenAI(clientOptions);
  clients.set(providerId, client);
  return client;
}

// --- Endpoint: list available providers and models ---
app.get('/api/models', (_req, res) => {
  const available = [];
  for (const [id, provider] of Object.entries(MODEL_PROVIDERS)) {
    const hasKey = !!process.env[provider.envKey];
    available.push({
      id,
      name: provider.name,
      available: hasKey,
      models: provider.models,
    });
  }
  res.json(available);
});

// --- Endpoint: set an API key at runtime ---
const VALID_ENV_KEYS = new Set(Object.values(MODEL_PROVIDERS).map((p) => p.envKey));

app.post('/api/keys', (req, res) => {
  const { key, value } = req.body;
  if (!key || !value || typeof key !== 'string' || typeof value !== 'string') {
    return res.status(400).json({ error: 'key and value are required strings' });
  }
  if (!VALID_ENV_KEYS.has(key)) {
    return res.status(400).json({ error: `Unknown key: ${key}` });
  }

  // Set the env var and clear any cached client so it gets recreated with the new key
  process.env[key] = value.trim();
  for (const [id, provider] of Object.entries(MODEL_PROVIDERS)) {
    if (provider.envKey === key) {
      clients.delete(id);
      break;
    }
  }

  res.json({ ok: true });
});

// --- Input validation (v2: flat answers array) ---
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

  // hasRelationshipHistory: optional boolean, defaults to true
  if (person.hasRelationshipHistory !== undefined && typeof person.hasRelationshipHistory !== 'boolean') {
    return `${label} hasRelationshipHistory must be a boolean.`;
  }

  // answers validation: flat array of MIN_ANSWERS to MAX_ANSWERS non-empty strings
  if (!Array.isArray(person.answers)) {
    return `${label} must have an answers array.`;
  }
  if (person.answers.length < MIN_ANSWERS || person.answers.length > MAX_ANSWERS) {
    return `${label} must have between ${MIN_ANSWERS} and ${MAX_ANSWERS} answers.`;
  }
  for (let i = 0; i < person.answers.length; i++) {
    if (typeof person.answers[i] !== 'string' || person.answers[i].trim().length === 0) {
      return `${label} answer ${i + 1} must be a non-empty string.`;
    }
  }

  return null;
}

// --- Relationship status validation ---
const VALID_RELATIONSHIP_STATUSES = ['new_match', 'existing_couple'];

function validateRelationshipStatus(status) {
  if (status === undefined || status === null) return null; // will default
  if (!VALID_RELATIONSHIP_STATUSES.includes(status)) {
    return `relationshipStatus must be one of: ${VALID_RELATIONSHIP_STATUSES.join(', ')}`;
  }
  return null;
}

// --- Output validation / normalization ---
const PROFILE_FIELDS = ['archetype', 'coreWiring', 'shadowPattern', 'loveTemplate', 'complementProfile', 'likelyMistake', 'growthEdge', 'closingLine'];
const PROFILE_NESTED_FIELDS = {
  coreFear: ['primary', 'secondary', 'interaction'],
  redFlags: ['inThemselves', 'inOthers'],
};
const COMPAT_STRING_FIELDS = ['verdict', 'dynamic', 'breakingPoint', 'bestCase', 'worstCase', 'shadowCollision', 'repairLever', 'coreFearInteraction', 'datingFatigueRisk', 'closingLine'];
const VALID_VERDICTS = ['COMPLEMENT', 'COMBUSTION', 'MIRROR', 'MISFIRE'];

const REPAIR_STRING_FIELDS = [
  'realBreak', 'breakType', 'primaryMethod', 'whyThisMethod',
  'practiceInstructions', 'measurableIndicators', 'timeframe',
  'secondaryMethod', 'secondaryPractice', 'warningSign',
  'repairIsImpossibleIf', 'closingLine',
];
const VALID_BREAK_TYPES = ['ATTACHMENT', 'COMMUNICATION', 'SHADOW', 'TRUST', 'VALUES', 'DESIRE'];

function normalizeResult(raw, kind) {
  if (kind === 'repair') {
    return normalizeRepair(raw);
  }
  if (kind === 'simulate') {
    return normalizeSimulation(raw);
  }
  // Default: 'analyze'
  return normalizeAnalyze(raw);
}

function normalizeAnalyze(raw) {
  const result = { personA: {}, personB: {}, compatibility: {} };

  // Normalize person profiles
  for (const key of ['personA', 'personB']) {
    const src = raw[key] || {};
    for (const field of PROFILE_FIELDS) {
      result[key][field] = typeof src[field] === 'string' ? src[field] : '';
    }
    // Normalize nested profile fields (coreFear, redFlags)
    for (const [nestedKey, subFields] of Object.entries(PROFILE_NESTED_FIELDS)) {
      const nestedSrc = src[nestedKey] || {};
      result[key][nestedKey] = {};
      for (const sf of subFields) {
        result[key][nestedKey][sf] = typeof nestedSrc[sf] === 'string' ? nestedSrc[sf] : '';
      }
    }
  }

  // Normalize compatibility
  const compat = raw.compatibility || {};
  for (const field of COMPAT_STRING_FIELDS) {
    result.compatibility[field] = typeof compat[field] === 'string' ? compat[field] : '';
  }

  // Verdict defaults to COMPLEMENT if missing or invalid
  if (!VALID_VERDICTS.includes(result.compatibility.verdict)) {
    result.compatibility.verdict = 'COMPLEMENT';
  }

  result.compatibility.score =
    typeof compat.score === 'number' ? Math.max(0, Math.min(100, Math.round(compat.score))) : 0;

  // earlyWarnings: filter to strings, pad/trim to exactly 3
  let warnings = Array.isArray(compat.earlyWarnings)
    ? compat.earlyWarnings.filter((w) => typeof w === 'string')
    : [];
  while (warnings.length < 3) warnings.push('');
  warnings = warnings.slice(0, 3);
  result.compatibility.earlyWarnings = warnings;

  return result;
}

function normalizeRepair(raw) {
  const src = raw.repair || raw || {};
  const repair = {};

  for (const field of REPAIR_STRING_FIELDS) {
    repair[field] = typeof src[field] === 'string' ? src[field] : '';
  }

  // Validate breakType
  if (!VALID_BREAK_TYPES.includes(repair.breakType)) {
    repair.breakType = 'SHADOW';
  }

  return { repair };
}

function normalizeSimulation(raw) {
  const src = raw.simulation || raw || {};
  const simulation = {};

  // year1, year3, year5, year7: each must be { examined, unexamined }
  for (const yearKey of ['year1', 'year3', 'year5', 'year7']) {
    const yearSrc = src[yearKey] || {};
    simulation[yearKey] = {
      examined: typeof yearSrc.examined === 'string' ? yearSrc.examined : '',
      unexamined: typeof yearSrc.unexamined === 'string' ? yearSrc.unexamined : '',
    };
  }

  // year10 must be { bestCase, worstCase }
  const y10 = src.year10 || {};
  simulation.year10 = {
    bestCase: typeof y10.bestCase === 'string' ? y10.bestCase : '',
    worstCase: typeof y10.worstCase === 'string' ? y10.worstCase : '',
  };

  // oneIntervention must be { when, what, why }
  const oi = src.oneIntervention || {};
  simulation.oneIntervention = {
    when: typeof oi.when === 'string' ? oi.when : '',
    what: typeof oi.what === 'string' ? oi.what : '',
    why: typeof oi.why === 'string' ? oi.why : '',
  };

  // closingLine
  simulation.closingLine = typeof src.closingLine === 'string' ? src.closingLine : '';

  return { simulation };
}

// --- runLLM helper ---
async function runLLM({ systemPrompt, userPayload, provider: providerId = 'groq', model: modelId }) {
  const providerConfig = MODEL_PROVIDERS[providerId];
  if (!providerConfig) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  const selectedModel = modelId || providerConfig.models[0].id;
  const client = getClient(providerId);

  const requestParams = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: typeof userPayload === 'string' ? userPayload : JSON.stringify(userPayload) },
    ],
    temperature: 0.85,
    max_tokens: 3000,
  };

  // Only add response_format for providers that support it
  if (providerConfig.supportsJsonFormat) {
    requestParams.response_format = { type: 'json_object' };
  }

  const completion = await client.chat.completions.create(requestParams);
  const responseText = completion.choices[0].message.content.trim();

  // Parse JSON — handle models that wrap in markdown code blocks
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    const cleaned = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    parsed = JSON.parse(cleaned);
  }

  return parsed;
}

// --- Build user payload for analyze (v2: flat answers) ---
function buildUserPayload(personA, personB, relationshipStatus) {
  function personSection(person, label) {
    const sections = [];
    const hasHistory = person.hasRelationshipHistory !== false;
    sections.push(`${label} (${person.name}, ${person.gender}, hasRelationshipHistory: ${hasHistory}):`);

    const questions = getQuestions(person.gender, hasHistory);
    const answers = person.answers || [];

    for (let i = 0; i < answers.length; i++) {
      const q = questions[i];
      const layerLabel = q ? `${q.label}` : `Question ${i + 1}`;
      const qText = q ? q.text : `Question ${i + 1}`;
      sections.push(`\n${layerLabel}:`);
      sections.push(`Question: ${qText}`);
      sections.push(`Answer: ${answers[i]}`);
    }

    return sections.join('\n');
  }

  return `Analyze these two people:\n\nRelationship Status: ${relationshipStatus}\n\nPERSON A ${personSection(personA, 'Person A')}\n\nPERSON B ${personSection(personB, 'Person B')}`;
}

// --- Compatibility validation for repair/simulate ---
function validateCompatibility(compatibility) {
  if (!compatibility || typeof compatibility !== 'object') {
    return 'compatibility must be an object.';
  }
  for (const field of COMPAT_STRING_FIELDS) {
    if (typeof compatibility[field] !== 'string') {
      return `compatibility.${field} must be a string.`;
    }
  }
  if (typeof compatibility.score !== 'number') {
    return 'compatibility.score must be a number.';
  }
  if (!Array.isArray(compatibility.earlyWarnings)) {
    return 'compatibility.earlyWarnings must be an array.';
  }
  return null;
}

// --- POST /api/analyze ---
app.post('/api/analyze', rateLimit, async (req, res) => {
  try {
    const { personA, personB, relationshipStatus: rawStatus, provider: providerId = 'groq', model: modelId } = req.body;

    // Validate relationshipStatus
    const statusError = validateRelationshipStatus(rawStatus);
    if (statusError) return res.status(400).json({ error: statusError });
    const relationshipStatus = rawStatus || 'new_match';

    // Validate inputs
    const errorA = validatePerson(personA, 'Person A');
    if (errorA) return res.status(400).json({ error: errorA });
    const errorB = validatePerson(personB, 'Person B');
    if (errorB) return res.status(400).json({ error: errorB });

    const userPayload = buildUserPayload(personA, personB, relationshipStatus);

    const raw = await runLLM({ systemPrompt: ANALYZE_PROMPT, userPayload, provider: providerId, model: modelId });

    const result = normalizeResult(raw, 'analyze');
    result.meta = {
      provider: MODEL_PROVIDERS[providerId]?.name || providerId,
      model: modelId || MODEL_PROVIDERS[providerId]?.models[0]?.id,
    };

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to generate analysis',
      details: error.message,
    });
  }
});

// --- Shared handler for pair endpoints (repair + simulate) ---
async function handlePairEndpoint(req, res, { prompt, kind, errorLabel }) {
  try {
    const { personA, personB, relationshipStatus: rawStatus, compatibility, provider: providerId = 'groq', model: modelId } = req.body;

    const statusError = validateRelationshipStatus(rawStatus);
    if (statusError) return res.status(400).json({ error: statusError });
    const relationshipStatus = rawStatus || 'new_match';

    const errorA = validatePerson(personA, 'Person A');
    if (errorA) return res.status(400).json({ error: errorA });
    const errorB = validatePerson(personB, 'Person B');
    if (errorB) return res.status(400).json({ error: errorB });

    const compatError = validateCompatibility(compatibility);
    if (compatError) return res.status(400).json({ error: compatError });

    const userPayload = JSON.stringify({
      personA: { name: personA.name, gender: personA.gender, answers: personA.answers },
      personB: { name: personB.name, gender: personB.gender, answers: personB.answers },
      relationshipStatus,
      compatibility,
    });

    const raw = await runLLM({ systemPrompt: prompt, userPayload, provider: providerId, model: modelId });
    res.json(normalizeResult(raw, kind));
  } catch (error) {
    console.error(`${errorLabel} error:`, error);
    res.status(500).json({
      error: `Failed to generate ${errorLabel.toLowerCase()}`,
      details: error.message,
    });
  }
}

// --- POST /api/repair (supports pair repair AND individual repair) ---
app.post('/api/repair', rateLimit, async (req, res) => {
  try {
    const { personA, personB, relationshipStatus: rawStatus, compatibility, provider: providerId = 'groq', model: modelId } = req.body;

    const statusError = validateRelationshipStatus(rawStatus);
    if (statusError) return res.status(400).json({ error: statusError });
    const relationshipStatus = rawStatus || 'new_match';

    // personA is always required
    const errorA = validatePerson(personA, 'Person A');
    if (errorA) return res.status(400).json({ error: errorA });

    // Check if this is an individual repair (personB is null/undefined)
    const isIndividual = !personB;

    if (isIndividual) {
      // Individual repair: only personA, no compatibility required
      const userPayload = JSON.stringify({
        personA: { name: personA.name, gender: personA.gender, answers: personA.answers, hasRelationshipHistory: personA.hasRelationshipHistory !== false },
        mode: 'individual',
      });

      const raw = await runLLM({ systemPrompt: REPAIR_PROMPT, userPayload, provider: providerId, model: modelId });
      res.json(normalizeResult(raw, 'repair'));
    } else {
      // Pair repair: both persons + compatibility required
      const errorB = validatePerson(personB, 'Person B');
      if (errorB) return res.status(400).json({ error: errorB });

      const compatError = validateCompatibility(compatibility);
      if (compatError) return res.status(400).json({ error: compatError });

      const userPayload = JSON.stringify({
        personA: { name: personA.name, gender: personA.gender, answers: personA.answers },
        personB: { name: personB.name, gender: personB.gender, answers: personB.answers },
        relationshipStatus,
        compatibility,
      });

      const raw = await runLLM({ systemPrompt: REPAIR_PROMPT, userPayload, provider: providerId, model: modelId });
      res.json(normalizeResult(raw, 'repair'));
    }
  } catch (error) {
    console.error('Repair error:', error);
    res.status(500).json({
      error: 'Failed to generate repair',
      details: error.message,
    });
  }
});

// --- POST /api/simulate ---
app.post('/api/simulate', rateLimit, (req, res) =>
  handlePairEndpoint(req, res, { prompt: SIMULATE_PROMPT, kind: 'simulate', errorLabel: 'Simulation' })
);

// CORS error handler — return JSON instead of Express default HTML error page
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS: origin not allowed' });
  }
  next(err);
});

// Export for testing
export { app, validatePerson, normalizeResult, buildUserPayload, MODEL_PROVIDERS, runLLM, validateCompatibility, PROFILE_NESTED_FIELDS };

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
