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

describe('PublishPage wizard', () => {
  it('enables continue after uploading a notice', async () => {
    render(<PublishPage />);

    fireEvent.click(screen.getByTestId('notice-option-licensing-premises-new'));
    fireEvent.click(screen.getByTestId('notice-step-continue'));

    const continueBtn = await screen.findByTestId('upload-step-continue');
    expect(continueBtn).toBeDisabled();

    const ocrPanel = screen.getByTestId('upload-ocr-panel');
    const summary = ocrPanel.querySelector('summary');
    if (!summary) throw new Error('Upload & OCR summary not found');
    fireEvent.click(summary);
    const fileInput = await screen.findByLabelText(/drop pdf/i);
    const file = new File(['sample'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(continueBtn).not.toBeDisabled());
  });
});
