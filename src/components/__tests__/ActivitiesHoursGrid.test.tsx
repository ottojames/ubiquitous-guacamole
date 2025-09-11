import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import ActivitiesHoursGrid, { defaultGrid } from '../publish/ActivitiesHoursGrid';

describe('ActivitiesHoursGrid', () => {
  it('shows toolbar and allows quick actions', () => {
    const value = defaultGrid();
    const handleChange = vi.fn();
    const { container } = render(<ActivitiesHoursGrid value={value} onChange={handleChange} />);
    const copyButtons = screen.getAllByText('Copy Mon→Thu');
    fireEvent.change(screen.getAllByLabelText('Mon start')[0], { target: { value: '09:00' } });
    fireEvent.change(screen.getAllByLabelText('Mon end')[0], { target: { value: '17:00' } });
    fireEvent.click(copyButtons[0]);
    expect(handleChange).toHaveBeenCalled();
    expect(container.querySelector('.overflow-x-auto')).toBeTruthy();
  });
});
