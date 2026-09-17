/**
 * Subtle Haptic Feedback (Vibration API) Utility
 * Enhances mobile tactile feel for critical commerce actions like saving bills, registering parties, etc.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection';

export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (typeof window === 'undefined' || !('navigator' in window)) return;
  if (typeof navigator.vibrate !== 'function') return;

  try {
    switch (style) {
      case 'selection':
      case 'light':
        // Crisp, tiny 12ms tap
        navigator.vibrate(12);
        break;
      case 'medium':
        // Distinctive 24ms tap
        navigator.vibrate(24);
        break;
      case 'heavy':
        // Stronger 40ms tap
        navigator.vibrate(40);
        break;
      case 'success':
        // Subtle dual pulse for successful completions (e.g. Save Bill, Save Party)
        navigator.vibrate([18, 45, 28]);
        break;
      case 'warning':
        // Subtle alert pulse
        navigator.vibrate([30, 40, 30]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Graceful silent fallback if vibration permission is restricted or unsupported
  }
}

// Convenience helpers
export const haptic = {
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  selection: () => triggerHaptic('selection'),
};
