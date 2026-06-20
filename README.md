# Carbon Footprint Intelligence System

A prototype greenhouse gas accounting and reporting platform for Small and Medium Enterprises (SMEs) in Portugal.

Scoped to **Scope 1 and Scope 2** emissions under the **GHG Protocol Corporate Standard**, with conceptual alignment to the **EU Corporate Sustainability Reporting Directive (CSRD)** and **ESRS E1 Climate Change** disclosure requirements.

Developed by **Aabiskar Sharma**.

---

## Features

### Multi-Facility Boundary Management
- Define company profile: name, industry sector, employee count, and reporting year
- Add and manage multiple facilities (office, warehouse, vehicle fleet, retail, production)
- All activity data is scoped to a specific facility for boundary-level reporting

### Scope 1 and Scope 2 Activity Logging
- **Scope 1 Stationary**: Natural gas and heating fuel combustion at fixed facilities
- **Scope 1 Mobile**: Diesel and petrol consumption from company vehicle fleets
- **Scope 2 Electricity**: Grid electricity consumption using the Portuguese DGEG residual mix factor

Emission factors sourced from DGEG (Portugal grid) and IPCC default combustion values, expressed in metric units (kWh, litres, kg CO2e).

> ⚠️ Emission factors are subject to annual revision. Verify against current-year DGEG and IPCC publications before using in any official filing or academic citation.

### Data Entry Options
- **Manual entry**: Single-activity form with facility selector and live emissions preview
- **Utility bill scan**: Upload an EDP, Endesa, or Galp invoice (PDF or image) — Gemini AI extracts billing period, consumption (kWh), and cost for user review before committing
- **CSV bulk import**: Upload historical activity data in bulk (date, facility, category, value, unit)

Extracted bill data is never auto-saved — it always goes through a human review and confirmation step.

### AI Features (requires Gemini API key)
- **AI Insights Report**: Generates a Scope 1 + Scope 2 breakdown with year-over-year comparison and business-operational recommendations (renewable tariff switching, fleet electrification, HVAC efficiency)
- **AI Carbon Coach**: Interactive chat assistant grounded in the company's own activity data

### Reporting and Export
- Dashboard charts with Scope 1 vs Scope 2 breakdown by facility and category
- Year-over-year comparison when more than one year of data exists
- CSV export structured loosely around ESRS E1 disclosure categories, clearly labelled as a draft internal estimate, not an audited disclosure

### Access and Data Management
- Simple login form with session persistence via localStorage (prototype-grade, not production auth)
- Sample data available via an explicit "Load Sample Data" action — new pilot companies start with an empty dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion |
| Backend | Node.js, Express, TypeScript |
| AI | Google Gemini API (`gemini-2.0-flash`) via `@google/genai` |
| Data | localStorage session persistence |

---

## Installation

### Prerequisites
- Node.js v18 or above
- npm v9 or above
- A Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 1. Clone the repository
```bash
git clone https://github.com/AabiskarS/CARBON-INTELLIGENCE.git
cd CARBON-INTELLIGENCE
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Create a `.env` file in the project root (see `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run in development
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 5. Build for production
```bash
npm run build
npm run start
```

### Running in GitHub Codespaces
Add `GEMINI_API_KEY` as a repository secret under **Settings → Codespaces → Secrets**, then rebuild the container. The key is injected automatically at startup.

---

## Compliance References

- **GHG Protocol**: [Corporate Accounting and Reporting Standard](https://ghgprotocol.org/corporate-standard)
- **CSRD**: [Directive (EU) 2022/2464](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464)
- **ESRS E1**: [EFRAG European Sustainability Reporting Standards](https://www.efrag.org/en/projects/esrs-e1-climate-change)
- **DGEG**: [Portuguese grid emission factors](https://www.dgeg.gov.pt)
- **IPCC**: [Guidelines for National Greenhouse Gas Inventories](https://www.ipcc-nggip.iges.or.jp)

---

## Limitations

This is a research prototype built for academic evaluation. It is explicitly **not**:
- An audited or assurance-grade CSRD compliance tool
- A multi-tenant production system
- A substitute for professional carbon accounting advice

Authentication is prototype-only. Do not use this system to store real sensitive business data in its current form.

---
