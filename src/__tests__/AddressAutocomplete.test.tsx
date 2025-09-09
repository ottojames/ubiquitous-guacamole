import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import type { AddressOption } from '../components/AddressAutocomplete';

describe('AddressAutocomplete', () => {
  beforeEach(() => {
    // @ts-ignore
    global.fetch = vi.fn();
  });

  it('shows suggestions and allows selection', async () => {
    const opt: AddressOption = { id: '1', label: '10 Downing St', line1: '10 Downing St', postcode: 'SW1A 2AA' };
    // @ts-ignore
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ results: [opt] }) });
    const onSelect = vi.fn();
    render(<AddressAutocomplete onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: '10 Downing' } });
    await waitFor(() => screen.getByRole('option'));
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(opt);
  });

  it('handles no results', async () => {
    // @ts-ignore
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ results: [] }) });
    render(<AddressAutocomplete onSelect={() => {}} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyz' } });
    await waitFor(() => screen.getByText('No results'));
  });

  it('handles provider error', async () => {
    // @ts-ignore
    fetch.mockRejectedValue(new Error('fail'));
    render(<AddressAutocomplete onSelect={() => {}} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'abc' } });
    await waitFor(() => screen.getByText('Unable to search'));
  });
});
