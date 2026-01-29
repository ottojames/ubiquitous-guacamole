/**
 * Test: Gambling forms validation tracking
 *
 * This test verifies that LICENSABLE_ACTIVITIES and OPENING_HOURS fields
 * are properly tracked in the validation pill for gambling forms.
 *
 * Issue: Officers reported that the validation pill did not show these fields,
 * causing confusion about form completion status.
 *
 * Fix: Added hidden placeholder fields to "gambling-activities-hours" section
 * that are tracked by validation logic but rendered by GamblingActivitiesSection.
 */

import { describe, it, expect } from 'vitest';
import { getFormBlueprint, getMandatoryFieldsForOCR } from '../formBlueprints';
import { NOTICE_DEFINITIONS } from '../noticeTypes';

describe('Gambling forms validation tracking', () => {
  const gamblingNewApp = NOTICE_DEFINITIONS.find(
    (d) => d.id === 'gambling-betting-new'
  );

  if (!gamblingNewApp) {
    throw new Error('Gambling betting new application definition not found');
  }

  it('should include LICENSABLE_ACTIVITIES in full blueprint', () => {
    const blueprint = getFormBlueprint(gamblingNewApp);
    const activitiesSection = blueprint.sections.find(
      (s) => s.id === 'gambling-activities-hours'
    );

    expect(activitiesSection).toBeDefined();
    expect(activitiesSection?.fields).toBeDefined();

    const licensableActivitiesField = activitiesSection?.fields.find(
      (f) => f.token === 'LICENSABLE_ACTIVITIES'
    );

    expect(licensableActivitiesField).toBeDefined();
    expect(licensableActivitiesField?.required).toBe(true);
    expect(licensableActivitiesField?.label).toBe('Licensed activities');
  });

  it('should include OPENING_HOURS in full blueprint', () => {
    const blueprint = getFormBlueprint(gamblingNewApp);
    const activitiesSection = blueprint.sections.find(
      (s) => s.id === 'gambling-activities-hours'
    );

    const openingHoursField = activitiesSection?.fields.find(
      (f) => f.token === 'OPENING_HOURS'
    );

    expect(openingHoursField).toBeDefined();
    expect(openingHoursField?.required).toBe(true);
    expect(openingHoursField?.label).toBe('Proposed opening hours');
  });

  it('should include both fields in mandatory fields for OCR', () => {
    const mandatoryBlueprint = getMandatoryFieldsForOCR(gamblingNewApp);

    // Flatten all fields from all sections
    const allFields = mandatoryBlueprint.sections.flatMap((s) => s.fields);

    const licensableActivities = allFields.find(
      (f) => f.token === 'LICENSABLE_ACTIVITIES'
    );
    const openingHours = allFields.find((f) => f.token === 'OPENING_HOURS');

    expect(licensableActivities).toBeDefined();
    expect(licensableActivities?.required).toBe(true);

    expect(openingHours).toBeDefined();
    expect(openingHours?.required).toBe(true);
  });

  it('should NOT include these fields for review applications', () => {
    const gamblingReview = NOTICE_DEFINITIONS.find(
      (d) => d.id === 'gambling-betting-review'
    );

    if (!gamblingReview) {
      throw new Error('Gambling betting review definition not found');
    }

    const blueprint = getFormBlueprint(gamblingReview);
    const activitiesSection = blueprint.sections.find(
      (s) => s.id === 'gambling-activities-hours'
    );

    // Review applications should NOT have the activities-hours section
    expect(activitiesSection).toBeUndefined();
  });

  it('should NOT include these fields for transfer applications', () => {
    const gamblingTransfer = NOTICE_DEFINITIONS.find(
      (d) => d.id === 'gambling-betting-transfer'
    );

    if (!gamblingTransfer) {
      throw new Error('Gambling betting transfer definition not found');
    }

    const blueprint = getFormBlueprint(gamblingTransfer);
    const activitiesSection = blueprint.sections.find(
      (s) => s.id === 'gambling-activities-hours'
    );

    // Transfer applications should NOT have the activities-hours section
    expect(activitiesSection).toBeUndefined();
  });

  it('should work for all gambling premises types', () => {
    const gamblingTypes = [
      'gambling-betting-new',
      'gambling-bingo-new',
      'gambling-agc-new',
      'gambling-fec-new',
    ];

    for (const typeId of gamblingTypes) {
      const definition = NOTICE_DEFINITIONS.find((d) => d.id === typeId);
      expect(definition, `Definition ${typeId} should exist`).toBeDefined();

      if (!definition) continue;

      const blueprint = getMandatoryFieldsForOCR(definition);
      const allFields = blueprint.sections.flatMap((s) => s.fields);

      const hasLicensableActivities = allFields.some(
        (f) => f.token === 'LICENSABLE_ACTIVITIES' && f.required
      );
      const hasOpeningHours = allFields.some(
        (f) => f.token === 'OPENING_HOURS' && f.required
      );

      expect(
        hasLicensableActivities,
        `${typeId} should have required LICENSABLE_ACTIVITIES field`
      ).toBe(true);
      expect(
        hasOpeningHours,
        `${typeId} should have required OPENING_HOURS field`
      ).toBe(true);
    }
  });
});
