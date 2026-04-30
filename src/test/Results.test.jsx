import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Results from '../components/Results';

const mockResults = {
  personA: {
    archetype: 'The Reluctant Architect',
    coreWiring: 'Driven by a need to build systems that make sense.',
    shadowPattern: 'Uses competence to avoid vulnerability.',
    loveTemplate: 'Love means building something together.',
    complementProfile: 'Needs someone who leads with feeling.',
    likelyMistake: 'Will choose someone equally avoidant.',
    growthEdge: 'Learning to be present without a plan.',
  },
  personB: {
    archetype: 'The Grounded Flame',
    coreWiring: 'Driven by connection and emotional truth.',
    shadowPattern: 'Stays too long in situations that hurt.',
    loveTemplate: 'Love means being fully seen.',
    complementProfile: 'Needs someone with structural thinking.',
    likelyMistake: 'Will choose someone who mirrors her intensity.',
    growthEdge: 'Learning to step back without abandoning.',
  },
  compatibility: {
    verdict: 'COMPLEMENT',
    score: 78,
    dynamic: 'Tuesday evening looks like parallel work in the same room.',
    shadowCollision: 'His avoidance triggers her abandonment wound.',
    breakingPoint: 'His emotional unavailability meets her need for depth.',
    bestCase: 'They build something real. He learns to feel; she learns to let go.',
    worstCase: 'He retreats into work. She spirals into resentment.',
    earlyWarnings: [
      'He cancels plans to work late more than twice in the first month.',
      'She starts explaining his feelings to him.',
      'Neither brings up the thing that bothered them last week.',
    ],
    repairLever: 'Weekly check-ins where both share one unspoken thing.',
    closingLine: 'The architect and the flame — if he lets her in, she lights the whole structure.',
  },
  repair: null,
  simulation: null,
};

const mockRepair = {
  realBreak: 'The real break is not about time — it is about emotional access.',
  emotionalCalibration: {
    personA: 'Alex needs to practice staying in discomfort for 30 seconds longer.',
    personB: 'Sam needs to let silence exist without filling it.',
  },
  dailyPractice: 'One question each morning: what am I avoiding right now?',
  cognitiveRepair: 'Notice when you label your partner instead of describing behavior.',
  revisionPractice: 'Before bed, revise one moment from the day as you wish it had gone.',
  equanimityPractice: 'Sit with the feeling of not knowing where this is going.',
  shadowWork: 'Write a letter from the part of you that wants to run.',
  communicationRepair: 'Replace "you always" with "I noticed" for one week.',
};

const mockSimulation = {
  year1: 'Honeymoon phase with increasing tension around emotional availability.',
  year3: 'A crisis point around shared goals and unspoken needs.',
  year5: 'Either deeper commitment or slow drift into parallel lives.',
  year7: 'The itch — restlessness or renewal, depending on earlier work.',
  year10: {
    bestCase: 'A partnership that is both safe and alive.',
    worstCase: 'Two people sharing a house but not a life.',
  },
  oneIntervention: 'Schedule one uninterrupted hour each week to talk about feelings, not logistics.',
};

const personA = { name: 'Alex', gender: 'male' };
const personB = { name: 'Sam', gender: 'female' };

const defaultProps = {
  results: mockResults,
  error: null,
  personA,
  personB,
  onReset: () => {},
  repairLoading: false,
  repairError: null,
  simulateLoading: false,
  simulateError: null,
  onRequestRepair: () => {},
  onRequestSimulate: () => {},
};

