import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/PublishPage';

describe('PublishPage wizard flow', () => {
  it('only shows upload method tabs on step 2', async () => {
    render(<PublishPage />);

    expect(screen.getByTestId('notice-step')).toBeInTheDocument();
    expect(screen.queryByText('Upload from Notice')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload via Template')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('notice-option-licensing-premises-new'));
    fireEvent.click(screen.getByTestId('notice-step-continue'));

    await waitFor(() => expect(screen.getByTestId('upload-method-step')).toBeInTheDocument());
    expect(screen.getByText('Upload from Notice')).toBeInTheDocument();
    expect(screen.getByText('Upload via Template')).toBeInTheDocument();
  });
});
