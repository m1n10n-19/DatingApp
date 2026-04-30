import { describe, it, expect } from 'vitest';
import { QUESTIONS } from '../services/questions';

describe('QUESTIONS', () => {
  it('should have exactly 3 questions', () => {
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
