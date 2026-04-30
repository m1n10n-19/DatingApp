import { describe, it, expect } from 'vitest';
import { QUESTIONS, UNIVERSAL_QUESTIONS } from '../services/questions';

describe('QUESTIONS (legacy)', () => {
  it('should have exactly 3 questions (legacy compat)', () => {
    expect(QUESTIONS).toHaveLength(3);
  });

  it('each question should have id, text, and placeholder', () => {
    QUESTIONS.forEach((q) => {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('text');
      expect(q).toHaveProperty('placeholder');
      expect(typeof q.id).toBe('number');
      expect(typeof q.text).toBe('string');
      expect(typeof q.placeholder).toBe('string');
      expect(q.text.length).toBeGreaterThan(10);
      expect(q.placeholder.length).toBeGreaterThan(5);
    });
  });

  it('should have sequential ids starting from 1', () => {
    QUESTIONS.forEach((q, i) => {
      expect(q.id).toBe(i + 1);
    });
  });
});

describe('UNIVERSAL_QUESTIONS', () => {
  it('should have exactly 5 questions', () => {
    expect(UNIVERSAL_QUESTIONS).toHaveLength(5);
  });

  it('each question should have id, text, placeholder, layer, and label', () => {
    UNIVERSAL_QUESTIONS.forEach((q) => {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('text');
      expect(q).toHaveProperty('placeholder');
      expect(q).toHaveProperty('layer');
      expect(q).toHaveProperty('label');
      expect(typeof q.text).toBe('string');
      expect(q.text.length).toBeGreaterThan(10);
    });
  });
});
