/**
 * Returns Tailwind classes for an action button that toggles between
 * an active gradient state and a disabled surface state.
 */
export function getActionButtonClasses(isEnabled) {
  const base =
    'inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-medium transition-all duration-300 cursor-pointer';
  if (isEnabled) {
    return `${base} bg-gradient-to-r from-accent/20 to-rose/20 border border-accent/30 text-text hover:border-accent/50`;
  }
  return `${base} bg-surface border border-surface-light text-text-faint cursor-not-allowed`;
}

/**
 * Returns Tailwind classes for a tab button that toggles between
 * active and inactive states.
 */
export function getTabButtonClasses(isActive) {
  const base = 'px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer';
  if (isActive) {
    return `${base} bg-gradient-to-r from-accent/20 to-rose/20 border border-accent/30 text-text`;
  }
  return `${base} bg-surface/40 border border-surface-light/50 text-text-dim hover:text-text hover:border-surface-light`;
}
