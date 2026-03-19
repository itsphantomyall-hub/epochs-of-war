import { describe, it, expect } from 'vitest';
import { EconomySystem } from '../../src/core/systems/EconomySystem';

describe('EconomySystem', () => {
  it('initializes with starting gold', () => {
    const eco = new EconomySystem(100, 1);
    expect(eco.getGold()).toBe(100);
  });

  it('passive income adds gold per second', () => {
    const eco = new EconomySystem(100, 1);
    eco.update(1.0); // 1 second = 3 gold/sec at age 1
    expect(eco.getGold()).toBeGreaterThan(100);
  });

  it('canAfford returns true when gold sufficient', () => {
    const eco = new EconomySystem(100, 1);
    expect(eco.canAfford(50)).toBe(true);
    expect(eco.canAfford(200)).toBe(false);
  });

  it('spend deducts gold correctly', () => {
    const eco = new EconomySystem(100, 1);
    eco.spend(30);
    expect(eco.getGold()).toBe(70);
  });

  it('passive income scales with age', () => {
    const eco1 = new EconomySystem(0, 1); // age 1: 3 gold/sec
    const eco4 = new EconomySystem(0, 4); // age 4: 6 gold/sec
    eco1.update(1.0);
    eco4.update(1.0);
    expect(eco4.getGold()).toBeGreaterThan(eco1.getGold());
  });
});
