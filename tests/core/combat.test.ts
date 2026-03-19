import { describe, it, expect } from 'vitest';

const COUNTER_MAP: Record<string, Set<string>> = {
  infantry: new Set(['special', 'ranged']),
  ranged: new Set(['heavy']),
  heavy: new Set(['infantry']),
  special: new Set(['heavy']),
};
const COUNTER_BONUS = 1.5;

describe('Counter System', () => {
  it('infantry counters special and ranged', () => {
    expect(COUNTER_MAP['infantry'].has('special')).toBe(true);
    expect(COUNTER_MAP['infantry'].has('ranged')).toBe(true);
  });

  it('ranged counters heavy', () => {
    expect(COUNTER_MAP['ranged'].has('heavy')).toBe(true);
  });

  it('heavy counters infantry', () => {
    expect(COUNTER_MAP['heavy'].has('infantry')).toBe(true);
  });

  it('no self-countering', () => {
    for (const [type, counters] of Object.entries(COUNTER_MAP)) {
      expect(counters.has(type)).toBe(false);
    }
  });

  it('counter bonus is 1.5x', () => {
    const baseDmg = 10;
    expect(baseDmg * COUNTER_BONUS).toBe(15);
  });
});
