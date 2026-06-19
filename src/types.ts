/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Facility {
  id: string;
  name: string;
  type: 'office' | 'warehouse' | 'vehicle-fleet' | 'retail' | 'production';
}

export interface Company {
  name: string;
  industrySector: string;
  employeeCount: number;
  reportingYear: number;
  facilities: Facility[];
}

export type ActivityCategory = 'scope1_stationary' | 'scope1_mobile' | 'scope2_electricity';

export interface Activity {
  id: string;
  date: string; // YYYY-MM-DD
  facilityId: string;
  category: ActivityCategory;
  subType: 'electricity' | 'diesel' | 'petrol' | 'natural_gas';
  value: number; // in kWh or litres
  unit: 'kWh' | 'litres';
  emissions: number; // in kg CO2e
  cost?: number; // in EUR
  description?: string;
  isExtracted?: boolean; // Flaq if pre-filled from utility bill
}

export interface EmissionFactor {
  scope: 1 | 2;
  factor: number; // kg CO2e per unit
  unit: 'kWh' | 'litres';
  description: string;
}

/**
 * Portuguese and IPCC-based emission factors (2025/2026 reference figures).
 * 
 * CRITICAL WARNING FOR THESIS AND AUDIT WRITING:
 * TODO: These emission factors are subject to annual revisions such as:
 * - Portuguese grid electricity factor is released annually by DGEG (Direção-Geral de Energia e Geologia).
 * - IPCC (Intergovernmental Panel on Climate Change) mobile and stationary fuel factors are subject to updates.
 * Verify these specific coefficients against the official current-year documents before using them in official filings or academic references.
 */
export const EMISSION_FACTORS: Record<Activity['subType'], EmissionFactor> = {
  electricity: {
    scope: 2,
    factor: 0.235, // kg CO2e/kWh - standard Portuguese residual grid mix estimate (DGEG)
    unit: 'kWh',
    description: 'DGEG Residual Grid Emission Factor for Portugal'
  },
  diesel: {
    scope: 1,
    factor: 2.68, // kg CO2e/litre - IPCC default mobile/stationary combustion
    unit: 'litres',
    description: 'IPCC Default Factor for Diesel fuel'
  },
  petrol: {
    scope: 1,
    factor: 2.31, // kg CO2e/litre - IPCC default mobile combustion
    unit: 'litres',
    description: 'IPCC Default Factor for Gasoline/Petrol fuel'
  },
  natural_gas: {
    scope: 1,
    factor: 0.202, // kg CO2e/kWh - IPCC default stationary combustion of natural gas (converted to kWh gross/net basis)
    unit: 'kWh',
    description: 'IPCC Natural Gas combustion conversion factor'
  }
};

export interface SessionState {
  isAuthenticated: boolean;
  username: string | null;
  company: Company | null;
  activities: Activity[];
}
