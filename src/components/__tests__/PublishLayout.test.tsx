import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/PublishPage';

describe('Publish layout', () => {
  it('shows upload flow by default and switches to template builder', () => {
    render(<PublishPage />);
    expect(screen.getByText('Upload your Notice')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Upload via Template'));
    expect(screen.getByRole('heading', { name: 'Confirm notice type' })).toBeInTheDocument();
  });
});
