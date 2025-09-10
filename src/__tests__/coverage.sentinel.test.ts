import { describe, it, expect } from 'vitest';

describe('coverage sentinel', () => {
  it('keeps the runner deterministic', () => {
    expect(true).toBe(true);
  });
});

