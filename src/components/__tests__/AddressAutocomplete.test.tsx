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
      .mockResolvedValue({ ok: true, json: async () => ({ items: [] }) } as any);
    global.fetch = fetchMock as unknown as typeof global.fetch;

    render(<AddressAutocomplete onSelect={() => {}} />);
    const input = screen.getByTestId('address-input');
    await userEvent.type(input, '9 lower park');

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe('/api/addresses?q=9%20lower%20park');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ signal: expect.any(Object) });

    global.fetch = originalFetch;
  });

  it('stores UPRN when selecting a postcode result', async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [{ id: '1', label: '1 High St' }] }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ address: { id: '1', lines: ['1 High St'], postcode: 'AB1 2CD', uprn: '999' } }),
      } as any);
    global.fetch = fetchMock as unknown as typeof global.fetch;
    const onSelect = vi.fn();

    render(<AddressAutocomplete onSelect={onSelect} />);
    const input = screen.getByTestId('address-input');
    await userEvent.type(input, 'AB1 2CD');
    await screen.findByText('1 High St');

    await userEvent.click(screen.getByText('1 High St'));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ uprn: '999' })));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/address/resolve?id=1');
    expect(screen.getByTestId('uprn-chip')).toBeInTheDocument();

    global.fetch = originalFetch;
  });
});
