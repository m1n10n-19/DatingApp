import { describe, it, expect } from 'vitest';
import { getActionButtonClasses, getTabButtonClasses } from '../utils/styles';

describe('getActionButtonClasses', () => {
  it('returns active gradient classes when enabled', () => {
    const classes = getActionButtonClasses(true);
    expect(classes).toContain('bg-gradient-to-r');
    expect(classes).toContain('from-accent/20');
    expect(classes).toContain('to-rose/20');
    expect(classes).toContain('border-accent/30');
    expect(classes).not.toContain('cursor-not-allowed');
  });

  it('returns disabled surface classes when not enabled', () => {
    const classes = getActionButtonClasses(false);
    expect(classes).toContain('bg-surface');
    expect(classes).toContain('cursor-not-allowed');
    expect(classes).toContain('text-text-faint');
    expect(classes).not.toContain('bg-gradient-to-r');
  });

  it('always includes base layout classes', () => {
    for (const enabled of [true, false]) {
      const classes = getActionButtonClasses(enabled);
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('transition-all');
    }
  });
});

describe('getTabButtonClasses', () => {
  it('returns active classes when active', () => {
    const classes = getTabButtonClasses(true);
    expect(classes).toContain('bg-gradient-to-r');
    expect(classes).toContain('from-accent/20');
    expect(classes).toContain('border-accent/30');
  });

  it('returns inactive classes when not active', () => {
    const classes = getTabButtonClasses(false);
    expect(classes).toContain('bg-surface/40');
    expect(classes).toContain('text-text-dim');
    expect(classes).toContain('hover:text-text');
    expect(classes).not.toContain('bg-gradient-to-r');
  });

  it('always includes base classes', () => {
    for (const active of [true, false]) {
      const classes = getTabButtonClasses(active);
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('text-sm');
      expect(classes).toContain('font-medium');
    }
  });
});
