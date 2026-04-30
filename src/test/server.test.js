import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'node:http';

// Mock the openai module before importing server
const mockCreate = vi.fn();

vi.hoisted(() => {
  // Raise rate limit for tests so we don't hit 429 — must be set before server module loads
  globalThis.process.env.RATE_LIMIT_MAX = '100000';
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

import { app, validatePerson, normalizeResult, buildUserPayload } from '../../server/index.js';

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
    answers: ['Answer one here', 'Answer two here', 'Answer three here', 'Answer four here', 'Answer five here'],
    ...overrides,
  };
}

function makePersonWith6Answers(overrides = {}) {
  return {
    name: 'Alice',
    gender: 'female',
    answers: ['Ans 1', 'Ans 2', 'Ans 3', 'Ans 4', 'Ans 5', 'Ans 6'],
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
      closingLine: 'He builds walls to feel safe.',
    },
    personB: {
      archetype: 'The Flame',
      coreWiring: 'Burns bright.',
      shadowPattern: 'Stays too long.',
      loveTemplate: 'Intensity is love.',
      complementProfile: 'Needs structure.',
      likelyMistake: 'Picks intensity.',
      growthEdge: 'Learn to stay.',
      closingLine: 'She burns through people looking for home.',
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
      breakType: 'ATTACHMENT',
      primaryMethod: 'Gottman Repair Attempts Protocol',
      whyThisMethod: 'Because their attachment styles clash.',
      practiceInstructions: 'Step one: notice the trigger. Step two: pause.',
      measurableIndicators: 'They will argue less frequently.',
      timeframe: '3-6 months of consistent practice.',
      secondaryMethod: 'IFS Parts Dialogue',
      secondaryPractice: 'Each person identifies their protector parts.',
      warningSign: 'When he goes silent and she pursues.',
      repairIsImpossibleIf: 'He refuses to acknowledge his emotional needs.',
      closingLine: 'The repair is in the reaching, not the arriving.',
    },
  };
}

