import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/PublishPage';

describe('Upload method step', () => {
  it('allows continuing with the template method and shows the preview rail', async () => {
    render(<PublishPage />);

    fireEvent.click(screen.getByTestId('notice-option-licensing-premises-new'));
    fireEvent.click(screen.getByTestId('notice-step-continue'));

    await waitFor(() => expect(screen.getByTestId('upload-method-step')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('upload-method-template'));

    expect(screen.getByText('Notice preview')).toBeInTheDocument();
    expect(
      screen.getByText('Your preview will appear here after you upload or type your notice text.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('upload-method-continue'));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Review and finish' })).toBeInTheDocument());
  });
});
