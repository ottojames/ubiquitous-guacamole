import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublishPage from '@/pages/PublishPage';

describe('PreviewPane rendering', () => {
  it('renders required lines from final renderer', async () => {
    (global as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/api/address/search')) {
        return { ok: true, json: async () => ({ results: [{ id: '1', label: '1 High St, Town AB1 2CD', line1: '1 High St', city: 'Town', postcode: 'AB1 2CD' }] }) } as any;
      }
      return { ok: true, json: async () => ({ ok: true }) } as any;
    });

    render(<PublishPage />);
    await userEvent.type(screen.getByLabelText(/Applicant Name/i), 'Jane Smith');
    await userEvent.type(screen.getByLabelText(/Applicant Email/i), 'jane@example.com');
    await userEvent.selectOptions(screen.getByLabelText(/Council\*/i), 'lambeth');
    const addressInput = screen.getByTestId('address-input');
    await userEvent.type(addressInput, '1 High St');
    const listbox = await screen.findByRole('listbox');
    fireEvent.mouseDown(within(listbox).getAllByRole('option')[0]);
    await userEvent.type(screen.getByLabelText(/Premises trading name/i), 'Blue Bar');
    await userEvent.click(screen.getByRole('button', { name: /Add activity/i }));

    await waitFor(() => expect(screen.getByText(/Proposed licensable activities and hours:/)).toBeInTheDocument());
    expect(screen.getByText(/LICENSING ACT 2003 – NOTICE OF APPLICATION FOR A PREMISES LICENCE/)).toBeInTheDocument();
    expect(screen.getByText(/Application date:/)).toBeInTheDocument();
    expect(screen.getByText(/Representations must be received by/)).toBeInTheDocument();
  });
});

