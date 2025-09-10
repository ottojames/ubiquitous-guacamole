import { render, screen } from '@testing-library/react';
import React from 'react';
import NoticePreview from '../NoticePreview';

describe('NoticePreview', () => {
  it('shows copy and download buttons', () => {
    render(<NoticePreview text="hello" />);
    expect(screen.getByRole('button', { name: /copy text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download .txt/i })).toBeInTheDocument();
  });
});
