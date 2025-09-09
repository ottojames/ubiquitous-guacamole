import React from 'react';
import { render, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PremisesForm, { WeeklyHoursInput } from '../components/publish/PremisesForm';

describe('PremisesForm', () => {
  it('has no postcode field', () => {
    // type-safe dummy ref for the component prop
    const dummyRef = { current: null } as unknown as React.RefObject<HTMLElement>;
    const { queryByLabelText } = render(
      <PremisesForm onSubmit={() => {}} saving={false} autoFocusRef={dummyRef} />
    );
    expect(queryByLabelText(/Postcode/i)).toBeNull();
  });

  it('Every Day autofill populates all days', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <WeeklyHoursInput value={{}} onChange={onChange} label="Opening hours" />
    );

    const row = getByText('Every Day').closest('tr')!;
    const startInput = within(row).getByLabelText(/Start time/i) as HTMLInputElement;
    const endInput = within(row).getByLabelText(/End time/i) as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: '09:00' } });
    fireEvent.change(endInput, { target: { value: '17:00' } });

    const expected: Record<string, { start: string; end: string }> = {};
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d) => {
      expected[d] = { start: '09:00', end: '17:00' };
    });

    expect(onChange).toHaveBeenLastCalledWith(expected);
  });
});
