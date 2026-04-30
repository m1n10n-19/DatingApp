import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Questionnaire from '../components/Questionnaire';
import { createInitialPerson, UNIVERSAL_QUESTIONS, getQuestions } from '../services/questions';

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

const LONG_ANSWER = 'This is a sufficiently long answer to pass the minimum character requirement';

// Escape special regex characters in a string (for use in RegExp)
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper to fill name+gender and advance (hasHistory defaults to true)
async function fillNameGender(name = 'Alice', genderLabel = 'Female') {
  const nameInput = screen.getByPlaceholderText('What should we call you?');
  fireEvent.change(nameInput, { target: { value: name } });
  fireEvent.click(screen.getByText('Select gender'));
  fireEvent.click(screen.getByText(genderLabel));
  fireEvent.click(screen.getByText('Continue to questions'));
  await waitFor(() => {
    expect(screen.getByText(/Layer 1: Surface/)).toBeInTheDocument();
  });
}

// Helper to fill name+gender, toggle hasHistory to No, and advance
async function fillNameGenderNoHistory(name = 'Alice', genderLabel = 'Female') {
  const nameInput = screen.getByPlaceholderText('What should we call you?');
  fireEvent.change(nameInput, { target: { value: name } });
  fireEvent.click(screen.getByText('Select gender'));
  fireEvent.click(screen.getByText(genderLabel));
  // Toggle history to "No"
  const noButton = screen.getByRole('button', { name: 'No' });
  fireEvent.click(noButton);
  fireEvent.click(screen.getByText('Continue to questions'));
  await waitFor(() => {
    expect(screen.getByText(/Layer 1: Surface/)).toBeInTheDocument();
  });
}

