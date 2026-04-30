import { describe, it, expect } from 'vitest';
import {
  QUESTIONS,
  CORE_QUESTIONS,
  CONTRADICTION_PAIRS,
  MODULE_DEFS,
  TRUTH_PREAMBLE,
  INITIAL_PERSON,
  createInitialPerson,
} from '../services/questions';
import { SAMPLE_PERSON_A } from '../services/sampleData';

describe('shared questions module', () => {
  describe('QUESTIONS (legacy re-export)', () => {
    it('exports a non-empty array', () => {
      expect(Array.isArray(QUESTIONS)).toBe(true);
      expect(QUESTIONS.length).toBeGreaterThan(0);
    });

    it('is the same reference as CORE_QUESTIONS', () => {
      expect(QUESTIONS).toBe(CORE_QUESTIONS);
    });
  });

  describe('CORE_QUESTIONS', () => {
    it('has exactly 3 questions with correct shape', () => {
      expect(CORE_QUESTIONS).toHaveLength(3);
      CORE_QUESTIONS.forEach((q) => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('text');
        expect(q).toHaveProperty('placeholder');
        expect(q).toHaveProperty('module', 'core');
      });
    });
  });

  describe('INITIAL_PERSON', () => {
    it('has empty name and gender', () => {
      expect(INITIAL_PERSON.name).toBe('');
      expect(INITIAL_PERSON.gender).toBe('');
    });

    it('has moduleAnswers.core array of length 3 with empty strings', () => {
      expect(INITIAL_PERSON.moduleAnswers.core).toHaveLength(3);
      INITIAL_PERSON.moduleAnswers.core.forEach((a) => expect(a).toBe(''));
    });

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(INITIAL_PERSON)).toBe(true);
    });

    it('has schemaVersion 1 and null createdAt', () => {
      expect(INITIAL_PERSON.schemaVersion).toBe(1);
      expect(INITIAL_PERSON.createdAt).toBeNull();
    });
  });

  describe('createInitialPerson', () => {
    it('returns an object with correct shape', () => {
      const person = createInitialPerson();
      expect(person.name).toBe('');
      expect(person.gender).toBe('');
      expect(person.moduleAnswers.core).toEqual(['', '', '']);
      expect(person.enabledModules).toEqual([]);
      expect(person.schemaVersion).toBe(1);
    });

    it('returns a new object each time (no shared reference)', () => {
      const a = createInitialPerson();
      const b = createInitialPerson();
      expect(a).not.toBe(b);
      expect(a.moduleAnswers).not.toBe(b.moduleAnswers);
      expect(a.moduleAnswers.core).not.toBe(b.moduleAnswers.core);
    });

    it('returned moduleAnswers.core array is mutable', () => {
      const person = createInitialPerson();
      person.moduleAnswers.core[0] = 'test';
      expect(person.moduleAnswers.core[0]).toBe('test');
    });

    it('returns unique id each call', () => {
      const a = createInitialPerson();
      const b = createInitialPerson();
      expect(a.id).toBeTruthy();
      expect(b.id).toBeTruthy();
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('MODULE_DEFS', () => {
    it('exports an array of 5 entries with correct shape', () => {
      expect(Array.isArray(MODULE_DEFS)).toBe(true);
      expect(MODULE_DEFS).toHaveLength(5);
      MODULE_DEFS.forEach((m) => {
        expect(m).toHaveProperty('key');
        expect(m).toHaveProperty('label');
        expect(m).toHaveProperty('required');
        expect(m).toHaveProperty('count');
        expect(typeof m.key).toBe('string');
        expect(typeof m.label).toBe('string');
        expect(typeof m.required).toBe('boolean');
        expect(typeof m.count).toBe('number');
      });
    });

    it('core is required, others are not', () => {
      const core = MODULE_DEFS.find((m) => m.key === 'core');
      expect(core.required).toBe(true);
      MODULE_DEFS.filter((m) => m.key !== 'core').forEach((m) => {
        expect(m.required).toBe(false);
      });
    });
  });

  describe('CONTRADICTION_PAIRS', () => {
    it('has 3 entries each with first and second', () => {
      expect(CONTRADICTION_PAIRS).toHaveLength(3);
      CONTRADICTION_PAIRS.forEach((pair) => {
        expect(pair).toHaveProperty('pairId');
        expect(pair).toHaveProperty('first');
        expect(pair).toHaveProperty('second');
        expect(pair).toHaveProperty('module', 'contradictions');
        expect(pair.first).toHaveProperty('id');
        expect(pair.first).toHaveProperty('text');
        expect(pair.first).toHaveProperty('placeholder');
        expect(pair.second).toHaveProperty('id');
        expect(pair.second).toHaveProperty('text');
        expect(pair.second).toHaveProperty('placeholder');
      });
    });
  });

  describe('TRUTH_PREAMBLE', () => {
    it('is a non-empty string > 100 chars', () => {
      expect(typeof TRUTH_PREAMBLE).toBe('string');
      expect(TRUTH_PREAMBLE.length).toBeGreaterThan(100);
    });
  });

  describe('INITIAL_PERSON.moduleAnswers.core', () => {
    it('has length 3', () => {
      expect(INITIAL_PERSON.moduleAnswers.core).toHaveLength(3);
    });
  });

  describe('SAMPLE_PERSON_A', () => {
    it('has moduleAnswers.kokology of length 4', () => {
      expect(SAMPLE_PERSON_A.moduleAnswers.kokology).toHaveLength(4);
    });

    it('has the new profile shape', () => {
      expect(SAMPLE_PERSON_A).toHaveProperty('id');
      expect(SAMPLE_PERSON_A).toHaveProperty('enabledModules');
      expect(SAMPLE_PERSON_A).toHaveProperty('moduleAnswers');
      expect(SAMPLE_PERSON_A).toHaveProperty('schemaVersion', 1);
      expect(SAMPLE_PERSON_A).toHaveProperty('createdAt');
      expect(SAMPLE_PERSON_A.moduleAnswers.core).toHaveLength(3);
      expect(SAMPLE_PERSON_A.moduleAnswers.shadow).toHaveLength(3);
      expect(SAMPLE_PERSON_A.moduleAnswers.desire).toHaveLength(2);
    });
  });
});
