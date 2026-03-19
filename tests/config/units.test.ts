import { describe, it, expect } from 'vitest';
import unitsData from '../../src/config/units.json';

describe('Units Config', () => {
  const units = (unitsData as any).units || unitsData;
  const unitEntries = Object.entries(units);

  it('has 32 units', () => {
    expect(unitEntries.length).toBe(32);
  });

  it('each unit has required fields', () => {
    for (const [id, unit] of unitEntries) {
      const u = unit as any;
      expect(u.displayName, `${id} missing displayName`).toBeTruthy();
      expect(u.age, `${id} missing age`).toBeGreaterThanOrEqual(1);
      expect(u.stats?.hp, `${id} missing HP`).toBeGreaterThan(0);
      expect(u.stats?.damage, `${id} missing damage`).toBeGreaterThan(0);
      expect(u.stats?.cost, `${id} missing cost`).toBeGreaterThan(0);
    }
  });

  it('each age has exactly 4 units', () => {
    for (let age = 1; age <= 8; age++) {
      const ageUnits = unitEntries.filter(([, u]) => (u as any).age === age);
      expect(ageUnits.length, `Age ${age} should have 4 units`).toBe(4);
    }
  });
});
