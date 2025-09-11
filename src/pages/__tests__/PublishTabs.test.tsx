import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/PublishPage';

describe('PublishPage tabs', () => {
  it('renders tabs and enables continue after OCR', async () => {
    const { container } = render(<PublishPage />);
    expect(screen.getByText('Upload from Notice')).toBeInTheDocument();
    expect(screen.getByText('Upload via Template')).toBeInTheDocument();
    const btn = screen.getByText('Continue') as HTMLButtonElement;
    expect(btn).toBeDisabled();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['hi'], 'test.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(btn).not.toBeDisabled());
  });
});
