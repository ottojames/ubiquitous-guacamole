import { describe, it, expect } from 'vitest';
import { calcRepDeadline } from '@/lib/date';

describe('calcRepDeadline', () => {
  it('adds 28 clear days from the day after', () => {
    expect(calcRepDeadline('2024-12-01', 'england_wales')).toBe('2024-12-30');
  });
  it('skips bank holidays', () => {
    expect(calcRepDeadline('2024-03-04', 'england_wales')).toBe('2024-04-02');
  });
  it('counts from the day after application', () => {
    expect(calcRepDeadline('2024-01-01', 'england_wales')).toBe('2024-01-30');
  });
});
