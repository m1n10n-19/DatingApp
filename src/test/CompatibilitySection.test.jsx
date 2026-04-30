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
  closingLine: 'The architect and the flame.',
};

describe('CompatibilitySection', () => {
  it('renders all 10 fields including shadowCollision and repairLever in correct order', () => {
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