describe('Results', () => {
  // --- Existing tests adapted for new tab structure ---

  it('renders error state when error is provided', () => {
    render(<Results {...defaultProps} results={null} error="Something went wrong" />);
    expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders nothing when results and error are both null', () => {
    const { container } = render(<Results {...defaultProps} results={null} error={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders person names in header', () => {
    render(<Results {...defaultProps} />);
    // Names appear in both the header and the profiles tab headings
    const alexElements = screen.getAllByText('Alex');
    expect(alexElements.length).toBeGreaterThanOrEqual(1);
    const samElements = screen.getAllByText('Sam');
    expect(samElements.length).toBeGreaterThanOrEqual(1);
  });

  it('defaults to Profiles tab', () => {
    render(<Results {...defaultProps} />);
    // Profiles tab is active by default — should show both archetypes
    expect(screen.getByText('The Reluctant Architect')).toBeInTheDocument();
    expect(screen.getByText('The Grounded Flame')).toBeInTheDocument();
  });

  it('renders all 7 ProfileOutput fields on Profiles tab', () => {
    render(<Results {...defaultProps} />);
    expect(screen.getByText('The Reluctant Architect')).toBeInTheDocument();
    expect(screen.getByText('Driven by a need to build systems that make sense.')).toBeInTheDocument();
    expect(screen.getByText('Uses competence to avoid vulnerability.')).toBeInTheDocument();
    expect(screen.getByText('Love means building something together.')).toBeInTheDocument();
    expect(screen.getByText('Needs someone who leads with feeling.')).toBeInTheDocument();
    expect(screen.getByText('Will choose someone equally avoidant.')).toBeInTheDocument();
    expect(screen.getByText('Learning to be present without a plan.')).toBeInTheDocument();
  });

  it('switches to Compatibility tab and renders compatibility data', () => {
    render(<Results {...defaultProps} />);
    fireEvent.click(screen.getByText('Compatibility'));
    expect(screen.getByText('Complement')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText(/the architect and the flame/i)).toBeInTheDocument();
  });

  it('renders early warning signs on Compatibility tab', () => {
    render(<Results {...defaultProps} />);
    fireEvent.click(screen.getByText('Compatibility'));
    expect(screen.getByText(/cancels plans to work late/i)).toBeInTheDocument();
  });

  it('calls onReset when Try Again is clicked on error', () => {
    const onReset = vi.fn();
    render(<Results {...defaultProps} results={null} error="Failed" onReset={onReset} />);
    fireEvent.click(screen.getByText('Try Again'));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('calls onReset when Start New Analysis is clicked', () => {
    const onReset = vi.fn();
    render(<Results {...defaultProps} onReset={onReset} />);
    fireEvent.click(screen.getByText('Start New Analysis'));
    expect(onReset).toHaveBeenCalledOnce();
  });

  // --- New tests for tab navigation ---

  it('tab navigation works between all 4 tabs', () => {
    render(<Results {...defaultProps} />);

    // Default: Profiles
    expect(screen.getByText('The Reluctant Architect')).toBeInTheDocument();

    // Switch to Compatibility
    fireEvent.click(screen.getByText('Compatibility'));
    expect(screen.getByText('Complement')).toBeInTheDocument();

    // Switch to Repair
    fireEvent.click(screen.getByText('Repair'));
    expect(screen.getByText('Generate Repair Plan')).toBeInTheDocument();

    // Switch to Simulate
    fireEvent.click(screen.getByText('Simulate'));
    expect(screen.getByText('Project Future')).toBeInTheDocument();

    // Switch back to Profiles
    fireEvent.click(screen.getByText('Profiles'));
    expect(screen.getByText('The Reluctant Architect')).toBeInTheDocument();
  });

  // --- Repair tab tests ---

  it('Repair tab shows generate button when repair=null and not loading', () => {
    render(<Results {...defaultProps} />);
    fireEvent.click(screen.getByText('Repair'));
    expect(screen.getByText('Generate Repair Plan')).toBeInTheDocument();
    expect(screen.getByText(/Generate personalized repair strategies/)).toBeInTheDocument();
  });

  it('clicking Generate Repair Plan calls onRequestRepair', () => {
    const onRequestRepair = vi.fn();
    render(<Results {...defaultProps} onRequestRepair={onRequestRepair} />);
    fireEvent.click(screen.getByText('Repair'));
    fireEvent.click(screen.getByText('Generate Repair Plan'));
    expect(onRequestRepair).toHaveBeenCalledOnce();
  });

  it('Repair tab shows loading spinner when repairLoading=true', () => {
    render(<Results {...defaultProps} repairLoading={true} />);
    fireEvent.click(screen.getByText('Repair'));
    expect(screen.getByText('Generating repair guidance...')).toBeInTheDocument();
  });

  it('Repair tab shows error + retry when repairError is set', () => {
    const onRequestRepair = vi.fn();
    render(
      <Results
        {...defaultProps}
        repairError="Server error"
        onRequestRepair={onRequestRepair}
      />
    );
    fireEvent.click(screen.getByText('Repair'));
    expect(screen.getByText('Failed to generate repair guidance.')).toBeInTheDocument();
    expect(screen.getByText('Server error')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRequestRepair).toHaveBeenCalledOnce();
  });

  it('Repair tab renders all 8 fields when populated, including emotionalCalibration with names', () => {
    const resultsWithRepair = {
      ...mockResults,
      repair: mockRepair,
    };
    render(<Results {...defaultProps} results={resultsWithRepair} />);
    fireEvent.click(screen.getByText('Repair'));

    // All 8 fields
    expect(screen.getByText(mockRepair.realBreak)).toBeInTheDocument();
    expect(screen.getByText(mockRepair.dailyPractice)).toBeInTheDocument();
    expect(screen.getByText(mockRepair.cognitiveRepair)).toBeInTheDocument();
    expect(screen.getByText(mockRepair.revisionPractice)).toBeInTheDocument();
    expect(screen.getByText(mockRepair.equanimityPractice)).toBeInTheDocument();
    expect(screen.getByText(mockRepair.shadowWork)).toBeInTheDocument();
    expect(screen.getByText(mockRepair.communicationRepair)).toBeInTheDocument();

    // Emotional calibration with actual names
    expect(screen.getByText(mockRepair.emotionalCalibration.personA)).toBeInTheDocument();
    expect(screen.getByText(mockRepair.emotionalCalibration.personB)).toBeInTheDocument();

    // The headings should contain the person names inside the emotional calibration section
    // personA name (Alex) and personB name (Sam) should appear as sub-headings
    const alexHeadings = screen.getAllByText('Alex');
    const samHeadings = screen.getAllByText('Sam');
    expect(alexHeadings.length).toBeGreaterThanOrEqual(2); // header + emotional calibration
    expect(samHeadings.length).toBeGreaterThanOrEqual(2);
  });

  // --- Simulate tab tests ---

  it('Simulate tab shows generate button when simulation=null and not loading', () => {
    render(<Results {...defaultProps} />);
    fireEvent.click(screen.getByText('Simulate'));
    expect(screen.getByText('Project Future')).toBeInTheDocument();
    expect(screen.getByText(/Project the relationship trajectory/)).toBeInTheDocument();
  });

  it('clicking Project Future calls onRequestSimulate', () => {
    const onRequestSimulate = vi.fn();
    render(<Results {...defaultProps} onRequestSimulate={onRequestSimulate} />);
    fireEvent.click(screen.getByText('Simulate'));
    fireEvent.click(screen.getByText('Project Future'));
    expect(onRequestSimulate).toHaveBeenCalledOnce();
  });

  it('Simulate tab shows loading + populated state with year10 sub-sections', () => {
    // First test loading state
    const { unmount } = render(<Results {...defaultProps} simulateLoading={true} />);
    fireEvent.click(screen.getByText('Simulate'));
    expect(screen.getByText('Projecting future...')).toBeInTheDocument();
    unmount();

    // Then test populated state
    const resultsWithSim = {
      ...mockResults,
      simulation: mockSimulation,
    };
    render(<Results {...defaultProps} results={resultsWithSim} />);
    fireEvent.click(screen.getByText('Simulate'));

    expect(screen.getByText(mockSimulation.year1)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year3)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year5)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year7)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year10.bestCase)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year10.worstCase)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.oneIntervention)).toBeInTheDocument();
  });
});
