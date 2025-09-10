import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActivitiesHoursGrid, { defaultGrid } from '@/components/publish/ActivitiesHoursGrid';
import { useState } from 'react';

describe('ActivitiesHoursGrid', () => {
  it('copies Monday to Thu', () => {
    const grid = defaultGrid();
    const Wrapper = () => {
      const [val, setVal] = useState(grid);
      return <ActivitiesHoursGrid value={val} onChange={setVal} />;
    };
    const { getAllByLabelText, getAllByText } = render(<Wrapper />);
    const monStart = getAllByLabelText('Mon start')[0] as HTMLInputElement;
    const monEnd = getAllByLabelText('Mon end')[0] as HTMLInputElement;
    fireEvent.change(monStart, { target: { value: '09:00' } });
    fireEvent.change(monEnd, { target: { value: '23:00' } });
    fireEvent.click(getAllByText('Copy Mon→Thu')[0]);
    const thuStart = getAllByLabelText('Thu start')[0] as HTMLInputElement;
    expect(thuStart.value).toBe('09:00');
  });

  it('shows midnight warning', () => {
    const grid = defaultGrid();
    const Wrapper = () => {
      const [val, setVal] = useState(grid);
      return <ActivitiesHoursGrid value={val} onChange={setVal} />;
    };
    const { getAllByLabelText, getByTestId } = render(<Wrapper />);
    fireEvent.change(getAllByLabelText('Mon start')[0], { target: { value: '23:00' } });
    fireEvent.change(getAllByLabelText('Mon end')[0], { target: { value: '01:00' } });
    expect(getByTestId('midnight-warning').textContent).toMatch('End is before start');
  });
});
