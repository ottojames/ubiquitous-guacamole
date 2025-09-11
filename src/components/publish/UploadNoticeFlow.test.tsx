import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UploadNoticeFlow from './UploadNoticeFlow';
import { vi } from 'vitest';

describe('UploadNoticeFlow gating', () => {
  it('disables Continue to Pay until required fields are filled', async () => {
    const results = [{ id: '1', label: '1 High St', postcode: 'BR1 1AA' }];
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results }) });

    render(<UploadNoticeFlow />);
    const fileInput = screen.getByLabelText(/Drop PDF/i);
    const file = new File(['x'], 'test.pdf', { type: 'application/pdf' });
    await userEvent.upload(fileInput, file);
    const continueBtn = await screen.findByRole('button', { name: /^Continue$/ });
    await waitFor(() => expect(continueBtn).toBeEnabled());
    await userEvent.click(continueBtn);

    const payBtn = screen.getByRole('button', { name: /Continue to Pay/i });
    expect(payBtn).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/Applicant name/i), 'Alice');
    const addrInput = screen.getByTestId('address-input');
    await userEvent.type(addrInput, 'BR1 1AA');
    await new Promise((r) => setTimeout(r, 350));
    await waitFor(() => screen.getByText('1 High St'));
    await userEvent.click(screen.getByText('1 High St'));
    await userEvent.type(screen.getByLabelText(/Date of submission/i), '2024-01-01');
    await userEvent.click(screen.getByLabelText(/true and accurate copy/i));
    await userEvent.click(screen.getByLabelText(/false information is an offence/i));

    await waitFor(() => expect(payBtn).toBeEnabled());
  });
});
