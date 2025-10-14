import { render, screen } from '@testing-library/react';
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

describe('Publish layout', () => {
  it('shows upload flow by default and switches to template builder', async () => {
    const user = userEvent.setup();
    render(<PublishPage />);
    expect(await screen.findByRole('heading', { name: /what kind of notice are you publishing\?/i })).toBeInTheDocument();

    await user.click(screen.getByTestId('notice-option-licensing-premises-new'));
    await user.click(screen.getByTestId('notice-step-continue'));

    await screen.findByTestId('upload-method-step');
    const templateButton = await screen.findByRole('button', { name: /structured template/i });
    await user.click(templateButton);
    const templatePanel = await screen.findByTestId('upload-template-panel');
    expect(templatePanel).toBeInTheDocument();
    await screen.findByLabelText(/Applicant name/i);
  });
});
