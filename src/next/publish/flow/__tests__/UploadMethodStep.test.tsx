import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import UploadMethodStep from '../steps/UploadMethodStep';

const noop = () => {};

describe('UploadMethodStep', () => {
  it('allows switching between upload and template modes', async () => {
    const user = userEvent.setup();
    const handleMethodChange = vi.fn();
    const handleEmailChange = vi.fn();

    // Render with method="template" to start in a known state, then switch to notice
    // Note: when method=null, the component auto-triggers template mode
    render(
      <UploadMethodStep
        definition={{ id: 'licensing-premises-new', label: 'Test notice type' } as any}
        method="template"
        onMethodChange={handleMethodChange}
        onBack={noop}
        onContinue={noop}
        continueDisabled={true}
        email="test@example.com"
        onEmailChange={handleEmailChange}
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
        templateContent={<div data-testid="template-panel">Template panel</div>}
      />
    );

    // Verify template panel is shown initially
    expect(screen.getByTestId('template-panel')).toBeInTheDocument();

    // Click on "Upload via File" to switch to notice mode
    const uploadButton = await screen.findByRole('button', { name: /upload via file/i });
    await user.click(uploadButton);

    // Wait for the upload dropzone to appear (UI should switch to notice mode)
    await waitFor(() => {
      expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument();
    });

    // Verify onMethodChange was called with 'notice'
    expect(handleMethodChange).toHaveBeenCalledWith('notice');

    // Click on "Structured template" to switch back to template mode
    const templateButton = await screen.findByRole('button', { name: /structured template/i });
    await user.click(templateButton);

    // Verify that onMethodChange was called with 'template'
    await waitFor(() => expect(handleMethodChange).toHaveBeenCalledWith('template'));
  });
});
