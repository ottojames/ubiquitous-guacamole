import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/publish';

describe('Preview template', () => {
  it('uses template for selected notice type and expands', async () => {
    (HTMLFormElement.prototype as any).requestSubmit = () => {};
    render(<PublishPage />);
    // switch to GVOL for simpler form
    fireEvent.change(screen.getByLabelText('What type of notice do you require?'), { target: { value: 'gvol' } });
    // fill form
    fireEvent.change(screen.getByLabelText('Applicant email'), { target: { value: 'a@example.com' } });
    fireEvent.change(screen.getByLabelText('Council'), { target: { value: 'bristol' } });
    // council email auto fills
    fireEvent.change(screen.getByLabelText('Operator'), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText('Vehicles'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Trailers'), { target: { value: '0' } });
    fireEvent.click(screen.getAllByText('Submit')[1]);

    expect(await screen.findByText(/goods vehicle operator licence/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Expand'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
