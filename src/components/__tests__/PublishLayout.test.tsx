import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/PublishPage';

describe('Publish layout', () => {
  it('renders the publish hero and first step', () => {
    render(<PublishPage />);

    expect(screen.getByRole('heading', { name: 'Publish a notice' })).toBeInTheDocument();
    expect(screen.getByText('Step 1 · Confirm notice type')).toBeInTheDocument();
  });

  it('advances to the template builder flow on step 2', async () => {
    render(<PublishPage />);

    fireEvent.click(screen.getByTestId('notice-option-licensing-premises-new'));
    fireEvent.click(screen.getByTestId('notice-step-continue'));

    await waitFor(() => expect(screen.getByTestId('upload-method-step')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('upload-method-template'));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Applicant details' })).toBeInTheDocument());
  });
});
