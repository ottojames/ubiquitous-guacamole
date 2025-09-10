import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PublishPage from '@/pages/PublishPage';

describe('Stepper', () => {
  it('shows steps and updates current on click', () => {
    render(<PublishPage />);
    const stepButtons = screen.getAllByRole('button', { name: /\d+\./ });
    // default currentStep = 1 (second step)
    expect(stepButtons[1]).toHaveAttribute('aria-current', 'true');
    fireEvent.click(stepButtons[3]); // click Details
    expect(stepButtons[3]).toHaveAttribute('aria-current', 'true');
  });
});

