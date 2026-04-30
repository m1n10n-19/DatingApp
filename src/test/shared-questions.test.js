import { describe, it, expect } from 'vitest';
import { QUESTIONS, INITIAL_PERSON, createInitialPerson } from '../services/questions';

describe('shared questions module', () => {
  describe('QUESTIONS', () => {
    it('exports a non-empty array', () => {
      expect(Array.isArray(QUESTIONS)).toBe(true);
      expect(QUESTIONS.length).toBeGreaterThan(0);
    });
  });

  describe('INITIAL_PERSON', () => {
    it('has empty name and gender', () => {
      expect(INITIAL_PERSON.name).toBe('');
      expect(INITIAL_PERSON.gender).toBe('');
    });

    it('has answers array matching QUESTIONS length', () => {
      expect(INITIAL_PERSON.answers).toHaveLength(QUESTIONS.length);
      INITIAL_PERSON.answers.forEach((a) => expect(a).toBe(''));
    });

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(INITIAL_PERSON)).toBe(true);
    });
  });

  describe('createInitialPerson', () => {
    it('returns an object matching INITIAL_PERSON shape', () => {
      const person = createInitialPerson();
      expect(person).toEqual({ name: '', gender: '', answers: QUESTIONS.map(() => '') });
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
  });
});
