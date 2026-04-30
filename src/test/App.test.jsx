import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';

// Mock profileStore
vi.mock('../services/profileStore', () => {
  let store = [];
  return {
    listProfiles: vi.fn(() => store),
    saveProfile: vi.fn((p) => {
      store = [...store, p];
      return p;
    }),
    deleteProfile: vi.fn((id) => {
      store = store.filter((p) => p.id !== id);
      return true;
    }),
    getProfile: vi.fn(),
    clearAll: vi.fn(),
    STORAGE_KEY: 'complement.profiles.v1',
    __setStore: (profiles) => {
      store = profiles;
    },
  };
});

import { __setStore } from '../services/profileStore';

// Models response for ModelSelector (returns array of provider objects)
const modelsResponse = {
  ok: true,
  json: () =>
    Promise.resolve([
      {
        id: 'groq',
        name: 'Groq',
        available: true,
        models: [{ id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' }],
      },
    ]),
};

const originalFetch = global.fetch;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setStore([]);
    // Default fetch mock that handles ModelSelector's /api/models call
    global.fetch = vi.fn((url) => {
      if (url === '/api/models') {
        return Promise.resolve(modelsResponse);
      }
      // Default for any other calls - return a pending promise
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders the landing page initially', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('Complement')).toBeInTheDocument();
    expect(screen.getByText('Begin Analysis')).toBeInTheDocument();
    expect(screen.getByText('My Profiles')).toBeInTheDocument();
  });

  it('navigates to Truth Preamble when Begin Analysis is clicked', async () => {
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Begin Analysis'));
    });
    expect(screen.getByText('Before we begin')).toBeInTheDocument();
    expect(screen.getByText('I understand, continue')).toBeInTheDocument();
  });

  it('navigates back to landing from Truth Preamble', async () => {
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Begin Analysis'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Back'));
    });
    expect(screen.getByText('Complement')).toBeInTheDocument();
  });

  it('My Profiles button opens Library view', async () => {
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('My Profiles'));
    });
    expect(screen.getByText('No saved profiles yet.')).toBeInTheDocument();
  });

  it('fresh flow goes through Truth → Questionnaire for A', async () => {
    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Begin Analysis'));
    });

    // Truth preamble
    expect(screen.getByText('Before we begin')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText('I understand, continue'));
    });

    // Questionnaire for Person A
    expect(screen.getByText("Let's start with the basics.")).toBeInTheDocument();
    // "Person A" appears in both header and body
    expect(screen.getAllByText('Person A').length).toBeGreaterThanOrEqual(1);
  });

  it('sample flow uses default new_match status and goes to analyzing', async () => {
    global.fetch = vi.fn((url) => {
      if (url === '/api/models') {
        return Promise.resolve(modelsResponse);
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            personA: { archetype: 'Test A' },
            personB: { archetype: 'Test B' },
            compatibility: { verdict: 'COMPLEMENT', score: 80 },
          }),
      });
    });

    await act(async () => {
      render(<App />);
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Quick Test'));
    });

    // Verify fetch was called with new_match
    const analyzeCalls = global.fetch.mock.calls.filter(([url]) => url === '/api/analyze');
    expect(analyzeCalls.length).toBe(1);
    const body = JSON.parse(analyzeCalls[0][1].body);
    expect(body.relationshipStatus).toBe('new_match');
  });

  it('status→analyzing happens before fetch resolves', async () => {
    let resolveAnalyze;
    global.fetch = vi.fn((url) => {
      if (url === '/api/models') {
        return Promise.resolve(modelsResponse);
      }
      return new Promise((resolve) => {
        resolveAnalyze = resolve;
      });
    });

    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Quick Test'));
    });

    // While fetch is pending, we should see the Analyzing screen with names
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Maya')).toBeInTheDocument();

    // Now resolve
    await act(async () => {
      resolveAnalyze({
        ok: true,
        json: () =>
          Promise.resolve({
            personA: { archetype: 'Test A' },
            personB: { archetype: 'Test B' },
            compatibility: { verdict: 'COMPLEMENT', score: 80 },
          }),
      });
    });

    // Should transition to results
    await waitFor(() => {
      expect(screen.getByText('Start New Analysis')).toBeInTheDocument();
    });
  });
});
