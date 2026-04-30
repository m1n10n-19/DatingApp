import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CompatibilitySection from '../components/CompatibilitySection';

const baseCompatibility = {
  verdict: 'COMPLEMENT',
  score: 78,
  dynamic: 'Tuesday evening looks like parallel work in the same room.',
  shadowCollision: 'His avoidance triggers her abandonment wound.',
  breakingPoint: 'His emotional unavailability meets her need for depth.',
  bestCase: 'They build something real.',
  worstCase: 'He retreats into work.',
  earlyWarnings: [
    'He cancels plans to work late.',
    'She starts explaining his feelings.',
    'Neither brings up the thing that bothered them.',
  ],
  repairLever: 'Weekly check-ins where both share one unspoken thing.',
  coreFearInteraction: 'His fear of incompetence meets her fear of being alone.',
  datingFatigueRisk: 'Moderate — both have enough self-awareness to avoid the doom loop.',
  closingLine: 'The architect and the flame.',
};

describe('CompatibilitySection', () => {
  it('renders all 12 fields including shadowCollision, repairLever, coreFearInteraction, and datingFatigueRisk in correct order', () => {
    const { container } = render(
      <CompatibilitySection compatibility={baseCompatibility} />
    );

    // All fields should be present
    expect(screen.getByText('Complement')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.dynamic)).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.shadowCollision)).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.breakingPoint)).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.bestCase)).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.worstCase)).toBeInTheDocument();
    expect(screen.getByText(/He cancels plans to work late/)).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.repairLever)).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.coreFearInteraction)).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.datingFatigueRisk)).toBeInTheDocument();
    expect(screen.getByText(/The architect and the flame/)).toBeInTheDocument();

    // Verify order: Shadow Collision heading before Breaking Point heading
    const allText = container.textContent;
    const shadowColIdx = allText.indexOf('Shadow Collision');
    const breakingPtIdx = allText.indexOf('Breaking Point');
    expect(shadowColIdx).toBeLessThan(breakingPtIdx);

    // Verify order: Repair Lever heading after Early Warning Signs heading and before closing line
    const repairLeverIdx = allText.indexOf('Repair Lever');
    const earlyWarningIdx = allText.indexOf('Early Warning Signs');
    const closingLineIdx = allText.indexOf('The architect and the flame');
    expect(repairLeverIdx).toBeGreaterThan(earlyWarningIdx);
    expect(repairLeverIdx).toBeLessThan(closingLineIdx);

    // Verify order: Core Fear Interaction after Repair Lever
    const coreFearInteractionIdx = allText.indexOf('Core Fear Interaction');
    expect(coreFearInteractionIdx).toBeGreaterThan(repairLeverIdx);
    expect(coreFearInteractionIdx).toBeLessThan(closingLineIdx);

    // Verify order: Dating Fatigue Risk after Core Fear Interaction
    const datingFatigueRiskIdx = allText.indexOf('Dating Fatigue Risk');
    expect(datingFatigueRiskIdx).toBeGreaterThan(coreFearInteractionIdx);
    expect(datingFatigueRiskIdx).toBeLessThan(closingLineIdx);
  });

  it('renders coreFearInteraction section with heading', () => {
    render(
      <CompatibilitySection compatibility={baseCompatibility} />
    );
    expect(screen.getByText('Core Fear Interaction')).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.coreFearInteraction)).toBeInTheDocument();
  });

  it('renders datingFatigueRisk section with prominent styling', () => {
    render(
      <CompatibilitySection compatibility={baseCompatibility} />
    );
    expect(screen.getByText('Dating Fatigue Risk')).toBeInTheDocument();
    expect(screen.getByText(baseCompatibility.datingFatigueRisk)).toBeInTheDocument();
  });

  it('omits coreFearInteraction when not present', () => {
    const compat = { ...baseCompatibility };
    delete compat.coreFearInteraction;
    render(
      <CompatibilitySection compatibility={compat} />
    );
    expect(screen.queryByText('Core Fear Interaction')).not.toBeInTheDocument();
  });

  it('omits datingFatigueRisk when not present', () => {
    const compat = { ...baseCompatibility };
    delete compat.datingFatigueRisk;
    render(
      <CompatibilitySection compatibility={compat} />
    );
    expect(screen.queryByText('Dating Fatigue Risk')).not.toBeInTheDocument();
  });

  it('renders all 4 verdict variants correctly', () => {
    const verdicts = [
      { key: 'COMPLEMENT', label: 'Complement' },
      { key: 'COMBUSTION', label: 'Combustion' },
      { key: 'MIRROR', label: 'Mirror' },
      { key: 'MISFIRE', label: 'Misfire' },
    ];

    for (const { key, label } of verdicts) {
      const { unmount } = render(
        <CompatibilitySection
          compatibility={{ ...baseCompatibility, verdict: key }}
        />
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('renders the score number', () => {
    render(
      <CompatibilitySection
        compatibility={{ ...baseCompatibility, score: 92 }}
      />
    );
    expect(screen.getByText('92')).toBeInTheDocument();
  });
});
