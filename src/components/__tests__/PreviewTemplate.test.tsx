import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import React from 'react';
import PublishPage from '@/pages/PublishPage';

describe('Template builder preview', () => {
  it('generates a premises notice preview after completing the builder flow', async () => {
    (HTMLFormElement.prototype as any).requestSubmit = () => {};
    render(<PublishPage />);

    fireEvent.click(screen.getByText('Upload via Template'));
    fireEvent.click(screen.getByRole('button', { name: /New premises licence/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    fireEvent.change(screen.getByLabelText('Applicant legal name'), { target: { value: 'Test Applicant Ltd' } });
    const applicantAddress = screen.getByRole('group', { name: 'Applicant address' });
    fireEvent.change(within(applicantAddress).getByLabelText('Address line 1'), { target: { value: '1 Market Street' } });
    fireEvent.change(within(applicantAddress).getByLabelText('Town or city'), { target: { value: 'Bristol' } });
    fireEvent.change(within(applicantAddress).getByLabelText('Postcode'), { target: { value: 'BS1 4ST' } });

    fireEvent.change(screen.getByLabelText('Contact email'), { target: { value: 'applicant@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '02071234567' } });

    fireEvent.change(screen.getByLabelText('Premises name'), { target: { value: 'The Market' } });
    const premisesAddress = screen.getByRole('group', { name: 'Premises address' });
    fireEvent.change(within(premisesAddress).getByLabelText('Address line 1'), { target: { value: '2 Market Street' } });
    fireEvent.change(within(premisesAddress).getByLabelText('Town or city'), { target: { value: 'Bristol' } });
    fireEvent.change(within(premisesAddress).getByLabelText('Postcode'), { target: { value: 'BS1 5ST' } });

    fireEvent.change(screen.getByLabelText('Intended publication date'), { target: { value: '2024-05-01' } });

    fireEvent.change(screen.getByLabelText('Council name'), { target: { value: 'Bristol City Council' } });
    fireEvent.change(screen.getByLabelText('Representation email'), { target: { value: 'licensing@bristol.gov.uk' } });
    fireEvent.change(screen.getByLabelText('Postal address for representations'), {
      target: { value: 'Licensing Team\nCity Hall\nBristol BS1 5TR' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: '10:00–23:00' })[0]);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Confirm your notice' })).toBeInTheDocument());

    const previewHeadings = screen.getAllByText('Notice preview');
    expect(previewHeadings[0]).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText(/Test Applicant Ltd/).length).toBeGreaterThan(0);
      expect(screen.queryByText(/\[\[missing:/)).not.toBeInTheDocument();
    });
  });
});
