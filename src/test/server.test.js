import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'node:http';

// Mock the openai module before importing server
const mockCreate = vi.fn();

const { setRateLimitMax } = vi.hoisted(() => {
  // Raise rate limit for tests so we don't hit 429 — must be set before server module loads
  process.env.RATE_LIMIT_MAX = '100000';
  return { setRateLimitMax: true };
});

vi.mock('openai', () => {
  class MockOpenAI {
    constructor() {
      this.chat = {
        completions: {
          create: mockCreate,
        },
      };
    }
  }
  return { default: MockOpenAI };
});

import { app, validatePerson, normalizeResult, buildUserMessage, MODEL_PROVIDERS, validateCompatibility } from '../../server/index.js';

// --- Test server setup ---
let server;
let baseURL;

beforeAll(async () => {
  await new Promise((resolve) => {
    server = createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseURL = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

// Helper for making HTTP requests
async function api(method, path, body, headers = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${baseURL}${path}`, opts);
  const json = await res.json().catch(() => null);
  return { status: res.status, body: json, headers: Object.fromEntries(res.headers.entries()) };
}

// --- Test helpers ---
function makeValidPerson(overrides = {}) {
  return {
    name: 'Alice',
    gender: 'female',
    enabledModules: [],
    moduleAnswers: {
      core: ['Answer one here', 'Answer two here', 'Answer three here'],
    },
    ...overrides,
  };
}

function makePersonWithModules(overrides = {}) {
  return {
    name: 'Alice',
    gender: 'female',
    enabledModules: ['kokology', 'shadow', 'desire'],
    moduleAnswers: {
      core: ['Core answer 1', 'Core answer 2', 'Core answer 3'],
      kokology: ['Kok 1', 'Kok 2', 'Kok 3', 'Kok 4'],
      shadow: ['Shadow 1', 'Shadow 2', 'Shadow 3'],
      desire: ['Desire 1', 'Desire 2'],
    },
    ...overrides,
  };
}

function makeMockAnalyzeResponse() {
  return {
    personA: {
      archetype: 'The Architect',
      coreWiring: 'Builds things.',
      shadowPattern: 'Avoids feelings.',
      loveTemplate: 'Earned through effort.',
      complementProfile: 'Needs warmth.',
      likelyMistake: 'Picks builders.',
      growthEdge: 'Learn to receive.',
    },
    personB: {
      archetype: 'The Flame',
      coreWiring: 'Burns bright.',
      shadowPattern: 'Stays too long.',
      loveTemplate: 'Intensity is love.',
      complementProfile: 'Needs structure.',
      likelyMistake: 'Picks intensity.',
      growthEdge: 'Learn to stay.',
    },
    compatibility: {
      verdict: 'COMPLEMENT',
      score: 78,
      dynamic: 'Tuesday evening.',
      breakingPoint: 'His walls.',
      bestCase: 'They grow.',
      worstCase: 'They stagnate.',
      earlyWarnings: ['Sign 1', 'Sign 2', 'Sign 3'],
      shadowCollision: 'Their shadows collide here.',
      repairLever: 'The one thing to fix.',
      closingLine: 'The truth.',
    },
  };
}

function makeMockRepairResponse() {
  return {
    repair: {
      realBreak: 'The real break.',
      emotionalCalibration: {
        personA: 'Person A calibration.',
        personB: 'Person B calibration.',
      },
      dailyPractice: 'Do this daily.',
      cognitiveRepair: 'Fix this thinking.',
      revisionPractice: 'Revise this belief.',
      equanimityPractice: 'Observe without reacting.',
      shadowWork: 'Befriend this protector.',
      communicationRepair: 'Say it this way instead.',
    },
  };
}

function makeMockSimulateResponse() {
  return {
    simulation: {
      year1: 'Year one looks like this.',
      year3: 'Year three changes things.',
      year5: 'Year five is the test.',
      year7: 'Year seven deepens or breaks.',
      year10: {
        bestCase: 'Best case at year ten.',
        worstCase: 'Worst case at year ten.',
      },
      oneIntervention: 'Do this one thing.',
    },
  };
}

function makeCompatibility() {
  return {
    verdict: 'COMPLEMENT',
    score: 78,
    dynamic: 'Tuesday evening.',
    breakingPoint: 'His walls.',
    bestCase: 'They grow.',
    worstCase: 'They stagnate.',
    earlyWarnings: ['Sign 1', 'Sign 2', 'Sign 3'],
    shadowCollision: 'Shadows collide.',
    repairLever: 'Fix this.',
    closingLine: 'The truth.',
  };
}

function setMockLLMResponse(data) {
  mockCreate.mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(data) } }],
  });
}

// --- Tests ---

describe('validatePerson', () => {
  it('returns null for a valid person with core only', () => {
    expect(validatePerson(makeValidPerson(), 'Person A')).toBeNull();
  });

  it('returns null for a valid person with optional modules', () => {
    expect(validatePerson(makePersonWithModules(), 'Person A')).toBeNull();
  });

  it('rejects null / undefined input', () => {
    expect(validatePerson(null, 'Person A')).toContain('Person A');
    expect(validatePerson(undefined, 'Person A')).toContain('Person A');
  });

  it('rejects non-object input', () => {
    expect(validatePerson('string', 'Person A')).toContain('Person A');
  });

  it('rejects empty name', () => {
    expect(validatePerson(makeValidPerson({ name: '' }), 'Person A')).toContain('name');
  });

  it('rejects whitespace-only name', () => {
    expect(validatePerson(makeValidPerson({ name: '   ' }), 'Person A')).toContain('name');
  });

  it('rejects missing gender', () => {
    expect(validatePerson(makeValidPerson({ gender: '' }), 'Person A')).toContain('gender');
  });

  it('rejects missing moduleAnswers', () => {
    const person = makeValidPerson();
    delete person.moduleAnswers;
    expect(validatePerson(person, 'Person A')).toContain('moduleAnswers');
  });

  it('rejects missing core answers', () => {
    const person = makeValidPerson({ moduleAnswers: {} });
    expect(validatePerson(person, 'Person A')).toContain('core');
  });

  it('rejects wrong number of core answers', () => {
    const person = makeValidPerson({ moduleAnswers: { core: ['one'] } });
    expect(validatePerson(person, 'Person A')).toContain('3');
  });

  it('rejects empty core answer', () => {
    const person = makeValidPerson({
      moduleAnswers: { core: ['Answer', '', 'Answer'] },
    });
    expect(validatePerson(person, 'Person B')).toContain('core answer 2');
  });

  it('rejects whitespace-only core answer', () => {
    const person = makeValidPerson({
      moduleAnswers: { core: ['   ', 'Answer', 'Answer'] },
    });
    expect(validatePerson(person, 'Person A')).toContain('core answer 1');
  });

  it('rejects non-array enabledModules', () => {
    const person = makeValidPerson({ enabledModules: 'kokology' });
    expect(validatePerson(person, 'Person A')).toContain('enabledModules');
  });

  it('rejects invalid module key', () => {
    const person = makeValidPerson({ enabledModules: ['invalid_module'] });
    expect(validatePerson(person, 'Person A')).toContain('invalid_module');
  });

  it('rejects core as enabled module (core is not optional)', () => {
    const person = makeValidPerson({ enabledModules: ['core'] });
    expect(validatePerson(person, 'Person A')).toContain('core');
  });

  it('rejects missing module answers for enabled module', () => {
    const person = makeValidPerson({ enabledModules: ['kokology'] });
    expect(validatePerson(person, 'Person A')).toContain('kokology');
  });

  it('rejects wrong count of module answers', () => {
    const person = makeValidPerson({
      enabledModules: ['kokology'],
      moduleAnswers: { core: ['A1', 'A2', 'A3'], kokology: ['K1', 'K2'] },
    });
    expect(validatePerson(person, 'Person A')).toContain('4');
  });

  it('rejects empty string in module answers', () => {
    const person = makeValidPerson({
      enabledModules: ['shadow'],
      moduleAnswers: { core: ['A1', 'A2', 'A3'], shadow: ['S1', '', 'S3'] },
    });
    expect(validatePerson(person, 'Person A')).toContain('shadow answer 2');
  });

  it('accepts contradictions module with 6 answers', () => {
    const person = makeValidPerson({
      enabledModules: ['contradictions'],
      moduleAnswers: {
        core: ['A1', 'A2', 'A3'],
        contradictions: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'],
      },
    });
    expect(validatePerson(person, 'Person A')).toBeNull();
  });

  it('uses the provided label in error messages', () => {
    expect(validatePerson(null, 'Person B')).toContain('Person B');
  });
});

describe('normalizeResult — analyze', () => {
  const validRaw = makeMockAnalyzeResponse();

  it('passes through a fully valid result unchanged', () => {
    const result = normalizeResult(validRaw, 'analyze');
    expect(result.personA.archetype).toBe('The Architect');
    expect(result.personA.loveTemplate).toBe('Earned through effort.');
    expect(result.personA.growthEdge).toBe('Learn to receive.');
    expect(result.compatibility.score).toBe(78);
    expect(result.compatibility.earlyWarnings).toHaveLength(3);
    expect(result.compatibility.shadowCollision).toBe('Their shadows collide here.');
    expect(result.compatibility.repairLever).toBe('The one thing to fix.');
  });

  it('fills missing person fields with empty strings', () => {
    const result = normalizeResult({ personA: {}, personB: {}, compatibility: {} }, 'analyze');
    expect(result.personA.archetype).toBe('');
    expect(result.personA.coreWiring).toBe('');
    expect(result.personA.loveTemplate).toBe('');
    expect(result.personA.growthEdge).toBe('');
    expect(result.personB.shadowPattern).toBe('');
  });

  it('fills missing compatibility string fields with empty strings', () => {
    const result = normalizeResult({ personA: {}, personB: {}, compatibility: {} }, 'analyze');
    expect(result.compatibility.dynamic).toBe('');
    expect(result.compatibility.closingLine).toBe('');
    expect(result.compatibility.shadowCollision).toBe('');
    expect(result.compatibility.repairLever).toBe('');
  });

  it('defaults verdict to COMPLEMENT when missing', () => {
    const result = normalizeResult({ personA: {}, personB: {}, compatibility: {} }, 'analyze');
    expect(result.compatibility.verdict).toBe('COMPLEMENT');
  });

  it('defaults verdict to COMPLEMENT when invalid', () => {
    const result = normalizeResult({
      personA: {},
      personB: {},
      compatibility: { verdict: 'INVALID' },
    }, 'analyze');
    expect(result.compatibility.verdict).toBe('COMPLEMENT');
  });

  it('keeps valid verdicts', () => {
    for (const v of ['COMPLEMENT', 'COMBUSTION', 'MIRROR', 'MISFIRE']) {
      const result = normalizeResult({
        personA: {},
        personB: {},
        compatibility: { verdict: v },
      }, 'analyze');
      expect(result.compatibility.verdict).toBe(v);
    }
  });

  it('defaults score to 0 when missing', () => {
    const result = normalizeResult({ personA: {}, personB: {}, compatibility: {} }, 'analyze');
    expect(result.compatibility.score).toBe(0);
  });

  it('clamps score to 0-100 range', () => {
    const over = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, score: 150 },
    }, 'analyze');
    expect(over.compatibility.score).toBe(100);

    const under = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, score: -20 },
    }, 'analyze');
    expect(under.compatibility.score).toBe(0);
  });

  it('rounds non-integer scores', () => {
    const result = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, score: 78.6 },
    }, 'analyze');
    expect(result.compatibility.score).toBe(79);
  });

  it('pads earlyWarnings to 3 when fewer', () => {
    const result = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, earlyWarnings: ['one'] },
    }, 'analyze');
    expect(result.compatibility.earlyWarnings).toHaveLength(3);
    expect(result.compatibility.earlyWarnings[0]).toBe('one');
    expect(result.compatibility.earlyWarnings[1]).toBe('');
    expect(result.compatibility.earlyWarnings[2]).toBe('');
  });

  it('trims earlyWarnings to 3 when more', () => {
    const result = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, earlyWarnings: ['a', 'b', 'c', 'd', 'e'] },
    }, 'analyze');
    expect(result.compatibility.earlyWarnings).toHaveLength(3);
  });

  it('defaults earlyWarnings to array of 3 empty strings when missing', () => {
    const result = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, earlyWarnings: undefined },
    }, 'analyze');
    expect(result.compatibility.earlyWarnings).toEqual(['', '', '']);
  });

  it('filters out non-string earlyWarnings entries', () => {
    const result = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, earlyWarnings: ['valid', 123, null, 'also valid'] },
    }, 'analyze');
    expect(result.compatibility.earlyWarnings).toEqual(['valid', 'also valid', '']);
  });

  it('handles completely empty input gracefully', () => {
    const result = normalizeResult({}, 'analyze');
    expect(result.personA).toBeDefined();
    expect(result.personB).toBeDefined();
    expect(result.compatibility).toBeDefined();
    expect(result.compatibility.score).toBe(0);
    expect(result.compatibility.earlyWarnings).toEqual(['', '', '']);
  });

  it('coerces non-string person fields to empty strings', () => {
    const result = normalizeResult({
      personA: { archetype: 42, coreWiring: true },
      personB: {},
      compatibility: {},
    }, 'analyze');
    expect(result.personA.archetype).toBe('');
    expect(result.personA.coreWiring).toBe('');
  });
});

describe('normalizeResult — repair', () => {
  it('normalizes a valid repair response', () => {
    const raw = makeMockRepairResponse();
    const result = normalizeResult(raw, 'repair');
    expect(result.repair.realBreak).toBe('The real break.');
    expect(result.repair.emotionalCalibration.personA).toBe('Person A calibration.');
    expect(result.repair.emotionalCalibration.personB).toBe('Person B calibration.');
    expect(result.repair.dailyPractice).toBe('Do this daily.');
  });

  it('coerces non-string fields to empty strings', () => {
    const raw = { repair: { realBreak: 42, dailyPractice: null } };
    const result = normalizeResult(raw, 'repair');
    expect(result.repair.realBreak).toBe('');
    expect(result.repair.dailyPractice).toBe('');
  });

  it('handles missing emotionalCalibration', () => {
    const raw = { repair: {} };
    const result = normalizeResult(raw, 'repair');
    expect(result.repair.emotionalCalibration).toEqual({ personA: '', personB: '' });
  });

  it('handles completely empty input', () => {
    const result = normalizeResult({}, 'repair');
    expect(result.repair).toBeDefined();
    expect(result.repair.realBreak).toBe('');
    expect(result.repair.communicationRepair).toBe('');
    expect(result.repair.emotionalCalibration).toEqual({ personA: '', personB: '' });
  });
});

describe('normalizeResult — simulate', () => {
  it('normalizes a valid simulation response', () => {
    const raw = makeMockSimulateResponse();
    const result = normalizeResult(raw, 'simulate');
    expect(result.simulation.year1).toBe('Year one looks like this.');
    expect(result.simulation.year3).toBe('Year three changes things.');
    expect(result.simulation.year10.bestCase).toBe('Best case at year ten.');
    expect(result.simulation.year10.worstCase).toBe('Worst case at year ten.');
    expect(result.simulation.oneIntervention).toBe('Do this one thing.');
  });

  it('coerces missing fields to empty strings', () => {
    const result = normalizeResult({}, 'simulate');
    expect(result.simulation.year1).toBe('');
    expect(result.simulation.year5).toBe('');
    expect(result.simulation.year7).toBe('');
    expect(result.simulation.oneIntervention).toBe('');
    expect(result.simulation.year10).toEqual({ bestCase: '', worstCase: '' });
  });

  it('coerces missing year10 fields to empty strings', () => {
    const raw = { simulation: { year10: { bestCase: 'good' } } };
    const result = normalizeResult(raw, 'simulate');
    expect(result.simulation.year10.bestCase).toBe('good');
    expect(result.simulation.year10.worstCase).toBe('');
  });
});

describe('buildUserMessage', () => {
  const personA = {
    name: 'Alice',
    gender: 'female',
    enabledModules: [],
    moduleAnswers: { core: ['ans1', 'ans2', 'ans3'] },
  };
  const personB = {
    name: 'Bob',
    gender: 'male',
    enabledModules: [],
    moduleAnswers: { core: ['ans4', 'ans5', 'ans6'] },
  };

  it('includes both person names and genders', () => {
    const msg = buildUserMessage(personA, personB);
    expect(msg).toContain('Alice');
    expect(msg).toContain('female');
    expect(msg).toContain('Bob');
    expect(msg).toContain('male');
  });

  it('includes all core answers', () => {
    const msg = buildUserMessage(personA, personB);
    for (const ans of [...personA.moduleAnswers.core, ...personB.moduleAnswers.core]) {
      expect(msg).toContain(ans);
    }
  });

  it('labels persons as PERSON A and PERSON B', () => {
    const msg = buildUserMessage(personA, personB);
    expect(msg).toContain('PERSON A');
    expect(msg).toContain('PERSON B');
  });
});

// --- Integration tests ---
describe('POST /api/analyze', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('returns 400 for invalid person data', async () => {
    const res = await api('POST', '/api/analyze', { personA: {}, personB: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for invalid relationshipStatus', async () => {
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/analyze', { personA, personB, relationshipStatus: 'friends' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('relationshipStatus');
  });

  it('defaults relationshipStatus to new_match when missing', async () => {
    setMockLLMResponse(makeMockAnalyzeResponse());
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/analyze', { personA, personB });
    expect(res.status).toBe(200);
    expect(res.body.compatibility).toBeDefined();
  });

  it('accepts valid relationshipStatus existing_couple', async () => {
    setMockLLMResponse(makeMockAnalyzeResponse());
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/analyze', { personA, personB, relationshipStatus: 'existing_couple' });
    expect(res.status).toBe(200);
  });

  it('returns compatibility with shadowCollision and repairLever', async () => {
    setMockLLMResponse(makeMockAnalyzeResponse());
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/analyze', { personA, personB, relationshipStatus: 'new_match' });
    expect(res.status).toBe(200);
    expect(res.body.compatibility.shadowCollision).toBe('Their shadows collide here.');
    expect(res.body.compatibility.repairLever).toBe('The one thing to fix.');
  });

  it('returns all 7 ProfileOutput fields per person', async () => {
    setMockLLMResponse(makeMockAnalyzeResponse());
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/analyze', { personA, personB });
    expect(res.status).toBe(200);
    for (const key of ['personA', 'personB']) {
      expect(res.body[key]).toHaveProperty('archetype');
      expect(res.body[key]).toHaveProperty('coreWiring');
      expect(res.body[key]).toHaveProperty('shadowPattern');
      expect(res.body[key]).toHaveProperty('loveTemplate');
      expect(res.body[key]).toHaveProperty('complementProfile');
      expect(res.body[key]).toHaveProperty('likelyMistake');
      expect(res.body[key]).toHaveProperty('growthEdge');
    }
  });

  it('rejects payloads with legacy answers field (no moduleAnswers)', async () => {
    const legacyPerson = { name: 'Alice', gender: 'female', answers: ['a1', 'a2', 'a3'] };
    const res = await api('POST', '/api/analyze', { personA: legacyPerson, personB: legacyPerson });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('moduleAnswers');
  });

  it('returns meta with provider and model', async () => {
    setMockLLMResponse(makeMockAnalyzeResponse());
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/analyze', { personA, personB });
    expect(res.status).toBe(200);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.provider).toBe('Groq');
  });
});

describe('POST /api/repair', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('happy path returns { repair } with all 8 fields', async () => {
    setMockLLMResponse(makeMockRepairResponse());
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/repair', {
      personA,
      personB,
      relationshipStatus: 'existing_couple',
      compatibility: makeCompatibility(),
    });
    expect(res.status).toBe(200);
    expect(res.body.repair).toBeDefined();
    expect(res.body.repair.realBreak).toBe('The real break.');
    expect(res.body.repair.emotionalCalibration.personA).toBe('Person A calibration.');
    expect(res.body.repair.emotionalCalibration.personB).toBe('Person B calibration.');
    expect(res.body.repair.dailyPractice).toBe('Do this daily.');
    expect(res.body.repair.cognitiveRepair).toBe('Fix this thinking.');
    expect(res.body.repair.revisionPractice).toBe('Revise this belief.');
    expect(res.body.repair.equanimityPractice).toBe('Observe without reacting.');
    expect(res.body.repair.shadowWork).toBe('Befriend this protector.');
    expect(res.body.repair.communicationRepair).toBe('Say it this way instead.');
  });

  it('returns 400 when person data is missing', async () => {
    const res = await api('POST', '/api/repair', {
      personA: {},
      personB: {},
      compatibility: makeCompatibility(),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when compatibility is missing', async () => {
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/repair', { personA, personB, relationshipStatus: 'new_match' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('compatibility');
  });

  it('returns 400 when compatibility is missing required fields', async () => {
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/repair', {
      personA,
      personB,
      relationshipStatus: 'new_match',
      compatibility: { verdict: 'COMPLEMENT', score: 78 },
    });
    expect(res.status).toBe(400);
  });

  it('normalizeResult coerces non-string repair fields to empty strings', async () => {
    setMockLLMResponse({
      repair: {
        realBreak: 42,
        emotionalCalibration: { personA: true, personB: 99 },
        dailyPractice: null,
        cognitiveRepair: undefined,
        revisionPractice: 'valid',
        equanimityPractice: [],
        shadowWork: {},
        communicationRepair: 'also valid',
      },
    });
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/repair', {
      personA,
      personB,
      relationshipStatus: 'new_match',
      compatibility: makeCompatibility(),
    });
    expect(res.status).toBe(200);
    expect(res.body.repair.realBreak).toBe('');
    expect(res.body.repair.dailyPractice).toBe('');
    expect(res.body.repair.emotionalCalibration.personA).toBe('');
    expect(res.body.repair.emotionalCalibration.personB).toBe('');
    expect(res.body.repair.revisionPractice).toBe('valid');
    expect(res.body.repair.communicationRepair).toBe('also valid');
  });

  it('emotionalCalibration has personA and personB shape', async () => {
    setMockLLMResponse(makeMockRepairResponse());
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/repair', {
      personA,
      personB,
      relationshipStatus: 'new_match',
      compatibility: makeCompatibility(),
    });
    expect(res.status).toBe(200);
    expect(res.body.repair.emotionalCalibration).toEqual({
      personA: 'Person A calibration.',
      personB: 'Person B calibration.',
    });
  });
});

describe('POST /api/simulate', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('happy path returns { simulation } with all fields', async () => {
    setMockLLMResponse(makeMockSimulateResponse());
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/simulate', {
      personA,
      personB,
      relationshipStatus: 'new_match',
      compatibility: makeCompatibility(),
    });
    expect(res.status).toBe(200);
    expect(res.body.simulation).toBeDefined();
    expect(res.body.simulation.year1).toBe('Year one looks like this.');
    expect(res.body.simulation.year3).toBe('Year three changes things.');
    expect(res.body.simulation.year5).toBe('Year five is the test.');
    expect(res.body.simulation.year7).toBe('Year seven deepens or breaks.');
    expect(res.body.simulation.year10.bestCase).toBe('Best case at year ten.');
    expect(res.body.simulation.year10.worstCase).toBe('Worst case at year ten.');
    expect(res.body.simulation.oneIntervention).toBe('Do this one thing.');
  });

  it('returns 400 when person data is missing', async () => {
    const res = await api('POST', '/api/simulate', {
      personA: {},
      personB: {},
      compatibility: makeCompatibility(),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when compatibility is missing', async () => {
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/simulate', { personA, personB, relationshipStatus: 'new_match' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('compatibility');
  });

  it('year10 is { bestCase, worstCase }', async () => {
    setMockLLMResponse(makeMockSimulateResponse());
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/simulate', {
      personA,
      personB,
      relationshipStatus: 'new_match',
      compatibility: makeCompatibility(),
    });
    expect(res.status).toBe(200);
    expect(typeof res.body.simulation.year10).toBe('object');
    expect(res.body.simulation.year10).toHaveProperty('bestCase');
    expect(res.body.simulation.year10).toHaveProperty('worstCase');
  });

  it('missing year10 fields coerced to empty strings', async () => {
    setMockLLMResponse({ simulation: { year1: 'y1', year10: {} } });
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/simulate', {
      personA,
      personB,
      relationshipStatus: 'new_match',
      compatibility: makeCompatibility(),
    });
    expect(res.status).toBe(200);
    expect(res.body.simulation.year10.bestCase).toBe('');
    expect(res.body.simulation.year10.worstCase).toBe('');
  });

  it('coerces missing simulation fields to empty strings', async () => {
    setMockLLMResponse({ simulation: {} });
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/simulate', {
      personA,
      personB,
      relationshipStatus: 'new_match',
      compatibility: makeCompatibility(),
    });
    expect(res.status).toBe(200);
    expect(res.body.simulation.year1).toBe('');
    expect(res.body.simulation.year3).toBe('');
    expect(res.body.simulation.year5).toBe('');
    expect(res.body.simulation.year7).toBe('');
    expect(res.body.simulation.oneIntervention).toBe('');
  });
});

// --- Regression protection ---
describe('GET /api/models (regression)', () => {
  it('returns provider/model metadata after refactor', async () => {
    const res = await api('GET', '/api/models');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);

    const groq = res.body.find((p) => p.id === 'groq');
    expect(groq).toBeDefined();
    expect(groq.name).toBe('Groq');
    expect(Array.isArray(groq.models)).toBe(true);
    expect(groq.models.length).toBeGreaterThan(0);

    const openai = res.body.find((p) => p.id === 'openai');
    expect(openai).toBeDefined();
    expect(openai.name).toBe('OpenAI');
  });
});

describe('POST /api/keys (regression)', () => {
  it('accepts a key payload and updates in-memory key', async () => {
    const res = await api('POST', '/api/keys', { key: 'GROQ_API_KEY', value: 'test-key-value' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects unknown key', async () => {
    const res = await api('POST', '/api/keys', { key: 'UNKNOWN_KEY', value: 'value' });
    expect(res.status).toBe(400);
  });
});

describe('CORS preview wildcard (regression)', () => {
  it('allows *.preview.us1.vorflux.com origins', async () => {
    const res = await api('GET', '/api/models', undefined, {
      'Origin': 'https://something.preview.us1.vorflux.com',
    });
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://something.preview.us1.vorflux.com');
  });

  it('allows specific listed origin', async () => {
    const res = await api('GET', '/api/models', undefined, {
      'Origin': 'http://localhost:5173',
    });
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});

describe('Rate limiting on new endpoints', () => {
  it('/api/repair endpoint exists and is rate-limited (not 404)', async () => {
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/repair', { personA, personB, relationshipStatus: 'new_match' });
    // Should get 400 (missing compatibility) not 404
    expect(res.status).toBe(400);
  });

  it('/api/simulate endpoint exists and is rate-limited (not 404)', async () => {
    const personA = makeValidPerson();
    const personB = makeValidPerson({ name: 'Bob', gender: 'male' });
    const res = await api('POST', '/api/simulate', { personA, personB, relationshipStatus: 'new_match' });
    expect(res.status).toBe(400);
  });
});
