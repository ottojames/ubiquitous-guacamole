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
          definition: { id: 'licensing-premises-new', label: 'Test notice type' } as any,
          uploadComponentProps: {
            onText: noop,
            onMeta: noop,
            onStatusChange: noop,
          },
          showRequiredDetails: false,
          templateDraft: {},
          onChange: noop,
          errors: {},
          onSwitchToTemplate: noop,
        }}
        templateContent={<div>Template panel</div>}
      />
    );

    const uploadButton = await screen.findByRole('button', { name: /upload via file/i });
    await user.click(uploadButton);
    expect(await screen.findByTestId('upload-dropzone')).toBeInTheDocument();

    const templateButton = await screen.findByRole('button', { name: /structured template/i });
    await user.click(templateButton);

    await waitFor(() => expect(handleMethodChange).toHaveBeenCalledWith('template'));
  });
});
