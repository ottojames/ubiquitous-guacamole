import { useEffect, useState } from 'react';

/**
 * useReducedMotion - Respects user's motion preferences
 *
 * Detects if the user has requested reduced motion via their
 * operating system settings (prefers-reduced-motion media query).
 *
 * This is critical for accessibility - users with vestibular disorders
 * or motion sensitivity can experience nausea, dizziness, or discomfort
 * from animations.
 *
 * @returns {boolean} true if user prefers reduced motion
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * const animationDuration = prefersReducedMotion ? 0 : 500;
 *
 * <div className={prefersReducedMotion ? '' : 'animate-fade-in'}>
 *   Content
 * </div>
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if matchMedia is supported (not available in some test environments)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers (Safari < 14)
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}
