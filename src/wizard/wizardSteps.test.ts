import { describe, expect, test } from 'vitest';
import { wizardSteps } from './wizardSteps';

describe('wizardSteps contract', () => {
  test('paths and length remain stable', () => {
    expect(wizardSteps).toHaveLength(4);
    wizardSteps.forEach((step) => {
      expect(step.path).toMatch(/^\/publish\/step-[1-4]$/);
    });
  });
});
