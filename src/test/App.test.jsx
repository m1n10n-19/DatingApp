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

  it('handleRequestRepair sets loading, calls fetch, populates analysisData.repair on success', async () => {
    const mockRepairResult = {
      repair: {
        realBreak: 'The real break',
        emotionalCalibration: { personA: 'Cal A', personB: 'Cal B' },
        dailyPractice: 'Daily',
        cognitiveRepair: 'Cognitive',
        revisionPractice: 'Revision',
        equanimityPractice: 'Equanimity',
        shadowWork: 'Shadow',
        communicationRepair: 'Communication',
      },
    };

    global.fetch = vi.fn((url) => {
      if (url === '/api/models') {
        return Promise.resolve(modelsResponse);
      }
      if (url === '/api/analyze') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              personA: { archetype: 'Arch A' },
              personB: { archetype: 'Arch B' },
              compatibility: { verdict: 'COMPLEMENT', score: 80, earlyWarnings: [] },
            }),
        });
      }
      if (url === '/api/repair') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRepairResult),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await act(async () => {
      render(<App />);
    });

    // Quick Test to get to results
    await act(async () => {
      fireEvent.click(screen.getByText('Quick Test'));
    });

    await waitFor(() => {
      expect(screen.getByText('Start New Analysis')).toBeInTheDocument();
    });

    // Navigate to Repair tab
    await act(async () => {
      fireEvent.click(screen.getByText('Repair'));
    });

    // Click Generate Repair Plan
    await act(async () => {
      fireEvent.click(screen.getByText('Generate Repair Plan'));
    });

    // Verify /api/repair was called
    const repairCalls = global.fetch.mock.calls.filter(([url]) => url === '/api/repair');
    expect(repairCalls.length).toBe(1);
    const repairBody = JSON.parse(repairCalls[0][1].body);
    expect(repairBody.compatibility).toBeDefined();

    // Repair data should now be rendered
    await waitFor(() => {
      expect(screen.getByText('The real break')).toBeInTheDocument();
    });
  });

  it('handleRequestRepair sets repairError on fetch failure', async () => {
    global.fetch = vi.fn((url) => {
      if (url === '/api/models') {
        return Promise.resolve(modelsResponse);
      }
      if (url === '/api/analyze') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              personA: { archetype: 'Arch A' },
              personB: { archetype: 'Arch B' },
              compatibility: { verdict: 'COMPLEMENT', score: 80, earlyWarnings: [] },
            }),
        });
      }
      if (url === '/api/repair') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Repair failed on server' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Quick Test'));
    });

    await waitFor(() => {
      expect(screen.getByText('Start New Analysis')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Repair'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Generate Repair Plan'));
    });

    // Should display the error
    await waitFor(() => {
      expect(screen.getByText('Failed to generate repair guidance.')).toBeInTheDocument();
      expect(screen.getByText('Repair failed on server')).toBeInTheDocument();
    });
  });

  it('handleRequestSimulate calls /api/simulate and populates simulation data', async () => {
    const mockSimResult = {
      simulation: {
        year1: 'Year 1 projection',
        year3: 'Year 3 projection',
        year5: 'Year 5 projection',
        year7: 'Year 7 projection',
        year10: { bestCase: 'Best 10', worstCase: 'Worst 10' },
        oneIntervention: 'Do this one thing',
      },
    };

    global.fetch = vi.fn((url) => {
      if (url === '/api/models') {
        return Promise.resolve(modelsResponse);
      }
      if (url === '/api/analyze') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              personA: { archetype: 'Arch A' },
              personB: { archetype: 'Arch B' },
              compatibility: { verdict: 'COMPLEMENT', score: 80, earlyWarnings: [] },
            }),
        });
      }
      if (url === '/api/simulate') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSimResult),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    await act(async () => {
      render(<App />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Quick Test'));
    });

    await waitFor(() => {
      expect(screen.getByText('Start New Analysis')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Simulate'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Project Future'));
    });

    // Verify /api/simulate was called
    const simCalls = global.fetch.mock.calls.filter(([url]) => url === '/api/simulate');
    expect(simCalls.length).toBe(1);

    // Simulation data should now be rendered
    await waitFor(() => {
      expect(screen.getByText('Year 1 projection')).toBeInTheDocument();
      expect(screen.getByText('Best 10')).toBeInTheDocument();
      expect(screen.getByText('Worst 10')).toBeInTheDocument();
      expect(screen.getByText('Do this one thing')).toBeInTheDocument();
    });
  });
});
