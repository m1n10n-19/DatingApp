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
    closingLine: 'He builds walls so well he forgot to leave a door.',
  },
  personB: {
    archetype: 'The Grounded Flame',
    coreWiring: 'Driven by connection and emotional truth.',
    shadowPattern: 'Stays too long in situations that hurt.',
    loveTemplate: 'Love means being fully seen.',
    complementProfile: 'Needs someone with structural thinking.',
    likelyMistake: 'Will choose someone who mirrors her intensity.',
    growthEdge: 'Learning to step back without abandoning.',
    closingLine: 'She burns so bright she forgets others need shade.',
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

// New v2 repair schema with 12 fields
const mockRepair = {
  realBreak: 'The real break is not about time — it is about emotional access.',
  breakType: 'ATTACHMENT',
  primaryMethod: 'Structured vulnerability exchange — 10 minutes, no fixing, just witnessing.',
  whyThisMethod: 'His avoidance and her over-processing both dissolve when forced to simply witness.',
  practiceInstructions: 'Sit facing each other. Set a timer for 5 minutes each. Speaker shares one unspoken thing. Listener holds eye contact and says only "I hear you" at the end.',
  measurableIndicators: 'Within 3 weeks, one of them will voluntarily share without being prompted.',
  timeframe: '6-8 weeks for visible behavioral shift.',
  secondaryMethod: 'Somatic co-regulation — synchronized breathing before difficult conversations.',
  secondaryPractice: 'Before any hard conversation, sit side by side and breathe together for 2 minutes. No words.',
  warningSign: 'He starts working late again without mentioning it, or she begins narrating his feelings for him.',
  repairIsImpossibleIf: 'Either person uses vulnerability shared in practice as ammunition during conflict.',
  closingLine: 'The repair is not about fixing — it is about letting the crack stay open long enough to see through it.',
};

// New v2 simulation schema with structured years and oneIntervention
const mockSimulation = {
  year1: {
    examined: 'They learn each other\'s language. He practices staying. She practices letting silence exist.',
    unexamined: 'Honeymoon intensity masks the avoidance-pursuit cycle already forming beneath.',
  },
  year3: {
    examined: 'A crisis around shared goals becomes a breakthrough when both name what they actually need.',
    unexamined: 'Resentment accumulates. She over-functions emotionally; he under-functions.',
  },
  year5: {
    examined: 'Deeper commitment. They\'ve built repair rituals that hold them through difficulty.',
    unexamined: 'Parallel lives. They share logistics but not interiority.',
  },
  year7: {
    examined: 'Renewal. The relationship has a quality of chosen-ness that comes from surviving real difficulty.',
    unexamined: 'The itch. One or both begin looking outside the relationship for what they never built inside it.',
  },
  year10: {
    bestCase: 'A partnership that is both safe and alive.',
    worstCase: 'Two people sharing a house but not a life.',
  },
  oneIntervention: {
    when: 'The first time he cancels plans to work late without telling her why.',
    what: 'She says "I notice you\'re pulling away and I want to understand" instead of explaining his feelings to him.',
    why: 'This single moment breaks the avoidance-pursuit cycle before it calcifies into identity.',
  },
  closingLine: 'Ten years is not a prediction — it is a map of which version of themselves they choose to feed.',
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

  it('renders closingLine on ProfileCard when present', () => {
    render(<Results {...defaultProps} />);
    expect(screen.getByText('He builds walls so well he forgot to leave a door.')).toBeInTheDocument();
    expect(screen.getByText('She burns so bright she forgets others need shade.')).toBeInTheDocument();
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

  it('Repair tab renders all 12 v2 fields when populated', () => {
    const resultsWithRepair = {
      ...mockResults,
      repair: mockRepair,
    };
    render(<Results {...defaultProps} results={resultsWithRepair} />);
    fireEvent.click(screen.getByText('Repair'));

    // realBreak
    expect(screen.getByText(mockRepair.realBreak)).toBeInTheDocument();
    // breakType badge
    expect(screen.getByText('ATTACHMENT')).toBeInTheDocument();
    // primaryMethod
    expect(screen.getByText(mockRepair.primaryMethod)).toBeInTheDocument();
    // whyThisMethod
    expect(screen.getByText(mockRepair.whyThisMethod)).toBeInTheDocument();
    // practiceInstructions
    expect(screen.getByText(mockRepair.practiceInstructions)).toBeInTheDocument();
    // measurableIndicators
    expect(screen.getByText(mockRepair.measurableIndicators)).toBeInTheDocument();
    // timeframe
    expect(screen.getByText(mockRepair.timeframe)).toBeInTheDocument();
    // secondaryMethod
    expect(screen.getByText(mockRepair.secondaryMethod)).toBeInTheDocument();
    // secondaryPractice
    expect(screen.getByText(mockRepair.secondaryPractice)).toBeInTheDocument();
    // warningSign
    expect(screen.getByText(mockRepair.warningSign)).toBeInTheDocument();
    // repairIsImpossibleIf
    expect(screen.getByText(mockRepair.repairIsImpossibleIf)).toBeInTheDocument();
    // closingLine
    expect(screen.getByText(mockRepair.closingLine)).toBeInTheDocument();
  });

  it('Repair tab renders section headings for new layout', () => {
    const resultsWithRepair = {
      ...mockResults,
      repair: mockRepair,
    };
    render(<Results {...defaultProps} results={resultsWithRepair} />);
    fireEvent.click(screen.getByText('Repair'));

    expect(screen.getByText('The Real Break')).toBeInTheDocument();
    expect(screen.getByText('Primary Method')).toBeInTheDocument();
    expect(screen.getByText('Why This Method')).toBeInTheDocument();
    expect(screen.getByText('Practice Instructions')).toBeInTheDocument();
    expect(screen.getByText('Measurable Indicators')).toBeInTheDocument();
    expect(screen.getByText('Timeframe')).toBeInTheDocument();
    expect(screen.getByText('Secondary Method')).toBeInTheDocument();
    expect(screen.getByText('Warning Sign')).toBeInTheDocument();
    expect(screen.getByText('Repair Is Impossible If')).toBeInTheDocument();
  });

  it('Repair tab renders break type badge with correct type', () => {
    const resultsWithRepair = {
      ...mockResults,
      repair: { ...mockRepair, breakType: 'TRUST' },
    };
    render(<Results {...defaultProps} results={resultsWithRepair} />);
    fireEvent.click(screen.getByText('Repair'));
    expect(screen.getByText('TRUST')).toBeInTheDocument();
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

  it('Simulate tab shows loading state', () => {
    render(<Results {...defaultProps} simulateLoading={true} />);
    fireEvent.click(screen.getByText('Simulate'));
    expect(screen.getByText('Projecting future...')).toBeInTheDocument();
  });

  it('Simulate tab renders structured year data with Examined/Unexamined paths', () => {
    const resultsWithSim = {
      ...mockResults,
      simulation: mockSimulation,
    };
    render(<Results {...defaultProps} results={resultsWithSim} />);
    fireEvent.click(screen.getByText('Simulate'));

    // Check dual-path headings exist for year sections
    const examinedHeadings = screen.getAllByText('Examined');
    expect(examinedHeadings.length).toBe(4); // years 1, 3, 5, 7
    const unexaminedHeadings = screen.getAllByText('Unexamined');
    expect(unexaminedHeadings.length).toBe(4);

    // Check year labels
    expect(screen.getByText('Year 1')).toBeInTheDocument();
    expect(screen.getByText('Year 3')).toBeInTheDocument();
    expect(screen.getByText('Year 5')).toBeInTheDocument();
    expect(screen.getByText('Year 7')).toBeInTheDocument();

    // Check actual content from structured years
    expect(screen.getByText(mockSimulation.year1.examined)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year1.unexamined)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year3.examined)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year3.unexamined)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year5.examined)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year5.unexamined)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year7.examined)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year7.unexamined)).toBeInTheDocument();
  });

  it('Simulate tab renders year10 bestCase/worstCase', () => {
    const resultsWithSim = {
      ...mockResults,
      simulation: mockSimulation,
    };
    render(<Results {...defaultProps} results={resultsWithSim} />);
    fireEvent.click(screen.getByText('Simulate'));

    expect(screen.getByText('Year 10')).toBeInTheDocument();
    expect(screen.getByText('Best Case')).toBeInTheDocument();
    expect(screen.getByText('Worst Case')).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year10.bestCase)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.year10.worstCase)).toBeInTheDocument();
  });

  it('Simulate tab renders structured oneIntervention with when/what/why', () => {
    const resultsWithSim = {
      ...mockResults,
      simulation: mockSimulation,
    };
    render(<Results {...defaultProps} results={resultsWithSim} />);
    fireEvent.click(screen.getByText('Simulate'));

    expect(screen.getByText('If You Only Do One Thing')).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.oneIntervention.when)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.oneIntervention.what)).toBeInTheDocument();
    expect(screen.getByText(mockSimulation.oneIntervention.why)).toBeInTheDocument();
  });

  it('Simulate tab renders closingLine', () => {
    const resultsWithSim = {
      ...mockResults,
      simulation: mockSimulation,
    };
    render(<Results {...defaultProps} results={resultsWithSim} />);
    fireEvent.click(screen.getByText('Simulate'));

    expect(screen.getByText(mockSimulation.closingLine)).toBeInTheDocument();
  });

  it('Simulate tab handles legacy string format for oneIntervention', () => {
    const legacySimulation = {
      ...mockSimulation,
      oneIntervention: 'Schedule one uninterrupted hour each week to talk about feelings.',
    };
    const resultsWithSim = {
      ...mockResults,
      simulation: legacySimulation,
    };
    render(<Results {...defaultProps} results={resultsWithSim} />);
    fireEvent.click(screen.getByText('Simulate'));

    expect(screen.getByText('Schedule one uninterrupted hour each week to talk about feelings.')).toBeInTheDocument();
  });

  it('Simulate tab handles legacy string format for year data', () => {
    const legacySimulation = {
      year1: 'Honeymoon phase with tension.',
      year3: 'Crisis point.',
      year5: 'Commitment or drift.',
      year7: 'Restlessness or renewal.',
      year10: {
        bestCase: 'Safe and alive.',
        worstCase: 'House but not life.',
      },
      oneIntervention: 'Talk about feelings.',
    };
    const resultsWithSim = {
      ...mockResults,
      simulation: legacySimulation,
    };
    render(<Results {...defaultProps} results={resultsWithSim} />);
    fireEvent.click(screen.getByText('Simulate'));

    expect(screen.getByText('Honeymoon phase with tension.')).toBeInTheDocument();
    expect(screen.getByText('Crisis point.')).toBeInTheDocument();
    expect(screen.getByText('Commitment or drift.')).toBeInTheDocument();
    expect(screen.getByText('Restlessness or renewal.')).toBeInTheDocument();
  });
});
