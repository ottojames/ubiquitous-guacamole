import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import PremisesForm, { WeeklyHoursInput } from '../components/publish/PremisesForm';

describe('PremisesForm', () => {
  it('has no postcode field', () => {
    const { queryByLabelText } = render(
      <PremisesForm onSubmit={() => {}} saving={false} autoFocusRef={{ current: null }} />
    );
    expect(queryByLabelText(/Postcode/i)).toBeNull();
  });

  it('Every Day autofill populates all days', () => {
    const onChange = vi.fn();
    const Wrapper = () => {
      const [val, setVal] = React.useState<Record<string, any>>({});
      return <WeeklyHoursInput value={val} onChange={(h) => { setVal(h); onChange(h); }} />;
    };
    const { getByText } = render(<Wrapper />);
    const row = getByText('Every Day').closest('tr')!;
    const inputs = row.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: '09:00', name: 'start' } });
    fireEvent.change(inputs[1], { target: { value: '17:00', name: 'end' } });
    const expected: Record<string, { start: string; end: string }> = {};
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((d) => {
      expected[d] = { start: '09:00', end: '17:00' };
    });
    expect(onChange).toHaveBeenLastCalledWith(expected);
  });
});
