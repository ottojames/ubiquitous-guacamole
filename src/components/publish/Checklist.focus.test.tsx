import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Checklist, { ChecklistItem } from './Checklist';

describe('Checklist focus', () => {
  it('focuses target input when Fix this clicked', async () => {
    const items: ChecklistItem[] = [{ id: 'a', label: 'Applicant name present', ok: false, target: 'applicantName' }];
    render(
      <div>
        <input id="applicantName" />
        <Checklist items={items} />
      </div>
    );
    await userEvent.click(screen.getByText('Fix this'));
    const input = document.getElementById('applicantName');
    expect(document.activeElement).toBe(input);
  });
});
