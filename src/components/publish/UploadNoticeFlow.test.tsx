import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UploadNoticeFlow from './UploadNoticeFlow';
import { vi } from 'vitest';

describe('UploadNoticeFlow gating', () => {
  it('disables Continue to Pay until required fields are filled', async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/autocomplete/')) {
        return {
          ok: true,
          json: async () => ({
            suggestions: [
              { id: 'address-1', address: '1 High St, Town, BR1 1AA', postcode: 'BR1 1AA' },
            ],
          }),
        } as any;
      }
      if (url.includes('/get/')) {
        return {
          ok: true,
          json: async () => ({
            postcode: 'BR1 1AA',
            addresses: [
              {
                line_1: '1 High St',
                line_2: '',
                town_or_city: 'Town',
                county: '',
                udprn: '1',
              },
            ],
          }),
        } as any;
      }

      return {
        ok: true,
        json: async () => ({ results: [] }),
      } as any;
    });
    // @ts-ignore
    global.fetch = fetchMock;

    render(<UploadNoticeFlow />);

    const noticeSelect = screen.getByTestId('select-notice-type');
    await userEvent.selectOptions(noticeSelect, 'premises');
    await userEvent.click(screen.getByTestId('btn-continue-step1'));

    const fileInput = await screen.findByLabelText(/Drop PDF/i);
    const file = new File(['x'], 'test.pdf', { type: 'application/pdf' });
    await userEvent.upload(fileInput, file);
    const continueBtn = await screen.findByRole('button', { name: /^Continue$/ });
    await waitFor(() => expect(continueBtn).toBeEnabled());
    await userEvent.click(continueBtn);

    const payBtn = screen.getByTestId('btn-continue');
    expect(payBtn).toBeDisabled();

    await userEvent.click(screen.getByTestId('btn-back'));

    await userEvent.type(screen.getByTestId('input-applicant-name'), 'Alice');
    const addrInput = screen.getByTestId('input-premises-address');
    await act(async () => {
      await userEvent.type(addrInput, 'BR1 1AA');
    });
    await new Promise((r) => setTimeout(r, 350));
    await waitFor(() => screen.getByText(/1 High St, Town/i));
    await userEvent.click(screen.getByText(/1 High St, Town/i));
    await userEvent.type(screen.getByLabelText(/Date of submission/i), '2024-01-01');

    const continueAfterEdit = await screen.findByRole('button', { name: /^Continue$/ });
    await userEvent.click(continueAfterEdit);

    const payBtnReady = await screen.findByTestId('btn-continue');
    await userEvent.click(await screen.findByLabelText(/notice text is correct/i));
    await waitFor(() => expect(payBtnReady).toBeEnabled());

    global.fetch = originalFetch;
  });
});
