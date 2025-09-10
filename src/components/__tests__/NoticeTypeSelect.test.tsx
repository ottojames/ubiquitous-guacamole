import { render, screen, fireEvent } from '@testing-library/react';
import NoticeTypeSelect from '../publish/NoticeTypeSelect';
import React from 'react';
import { vi } from 'vitest';

describe('NoticeTypeSelect', () => {
  it('switches types', () => {
    const onChange = vi.fn();
    render(<NoticeTypeSelect value="premises" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('What type of notice do you require?'), { target: { value: 'gvol' } });
    expect(onChange).toHaveBeenCalledWith('gvol');
  });
});
