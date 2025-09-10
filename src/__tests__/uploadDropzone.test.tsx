import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublishPage from '@/pages/PublishPage';

describe.skip('UploadDropzone status transitions', () => {
  it('goes to done in test mode and sets notice-editor text', async () => {
    render(<PublishPage />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(screen.getAllByText(/Status: done/i)[0]).toBeInTheDocument());
    const editor = screen.getByTestId('notice-editor') as HTMLTextAreaElement;
    expect(editor.value).toBe('hello');
  });
});
