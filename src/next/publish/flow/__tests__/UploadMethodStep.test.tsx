import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import UploadMethodStep from '../steps/UploadMethodStep';
import { createInitialLegalDetails } from '@/next/publish/flow/lib/legalDetails';

const noop = () => {};

describe('UploadMethodStep', () => {
  it('allows switching between upload and template modes', async () => {
    const user = userEvent.setup();
    const handleMethodChange = vi.fn();
    const legalDetails = createInitialLegalDetails();

    render(
      <UploadMethodStep
        definition={{ id: 'licensing-premises-new', label: 'Test notice type' } as any}
        method={null}
        onMethodChange={handleMethodChange}
        onBack={noop}
        onContinue={noop}
        continueDisabled={true}
        uploadPaneProps={{
          uploadComponentProps: {
            onText: noop,
            onMeta: noop,
            onStatusChange: noop,
          },
          showRequiredDetails: false,
          details: legalDetails,
          meta: {},
          statuses: [],
          errors: {},
          recommendedWarnings: [],
          selectedCouncil: null,
          onChange: noop,
          onCouncilSelect: noop,
          onCouncilInput: noop,
          onSwitchToTemplate: noop,
          onFieldFocus: noop,
          onHighlightRequest: noop,
          focusRequest: null,
          ocrHighlights: [],
          missingCount: 0,
        }}
        templateContent={<div>Template panel</div>}
      />
    );

    const uploadButton = screen.getByRole('button', { name: /upload & ocr/i });
    await user.click(uploadButton);
    expect(screen.getByText(/drag a file or click to upload/i)).toBeInTheDocument();

    const templateButton = screen.getByRole('button', { name: /structured template/i });
    await user.click(templateButton);

    await waitFor(() => expect(handleMethodChange).toHaveBeenCalledWith('template'));
  });
});
