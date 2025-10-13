import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('Template builder preview', () => {
  it('generates a premises notice preview after completing the builder flow', async () => {
    (HTMLFormElement.prototype as any).requestSubmit = () => {};
    render(<PublishPage />);

    fireEvent.click(screen.getByTestId('notice-option-licensing-premises-new'));
    fireEvent.click(screen.getByTestId('notice-step-continue'));
    const templatePanel = await screen.findByTestId('upload-template-panel');
    const templateSummary = templatePanel.querySelector('summary');
    if (!templateSummary) throw new Error('Structured fields summary not found');
    fireEvent.click(templateSummary);
    await screen.findByLabelText(/Company name/i);
    const loadExampleBtn = await screen.findByRole('button', { name: /Load example data/i });
    fireEvent.click(loadExampleBtn);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Confirm your notice' })).toBeInTheDocument());

    const previewHeadings = screen.getAllByText('Notice preview');
    expect(previewHeadings[0]).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(/Sample Bars Ltd/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/\[\[missing:/)).not.toBeInTheDocument();
    });
  });
});
