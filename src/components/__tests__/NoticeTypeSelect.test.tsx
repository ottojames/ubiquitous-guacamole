import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/publish';

describe('NoticeTypeSelect', () => {
  it('renders only the active form when switching types', () => {
    render(<PublishPage />);

    // Premises by default
    expect(screen.getByLabelText('Premises name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Operator')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('What type of notice do you require?'), { target: { value: 'gvol' } });
    expect(screen.getByLabelText('Operator')).toBeInTheDocument();
    expect(screen.queryByLabelText('Premises name')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('What type of notice do you require?'), { target: { value: 'traffic' } });
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.queryByLabelText('Operator')).not.toBeInTheDocument();
  });
});
