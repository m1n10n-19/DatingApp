import { describe, it, expect } from 'vitest';
import { validatePerson, normalizeResult, buildUserMessage } from '../../server/index.js';
import { QUESTIONS } from '../services/questions';

describe('validatePerson', () => {
  const validPerson = {
    name: 'Alice',
    gender: 'female',
    answers: QUESTIONS.map(() => 'A valid answer here'),
  };

  it('returns null for a valid person', () => {
    expect(validatePerson(validPerson, 'Person A')).toBeNull();
  });

  it('rejects null / undefined input', () => {
    expect(validatePerson(null, 'Person A')).toContain('Person A');
    expect(validatePerson(undefined, 'Person A')).toContain('Person A');
  });

  it('rejects non-object input', () => {
    expect(validatePerson('string', 'Person A')).toContain('Person A');
  });

  it('rejects empty name', () => {
    expect(validatePerson({ ...validPerson, name: '' }, 'Person A')).toContain('name');
  });

  it('rejects whitespace-only name', () => {
    expect(validatePerson({ ...validPerson, name: '   ' }, 'Person A')).toContain('name');
  });

  it('rejects missing gender', () => {
    expect(validatePerson({ ...validPerson, gender: '' }, 'Person A')).toContain('gender');
  });

  it('rejects wrong number of answers', () => {
    expect(validatePerson({ ...validPerson, answers: ['one'] }, 'Person A')).toContain('answers');
  });

  it('rejects non-array answers', () => {
    expect(validatePerson({ ...validPerson, answers: 'not array' }, 'Person A')).toContain('answers');
  });

  it('rejects empty string answer', () => {
    const answers = QUESTIONS.map(() => 'Valid answer');
    answers[1] = '';
    expect(validatePerson({ ...validPerson, answers }, 'Person B')).toContain('answer 2');
  });

  it('rejects whitespace-only answer', () => {
    const answers = QUESTIONS.map(() => 'Valid answer');
    answers[0] = '   ';
    expect(validatePerson({ ...validPerson, answers }, 'Person A')).toContain('answer 1');
  });

  it('uses the provided label in error messages', () => {
    expect(validatePerson(null, 'Person B')).toContain('Person B');
  });
});

describe('normalizeResult', () => {
  const validRaw = {
    personA: {
      archetype: 'The Architect',
      coreWiring: 'Builds things.',
      shadowPattern: 'Avoids feelings.',
      complementProfile: 'Needs warmth.',
      likelyMistake: 'Picks builders.',
    },
    personB: {
      archetype: 'The Flame',
      coreWiring: 'Burns bright.',
      shadowPattern: 'Stays too long.',
      complementProfile: 'Needs structure.',
      likelyMistake: 'Picks intensity.',
    },
    compatibility: {
      verdict: 'COMPLEMENT',
      score: 78,
      dynamic: 'Tuesday evening.',
      breakingPoint: 'His walls.',
      bestCase: 'They grow.',
      worstCase: 'They stagnate.',
      earlyWarnings: ['Sign 1', 'Sign 2', 'Sign 3'],
      closingLine: 'The truth.',
    },
  };

  it('passes through a fully valid result unchanged', () => {
    const result = normalizeResult(validRaw);
    expect(result.personA.archetype).toBe('The Architect');
    expect(result.compatibility.score).toBe(78);
    expect(result.compatibility.earlyWarnings).toHaveLength(3);
  });

  it('fills missing person fields with empty strings', () => {
    const result = normalizeResult({ personA: {}, personB: {}, compatibility: {} });
    expect(result.personA.archetype).toBe('');
    expect(result.personA.coreWiring).toBe('');
    expect(result.personB.shadowPattern).toBe('');
  });

  it('fills missing compatibility string fields with empty strings', () => {
    const result = normalizeResult({ personA: {}, personB: {}, compatibility: {} });
    expect(result.compatibility.verdict).toBe('');
    expect(result.compatibility.dynamic).toBe('');
    expect(result.compatibility.closingLine).toBe('');
  });

  it('defaults score to 0 when missing', () => {
    const result = normalizeResult({ personA: {}, personB: {}, compatibility: {} });
    expect(result.compatibility.score).toBe(0);
  });

  it('clamps score to 0-100 range', () => {
    const over = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, score: 150 },
    });
    expect(over.compatibility.score).toBe(100);

    const under = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, score: -20 },
    });
    expect(under.compatibility.score).toBe(0);
  });

  it('rounds non-integer scores', () => {
    const result = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, score: 78.6 },
    });
    expect(result.compatibility.score).toBe(79);
  });

  it('defaults earlyWarnings to empty array when missing', () => {
    const result = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, earlyWarnings: undefined },
    });
    expect(result.compatibility.earlyWarnings).toEqual([]);
  });

  it('filters out non-string earlyWarnings entries', () => {
    const result = normalizeResult({
      ...validRaw,
      compatibility: { ...validRaw.compatibility, earlyWarnings: ['valid', 123, null, 'also valid'] },
    });
    expect(result.compatibility.earlyWarnings).toEqual(['valid', 'also valid']);
  });

  it('handles completely empty input gracefully', () => {
    const result = normalizeResult({});
    expect(result.personA).toBeDefined();
    expect(result.personB).toBeDefined();
    expect(result.compatibility).toBeDefined();
    expect(result.compatibility.score).toBe(0);
    expect(result.compatibility.earlyWarnings).toEqual([]);
  });

  it('coerces non-string person fields to empty strings', () => {
    const result = normalizeResult({
      personA: { archetype: 42, coreWiring: true },
      personB: {},
      compatibility: {},
    });
    expect(result.personA.archetype).toBe('');
    expect(result.personA.coreWiring).toBe('');
  });
});

describe('buildUserMessage', () => {
  const personA = { name: 'Alice', gender: 'female', answers: ['ans1', 'ans2', 'ans3'] };
  const personB = { name: 'Bob', gender: 'male', answers: ['ans4', 'ans5', 'ans6'] };

  it('includes both person names and genders', () => {
    const msg = buildUserMessage(personA, personB);
    expect(msg).toContain('Alice');
    expect(msg).toContain('female');
    expect(msg).toContain('Bob');
    expect(msg).toContain('male');
  });

  it('includes all answers', () => {
    const msg = buildUserMessage(personA, personB);
    for (const ans of [...personA.answers, ...personB.answers]) {
      expect(msg).toContain(ans);
    }
  });

  it('includes question text from shared QUESTIONS', () => {
    const msg = buildUserMessage(personA, personB);
    for (const q of QUESTIONS) {
      // Each question should appear twice (once per person)
      const firstIndex = msg.indexOf(q.text);
      const secondIndex = msg.indexOf(q.text, firstIndex + 1);
      expect(firstIndex).toBeGreaterThan(-1);
      expect(secondIndex).toBeGreaterThan(firstIndex);
    }
  });

  it('labels persons as PERSON A and PERSON B', () => {
    const msg = buildUserMessage(personA, personB);
    expect(msg).toContain('PERSON A');
    expect(msg).toContain('PERSON B');
  });
});
