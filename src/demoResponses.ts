/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Company, Activity } from "./types";

export const DEMO_COMPANY: Company = {
  name: "Demo Enterprises, Lda.",
  industrySector: "Software, Tech & Shared Service Offices",
  employeeCount: 28,
  reportingYear: 2026,
  facilities: [
    { id: "fac-1", name: "Lisbon Tech Hub (HQ)", type: "office" },
    { id: "fac-2", name: "Porto Regional Operations", type: "office" },
    { id: "fac-3", name: "Commercial & Delivery Road Fleet", type: "vehicle-fleet" }
  ]
};

export const DEMO_ACTIVITIES: Activity[] = [
  {
    id: "demo-act-1",
    date: "2026-01-15",
    facilityId: "fac-1",
    category: "scope2_electricity",
    subType: "electricity",
    value: 5200,
    unit: "kWh",
    emissions: 1222, // 5200 * 0.235
    cost: 780,
    description: "January Lisbon HQ electricity grid consumption (EDP Comercial)",
    isExtracted: true
  },
  {
    id: "demo-act-2",
    date: "2026-01-20",
    facilityId: "fac-1",
    category: "scope1_stationary",
    subType: "natural_gas",
    value: 1450,
    unit: "kWh",
    emissions: 292.9, // 1450 * 0.202
    cost: 165,
    description: "Lisbon office HVAC winter heating gas feed"
  },
  {
    id: "demo-act-3",
    date: "2026-01-28",
    facilityId: "fac-3",
    category: "scope1_mobile",
    subType: "diesel",
    value: 380,
    unit: "litres",
    emissions: 1018.4, // 380 * 2.68
    cost: 610,
    description: "Support van logistics diesel refuel batches"
  },
  {
    id: "demo-act-4",
    date: "2026-02-12",
    facilityId: "fac-2",
    category: "scope2_electricity",
    subType: "electricity",
    value: 3850,
    unit: "kWh",
    emissions: 904.75, // 3850 * 0.235
    cost: 575,
    description: "February Porto regional office power bill"
  },
  {
    id: "demo-act-5",
    date: "2026-02-22",
    facilityId: "fac-3",
    category: "scope1_mobile",
    subType: "petrol",
    value: 210,
    unit: "litres",
    emissions: 485.1, // 210 * 2.31
    cost: 360,
    description: "Executive hybrid car petrol refill"
  }
];

export const DEMO_BILL_EXTRACTION = {
  billingPeriod: "01/01/2026 - 31/01/2026",
  consumptionKWh: 4850,
  totalCostEur: 728.5,
  fuelType: "electricity",
  extractedSuccessfully: true,
  explanation: "[Demo Mode] Extracted from EDP Comercial utility bill invoice: Active electricity consumption 4,850 kWh, total cost €728.50."
};

export const DEMO_INSIGHTS_REPORT = {
  executiveSummary: "Demo Enterprises, Lda. recorded total operational emissions of 3.92 tCO2e across Scope 1 (Direct Stationary & Mobile) and Scope 2 (Purchased Electricity) during the 2026 reporting period. Scope 2 electricity is the primary carbon driver representing 54% of total greenhouse gas impact. Adopting targeted energy procurement and fleet electrification levers will position the SME in full alignment with voluntary CSRD / ESRS E1 disclosure recommendations.",
  scopeAnalysis: {
    scope1Assessment: "Scope 1 direct emissions total 1.79 tCO2e, split between building heating (natural gas) and commercial road travel (diesel & petrol). Mobile combustion accounts for 84% of Scope 1 output, making corporate transport electrification the highest-leverage internal mitigation path.",
    scope2Assessment: "Scope 2 location-based electricity emissions total 2.13 tCO2e across the Lisbon and Porto facilities. Switching to 100% certified Garantias de Origem (d'Origem) renewable electricity contracts will reduce Scope 2 market-based emissions to 0 kg CO2e immediately."
  },
  recommendations: [
    {
      title: "Transition to 100% Renewable Electricity (Garantias de Origem)",
      impactScope: "Scope 2 (Electricity)",
      leverType: "tariff_switch" as const,
      impactRangeQualitative: "High qualitative abatement (eliminates ~54% of organizational footprint)",
      description: "Migrate EDP or Iberdrola commercial power contracts to certified 100% renewable generation tariffs backed by Portuguese EEGO Garantias de Origem certificates."
    },
    {
      title: "Commercial Fleet Electrification & EV Charging Infrastructure",
      impactScope: "Scope 1 (Mobile Combustion)",
      leverType: "electrification" as const,
      impactRangeQualitative: "Significant emission reduction over 2-year cycle",
      description: "Replace remaining diesel support vans with battery-electric vehicles (BEVs) and install Level 2 smart chargers at the Lisbon HQ, phasing out recurring fossil fuel combustion."
    },
    {
      title: "High-Efficiency HVAC Heat Pump Retrofit",
      impactScope: "Scope 1 (Stationary Combustion)",
      leverType: "hvac_upgrade" as const,
      impactRangeQualitative: "Moderate qualitative savings and winter cost reduction",
      description: "Replace legacy natural gas space heaters with inverter air-to-air heat pumps (SCOP > 4.2), ending direct fossil gas combustion in office spaces."
    },
    {
      title: "Smart Lighting & Automated Climate Setback Controls",
      impactScope: "Scope 2 (Electricity)",
      leverType: "other" as const,
      impactRangeQualitative: "8–12% electricity kWh reduction",
      description: "Install PIR occupancy sensors and programmable thermostats to avoid off-hours baseline vampire power draws in regional facilities."
    }
  ],
  esrsAlignDocs: "For CSRD / ESRS E1 Climate Change compliance, Demo Enterprises should maintain activity documentation (utility invoices and fuel receipts) with emission calculation methodologies aligned with GHG Protocol Corporate Standard. Transition to market-based dual reporting once Guarantee of Origin certificates are active."
};

