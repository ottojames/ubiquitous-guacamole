import { useEffect, useRef } from 'react';

/**
 * useFocusTrap - WCAG 2.4.3 compliant focus management for modal dialogs
 *
 * Traps keyboard focus within a container, preventing Tab from escaping.
 * Returns focus to trigger element when trap is deactivated.
 *
 * @param isActive - Whether the focus trap should be active
 * @param onEscape - Optional callback when Escape key is pressed
 * @returns Ref to attach to the trap container
 *
 * @example
 * const trapRef = useFocusTrap(isOpen, () => setIsOpen(false));
 * return <div ref={trapRef} role="dialog">...</div>
 */
export function useFocusTrap(
  isActive: boolean,
  onEscape?: () => void
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the element that had focus before trap activated
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    };

    // Focus first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Focus first element after a brief delay to ensure modal is rendered
      setTimeout(() => focusableElements[0]?.focus(), 50);
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }

      // Only trap Tab key
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift+Tab on first element -> focus last
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
        return;
      }

      // Tab on last element -> focus first
      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
        return;
      }
    };

    // Add event listener
    container.addEventListener('keydown', handleKeyDown);

    // Hide other content from screen readers
    const mainContent = document.querySelector('main');
    const header = document.querySelector('header');

    if (mainContent) mainContent.setAttribute('aria-hidden', 'true');
    if (header && !header.contains(container)) {
      header.setAttribute('aria-hidden', 'true');
    }

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore screen reader access
      if (mainContent) mainContent.removeAttribute('aria-hidden');
      if (header) header.removeAttribute('aria-hidden');

      // Return focus to trigger element
      if (previousActiveElement.current && document.contains(previousActiveElement.current)) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, onEscape]);

  return containerRef;
}