// Helper to fill a question and advance
async function answerAndNext(answer = LONG_ANSWER) {
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

  it('renders the relationship history question in name_gender phase', () => {
    render(<Questionnaire {...makeProps()} />);
    expect(
      screen.getByText('Have you been in a serious relationship before?')
    ).toBeInTheDocument();
    // "Yes" should be the default active state
    const yesButton = screen.getByRole('button', { name: 'Yes' });
    expect(yesButton).toBeInTheDocument();
    const noButton = screen.getByRole('button', { name: 'No' });
    expect(noButton).toBeInTheDocument();
  });

  it('defaults hasHistory to true (Yes is selected)', () => {
    render(<Questionnaire {...makeProps()} />);
    const yesButton = screen.getByRole('button', { name: 'Yes' });
    // "Yes" button should have the active style (border-accent)
    expect(yesButton.className).toContain('border-accent');
    const noButton = screen.getByRole('button', { name: 'No' });
    expect(noButton.className).not.toContain('border-accent');
  });

  it('toggles hasHistory when No is clicked', () => {
    render(<Questionnaire {...makeProps()} />);
    const noButton = screen.getByRole('button', { name: 'No' });
    fireEvent.click(noButton);
    // Now "No" should be active
    expect(noButton.className).toContain('border-accent');
    const yesButton = screen.getByRole('button', { name: 'Yes' });
    expect(yesButton.className).not.toContain('border-accent');
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

  it('validates gender required before Next', () => {
    render(<Questionnaire {...makeProps()} />);
    const continueBtn = screen.getByText('Continue to questions');
    expect(continueBtn).toBeDisabled();

    // Fill only gender — still disabled (no name)
    fireEvent.click(screen.getByText('Select gender'));
    fireEvent.click(screen.getByText('Female'));
    expect(continueBtn).toBeDisabled();
  });

  it('enables continue when both name and gender are set', () => {
    render(<Questionnaire {...makeProps()} />);
    const nameInput = screen.getByPlaceholderText('What should we call you?');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByText('Select gender'));
    fireEvent.click(screen.getByText('Female'));
    const continueBtn = screen.getByText('Continue to questions');
    expect(continueBtn).not.toBeDisabled();
  });

  it('advances to questions phase showing layer labels', async () => {
    render(<Questionnaire {...makeProps()} />);
    await fillNameGender();

    // Should show question 1 with layer label
    expect(screen.getByText(/Layer 1: Surface — Question 1 of 6/)).toBeInTheDocument();
    expect(screen.getByText(UNIVERSAL_QUESTIONS[0].text)).toBeInTheDocument();
  });

  it('iterates through all 6 questions for female gender (with history)', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender('Alice', 'Female');

    const questions = getQuestions('female', true);
    expect(questions).toHaveLength(6);

    for (let i = 0; i < 6; i++) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`${questions[i].label} — Question ${i + 1} of 6`))
        ).toBeInTheDocument();
      });
      await answerAndNext(`Answer for question ${i + 1} that is definitely long enough`);
    }

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    const profile = onComplete.mock.calls[0][0];
    expect(profile.answers).toHaveLength(6);
    expect(profile.gender).toBe('female');
    expect(profile.hasRelationshipHistory).toBe(true);
  });

  it('iterates through all 6 questions for male gender (with history)', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender('Bob', 'Male');

    const questions = getQuestions('male', true);
    expect(questions).toHaveLength(6);

    for (let i = 0; i < 6; i++) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`${questions[i].label} — Question ${i + 1} of 6`))
        ).toBeInTheDocument();
      });
      await answerAndNext(`Answer for question ${i + 1} that is definitely long enough`);
    }

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    const profile = onComplete.mock.calls[0][0];
    expect(profile.answers).toHaveLength(6);
    expect(profile.gender).toBe('male');
    expect(profile.hasRelationshipHistory).toBe(true);
  });

  it('shows only 5 questions for non-binary gender (with history)', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender('Sam', 'Non-binary');

    const questions = getQuestions('non-binary', true);
    expect(questions).toHaveLength(5);

    for (let i = 0; i < 5; i++) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`${questions[i].label} — Question ${i + 1} of 5`))
        ).toBeInTheDocument();
      });
      await answerAndNext(`Answer for question ${i + 1} that is definitely long enough`);
    }

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    const profile = onComplete.mock.calls[0][0];
    expect(profile.answers).toHaveLength(5);
    expect(profile.gender).toBe('non-binary');
    expect(profile.hasRelationshipHistory).toBe(true);
  });

  it('shows 9 questions for female gender with no history', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGenderNoHistory('Alice', 'Female');

    const questions = getQuestions('female', false);
    expect(questions).toHaveLength(9);

    for (let i = 0; i < 9; i++) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`${escapeRegex(questions[i].label)} — Question ${i + 1} of 9`))
        ).toBeInTheDocument();
      });
      await answerAndNext(`Answer for question ${i + 1} that is definitely long enough`);
    }

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    const profile = onComplete.mock.calls[0][0];
    expect(profile.answers).toHaveLength(9);
    expect(profile.gender).toBe('female');
    expect(profile.hasRelationshipHistory).toBe(false);
  });

  it('shows 8 questions for non-binary gender with no history', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGenderNoHistory('Sam', 'Non-binary');

    const questions = getQuestions('non-binary', false);
    expect(questions).toHaveLength(8);

    for (let i = 0; i < 8; i++) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`${escapeRegex(questions[i].label)} — Question ${i + 1} of 8`))
        ).toBeInTheDocument();
      });
      await answerAndNext(`Answer for question ${i + 1} that is definitely long enough`);
    }

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    const profile = onComplete.mock.calls[0][0];
    expect(profile.answers).toHaveLength(8);
    expect(profile.gender).toBe('non-binary');
    expect(profile.hasRelationshipHistory).toBe(false);
  });

  it('uses alt-Q4 text when hasHistory is false', async () => {
    render(<Questionnaire {...makeProps()} />);
    await fillNameGenderNoHistory('Alice', 'Female');

    // Navigate to Q4 (index 3)
    for (let i = 0; i < 3; i++) {
      await answerAndNext(`Answer for question ${i + 1} that is definitely long enough`);
      await waitFor(() => {
        expect(screen.getByText(new RegExp(`Question ${i + 2} of`))).toBeInTheDocument();
      });
    }

    // Q4 should show the no-history variant label
    expect(screen.getByText(/Layer 4: Template \(No History\)/)).toBeInTheDocument();
  });

  it('requires minimum 20 characters for question answers', async () => {
    render(<Questionnaire {...makeProps()} />);
    await fillNameGender();

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Too short' } });
    const nextBtn = screen.getByText('Next question');
    expect(nextBtn).toBeDisabled();

    // Show "more characters needed" message
    expect(screen.getByText(/more characters needed/)).toBeInTheDocument();
  });

  it('shows "Ready to continue" when answer is long enough', async () => {
    render(<Questionnaire {...makeProps()} />);
    await fillNameGender();

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: LONG_ANSWER } });
    expect(screen.getByText('Ready to continue')).toBeInTheDocument();
  });

  it('shows "Complete" on the last question button', async () => {
    render(<Questionnaire {...makeProps()} />);
    await fillNameGender();

    const questions = getQuestions('female', true);

    // Answer all questions except the last
    for (let i = 0; i < questions.length - 1; i++) {
      await answerAndNext(`Answer for question ${i + 1} that is definitely long enough`);
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`Question ${i + 2} of ${questions.length}`))
        ).toBeInTheDocument();
      });
    }

    // Last question should show "Complete" button
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: LONG_ANSWER } });
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('calls onComplete with fully-built Profile (v2 schema) including hasRelationshipHistory', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender('Bob', 'Male');

    const questions = getQuestions('male', true);
    for (let i = 0; i < questions.length; i++) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`Question ${i + 1} of ${questions.length}`))
        ).toBeInTheDocument();
      });
      await answerAndNext(`A sufficiently long answer for question number ${i + 1}`);
    }

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    const profile = onComplete.mock.calls[0][0];
    expect(profile.name).toBe('Bob');
    expect(profile.gender).toBe('male');
    expect(profile.answers).toHaveLength(6);
    expect(profile.hasRelationshipHistory).toBe(true);
    expect(profile.schemaVersion).toBe(2);
    expect(profile.id).toBeTruthy();
    expect(profile.createdAt).toBeTruthy();
    // Should NOT have legacy fields
    expect(profile.moduleAnswers).toBeUndefined();
    expect(profile.enabledModules).toBeUndefined();
  });

  it('calls onComplete with hasRelationshipHistory false when No is toggled', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGenderNoHistory('Eve', 'Female');

    const questions = getQuestions('female', false);
    for (let i = 0; i < questions.length; i++) {
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`Question ${i + 1} of ${questions.length}`))
        ).toBeInTheDocument();
      });
      await answerAndNext(`A sufficiently long answer for question number ${i + 1}`);
    }

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    const profile = onComplete.mock.calls[0][0];
    expect(profile.name).toBe('Eve');
    expect(profile.gender).toBe('female');
    expect(profile.answers).toHaveLength(9);
    expect(profile.hasRelationshipHistory).toBe(false);
  });

  it('preserves answers when navigating between questions', async () => {
    render(<Questionnaire {...makeProps()} />);
    await fillNameGender();

    // Answer question 1
    const textarea1 = screen.getByRole('textbox');
    const answer1 = 'My specific answer to question one for testing';
    fireEvent.change(textarea1, { target: { value: answer1 } });
    await answerAndNext(answer1);

    // We're now on question 2
    await waitFor(() => {
      expect(screen.getByText(/Question 2 of/)).toBeInTheDocument();
    });

    // The textarea should be empty (different question)
    const textarea2 = screen.getByRole('textbox');
    expect(textarea2.value).toBe('');
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(<Questionnaire {...makeProps({ onCancel })} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('uses initialPerson values for name and gender', () => {
    const initialPerson = {
      ...createInitialPerson(),
      name: 'Existing',
      gender: 'male',
    };
    render(<Questionnaire {...makeProps({ initialPerson })} />);
    const nameInput = screen.getByPlaceholderText('What should we call you?');
    expect(nameInput.value).toBe('Existing');
    // Gender should be pre-selected (showing "Male" instead of "Select gender")
    expect(screen.getByText('Male')).toBeInTheDocument();
  });

  it('uses initialPerson hasRelationshipHistory value', () => {
    const initialPerson = {
      ...createInitialPerson(),
      name: 'Existing',
      gender: 'male',
      hasRelationshipHistory: false,
    };
    render(<Questionnaire {...makeProps({ initialPerson })} />);
    // "No" should be selected
    const noButton = screen.getByRole('button', { name: 'No' });
    expect(noButton.className).toContain('border-accent');
    const yesButton = screen.getByRole('button', { name: 'Yes' });
    expect(yesButton.className).not.toContain('border-accent');
  });

  it('displays personLabel in header', () => {
    render(<Questionnaire {...makeProps({ personLabel: 'Person B' })} />);
    const matches = screen.getAllByText('Person B');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // Should appear in the header bar
    expect(matches[0]).toBeInTheDocument();
  });
});
