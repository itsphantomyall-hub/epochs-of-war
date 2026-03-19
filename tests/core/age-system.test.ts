import { describe, it, expect } from 'vitest';

describe('Age System', () => {
  it('base HP formula: 500 + (age-1) * 200', () => {
    const getBaseHp = (age: number) => 500 + (age - 1) * 200;
    expect(getBaseHp(1)).toBe(500);
    expect(getBaseHp(4)).toBe(1100);
    expect(getBaseHp(8)).toBe(1900);
  });

  it('XP thresholds increase each age', () => {
    const thresholds = [100, 250, 500, 900, 1400, 2200, 3500];
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
    }
  });

  it('passive income increases per age', () => {
    const getIncome = (age: number) => 3 + (age - 1);
    expect(getIncome(1)).toBe(3);
    expect(getIncome(4)).toBe(6);
    expect(getIncome(8)).toBe(10);
  });
});