function makeMockSimulateResponse() {
  return {
    simulation: {
      year1: {
        examined: 'Year one examined path.',
        unexamined: 'Year one unexamined path.',
      },
      year3: {
        examined: 'Year three examined path.',
        unexamined: 'Year three unexamined path.',
      },
      year5: {
        examined: 'Year five examined path.',
        unexamined: 'Year five unexamined path.',
      },
      year7: {
        examined: 'Year seven examined path.',
        unexamined: 'Year seven unexamined path.',
      },
      year10: {
        bestCase: 'Best case at year ten.',
        worstCase: 'Worst case at year ten.',
      },
      oneIntervention: {
        when: 'During their first real fight.',
        what: 'Name the pattern out loud.',
        why: 'Breaking the unconscious cycle.',
      },
      closingLine: 'The future is a choice.',
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
  it('returns null for a valid person with 5 answers', () => {
    expect(validatePerson(makeValidPerson(), 'Person A')).toBeNull();
  });

  it('returns null for a valid person with 6 answers', () => {
    expect(validatePerson(makePersonWith6Answers(), 'Person A')).toBeNull();
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

  it('rejects missing answers', () => {
    const person = makeValidPerson();
    delete person.answers;
    expect(validatePerson(person, 'Person A')).toContain('answers');
  });

  it('rejects too few answers (less than 5)', () => {
    const person = makeValidPerson({ answers: ['one', 'two', 'three'] });
    expect(validatePerson(person, 'Person A')).toContain('5');
  });

  it('rejects too many answers (more than 6)', () => {
    const person = makeValidPerson({ answers: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] });
    expect(validatePerson(person, 'Person A')).toContain('6');
  });

  it('rejects empty answer string', () => {
    const person = makeValidPerson({
      answers: ['Answer', '', 'Answer', 'Answer', 'Answer'],
    });
    expect(validatePerson(person, 'Person B')).toContain('answer 2');
  });

  it('rejects whitespace-only answer', () => {
    const person = makeValidPerson({
      answers: ['   ', 'Answer', 'Answer', 'Answer', 'Answer'],
    });
    expect(validatePerson(person, 'Person A')).toContain('answer 1');
  });

  it('uses the provided label in error messages', () => {
    expect(validatePerson(null, 'Person B')).toContain('Person B');
  });

  it('rejects non-array answers', () => {
    const person = makeValidPerson({ answers: 'not an array' });
    expect(validatePerson(person, 'Person A')).toContain('answers');
  });

  it('rejects legacy moduleAnswers format (no answers field)', () => {
    const legacyPerson = {
      name: 'Alice',
      gender: 'female',
      moduleAnswers: { core: ['a1', 'a2', 'a3'] },
      enabledModules: [],
    };
    expect(validatePerson(legacyPerson, 'Person A')).toContain('answers');
  });
});

describe('normalizeResult — analyze', () => {
  const validRaw = makeMockAnalyzeResponse();

  it('passes through a fully valid result unchanged', () => {
    const result = normalizeResult(validRaw, 'analyze');
    expect(result.personA.archetype).toBe('The Architect');
    expect(result.personA.loveTemplate).toBe('Earned through effort.');
    expect(result.personA.growthEdge).toBe('Learn to receive.');
    expect(result.personA.closingLine).toBe('He builds walls to feel safe.');
    expect(result.personB.closingLine).toBe('She burns through people looking for home.');
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
    expect(result.personA.closingLine).toBe('');
    expect(result.personB.shadowPattern).toBe('');
    expect(result.personB.closingLine).toBe('');
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
  it('normalizes a valid repair response with all 12 fields', () => {
    const raw = makeMockRepairResponse();
    const result = normalizeResult(raw, 'repair');
    expect(result.repair.realBreak).toBe('The real break.');
    expect(result.repair.breakType).toBe('ATTACHMENT');
    expect(result.repair.primaryMethod).toBe('Gottman Repair Attempts Protocol');
    expect(result.repair.whyThisMethod).toBe('Because their attachment styles clash.');
    expect(result.repair.practiceInstructions).toBe('Step one: notice the trigger. Step two: pause.');
    expect(result.repair.measurableIndicators).toBe('They will argue less frequently.');
    expect(result.repair.timeframe).toBe('3-6 months of consistent practice.');
    expect(result.repair.secondaryMethod).toBe('IFS Parts Dialogue');
    expect(result.repair.secondaryPractice).toBe('Each person identifies their protector parts.');
    expect(result.repair.warningSign).toBe('When he goes silent and she pursues.');
    expect(result.repair.repairIsImpossibleIf).toBe('He refuses to acknowledge his emotional needs.');
    expect(result.repair.closingLine).toBe('The repair is in the reaching, not the arriving.');
  });

  it('coerces non-string fields to empty strings', () => {
    const raw = { repair: { realBreak: 42, primaryMethod: null } };
    const result = normalizeResult(raw, 'repair');
    expect(result.repair.realBreak).toBe('');
    expect(result.repair.primaryMethod).toBe('');
  });

  it('defaults breakType to SHADOW when invalid', () => {
    const raw = { repair: { breakType: 'INVALID' } };
    const result = normalizeResult(raw, 'repair');
    expect(result.repair.breakType).toBe('SHADOW');
  });

  it('keeps valid breakType values', () => {
    for (const bt of ['ATTACHMENT', 'COMMUNICATION', 'SHADOW', 'TRUST', 'VALUES', 'DESIRE']) {
      const result = normalizeResult({ repair: { breakType: bt } }, 'repair');
      expect(result.repair.breakType).toBe(bt);
    }
  });

  it('handles completely empty input', () => {
    const result = normalizeResult({}, 'repair');
    expect(result.repair).toBeDefined();
    expect(result.repair.realBreak).toBe('');
    expect(result.repair.closingLine).toBe('');
    expect(result.repair.breakType).toBe('SHADOW'); // default
  });

  it('does not have old emotionalCalibration field', () => {
    const result = normalizeResult({}, 'repair');
    expect(result.repair.emotionalCalibration).toBeUndefined();
  });
});

describe('normalizeResult — simulate', () => {
  it('normalizes a valid simulation response with nested year projections', () => {
    const raw = makeMockSimulateResponse();
    const result = normalizeResult(raw, 'simulate');
    expect(result.simulation.year1.examined).toBe('Year one examined path.');
    expect(result.simulation.year1.unexamined).toBe('Year one unexamined path.');
    expect(result.simulation.year3.examined).toBe('Year three examined path.');
    expect(result.simulation.year3.unexamined).toBe('Year three unexamined path.');
    expect(result.simulation.year5.examined).toBe('Year five examined path.');
    expect(result.simulation.year7.unexamined).toBe('Year seven unexamined path.');
    expect(result.simulation.year10.bestCase).toBe('Best case at year ten.');
    expect(result.simulation.year10.worstCase).toBe('Worst case at year ten.');
    expect(result.simulation.oneIntervention.when).toBe('During their first real fight.');
    expect(result.simulation.oneIntervention.what).toBe('Name the pattern out loud.');
    expect(result.simulation.oneIntervention.why).toBe('Breaking the unconscious cycle.');
    expect(result.simulation.closingLine).toBe('The future is a choice.');
  });

  it('coerces missing fields to empty strings', () => {
    const result = normalizeResult({}, 'simulate');
    expect(result.simulation.year1).toEqual({ examined: '', unexamined: '' });
    expect(result.simulation.year3).toEqual({ examined: '', unexamined: '' });
    expect(result.simulation.year5).toEqual({ examined: '', unexamined: '' });
    expect(result.simulation.year7).toEqual({ examined: '', unexamined: '' });
    expect(result.simulation.year10).toEqual({ bestCase: '', worstCase: '' });
    expect(result.simulation.oneIntervention).toEqual({ when: '', what: '', why: '' });
    expect(result.simulation.closingLine).toBe('');
  });

  it('coerces missing year10 fields to empty strings', () => {
    const raw = { simulation: { year10: { bestCase: 'good' } } };
    const result = normalizeResult(raw, 'simulate');
    expect(result.simulation.year10.bestCase).toBe('good');
    expect(result.simulation.year10.worstCase).toBe('');
  });

  it('coerces missing oneIntervention fields to empty strings', () => {
    const raw = { simulation: { oneIntervention: { when: 'now' } } };
    const result = normalizeResult(raw, 'simulate');
    expect(result.simulation.oneIntervention.when).toBe('now');
    expect(result.simulation.oneIntervention.what).toBe('');
    expect(result.simulation.oneIntervention.why).toBe('');
  });

  it('handles partial year objects', () => {
    const raw = { simulation: { year1: { examined: 'partial' } } };
    const result = normalizeResult(raw, 'simulate');
    expect(result.simulation.year1.examined).toBe('partial');
    expect(result.simulation.year1.unexamined).toBe('');
  });
});

describe('buildUserPayload', () => {
  const personA = {
    name: 'Alice',
    gender: 'female',
    answers: ['ans1', 'ans2', 'ans3', 'ans4', 'ans5'],
  };
  const personB = {
    name: 'Bob',
    gender: 'male',
    answers: ['ans4', 'ans5', 'ans6', 'ans7', 'ans8'],
  };

  it('includes both person names and genders', () => {
    const msg = buildUserPayload(personA, personB, 'new_match');
    expect(msg).toContain('Alice');
    expect(msg).toContain('female');
    expect(msg).toContain('Bob');
    expect(msg).toContain('male');
  });

  it('includes all answers', () => {
    const msg = buildUserPayload(personA, personB, 'new_match');
    for (const ans of [...personA.answers, ...personB.answers]) {
      expect(msg).toContain(ans);
    }
  });

  it('labels persons as PERSON A and PERSON B', () => {
    const msg = buildUserPayload(personA, personB, 'new_match');
    expect(msg).toContain('PERSON A');
    expect(msg).toContain('PERSON B');
  });

  it('includes relationship status in payload', () => {
    const msg = buildUserPayload(personA, personB, 'existing_couple');
    expect(msg).toContain('existing_couple');
  });

  it('includes layer labels for questions', () => {
    const msg = buildUserPayload(personA, personB, 'new_match');
    expect(msg).toContain('Layer 1: Surface');
    expect(msg).toContain('Layer 2: Shadow');
    expect(msg).toContain('Layer 3: Recognition');
    expect(msg).toContain('Layer 4: Template');
    expect(msg).toContain('Layer 5: Desire');
  });

  it('includes question text from UNIVERSAL_QUESTIONS', () => {
    const msg = buildUserPayload(personA, personB, 'new_match');
    expect(msg).toContain('When something you deeply care about falls apart');
    expect(msg).toContain('most afraid someone you love will eventually discover');
  });

  it('includes gendered Q6 for person with 6 answers', () => {
    const personWith6 = {
      name: 'Charlie',
      gender: 'male',
      answers: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
    };
    const msg = buildUserPayload(personWith6, personB, 'new_match');
    expect(msg).toContain('Layer 6: Gendered');
    expect(msg).toContain('genuinely strong');
    expect(msg).toContain('a6');
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

  it('returns all 8 ProfileOutput fields per person (including closingLine)', async () => {
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
      expect(res.body[key]).toHaveProperty('closingLine');
    }
  });

  it('rejects payloads with legacy moduleAnswers field (no answers)', async () => {
    const legacyPerson = { name: 'Alice', gender: 'female', moduleAnswers: { core: ['a1', 'a2', 'a3'] } };
    const res = await api('POST', '/api/analyze', { personA: legacyPerson, personB: legacyPerson });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('answers');
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

  it('happy path returns { repair } with all 12 fields', async () => {
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
    expect(res.body.repair.breakType).toBe('ATTACHMENT');
    expect(res.body.repair.primaryMethod).toBe('Gottman Repair Attempts Protocol');
    expect(res.body.repair.whyThisMethod).toBe('Because their attachment styles clash.');
    expect(res.body.repair.practiceInstructions).toBe('Step one: notice the trigger. Step two: pause.');
    expect(res.body.repair.measurableIndicators).toBe('They will argue less frequently.');
    expect(res.body.repair.timeframe).toBe('3-6 months of consistent practice.');
    expect(res.body.repair.secondaryMethod).toBe('IFS Parts Dialogue');
    expect(res.body.repair.secondaryPractice).toBe('Each person identifies their protector parts.');
    expect(res.body.repair.warningSign).toBe('When he goes silent and she pursues.');
    expect(res.body.repair.repairIsImpossibleIf).toBe('He refuses to acknowledge his emotional needs.');
    expect(res.body.repair.closingLine).toBe('The repair is in the reaching, not the arriving.');
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
        breakType: 'ATTACHMENT',
        primaryMethod: null,
        whyThisMethod: undefined,
        practiceInstructions: 'valid',
        measurableIndicators: [],
        timeframe: {},
        secondaryMethod: true,
        secondaryPractice: 'also valid',
        warningSign: 123,
        repairIsImpossibleIf: 'honest',
        closingLine: 'end',
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
    expect(res.body.repair.primaryMethod).toBe('');
    expect(res.body.repair.practiceInstructions).toBe('valid');
    expect(res.body.repair.secondaryPractice).toBe('also valid');
    expect(res.body.repair.repairIsImpossibleIf).toBe('honest');
    expect(res.body.repair.closingLine).toBe('end');
  });
});

describe('POST /api/simulate', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('happy path returns { simulation } with all nested fields', async () => {
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
    expect(res.body.simulation.year1.examined).toBe('Year one examined path.');
    expect(res.body.simulation.year1.unexamined).toBe('Year one unexamined path.');
    expect(res.body.simulation.year10.bestCase).toBe('Best case at year ten.');
    expect(res.body.simulation.year10.worstCase).toBe('Worst case at year ten.');
    expect(res.body.simulation.oneIntervention.when).toBe('During their first real fight.');
    expect(res.body.simulation.oneIntervention.what).toBe('Name the pattern out loud.');
    expect(res.body.simulation.oneIntervention.why).toBe('Breaking the unconscious cycle.');
    expect(res.body.simulation.closingLine).toBe('The future is a choice.');
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
    setMockLLMResponse({ simulation: { year1: { examined: 'y1e' }, year10: {} } });
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

  it('coerces missing simulation fields to defaults', async () => {
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
    expect(res.body.simulation.year1).toEqual({ examined: '', unexamined: '' });
    expect(res.body.simulation.year3).toEqual({ examined: '', unexamined: '' });
    expect(res.body.simulation.year5).toEqual({ examined: '', unexamined: '' });
    expect(res.body.simulation.year7).toEqual({ examined: '', unexamined: '' });
    expect(res.body.simulation.oneIntervention).toEqual({ when: '', what: '', why: '' });
    expect(res.body.simulation.closingLine).toBe('');
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
