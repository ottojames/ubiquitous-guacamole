import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import NewPublishFlow from '../NewPublishFlow';

// Provide an initial path hoisted before the mock is evaluated
const initial = vi.hoisted(() => ({ path: '/publish/step-2?draft=test-draft-123' }));

// Mock react-router-dom to simulate location and navigation, matching existing test patterns
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  let currentPath = initial.path;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());
  return {
    ...actual,
    useNavigate: () => (to: any, options?: any) => {
      if (typeof to === 'string') {
        currentPath = to;
      } else if (to && typeof to === 'object' && typeof to.pathname === 'string') {
        currentPath = `${to.pathname}${to.search ?? ''}`;
      }
      // ignore replace option; we only simulate path changes
      notify();
    },
    useLocation: () => {
      const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
      React.useEffect(() => {
        listeners.add(forceUpdate);
        return () => listeners.delete(forceUpdate);
      }, []);
      const [pathname, search = ''] = currentPath.split('?');
      return { pathname, search: search ? `?${search}` : '', hash: '', state: null, key: 'mock' } as any;
    },
    Link: ({ children, to, ...rest }: any) => (
      <a href={typeof to === 'string' ? to : ''} {...rest}>
        {children}
      </a>
    ),
    NavLink: ({ children, to, ...rest }: any) => (
      <a href={typeof to === 'string' ? to : ''} {...rest}>
        {children}
      </a>
    ),
  };
});

describe('NewPublishFlow – route/guard behavior', () => {
  test('visiting step-2 without prerequisites redirects to Step 1 with message', async () => {
    render(<NewPublishFlow />);

    // After mount, guard redirects back to step 1 and shows a hint
    const step1Heading = await screen.findByRole('heading', { name: /confirm your notice type/i });
    expect(step1Heading).toBeInTheDocument();
    expect(screen.getByText(/choose a notice type|start at step 1/i)).toBeInTheDocument();

    // Step 2 heading not present
    const step2 = screen.queryByRole('heading', { name: /upload your notice/i });
    expect(step2).toBeNull();
  });
});
