import React from 'react';
import { render, screen } from '@testing-library/react';
import Stepper from '@/components/publish/Stepper';

describe('Stepper', () => {
  it('renders with no steps without crashing', () => {
    render(<Stepper />);
    // Container should render
    expect(screen.getByLabelText('Steps')).toBeInTheDocument();
    // No step buttons when steps are empty/undefined
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('renders the correct number of steps when provided', () => {
    const steps = ['One', 'Two', 'Three'];
    render(<Stepper steps={steps} currentStep={1} />);
    const stepButtons = screen.getAllByRole('button', { name: /\d+\./ });
    expect(stepButtons).toHaveLength(steps.length);
  });
});

