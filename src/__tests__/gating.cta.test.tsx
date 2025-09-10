import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublishPage from '@/pages/PublishPage';

describe('CTA gating with zod', () => {
  it('disables until required fields are valid, then enables', async () => {
    // Mock address search used by AddressAutocomplete
    (global as any).fetch = vi.fn(async (url: string) => {
      if (String(url).includes('/api/address/search')) {
        return { ok: true, json: async () => ({ results: [{ id: '1', label: '1 High St, Town AB1 2CD', line1: '1 High St', city: 'Town', postcode: 'AB1 2CD' }] }) } as any;
      }
      return { ok: true, json: async () => ({ ok: true }) } as any;
    });

    render(<PublishPage />);
    const button = screen.getByTestId('publish-btn');
    expect(button).toBeDisabled();

    // Fill applicant
    await userEvent.type(screen.getByLabelText(/Applicant Name/i), 'Jane Smith');
    await userEvent.type(screen.getByLabelText(/Applicant Email/i), 'jane@example.com');

    // Pick council (select -> lambeth)
    const councilSelect = screen.getByLabelText(/Council\*/i);
    await userEvent.selectOptions(councilSelect, 'lambeth');

    // Address lookup
    const addressInput = screen.getByTestId('address-input');
    await userEvent.type(addressInput, '1 High St');
    const listbox = await screen.findByRole('listbox');
    const option = within(listbox).getAllByRole('option')[0];
    fireEvent.mouseDown(option);

    // Basics
    await userEvent.type(screen.getByLabelText(/Premises trading name/i), 'Blue Bar');

    // Activities: add one row
    await userEvent.click(screen.getByRole('button', { name: /Add activity/i }));

    await waitFor(() => expect(button).not.toBeDisabled());
  });
});

