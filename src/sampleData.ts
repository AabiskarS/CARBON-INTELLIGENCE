/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Company, Activity, EMISSION_FACTORS } from "./types";

export const SAMPLE_COMPANY: Company = {
  name: "Serralharia Central de Aveiro, Lda.",
  industrySector: "Metalworking & Industrial Production",
  employeeCount: 45,
  reportingYear: 2026,
  facilities: [
    { id: "fac-1", name: "Aveiro Production Plant", type: "production" },
    { id: "fac-2", name: "Central Distribution Warehouse", type: "warehouse" },
    { id: "fac-3", name: "Lisbon Sales Office", type: "office" },
    { id: "fac-4", name: "Commercial & Delivery Road Fleet", type: "vehicle-fleet" }
  ]
};

export const SAMPLE_ACTIVITIES: Activity[] = [
  // Aveiro Plant - High Scope 2 and Stationary combustion
  {
    id: "act-1",
    date: "2026-01-15",
    facilityId: "fac-1",
    category: "scope2_electricity",
    subType: "electricity",
    value: 12500, // 12,500 kWh electricity
    unit: "kWh",
    emissions: 12500 * EMISSION_FACTORS.electricity.factor, // DGEG Portugal
    cost: 1875,
    description: "January grid power consumption invoice"
  },
  {
    id: "act-2",
    date: "2026-02-18",
    facilityId: "fac-1",
    category: "scope2_electricity",
    subType: "electricity",
    value: 11800,
    unit: "kWh",
    emissions: 11800 * EMISSION_FACTORS.electricity.factor,
    cost: 1770,
    description: "February electricity bill"
  },
  {
    id: "act-3",
    date: "2026-01-20",
    facilityId: "fac-1",
    category: "scope1_stationary",
    subType: "natural_gas",
    value: 4200, // 4,200 kWh natural gas
    unit: "kWh",
    emissions: 4200 * EMISSION_FACTORS.natural_gas.factor, // IPCC Gas
    cost: 340,
    description: "Industrial heat natural gas feed (direct emission)"
  },
  
  // Warehouse electricity and heating
  {
    id: "act-4",
    date: "2026-01-10",
    facilityId: "fac-2",
    category: "scope2_electricity",
    subType: "electricity",
    value: 3900,
    unit: "kWh",
    emissions: 3900 * EMISSION_FACTORS.electricity.factor,
    cost: 585,
    description: "Warehouse logistics hub electricity bill"
  },
  
  // Roads Logistics - diesel delivery fleet
  {
    id: "act-5",
    date: "2026-01-28",
    facilityId: "fac-4",
    category: "scope1_mobile",
    subType: "diesel",
    value: 850, // 850 Litres of diesel
    unit: "litres",
    emissions: 850 * EMISSION_FACTORS.diesel.factor, // IPCC Diesel
    cost: 1360,
    description: "Primary distribution fleet diesel refills"
  },
  {
    id: "act-6",
    date: "2026-02-25",
    facilityId: "fac-4",
    category: "scope1_mobile",
    subType: "diesel",
    value: 920, // 920 Litres
    unit: "litres",
    emissions: 920 * EMISSION_FACTORS.diesel.factor,
    cost: 1472,
    description: "February distribution diesel refuels"
  },

  // Road fleet - petrol sales team
  {
    id: "act-7",
    date: "2026-02-10",
    facilityId: "fac-4",
    category: "scope1_mobile",
    subType: "petrol",
    value: 310, // 310 Litres petrol
    unit: "litres",
    emissions: 310 * EMISSION_FACTORS.petrol.factor, // IPCC Gasoline
    cost: 527,
    description: "Sales executive division gasoline expenses"
  }
];
