import { describe, it, expect } from 'vitest';
import { calculateEmissions, getEmissionFactor } 
  from '../src/lib/emissions';

describe('calculateEmissions', () => {

  it('calculates electricity correctly', () => {
    // 1000 kWh × 0.235 kg CO2e/kWh = 235
    expect(calculateEmissions(1000, 'electricity')).toBe(235);
  });

  it('calculates diesel correctly', () => {
    // 100 L × 2.68 kg CO2e/L = 268
    expect(calculateEmissions(100, 'diesel')).toBe(268);
  });

  it('calculates petrol correctly', () => {
    // 50 L × 2.31 kg CO2e/L = 115.5
    expect(calculateEmissions(50, 'petrol')).toBe(115.5);
  });

  it('calculates natural gas correctly', () => {
    // 500 kWh × 0.202 kg CO2e/kWh = 101
    expect(calculateEmissions(500, 'natural_gas')).toBe(101);
  });

  it('returns 0 for zero consumption', () => {
    expect(calculateEmissions(0, 'electricity')).toBe(0);
    expect(calculateEmissions(0, 'diesel')).toBe(0);
  });

  it('rounds to two decimal places', () => {
    // 1.234 × 0.235 = 0.28999 → rounds to 0.29
    expect(calculateEmissions(1.234, 'electricity')).toBe(0.29);
  });

  it('handles very large values without crashing', () => {
    const result = calculateEmissions(1000000, 'diesel');
    expect(result).toBe(2680000);
  });

});

describe('getEmissionFactor', () => {

  it('returns the correct factor for electricity', () => {
    expect(getEmissionFactor('electricity')).toBe(0.235);
  });

  it('returns the correct factor for diesel', () => {
    expect(getEmissionFactor('diesel')).toBe(2.68);
  });

  it('returns the correct factor for petrol', () => {
    expect(getEmissionFactor('petrol')).toBe(2.31);
  });

  it('returns the correct factor for natural gas', () => {
    expect(getEmissionFactor('natural_gas')).toBe(0.202);
  });

  it('returns 0 for an unknown sub-type', () => {
    expect(getEmissionFactor('unknown' as any)).toBe(0);
  });

});
