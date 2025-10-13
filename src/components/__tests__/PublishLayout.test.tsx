import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/PublishPage';
import { vi } from 'vitest';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  let currentPath = '/publish/step-1';
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    ...actual,
    useNavigate: () => (to: any) => {
      if (typeof to === 'string') {
        currentPath = to;
      } else if (to && typeof to === 'object' && typeof to.pathname === 'string') {
        currentPath = `${to.pathname}${to.search ?? ''}`;
      }
      notify();
    },
    useLocation: () => {
      const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
      React.useEffect(() => {
        listeners.add(forceUpdate);
        return () => {
          listeners.delete(forceUpdate);
        };
      }, []);
      const [pathname, search = ''] = currentPath.split('?');
      return { pathname, search: search ? `?${search}` : '', hash: '', state: null, key: 'mock' };
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

describe('Publish layout', () => {
  it('shows upload flow by default and switches to template builder', async () => {
    render(<PublishPage />);
    expect(screen.getByRole('heading', { name: /confirm your notice type/i })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('notice-option-licensing-premises-new'));
    fireEvent.click(screen.getByTestId('notice-step-continue'));

    await screen.findByRole('heading', { name: /upload your notice/i });
    const templatePanel = await screen.findByTestId('upload-template-panel');
    const templateSummary = templatePanel.querySelector('summary');
    if (!templateSummary) throw new Error('Structured fields summary not found');
    fireEvent.click(templateSummary);
    await screen.findByLabelText(/Company name/i);
  });
});
