import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/publish';

describe('Error summary and fix links', () => {
  it('focuses fields from error summary and compliance fix', async () => {
    render(<PublishPage />);
    // switch to gvol
    fireEvent.change(screen.getByLabelText('What type of notice do you require?'), { target: { value: 'gvol' } });
    fireEvent.click(screen.getByText('Submit'));
    // error summary link
    const errLink = await screen.findByText('Applicant email is required');
    fireEvent.click(errLink);
    expect(screen.getByLabelText('Applicant email')).toHaveFocus();

    // fill required fields and trigger compliance issue
    fireEvent.change(screen.getByLabelText('Applicant email'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('Council'), { target: { value: 'bristol' } });
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText('Vehicles'), { target: { value: '-1' } });
    fireEvent.change(screen.getByLabelText('Trailers'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('Submit'));
    const fixLink = await screen.findByText('Fix');
    fireEvent.click(fixLink);
    expect(screen.getByLabelText('Vehicles')).toHaveFocus();
  });
});
