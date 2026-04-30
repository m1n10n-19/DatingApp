import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Questionnaire from '../components/Questionnaire';
import { createInitialPerson } from '../services/questions';

// Mock profileStore so we can check if saveProfile is called
vi.mock('../services/profileStore', () => ({
  saveProfile: vi.fn((p) => p),
  listProfiles: vi.fn(() => []),
  deleteProfile: vi.fn(),
  getProfile: vi.fn(),
  clearAll: vi.fn(),
  STORAGE_KEY: 'complement.profiles.v1',
}));

const makeProps = (overrides = {}) => ({
  personLabel: 'Person A',
  initialPerson: createInitialPerson(),
  onComplete: vi.fn(),
  onCancel: vi.fn(),
  ...overrides,
});

// Helper to fill name+gender and advance
async function fillNameGender(name = 'Alice') {
  const nameInput = screen.getByPlaceholderText('What should we call you?');
  fireEvent.change(nameInput, { target: { value: name } });
  fireEvent.click(screen.getByText('Select gender'));
  fireEvent.click(screen.getByText('Female'));
  fireEvent.click(screen.getByText('Continue to questions'));
  await waitFor(() => {
    expect(screen.getByText(/Core/)).toBeInTheDocument();
  });
}

// Helper to fill a question and advance
async function answerAndNext(answer = 'This is a sufficiently long answer to pass the minimum character requirement') {
  const textarea = screen.getByRole('textbox');
  fireEvent.change(textarea, { target: { value: answer } });
  const nextBtn = screen.queryByText('Next question') || screen.queryByText('Complete');
  if (nextBtn) {
    fireEvent.click(nextBtn);
  }
}

describe('Questionnaire', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name_gender phase initially', () => {
    render(<Questionnaire {...makeProps()} />);
    expect(screen.getByText("Let's start with the basics.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What should we call you?')).toBeInTheDocument();
    expect(screen.getByText('Select gender')).toBeInTheDocument();
  });

  it('validates name required before Next', () => {
    render(<Questionnaire {...makeProps()} />);
    const continueBtn = screen.getByText('Continue to questions');
    expect(continueBtn).toBeDisabled();

    // Fill only name - still disabled (no gender)
    const nameInput = screen.getByPlaceholderText('What should we call you?');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    expect(continueBtn).toBeDisabled();
  });

  it('advances through core phase (3 questions)', async () => {
    render(<Questionnaire {...makeProps()} />);
    await fillNameGender();

    // Should show core question 1
    expect(screen.getByText(/Core — Question 1 of 3/)).toBeInTheDocument();
    await answerAndNext();

    await waitFor(() => {
      expect(screen.getByText(/Core — Question 2 of 3/)).toBeInTheDocument();
    });
    await answerAndNext();

    await waitFor(() => {
      expect(screen.getByText(/Core — Question 3 of 3/)).toBeInTheDocument();
    });
  });

  it('module select toggles enabledModules', async () => {
    render(<Questionnaire {...makeProps()} />);
    await fillNameGender();

    // Answer all 3 core questions
    for (let i = 0; i < 3; i++) {
      await answerAndNext();
      if (i < 2) {
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`Core — Question ${i + 2} of 3`))).toBeInTheDocument();
        });
      }
    }

    // Should be on module select
    await waitFor(() => {
      expect(screen.getByText('Add depth modules?')).toBeInTheDocument();
    });

    // Check Kokology checkbox
    const kokologyCheckbox = screen.getByLabelText(/Kokology/);
    expect(kokologyCheckbox).not.toBeChecked();
    fireEvent.click(kokologyCheckbox);
    expect(kokologyCheckbox).toBeChecked();
  });

  it('skips disabled modules', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender();

    // Answer all 3 core questions
    for (let i = 0; i < 3; i++) {
      await answerAndNext();
      if (i < 2) {
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`Core — Question ${i + 2} of 3`))).toBeInTheDocument();
        });
      }
    }

    // Module select - don't enable anything
    await waitFor(() => {
      expect(screen.getByText('Skip depth modules')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Skip depth modules'));

    // Should call onComplete immediately (skipping all optional modules)
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    const profile = onComplete.mock.calls[0][0];
    expect(profile.enabledModules).toEqual([]);
    expect(profile.moduleAnswers.core).toHaveLength(3);
    expect(profile.moduleAnswers.kokology).toBeUndefined();
  });

  it('collects contradictions in two halves', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender();

    // Core
    for (let i = 0; i < 3; i++) {
      await answerAndNext();
      if (i < 2) {
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`Core — Question ${i + 2} of 3`))).toBeInTheDocument();
        });
      }
    }

    // Module select - enable only contradictions
    await waitFor(() => {
      expect(screen.getByText('Add depth modules?')).toBeInTheDocument();
    });
    const contradictionsCheckbox = screen.getByLabelText(/Contradiction pairs/);
    fireEvent.click(contradictionsCheckbox);
    fireEvent.click(screen.getByText('Continue'));

    // Contradictions first half (3 questions)
    await waitFor(() => {
      expect(screen.getByText(/Contradictions \(part 1\) — Question 1 of 3/)).toBeInTheDocument();
    });
    for (let i = 0; i < 3; i++) {
      await answerAndNext();
      if (i < 2) {
        await waitFor(() => {
          expect(
            screen.getByText(new RegExp(`Contradictions \\(part 1\\) — Question ${i + 2} of 3`))
          ).toBeInTheDocument();
        });
      }
    }

    // Contradictions second half (3 questions)
    await waitFor(() => {
      expect(screen.getByText(/Contradictions \(part 2\) — Question 1 of 3/)).toBeInTheDocument();
    });
    for (let i = 0; i < 3; i++) {
      await answerAndNext();
      if (i < 2) {
        await waitFor(() => {
          expect(
            screen.getByText(new RegExp(`Contradictions \\(part 2\\) — Question ${i + 2} of 3`))
          ).toBeInTheDocument();
        });
      }
    }

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    const profile = onComplete.mock.calls[0][0];
    expect(profile.moduleAnswers.contradictions).toHaveLength(6);
    expect(profile.enabledModules).toContain('contradictions');
  });

  it('calls onComplete with fully-built Profile', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender('Bob');

    // Core
    for (let i = 0; i < 3; i++) {
      await answerAndNext('A sufficiently long answer for question number ' + (i + 1));
      if (i < 2) {
        await waitFor(() => {
          expect(screen.getByText(new RegExp(`Core — Question ${i + 2} of 3`))).toBeInTheDocument();
        });
      }
    }

    // Skip modules
    await waitFor(() => {
      expect(screen.getByText('Skip depth modules')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Skip depth modules'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    const profile = onComplete.mock.calls[0][0];
    expect(profile.name).toBe('Bob');
    expect(profile.gender).toBe('female');
    expect(profile.moduleAnswers.core).toHaveLength(3);
    expect(profile.schemaVersion).toBe(1);
    expect(profile.id).toBeTruthy();
    expect(profile.createdAt).toBeTruthy();
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(<Questionnaire {...makeProps({ onCancel })} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
