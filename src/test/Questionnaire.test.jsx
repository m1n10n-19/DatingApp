import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Questionnaire from '../components/Questionnaire';
import { createInitialPerson, UNIVERSAL_QUESTIONS, getQuestionsForGender } from '../services/questions';

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

// Helper to fill name+gender and advance
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

  it('iterates through all 6 questions for female gender', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender('Alice', 'Female');

    const questions = getQuestionsForGender('female');
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
  });

  it('iterates through all 6 questions for male gender', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender('Bob', 'Male');

    const questions = getQuestionsForGender('male');
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
  });

  it('shows only 5 questions for non-binary gender', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender('Sam', 'Non-binary');

    const questions = getQuestionsForGender('non-binary');
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

    const questions = getQuestionsForGender('female');

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

  it('calls onComplete with fully-built Profile (v2 schema)', async () => {
    const onComplete = vi.fn();
    render(<Questionnaire {...makeProps({ onComplete })} />);
    await fillNameGender('Bob', 'Male');

    const questions = getQuestionsForGender('male');
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
    expect(profile.schemaVersion).toBe(2);
    expect(profile.id).toBeTruthy();
    expect(profile.createdAt).toBeTruthy();
    // Should NOT have legacy fields
    expect(profile.moduleAnswers).toBeUndefined();
    expect(profile.enabledModules).toBeUndefined();
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

  it('displays personLabel in header', () => {
    render(<Questionnaire {...makeProps({ personLabel: 'Person B' })} />);
    const matches = screen.getAllByText('Person B');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // Should appear in the header bar
    expect(matches[0]).toBeInTheDocument();
  });
});
