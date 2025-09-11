import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/publish';

describe('Publish layout', () => {
  it('renders one active form and right rail cards', () => {
    render(<PublishPage />);
    // default premises form present
    expect(screen.getByLabelText('Premises name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Operator')).not.toBeInTheDocument();

    // right rail cards
    expect(screen.getByLabelText('Notice preview')).toBeInTheDocument();
    expect(screen.getByLabelText('Compliance checklist')).toBeInTheDocument();
    expect(screen.getByLabelText('Key dates')).toBeInTheDocument();
    expect(screen.getByLabelText('Cost')).toBeInTheDocument();

    // grid layout applied
    const layout = screen.getByTestId('publish-layout');
    const grid = layout.querySelector('div.grid');
    expect(grid?.className).toContain('md:grid-cols-3');

    // switch form
    fireEvent.change(screen.getByLabelText('What type of notice do you require?'), { target: { value: 'gvol' } });
    expect(screen.getByLabelText('Operator')).toBeInTheDocument();
    expect(screen.queryByLabelText('Premises name')).not.toBeInTheDocument();
  });
});
