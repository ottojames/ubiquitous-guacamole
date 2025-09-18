import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddressAutocomplete, { mapAddress } from '../AddressAutocomplete';

describe('mapAddress', () => {
  it('maps uprn', () => {
    const mapped = mapAddress({ line1: '1 High St', city: 'Town', postcode: 'AB1', uprn: '123' });
    expect(mapped.uprn).toBe('123');
  });
});

describe('AddressAutocomplete', () => {
  it('fetches results for partial query', async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ suggestions: [] }),
      } as any);
    global.fetch = fetchMock as unknown as typeof global.fetch;

    render(<AddressAutocomplete onSelect={() => {}} />);
    const input = screen.getByTestId('address-input');
    await userEvent.type(input, '9 lower park');

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const requested = fetchMock.mock.calls[0][0] as string;
    expect(requested).toContain('/api/getaddress/autocomplete/9%20lower%20park');
    expect(requested).toContain('api-key=');
    expect(requested).toContain('all=true');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ signal: expect.any(Object) });

    global.fetch = originalFetch;
  });

  it('calls onSelect with the suggestion label and postcode', async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            id: 'addr-1',
            address: '1 High St, Town, AB1 2CD',
            postcode: 'AB1 2CD',
          },
        ],
      }),
    } as any);
    global.fetch = fetchMock as unknown as typeof global.fetch;
    const onSelect = vi.fn();

    render(<AddressAutocomplete onSelect={onSelect} />);
    const input = screen.getByTestId('address-input');
    await userEvent.type(input, 'AB1 2CD');
    await screen.findByText(/1 High St, Town/i);

    await userEvent.click(screen.getByText(/1 High St, Town/i));

    await waitFor(() =>
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ label: '1 High St, Town, AB1 2CD', postcode: 'AB1 2CD' }),
      ),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    global.fetch = originalFetch;
  });
});
