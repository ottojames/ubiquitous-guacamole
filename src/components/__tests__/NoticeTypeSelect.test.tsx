import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/PublishPage';

describe('NoticeTypeSelect', () => {
  it('renders only the active form when switching types', () => {
    render(<PublishPage />);
    const select = screen.getByLabelText('Notice type') as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'premises' } });
    expect(select.value).toBe('premises');
    expect(
      screen.getByText('Alcohol/regulated entertainment & late-night refreshment.')
    ).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'variation' } });
    expect(select.value).toBe('variation');
    expect(screen.getByText('Change to existing licence (hours, conditions, layout, etc.).')).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'review' } });
    expect(select.value).toBe('review');
    expect(screen.getByText('Application to review an existing licence.')).toBeInTheDocument();
  });
});
