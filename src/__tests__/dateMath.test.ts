import { describe, it, expect } from 'vitest';
import { calcRepDeadline } from '@/lib/date';

describe('calcRepDeadline', () => {
  it('adds 28 days and skips weekends', () => {
    expect(calcRepDeadline('2024-12-01', 'england_wales')).toBe('2024-12-30');
  });
  it('skips bank holidays', () => {
    expect(calcRepDeadline('2024-03-04', 'england_wales')).toBe('2024-04-02');
  });
});
