import { describe, it, expect } from 'vitest';
import {
  QUESTIONS,
  CORE_QUESTIONS,
  CONTRADICTION_PAIRS,
  MODULE_DEFS,
  TRUTH_PREAMBLE,
  INITIAL_PERSON,
  createInitialPerson,
  UNIVERSAL_QUESTIONS,
  GENDER_QUESTIONS,
  getQuestions,
  NO_HISTORY_Q4,
  NO_HISTORY_EXTRA_QUESTIONS,
  MIN_ANSWERS,
  MAX_ANSWERS,
} from '../services/questions';
import { SAMPLE_PERSON_A, SAMPLE_PERSON_B } from '../services/sampleData';

describe('shared questions module', () => {
  describe('UNIVERSAL_QUESTIONS', () => {
    it('has exactly 5 universal questions', () => {
      expect(UNIVERSAL_QUESTIONS).toHaveLength(5);
    });

    it('each has id, layer, label, text, placeholder', () => {
      UNIVERSAL_QUESTIONS.forEach((q) => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('layer');
        expect(q).toHaveProperty('label');
        expect(q).toHaveProperty('text');
        expect(q).toHaveProperty('placeholder');
      });
    });
  });

  describe('GENDER_QUESTIONS', () => {
    it('has male and female variants', () => {
      expect(GENDER_QUESTIONS.male).toBeDefined();
      expect(GENDER_QUESTIONS.female).toBeDefined();
      expect(GENDER_QUESTIONS.male.id).toBe(6);
      expect(GENDER_QUESTIONS.female.id).toBe(6);
    });
  });

  describe('NO_HISTORY_Q4', () => {
    it('is a valid question object with id 4', () => {
      expect(NO_HISTORY_Q4.id).toBe(4);
      expect(NO_HISTORY_Q4.layer).toBe('Template');
      expect(NO_HISTORY_Q4.text).toContain("haven't been in a serious relationship");
    });
  });

  describe('NO_HISTORY_EXTRA_QUESTIONS', () => {
    it('has exactly 3 extra questions (Q7-Q9)', () => {
      expect(NO_HISTORY_EXTRA_QUESTIONS).toHaveLength(3);
    });

    it('has ids 7, 8, 9', () => {
      expect(NO_HISTORY_EXTRA_QUESTIONS[0].id).toBe(7);
      expect(NO_HISTORY_EXTRA_QUESTIONS[1].id).toBe(8);
      expect(NO_HISTORY_EXTRA_QUESTIONS[2].id).toBe(9);
    });

    it('each has id, layer, label, text, placeholder', () => {
      NO_HISTORY_EXTRA_QUESTIONS.forEach((q) => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('layer');
        expect(q).toHaveProperty('label');
        expect(q).toHaveProperty('text');
        expect(q).toHaveProperty('placeholder');
      });
    });
  });

  describe('getQuestions', () => {
    describe('with history (default)', () => {
      it('returns 5 questions for non-gendered user', () => {
        const qs = getQuestions('other', true);
        expect(qs).toHaveLength(5);
      });

      it('returns 6 questions for male', () => {
        const qs = getQuestions('male', true);
        expect(qs).toHaveLength(6);
      });

      it('returns 6 questions for female', () => {
        const qs = getQuestions('female');
        expect(qs).toHaveLength(6);
      });

      it('uses original Q4 (Template)', () => {
        const qs = getQuestions('female', true);
        expect(qs[3].text).toContain('What did love look like in the home you grew up in');
      });

      it('does not include extra questions Q7-Q9', () => {
        const qs = getQuestions('female', true);
        expect(qs.length).toBeLessThanOrEqual(6);
        expect(qs.some((q) => q.id === 7)).toBe(false);
      });
    });

    describe('without history (hasHistory = false)', () => {
      it('returns 8 questions for non-gendered user', () => {
        const qs = getQuestions('other', false);
        expect(qs).toHaveLength(8);
      });

      it('returns 9 questions for male', () => {
        const qs = getQuestions('male', false);
        expect(qs).toHaveLength(9);
      });

      it('returns 9 questions for female', () => {
        const qs = getQuestions('female', false);
        expect(qs).toHaveLength(9);
      });

      it('uses No History Q4 replacement', () => {
        const qs = getQuestions('female', false);
        expect(qs[3].text).toContain("haven't been in a serious relationship");
      });

      it('includes gendered Q6 in position 5', () => {
        const qs = getQuestions('male', false);
        expect(qs[5].id).toBe(6);
        expect(qs[5].layer).toBe('Gendered');
      });

      it('includes Q7, Q8, Q9 after gendered Q6', () => {
        const qs = getQuestions('female', false);
        expect(qs[6].id).toBe(7);
        expect(qs[7].id).toBe(8);
        expect(qs[8].id).toBe(9);
      });

      it('retains Q1, Q2, Q3, Q5 from universal', () => {
        const qs = getQuestions('female', false);
        expect(qs[0].id).toBe(1);
        expect(qs[1].id).toBe(2);
        expect(qs[2].id).toBe(3);
        expect(qs[4].id).toBe(5);
      });
    });
  });

  describe('MIN_ANSWERS and MAX_ANSWERS', () => {
    it('MIN_ANSWERS is 5', () => {
      expect(MIN_ANSWERS).toBe(5);
    });

    it('MAX_ANSWERS is 9 (accommodates no-history questionnaire)', () => {
      expect(MAX_ANSWERS).toBe(9);
    });
  });

  describe('QUESTIONS (legacy re-export)', () => {
    it('exports a non-empty array', () => {
      expect(Array.isArray(QUESTIONS)).toBe(true);
      expect(QUESTIONS.length).toBeGreaterThan(0);
    });

    it('is the same reference as CORE_QUESTIONS', () => {
      expect(QUESTIONS).toBe(CORE_QUESTIONS);
    });
  });

  describe('CORE_QUESTIONS (legacy)', () => {
    it('has exactly 3 questions with module "core"', () => {
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

    it('has answers array of length 6 with empty strings', () => {
      expect(INITIAL_PERSON.answers).toHaveLength(6);
      for (const a of INITIAL_PERSON.answers) {
        expect(a).toBe('');
      }
    });

    it('has hasRelationshipHistory defaulting to true', () => {
      expect(INITIAL_PERSON.hasRelationshipHistory).toBe(true);
    });

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(INITIAL_PERSON)).toBe(true);
    });

    it('has schemaVersion 2 and null createdAt', () => {
      expect(INITIAL_PERSON.schemaVersion).toBe(2);
      expect(INITIAL_PERSON.createdAt).toBeNull();
    });
  });

  describe('createInitialPerson', () => {
    it('returns an object with correct v2 shape', () => {
      const person = createInitialPerson();
      expect(person.name).toBe('');
      expect(person.gender).toBe('');
      expect(person.answers).toEqual(['', '', '', '', '', '']);
      expect(person.hasRelationshipHistory).toBe(true);
      expect(person.schemaVersion).toBe(2);
    });

    it('returns a new object each time (no shared reference)', () => {
      const a = createInitialPerson();
      const b = createInitialPerson();
      expect(a).not.toBe(b);
      expect(a.answers).not.toBe(b.answers);
    });

    it('returned answers array is mutable', () => {
      const person = createInitialPerson();
      person.answers[0] = 'test';
      expect(person.answers[0]).toBe('test');
    });

    it('returns unique id each call', () => {
      const a = createInitialPerson();
      const b = createInitialPerson();
      expect(a.id).toBeTruthy();
      expect(b.id).toBeTruthy();
      expect(a.id).not.toBe(b.id);
    });
  });

  describe('Legacy deprecation re-exports', () => {
    it('MODULE_DEFS is an empty array', () => {
      expect(Array.isArray(MODULE_DEFS)).toBe(true);
      expect(MODULE_DEFS).toHaveLength(0);
    });

    it('CONTRADICTION_PAIRS is an empty array', () => {
      expect(Array.isArray(CONTRADICTION_PAIRS)).toBe(true);
      expect(CONTRADICTION_PAIRS).toHaveLength(0);
    });
  });

  describe('TRUTH_PREAMBLE', () => {
    it('is a non-empty string > 100 chars', () => {
      expect(typeof TRUTH_PREAMBLE).toBe('string');
      expect(TRUTH_PREAMBLE.length).toBeGreaterThan(100);
    });
  });

  describe('SAMPLE_PERSON_A', () => {
    it('has the v2 profile shape', () => {
      expect(SAMPLE_PERSON_A).toHaveProperty('id');
      expect(SAMPLE_PERSON_A).toHaveProperty('name');
      expect(SAMPLE_PERSON_A).toHaveProperty('gender');
      expect(SAMPLE_PERSON_A).toHaveProperty('answers');
      expect(SAMPLE_PERSON_A).toHaveProperty('hasRelationshipHistory', true);
      expect(SAMPLE_PERSON_A).toHaveProperty('schemaVersion', 2);
      expect(SAMPLE_PERSON_A).toHaveProperty('createdAt');
      expect(SAMPLE_PERSON_A.answers).toHaveLength(6);
    });
  });

  describe('SAMPLE_PERSON_B', () => {
    it('has the v2 profile shape', () => {
      expect(SAMPLE_PERSON_B).toHaveProperty('id');
      expect(SAMPLE_PERSON_B).toHaveProperty('answers');
      expect(SAMPLE_PERSON_B).toHaveProperty('schemaVersion', 2);
      expect(SAMPLE_PERSON_B).toHaveProperty('hasRelationshipHistory', true);
      expect(SAMPLE_PERSON_B.answers).toHaveLength(6);
    });
  });
});