export function getDemoChatResponse(prompt: string, historyLength: number): string {
  const lower = prompt.toLowerCase();

  if (lower.includes("scope 2") || lower.includes("electricity") || lower.includes("power") || lower.includes("edp") || lower.includes("tariff")) {
    return `### Scope 2 Electricity Abatement Strategy for Demo Enterprises, Lda.

Based on your current ledger, **Scope 2 Purchased Electricity** accounts for **2,126 kg CO2e** (54% of total organizational footprint).

**Recommended Action Plan:**
1. **Switch to 100% Green Tariff (*Garantias de Origem*)**:
   - Request certified renewable supply with Portuguese EEGO (*Entidade Emissora de Garantias de Origem*) certificates from EDP Comercial or Iberdrola.
   - Under the GHG Protocol Corporate Standard market-based accounting method, this directly brings your **Scope 2 market-based emissions down to 0 kg CO2e**.
2. **Sub-metering & Peak Optimization**:
   - The Lisbon HQ uses 5,200 kWh/month. Installing smart sub-meters can isolate HVAC vs. IT server baseline consumption.
3. **Official Reference Factor**:
   - Current Portuguese grid emission factor applied is **0.235 kg CO2e/kWh** (DGEG reference).

Would you like advice on preparing the dual-reporting disclosure table for ESRS E1-6?`;
  }

  if (lower.includes("fleet") || lower.includes("diesel") || lower.includes("petrol") || lower.includes("car") || lower.includes("vehicle") || lower.includes("mobile")) {
    return `### Fleet & Transport Decarbonization Plan

Your road vehicles currently generate **1,503 kg CO2e** across diesel (380 L) and petrol (210 L) operations, making mobile combustion the largest component of your Scope 1 footprint.

**Strategic Levers:**
- **Short-Term (0-6 months)**:
  - Consolidate corporate fuel cards (Galp/Repsol/BP) to automate litre tracking and avoid manual receipt estimation.
  - Implement eco-driving training for commercial delivery routes (typically yields 7-10% fuel savings).
- **Medium-Term (6-18 months)**:
  - Transition lease agreements to Battery Electric Vehicles (BEVs). Portuguese corporate tax regulations (*Tributação Autónoma*) offer significant tax exemptions for 100% electric company vehicles.
  - Install Level 2 (7.4 kW to 22 kW) charging stations at the Lisbon Tech Hub facility.

Official emission factors used:
- **Diesel**: 2.68 kg CO2e/litre (IPCC standard)
- **Petrol**: 2.31 kg CO2e/litre (IPCC standard)`;
  }

  if (lower.includes("csrd") || lower.includes("esrs") || lower.includes("reporting") || lower.includes("regulation") || lower.includes("audit") || lower.includes("compliance")) {
    return `### EU CSRD & ESRS E1 SME Preparedness

For a Portuguese enterprise with 28 employees, voluntary alignment with the **EFRAG VSME (Voluntary SME Standard)** provides a significant competitive advantage for banking covenants and supply-chain tenders.

**Key ESRS E1 Disclosure Requirements Covered:**
- **ESRS E1-6 (Gross Scopes 1 and 2 GHG Emissions)**:
  - Scope 1 Direct Emissions: Stationary (Natural Gas) + Mobile (Diesel/Petrol).
  - Scope 2 Indirect Emissions: Grid Electricity (location-based calculation).
- **Documentation Verification Trail**:
  - Utility invoices and fuel logs are recorded with dates, facility mappings, and emission factors.
- **Next Steps for CSRD Readiness**:
  - Export your emissions ledger via the **CSRD E1 Exporter** tab in CSV format.
  - Establish a base year (2026) to track annual reduction targets.

Let me know if you would like me to review your facility breakdown or help draft an executive decarbonization policy!`;
  }

  // General conversational or follow-up response
  if (historyLength <= 1) {
    return `Hello! As your Corporate Carbon Coach for **Demo Enterprises, Lda.**, I've analyzed your current 2026 ledger:

- **Total Emissions**: ~3.92 tonnes CO2e
- **Scope 1 (Direct)**: 1.79 tCO2e (Stationary natural gas + Mobile road fuels)
- **Scope 2 (Electricity)**: 2.13 tCO2e (Lisbon HQ & Porto office)

The most impactful immediate step is addressing your purchased electricity by requesting *Garantias de Origem* (d'Origem) certification, followed by a phased electrification of your commercial transport fleet.

What specific area would you like to explore today?`;
  }

  return `Thank you for the question regarding your corporate carbon strategy.

For **Demo Enterprises, Lda.**, operational decarbonization should follow the mitigation hierarchy:
1. **Avoid & Reduce**: Conduct energy audits at the Lisbon Tech Hub and Porto Regional Operations to eliminate non-working-hours phantom loads.
2. **Electrify**: Replace fossil fuels (natural gas space heating and fleet diesel) with electric heat pumps and BEV vehicles.
3. **Procure Clean**: Ensure all purchased electricity is certified with renewable guarantee of origin certificates.

All calculations in this system follow the GHG Protocol Corporate Accounting Standard and match Portuguese national reporting guidelines (DGEG/APA). How else can I assist your sustainability team?`;
}
