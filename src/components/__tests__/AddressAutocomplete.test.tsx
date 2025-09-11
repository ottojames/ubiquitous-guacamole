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
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results: [] }) } as any);
    // @ts-ignore
    global.fetch = fetchMock;
    render(<AddressAutocomplete onSelect={() => {}} />);
    const input = screen.getByTestId('address-input');
    await userEvent.type(input, '9 lower park');
    await new Promise((r) => setTimeout(r, 350));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/address/search?q=9%20lower%20park'));
  });

  it('stores UPRN when selecting a postcode result', async () => {
    const results = [{ id: '1', label: '1 High St', uprn: '999', postcode: 'AB1 2CD' }];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ results }) } as any);
    // @ts-ignore
    global.fetch = fetchMock;
    const onSelect = vi.fn();
    render(<AddressAutocomplete onSelect={onSelect} />);
    const input = screen.getByTestId('address-input');
    await userEvent.type(input, 'AB1 2CD');
    await new Promise((r) => setTimeout(r, 350));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await waitFor(() => screen.getByText('1 High St'));
    await userEvent.click(screen.getByText('1 High St'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ uprn: '999' }));
    expect(screen.getByTestId('uprn-chip')).toBeInTheDocument();
  });
});
