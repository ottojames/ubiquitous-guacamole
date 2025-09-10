import { render, screen } from '@testing-library/react';
import React from 'react';
import NoticePreview from '../publish/NoticePreview';

describe('NoticePreview', () => {
  it('renders text with copy and download actions', () => {
    render(<NoticePreview text="hello" />);
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download \.txt/i })).toBeInTheDocument();
  });
});
