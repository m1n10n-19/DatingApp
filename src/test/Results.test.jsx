import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Results from '../components/Results';

const mockResults = {
  personA: {
    archetype: 'The Reluctant Architect',
    coreWiring: 'Driven by a need to build systems that make sense.',
    shadowPattern: 'Uses competence to avoid vulnerability.',
    complementProfile: 'Needs someone who leads with feeling.',
    likelyMistake: 'Will choose someone equally avoidant.',
  },
  personB: {
    archetype: 'The Grounded Flame',
    coreWiring: 'Driven by connection and emotional truth.',
    shadowPattern: 'Stays too long in situations that hurt.',
    complementProfile: 'Needs someone with structural thinking.',
    likelyMistake: 'Will choose someone who mirrors her intensity.',
  },
  compatibility: {
    verdict: 'COMPLEMENT',
    score: 78,
    dynamic: 'Tuesday evening looks like parallel work in the same room.',
    breakingPoint: 'His emotional unavailability meets her need for depth.',
    bestCase: 'They build something real. He learns to feel; she learns to let go.',
    worstCase: 'He retreats into work. She spirals into resentment.',
    earlyWarnings: [
      'He cancels plans to work late more than twice in the first month.',
      'She starts explaining his feelings to him.',
      'Neither brings up the thing that bothered them last week.',
    ],
    closingLine: 'The architect and the flame — if he lets her in, she lights the whole structure.',
  },
};

const personA = { name: 'Alex', gender: 'male', answers: ['a', 'b', 'c'] };
const personB = { name: 'Sam', gender: 'female', answers: ['d', 'e', 'f'] };

describe('Results', () => {
  it('renders error state when error is provided', () => {
    render(
      <Results
        results={null}
        error="Something went wrong"
        personA={personA}
        personB={personB}
        onReset={() => {}}
      />
    );
    expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders nothing when results and error are both null', () => {
    const { container } = render(
      <Results
        results={null}
        error={null}
        personA={personA}
        personB={personB}
        onReset={() => {}}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders person names in header and tabs', () => {
    render(
      <Results
        results={mockResults}
        error={null}
        personA={personA}
        personB={personB}
        onReset={() => {}}
      />
    );
    // Names appear in both the header and the tab navigation
    const alexElements = screen.getAllByText('Alex');
    expect(alexElements.length).toBeGreaterThanOrEqual(2); // header + tab
    const samElements = screen.getAllByText('Sam');
    expect(samElements.length).toBeGreaterThanOrEqual(2); // header + tab
  });

  it('renders compatibility tab by default', () => {
    render(
      <Results
        results={mockResults}
        error={null}
        personA={personA}
        personB={personB}
        onReset={() => {}}
      />
    );
    expect(screen.getByText('Complement')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('renders the closing line', () => {
    render(
      <Results
        results={mockResults}
        error={null}
        personA={personA}
        personB={personB}
        onReset={() => {}}
      />
    );
    expect(screen.getByText(/the architect and the flame/i)).toBeInTheDocument();
  });

  it('renders early warning signs', () => {
    render(
      <Results
        results={mockResults}
        error={null}
        personA={personA}
        personB={personB}
        onReset={() => {}}
      />
    );
    expect(screen.getByText(/cancels plans to work late/i)).toBeInTheDocument();
  });

  it('switches to person A profile tab', () => {
    render(
      <Results
        results={mockResults}
        error={null}
        personA={personA}
        personB={personB}
        onReset={() => {}}
      />
    );
    // Click on Alex's tab
    const tabs = screen.getAllByRole('button');
    const alexTab = tabs.find((t) => t.textContent === 'Alex');
    fireEvent.click(alexTab);

    expect(screen.getByText('The Reluctant Architect')).toBeInTheDocument();
    expect(screen.getByText('Uses competence to avoid vulnerability.')).toBeInTheDocument();
  });

  it('calls onReset when Try Again is clicked on error', () => {
    const onReset = vi.fn();
    render(
      <Results
        results={null}
        error="Failed"
        personA={personA}
        personB={personB}
        onReset={onReset}
      />
    );
    fireEvent.click(screen.getByText('Try Again'));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('calls onReset when Start New Analysis is clicked', () => {
    const onReset = vi.fn();
    render(
      <Results
        results={mockResults}
        error={null}
        personA={personA}
        personB={personB}
        onReset={onReset}
      />
    );
    fireEvent.click(screen.getByText('Start New Analysis'));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
