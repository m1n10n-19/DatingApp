import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileLibrary from '../components/ProfileLibrary';

// Mock profileStore
vi.mock('../services/profileStore', () => {
  let store = [];
  return {
    listProfiles: vi.fn(() => store),
    deleteProfile: vi.fn((id) => {
      store = store.filter((p) => p.id !== id);
      return true;
    }),
    saveProfile: vi.fn((p) => p),
    getProfile: vi.fn(),
    clearAll: vi.fn(),
    STORAGE_KEY: 'complement.profiles.v1',
    __setStore: (profiles) => {
      store = profiles;
    },
  };
});

import { deleteProfile, __setStore } from '../services/profileStore';

const makeProfile = (id, name) => ({
  id,
  name,
  gender: 'female',
  enabledModules: ['kokology'],
  moduleAnswers: { core: ['a', 'b', 'c'] },
  schemaVersion: 1,
  createdAt: '2025-01-15T10:00:00.000Z',
});

const defaultProps = {
  onCreateNew: vi.fn(),
  onPairSelected: vi.fn(),
  onBack: vi.fn(),
};

describe('ProfileLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setStore([]);
  });

  it('empty state shows Create CTA', () => {
    render(<ProfileLibrary {...defaultProps} />);
    expect(screen.getByText('No saved profiles yet.')).toBeInTheDocument();
    expect(screen.getByText('Create new profile')).toBeInTheDocument();
  });

  it('lists saved profiles via listProfiles', () => {
    __setStore([makeProfile('1', 'Alice'), makeProfile('2', 'Bob')]);
    render(<ProfileLibrary {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('selecting A and B enables Continue', () => {
    __setStore([makeProfile('1', 'Alice'), makeProfile('2', 'Bob')]);
    render(<ProfileLibrary {...defaultProps} />);

    // Continue should be disabled initially
    const continueBtn = screen.getByText('Continue');
    expect(continueBtn).toBeDisabled();

    // Select Alice (becomes A)
    fireEvent.click(screen.getByText('Alice'));
    expect(screen.getByText('A: Alice')).toBeInTheDocument();

    // Select Bob (becomes B)
    fireEvent.click(screen.getByText('Bob'));
    expect(screen.getByText('B: Bob')).toBeInTheDocument();

    expect(continueBtn).not.toBeDisabled();
  });

  it('Continue calls onPairSelected with both', () => {
    const onPairSelected = vi.fn();
    const alice = makeProfile('1', 'Alice');
    const bob = makeProfile('2', 'Bob');
    __setStore([alice, bob]);
    render(<ProfileLibrary {...defaultProps} onPairSelected={onPairSelected} />);

    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByText('Bob'));
    fireEvent.click(screen.getByText('Continue'));

    expect(onPairSelected).toHaveBeenCalledWith({
      personA: alice,
      personB: bob,
    });
  });

  it('delete confirms then removes from library', () => {
    const alice = makeProfile('1', 'Alice');
    __setStore([alice]);
    window.confirm = vi.fn(() => true);

    render(<ProfileLibrary {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Click the delete button (trash icon)
    const deleteBtn = screen.getByTitle('Delete profile');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalledWith('Delete profile "Alice"?');
    expect(deleteProfile).toHaveBeenCalledWith('1');
  });
});
