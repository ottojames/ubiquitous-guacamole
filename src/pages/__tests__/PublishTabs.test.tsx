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

describe('PublishPage wizard', () => {
  it('prompts for manual details after uploading a notice', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        if (url.includes('/api/ai-summary')) {
          return Promise.resolve(
            new Response(JSON.stringify({ summary: '' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
        return Promise.reject(new Error(`Unhandled fetch for ${url}`));
      });

    try {
      render(<PublishPage />);

      await user.click(screen.getByTestId('notice-option-licensing-premises-new'));
      await user.click(screen.getByTestId('notice-step-continue'));

      const continueBtn = await screen.findByTestId('upload-step-continue');
      expect(continueBtn).toBeDisabled();

      const dropzone = await screen.findByTestId('upload-dropzone');
      const fileInput = dropzone.querySelector('input[type="file"]') as HTMLInputElement | null;
      if (!fileInput) throw new Error('Upload file input not found');
      const file = new File(['sample'], 'test.pdf', { type: 'application/pdf' });
      await user.upload(fileInput, file);

      await screen.findByText(/complete the required details/i);
      expect(continueBtn).toBeDisabled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
