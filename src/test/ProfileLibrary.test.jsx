import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileLibrary from '../components/ProfileLibrary';

// Mock profileStore
vi.mock('../services/profileStore', () => {
  let store = [];
  let fictional = [];
  return {
    listProfiles: vi.fn(() => store),
    deleteProfile: vi.fn((id) => {
      store = store.filter((p) => p.id !== id);
      return true;
    }),
    saveProfile: vi.fn((p) => p),
    getProfile: vi.fn(),
    getFictionalProfiles: vi.fn(() => fictional),
    clearAll: vi.fn(),
    STORAGE_KEY: 'complement.profiles.v1',
    __setStore: (profiles) => {
      store = profiles;
    },
    __setFictional: (profiles) => {
      fictional = profiles;
    },
  };
});

import { deleteProfile, __setStore, __setFictional } from '../services/profileStore';

const makeProfile = (id, name) => ({
  id,
  name,
  gender: 'female',
  enabledModules: ['kokology'],
  moduleAnswers: { core: ['a', 'b', 'c'] },
  schemaVersion: 1,
  createdAt: '2025-01-15T10:00:00.000Z',
});

const makeFictionalProfile = (id, name) => ({
  id,
  name,
  gender: 'male',
  answers: ['ans1', 'ans2', 'ans3', 'ans4', 'ans5'],
  hasRelationshipHistory: false,
  schemaVersion: 2,
  createdAt: null,
  isFictional: true,
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
    __setFictional([]);
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

  // ---------- Tab / Fictional profile tests ----------

  it('renders My Profiles and Historical & Fictional tabs', () => {
    render(<ProfileLibrary {...defaultProps} />);
    expect(screen.getByRole('tab', { name: 'My Profiles' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Historical & Fictional/i })).toBeInTheDocument();
  });

  it('My Profiles tab is active by default', () => {
    render(<ProfileLibrary {...defaultProps} />);
    const myTab = screen.getByRole('tab', { name: 'My Profiles' });
    expect(myTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switching to Historical & Fictional tab shows fictional profiles', () => {
    __setFictional([
      makeFictionalProfile('f-1', 'Marcus Aurelius'),
      makeFictionalProfile('f-2', 'Cleopatra'),
    ]);
    render(<ProfileLibrary {...defaultProps} />);

    // Fictional profiles should not be visible on My Profiles tab
    expect(screen.queryByText('Marcus Aurelius')).not.toBeInTheDocument();

    // Click on the fictional tab
    fireEvent.click(screen.getByRole('tab', { name: /Historical & Fictional/i }));

    expect(screen.getByText('Marcus Aurelius')).toBeInTheDocument();
    expect(screen.getByText('Cleopatra')).toBeInTheDocument();
  });

  it('fictional profiles do not show a delete button', () => {
    __setFictional([makeFictionalProfile('f-1', 'Marcus Aurelius')]);
    render(<ProfileLibrary {...defaultProps} />);

    fireEvent.click(screen.getByRole('tab', { name: /Historical & Fictional/i }));

    expect(screen.getByText('Marcus Aurelius')).toBeInTheDocument();
    expect(screen.queryByTitle('Delete profile')).not.toBeInTheDocument();
  });

  it('Create new profile button is hidden on fictional tab', () => {
    __setFictional([makeFictionalProfile('f-1', 'Marcus Aurelius')]);
    render(<ProfileLibrary {...defaultProps} />);

    // Visible on My Profiles tab
    expect(screen.getByText('Create new profile')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Historical & Fictional/i }));

    // Hidden on fictional tab
    expect(screen.queryByText('Create new profile')).not.toBeInTheDocument();
  });

  it('can select a fictional profile for slot A or B', () => {
    const marcus = makeFictionalProfile('f-1', 'Marcus Aurelius');
    const cleo = makeFictionalProfile('f-2', 'Cleopatra');
    __setFictional([marcus, cleo]);
    render(<ProfileLibrary {...defaultProps} />);

    fireEvent.click(screen.getByRole('tab', { name: /Historical & Fictional/i }));

    fireEvent.click(screen.getByText('Marcus Aurelius'));
    expect(screen.getByText('A: Marcus Aurelius')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cleopatra'));
    expect(screen.getByText('B: Cleopatra')).toBeInTheDocument();
  });

  it('can mix a local profile in A and a fictional profile in B', () => {
    const onPairSelected = vi.fn();
    const alice = makeProfile('1', 'Alice');
    const marcus = makeFictionalProfile('f-1', 'Marcus Aurelius');
    __setStore([alice]);
    __setFictional([marcus]);

    render(<ProfileLibrary {...defaultProps} onPairSelected={onPairSelected} />);

    // Select Alice from My Profiles tab
    fireEvent.click(screen.getByText('Alice'));
    expect(screen.getByText('A: Alice')).toBeInTheDocument();

    // Switch to fictional tab and select Marcus
    fireEvent.click(screen.getByRole('tab', { name: /Historical & Fictional/i }));
    fireEvent.click(screen.getByText('Marcus Aurelius'));
    expect(screen.getByText('B: Marcus Aurelius')).toBeInTheDocument();

    // Continue should work
    fireEvent.click(screen.getByText('Continue'));
    expect(onPairSelected).toHaveBeenCalledWith({
      personA: alice,
      personB: marcus,
    });
  });

  it('shows empty fictional state when no fictional profiles exist', () => {
    __setFictional([]);
    render(<ProfileLibrary {...defaultProps} />);

    fireEvent.click(screen.getByRole('tab', { name: /Historical & Fictional/i }));

    expect(screen.getByText('No fictional profiles available.')).toBeInTheDocument();
    expect(screen.getByText('Run the generator script to populate them.')).toBeInTheDocument();
  });

  it('Continue button is visible when fictional profiles exist even if no local profiles', () => {
    __setStore([]);
    __setFictional([
      makeFictionalProfile('f-1', 'Marcus Aurelius'),
      makeFictionalProfile('f-2', 'Cleopatra'),
    ]);
    render(<ProfileLibrary {...defaultProps} />);

    // Should show Continue button because fictional profiles exist
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });
});
