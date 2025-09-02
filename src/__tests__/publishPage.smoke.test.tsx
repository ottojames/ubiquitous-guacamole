import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PublishPage from '../pages/PublishPage';

describe('PublishPage OCR flow', () => {
  it('shows editor with OCR text after upload', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      json: async () => ({ text: 'hello', meta: { engine: 'test' } }),
    });
    const { container, getByTestId } = render(<PublishPage />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['abc'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(getByTestId('notice-editor')).toHaveValue('hello');
    });
  });
});
