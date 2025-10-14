import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    const user = userEvent.setup();
    render(<PublishPage />);

    await user.click(screen.getByTestId('notice-option-licensing-premises-new'));
    await user.click(screen.getByTestId('notice-step-continue'));
    const templateButton = await screen.findByRole('button', { name: /structured template/i });
    await user.click(templateButton);
    await screen.findByTestId('upload-method-step');
    const templatePanel = await screen.findByTestId('upload-template-panel');
    await screen.findByLabelText(/applicant name/i);
    const loadExampleBtn = await screen.findByRole('button', { name: /load example data/i });
    await user.click(loadExampleBtn);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await screen.findByTestId('confirm-step');

    await waitFor(() => {
      expect(screen.getAllByText(/Sample Bars Ltd/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/\[\[missing:/)).not.toBeInTheDocument();
    });
  });
});
