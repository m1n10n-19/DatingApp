import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RelationshipStatus from '../components/RelationshipStatus';

const makeProfile = (name, gender = 'female') => ({
  id: crypto.randomUUID(),
  name,
  gender,
  enabledModules: [],
  moduleAnswers: { core: ['a', 'b', 'c'] },
  schemaVersion: 1,
  createdAt: '2025-01-15T10:00:00.000Z',
});

const defaultProps = {
  personA: makeProfile('Alice'),
  personB: makeProfile('Bob', 'male'),
  onConfirm: vi.fn(),
  onBack: vi.fn(),
};

describe('RelationshipStatus', () => {
  it('renders both profile previews', () => {
    render(<RelationshipStatus {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('default status is new_match', () => {
    const onConfirm = vi.fn();
    render(<RelationshipStatus {...defaultProps} onConfirm={onConfirm} />);

    // Click continue with default
    fireEvent.click(screen.getByText('Continue to analysis'));
    expect(onConfirm).toHaveBeenCalledWith('new_match');
  });

  it('confirm calls onConfirm with selected status', () => {
    const onConfirm = vi.fn();
    render(<RelationshipStatus {...defaultProps} onConfirm={onConfirm} />);

    // Select existing couple
    fireEvent.click(screen.getByText('Already in a relationship'));
    fireEvent.click(screen.getByText('Continue to analysis'));
    expect(onConfirm).toHaveBeenCalledWith('existing_couple');
  });
});
