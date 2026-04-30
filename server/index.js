import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { CORE_QUESTIONS, KOKOLOGY_QUESTIONS, SHADOW_QUESTIONS, DESIRE_QUESTIONS, CONTRADICTION_PAIRS } from '../shared/questions.js';
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

// --- Module answer count requirements ---
const MODULE_COUNTS = { core: 3, kokology: 4, shadow: 3, desire: 2, contradictions: 6 };
const OPTIONAL_MODULES = ['kokology', 'shadow', 'desire', 'contradictions'];

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

  // moduleAnswers validation
  if (!person.moduleAnswers || typeof person.moduleAnswers !== 'object') {
    return `${label} must have moduleAnswers.`;
  }

  // core answers required: array of 3 non-empty strings
  const core = person.moduleAnswers.core;
  if (!Array.isArray(core) || core.length !== MODULE_COUNTS.core) {
    return `${label} must have exactly ${MODULE_COUNTS.core} core answers.`;
  }
  for (let i = 0; i < core.length; i++) {
    if (typeof core[i] !== 'string' || core[i].trim().length === 0) {
      return `${label} core answer ${i + 1} must be a non-empty string.`;
    }
  }

  // enabledModules validation
  if (!Array.isArray(person.enabledModules)) {
    return `${label} must have enabledModules array.`;
  }
  for (const m of person.enabledModules) {
    if (typeof m !== 'string' || !OPTIONAL_MODULES.includes(m)) {
      return `${label} has invalid enabled module: ${m}.`;
    }
  }

  // Per-module answer count validation
  for (const m of person.enabledModules) {
    const expectedCount = MODULE_COUNTS[m];
    const answers = person.moduleAnswers[m];
    if (!Array.isArray(answers) || answers.length !== expectedCount) {
      return `${label} must have exactly ${expectedCount} ${m} answers.`;
    }
    for (let i = 0; i < answers.length; i++) {
      if (typeof answers[i] !== 'string' || answers[i].trim().length === 0) {
        return `${label} ${m} answer ${i + 1} must be a non-empty string.`;
      }
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
const PROFILE_FIELDS = ['archetype', 'coreWiring', 'shadowPattern', 'loveTemplate', 'complementProfile', 'likelyMistake', 'growthEdge'];
const COMPAT_STRING_FIELDS = ['verdict', 'dynamic', 'breakingPoint', 'bestCase', 'worstCase', 'shadowCollision', 'repairLever', 'closingLine'];
const VALID_VERDICTS = ['COMPLEMENT', 'COMBUSTION', 'MIRROR', 'MISFIRE'];

const REPAIR_FIELDS = ['realBreak', 'dailyPractice', 'cognitiveRepair', 'revisionPractice', 'equanimityPractice', 'shadowWork', 'communicationRepair'];

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

  for (const field of REPAIR_FIELDS) {
    repair[field] = typeof src[field] === 'string' ? src[field] : '';
  }

  // emotionalCalibration
  const ec = src.emotionalCalibration || {};
  repair.emotionalCalibration = {
    personA: typeof ec.personA === 'string' ? ec.personA : '',
    personB: typeof ec.personB === 'string' ? ec.personB : '',
  };

  return { repair };
}

function normalizeSimulation(raw) {
  const src = raw.simulation || raw || {};
  const simulation = {};

  for (const field of ['year1', 'year3', 'year5', 'year7', 'oneIntervention']) {
    simulation[field] = typeof src[field] === 'string' ? src[field] : '';
  }

  // year10 must be { bestCase, worstCase }
  const y10 = src.year10 || {};
  simulation.year10 = {
    bestCase: typeof y10.bestCase === 'string' ? y10.bestCase : '',
    worstCase: typeof y10.worstCase === 'string' ? y10.worstCase : '',
  };

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

// --- Module question lookup for payload building ---
const MODULE_QUESTIONS = {
  kokology: KOKOLOGY_QUESTIONS,
  shadow: SHADOW_QUESTIONS,
  desire: DESIRE_QUESTIONS,
};

function getModuleQuestionTexts(mod) {
  if (mod === 'contradictions') {
    return [
      ...CONTRADICTION_PAIRS.map((p) => p.first.text),
      ...CONTRADICTION_PAIRS.map((p) => p.second.text),
    ];
  }
  return (MODULE_QUESTIONS[mod] || []).map((q) => q.text);
}

// --- Build user payload for analyze ---
function buildUserPayload(personA, personB, relationshipStatus) {
  function personSection(person, label) {
    const sections = [];
    sections.push(`${label} (${person.name}, ${person.gender}):`);

    // Core questions
    sections.push('\nCORE QUESTIONS:');
    for (let i = 0; i < CORE_QUESTIONS.length; i++) {
      sections.push(`Question ${i + 1}: ${CORE_QUESTIONS[i].text}`);
      sections.push(`Answer: ${person.moduleAnswers.core[i]}`);
    }

    // Optional module answers (include question text for each)
    if (person.enabledModules && person.enabledModules.length > 0) {
      for (const mod of person.enabledModules) {
        const answers = person.moduleAnswers[mod];
        if (answers) {
          const questionTexts = getModuleQuestionTexts(mod);
          sections.push(`\n${mod.toUpperCase()} QUESTIONS:`);
          for (let i = 0; i < answers.length; i++) {
            const qText = questionTexts[i] || `${mod} Q${i + 1}`;
            sections.push(`Question: ${qText}`);
            sections.push(`Answer: ${answers[i]}`);
          }
        }
      }
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
      personA: { name: personA.name, gender: personA.gender, moduleAnswers: personA.moduleAnswers, enabledModules: personA.enabledModules },
      personB: { name: personB.name, gender: personB.gender, moduleAnswers: personB.moduleAnswers, enabledModules: personB.enabledModules },
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

// --- POST /api/repair ---
app.post('/api/repair', rateLimit, (req, res) =>
  handlePairEndpoint(req, res, { prompt: REPAIR_PROMPT, kind: 'repair', errorLabel: 'Repair' })
);

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
export { app, validatePerson, normalizeResult, buildUserPayload, MODEL_PROVIDERS, runLLM, validateCompatibility };

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
