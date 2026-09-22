import { Activity } from '../types';
import { EMISSION_FACTORS } from '../types';

/**
 * Calculate CO2e emissions for a given activity value and sub-type.
 * Returns kg CO2e, rounded to 2 decimal places.
 */
export function calculateEmissions(
  value: number,
  subType: Activity['subType']
): number {
  const factor = EMISSION_FACTORS[subType]?.factor ?? 0;
  return Math.round(value * factor * 100) / 100;
}

/**
 * Get the emission factor for a sub-type.
 */
export function getEmissionFactor(
  subType: Activity['subType']
): number {
  return EMISSION_FACTORS[subType]?.factor ?? 0;
}
