import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PersonForm from '../components/PersonForm';
import { QUESTIONS } from '../services/questions';

const defaultProps = {
  label: 'Person A',
  personNumber: 1,
  questions: QUESTIONS,
  onComplete: vi.fn(),
  onBack: vi.fn(),
};

describe('PersonForm', () => {
  it('renders the intro step with name and gender fields', () => {
    render(<PersonForm {...defaultProps} />);
    expect(screen.getByText("Let's start with the basics.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What should we call you?')).toBeInTheDocument();
    expect(screen.getByText('Select gender')).toBeInTheDocument();
  });

  it('shows Person label', () => {
    render(<PersonForm {...defaultProps} />);
    expect(screen.getByText('Person A')).toBeInTheDocument();
  });

  it('disables continue button when name is empty', () => {
    render(<PersonForm {...defaultProps} />);
    const continueBtn = screen.getByText('Continue to questions');
    expect(continueBtn).toBeDisabled();
  });

  it('disables continue button when only name is filled (no gender)', () => {
    render(<PersonForm {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('What should we call you?');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    const continueBtn = screen.getByText('Continue to questions');
    expect(continueBtn).toBeDisabled();
  });

  it('enables continue button when name and gender are filled', () => {
    render(<PersonForm {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('What should we call you?');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    // Open gender dropdown and select
    fireEvent.click(screen.getByText('Select gender'));
    fireEvent.click(screen.getByText('Female'));

    const continueBtn = screen.getByText('Continue to questions');
    expect(continueBtn).not.toBeDisabled();
  });

  it('navigates to first question after filling intro', async () => {
    render(<PersonForm {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('What should we call you?');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    fireEvent.click(screen.getByText('Select gender'));
    fireEvent.click(screen.getByText('Female'));
    fireEvent.click(screen.getByText('Continue to questions'));

    // Wait for AnimatePresence transition
    await waitFor(() => {
      expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
    });
  });

  it('requires minimum 20 characters for question answers', async () => {
    render(<PersonForm {...defaultProps} />);
    // Fill intro
    fireEvent.change(screen.getByPlaceholderText('What should we call you?'), {
      target: { value: 'Alice' },
    });
    fireEvent.click(screen.getByText('Select gender'));
    fireEvent.click(screen.getByText('Female'));
    fireEvent.click(screen.getByText('Continue to questions'));

    // Wait for question to appear
    await waitFor(() => {
      expect(screen.getByText(/Question 1 of 3/)).toBeInTheDocument();
    });

    // Type a short answer
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Short' } });

    const nextBtn = screen.getByText('Next question');
    expect(nextBtn).toBeDisabled();

    // Type a long enough answer
    fireEvent.change(textarea, {
      target: { value: 'This is a long enough answer to pass the minimum character requirement for the form' },
    });
    expect(nextBtn).not.toBeDisabled();
  });

  it('calls onBack when back button is clicked on intro', () => {
    const onBack = vi.fn();
    render(<PersonForm {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByText('Back'));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
