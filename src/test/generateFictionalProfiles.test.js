import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getQuestions } from '../../shared/questions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Parse the script to extract the FIGURES array ──────────────────────────
// We read the raw source and eval the FIGURES array to test it independently
// without triggering the network-dependent main() function.
const scriptPath = path.resolve(__dirname, '..', '..', 'scripts', 'generateFictionalProfiles.js');
const scriptSource = fs.readFileSync(scriptPath, 'utf-8');

// Extract the FIGURES array from the source code
function extractFigures() {
  const startMarker = 'const FIGURES = [';
  const startIdx = scriptSource.indexOf(startMarker);
  if (startIdx === -1) throw new Error('Could not find FIGURES array in script');

  // Find the matching closing bracket
  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx + startMarker.length - 1; i < scriptSource.length; i++) {
    if (scriptSource[i] === '[') depth++;
    else if (scriptSource[i] === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  if (endIdx === -1) throw new Error('Could not find end of FIGURES array');

  // Replace const with return
  const arraySource = scriptSource.slice(startIdx, endIdx).replace('const FIGURES = ', 'return ');
  // eslint-disable-next-line no-new-func
  return new Function(arraySource)();
}

// Extract buildAnswerGenerationPrompt function
function extractBuildPromptFn() {
  const startMarker = 'function buildAnswerGenerationPrompt(figure, questions) {';
  const startIdx = scriptSource.indexOf(startMarker);
  if (startIdx === -1) throw new Error('Could not find buildAnswerGenerationPrompt in script');

  // Find the matching closing brace
  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < scriptSource.length; i++) {
    if (scriptSource[i] === '{') depth++;
    else if (scriptSource[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  if (endIdx === -1) throw new Error('Could not find end of buildAnswerGenerationPrompt');

  const fnSource = scriptSource.slice(startIdx, endIdx);
  // eslint-disable-next-line no-new-func
  return new Function('figure', 'questions', fnSource.replace(/^function buildAnswerGenerationPrompt\(figure, questions\)\s*\{/, '').replace(/\}$/, ''));
}

// Extract generateId function
function extractGenerateIdFn() {
  const startMarker = 'function generateId(name) {';
  const startIdx = scriptSource.indexOf(startMarker);
  if (startIdx === -1) throw new Error('Could not find generateId in script');

  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < scriptSource.length; i++) {
    if (scriptSource[i] === '{') depth++;
    else if (scriptSource[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  if (endIdx === -1) throw new Error('Could not find end of generateId');

  const fnSource = scriptSource.slice(startIdx, endIdx);
  // eslint-disable-next-line no-new-func
  return new Function('name', fnSource.replace(/^function generateId\(name\)\s*\{/, '').replace(/\}$/, ''));
}

const FIGURES = extractFigures();
const buildAnswerGenerationPrompt = extractBuildPromptFn();
const generateId = extractGenerateIdFn();

// ── Spec-required figures ──────────────────────────────────────────────────
const SPEC_FIGURES = [
  'Marcus Aurelius', 'Khadijah', 'Atticus Finch', 'Noor Inayat Khan',
  'Kannagi', 'Arwen', 'Frodo Baggins', 'Elizabeth Bennet',
  'Sherlock Holmes', 'Hermione Granger', 'Gandhi', 'Cleopatra',
  'Steve Jobs', 'Frida Kahlo', 'APJ Abdul Kalam', 'Joan of Arc',
  'Rumi', 'Virginia Woolf', 'Bruce Lee', 'Simone de Beauvoir',
  'Nelson Mandela', 'Ada Lovelace', 'Nikola Tesla', 'Toni Morrison',
];

// ── Tests ──────────────────────────────────────────────────────────────────
describe('generateFictionalProfiles – FIGURES array', () => {
  it('contains exactly 50 figures', () => {
    expect(FIGURES).toHaveLength(50);
  });

  it('has exactly 25 men and 25 women', () => {
    const men = FIGURES.filter((f) => f.gender === 'male');
    const women = FIGURES.filter((f) => f.gender === 'female');
    expect(men).toHaveLength(25);
    expect(women).toHaveLength(25);
  });

  it('includes all 24 spec-required figures', () => {
    const names = FIGURES.map((f) => f.name);
    for (const name of SPEC_FIGURES) {
      expect(names).toContain(name);
    }
  });

  it('has no duplicate names', () => {
    const names = FIGURES.map((f) => f.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('every figure has required fields', () => {
    for (const fig of FIGURES) {
      expect(fig).toHaveProperty('name');
      expect(fig).toHaveProperty('gender');
      expect(fig).toHaveProperty('era');
      expect(fig).toHaveProperty('type');
      expect(fig).toHaveProperty('brief');
      expect(typeof fig.name).toBe('string');
      expect(fig.name.length).toBeGreaterThan(0);
      expect(['male', 'female']).toContain(fig.gender);
      expect(typeof fig.era).toBe('string');
      expect(typeof fig.type).toBe('string');
      expect(typeof fig.brief).toBe('string');
    }
  });

  it('every figure has a valid type', () => {
    const validTypes = ['historical', 'fictional', 'literary'];
    for (const fig of FIGURES) {
      expect(validTypes).toContain(fig.type);
    }
  });
});

describe('generateFictionalProfiles – generateId', () => {
  it('creates a slug from a simple name', () => {
    expect(generateId('Marcus Aurelius')).toBe('fictional-marcus-aurelius');
  });

  it('handles special characters', () => {
    expect(generateId("APJ Abdul Kalam")).toBe('fictional-apj-abdul-kalam');
  });

  it('handles names with apostrophes', () => {
    expect(generateId("Joan of Arc")).toBe('fictional-joan-of-arc');
  });

  it('returns lowercase with hyphens', () => {
    const id = generateId('Sherlock Holmes');
    expect(id).toBe('fictional-sherlock-holmes');
    expect(id).toMatch(/^fictional-[a-z0-9-]+$/);
  });

  it('produces unique IDs for all figures', () => {
    const ids = FIGURES.map((f) => generateId(f.name));
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('generateFictionalProfiles – buildAnswerGenerationPrompt', () => {
  const sampleFigure = {
    name: 'Marcus Aurelius',
    gender: 'male',
    era: 'Ancient Rome',
    type: 'historical',
    brief: 'Stoic philosopher-emperor',
  };

  it('includes the figure name and context', () => {
    const questions = getQuestions('male', true);
    const prompt = buildAnswerGenerationPrompt(sampleFigure, questions);
    expect(prompt).toContain('Marcus Aurelius');
    expect(prompt).toContain('Ancient Rome');
    expect(prompt).toContain('historical');
  });

  it('includes all question texts', () => {
    const questions = getQuestions('male', true);
    const prompt = buildAnswerGenerationPrompt(sampleFigure, questions);
    for (const q of questions) {
      expect(prompt).toContain(q.text);
    }
  });

  it('requests JSON array output', () => {
    const questions = getQuestions('male', true);
    const prompt = buildAnswerGenerationPrompt(sampleFigure, questions);
    expect(prompt).toContain('JSON array of strings');
    expect(prompt).toContain(`Return exactly ${questions.length} answers`);
  });

  it('works for female figures with correct question count', () => {
    const femaleFigure = { ...sampleFigure, name: 'Cleopatra', gender: 'female' };
    const questions = getQuestions('female', true);
    const prompt = buildAnswerGenerationPrompt(femaleFigure, questions);
    expect(prompt).toContain('Cleopatra');
    expect(prompt).toContain(`Return exactly ${questions.length} answers`);
  });
});

describe('generateFictionalProfiles – output file', () => {
  it('src/data/fictionalProfiles.json exists and is valid JSON', () => {
    const outputPath = path.resolve(__dirname, '..', 'data', 'fictionalProfiles.json');
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
  });
});

describe('generateFictionalProfiles – question compatibility', () => {
  it('male figures get 6 questions (5 universal + 1 gendered)', () => {
    const questions = getQuestions('male', true);
    expect(questions).toHaveLength(6);
  });

  it('female figures get 6 questions (5 universal + 1 gendered)', () => {
    const questions = getQuestions('female', true);
    expect(questions).toHaveLength(6);
  });
});
