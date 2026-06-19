# CarbonIntelligence: SME ESG Accounting Port

**CarbonIntelligence** is a comprehensive, production-ready, full-stack greenhouse gas (GHG) accounting and sustainability compliance platform engineered specifically for Small and Medium Enterprises (SMEs) in Portugal. Framed around the **GHG Protocol Corporate Standard (Scope 1 and Scope 2)**, it streamlines organizational boundary mappings, transactional carbon ledgers, automated utility invoice ingestion, and compliance reporting under the **EU Corporate Sustainability Reporting Directive (CSRD)** and **ESRS E1 Climate Change** guidelines.

Developed and maintained exclusively by **AABISKAR SHARMA**.

---

## 🌟 Key Capabilities

### 1. Multi-Facility Boundary & Micro-Asset Mapping
* **Organizational Boundary Control**: Map business assets dynamically across multiple physical locations (e.g., manufacturing facilities, centralized offices, regional warehouses).
* **Scope 1 Stationary Burner Accounting**: Record and calculate direct fuel consumption (natural gas, heating diesel) using precise volumetric and energy conversion schemas.
* **Scope 1 Mobile Fleet Tracking**: Account for internal sales and transport logistics runs with automatic fuel emission rates (diesel and petrol).
* **Scope 2 Indirect Electricity Inventory**: Compute indirect consumption aligned with real-time **DGEG (Direção-Geral de Energia e Geologia)** residual grid mix coefficients in Portugal.

### 2. Multi-Format Intelligent Data Entry
* **Manual Log Booking**: User-friendly single-entry logging with responsive error checks, automatic conversions, and timestamp records.
* **Multimodal Invoice Scanning (EDP/Iberdrola/Endesa AI Bill Scan)**: Powered by server-side advanced multi-modal models to parse standard Portuguese electricity and gas utility PDF receipts, extracting absolute consumption units (kWh/litres), costs, billing periods, and facility mapping automatically.
* **Bulk CSV Spreadsheet Uploader**: High-performance pipeline to instantly parse and validate hundreds of historical ledger lines, issuing targeted validation warnings on format, coordinates, or dates.

### 3. Generative ESG Business Assistance & Abatement
* **AI Corporate ESG Insights (ESRS E1)**: On-demand synthesis of Double-Materiality qualitative reports outlining specific climate abatement levers, local Portuguese tariff adjustments, and CSRD compliance guidance.
* **SME Climate Coach**: Interactive chat assistant grounded in active inventory statistics to suggest HVAC upgrades, fleet electrification plans, and operational savings.

### 4. Interactive Analytics & Professional Exporter
* **Operational Carbon Analytics**: Fluid, real-time charts breaking down grid emission mixes, YoY baseline changes, and specific facility asset carbon concentrations.
* **CSRD/ESRS E1 Compliance Package Exporter**: One-click download of compliant, audit-ready CSV sheets and structured, printable PDF reporting files.

---

## 🎨 Visual Identity & Recent Styling Upgrades

* **Integrated Forest-Green & Eco accents**: Refined with deep-slate brand headers paired with vibrant teal highlights.
* **Custom Main Workspace Canvas**: Styled with a solid, focus-oriented pasture-green background (`#96c192`) on the main viewer mainspring, creating a highly comfortable, eye-safe environment for deep financial and environmental audits.
* **Audited Corporate Boundaries Banner**: Framed with a prominent organic coniferous-green background banner (`#345d00`) on active seed and sandbox status blocks to ensure boundaries configuration is always visible to operators.

---

## 🚀 System Architecture & Technical Stack

The system is constructed with a modern, full-stack unified architecture:

* **Client**: React 18+ with TypeScript, Vite, Tailwind CSS, Lucide Icons, and beautiful micro-animations using Framer Motion.
* **Server**: Node.js and Express.js backend serving as a secure proxy API gateway to run advanced model scanning and analysis without exposing sensitive credentials down to client browsers.
* **Data Integration**: In-app active session persistence using client `localStorage` to safeguard operational audit data from browser refreshes.

---

## 🛠️ Step-by-Step Installation & Local Run

### Prerequisites
* **Node.js** (v18.x or above matching standard server environments)
* **npm** (v9.x or above)

### 1. Clone the Workspace
```bash
git clone https://github.com/aabiskar-sharma/carbon-intelligence.git
cd carbon-intelligence
```

### 2. Install Project Dependencies
Run the installation script to populate local packages:
```bash
npm install
```

### 3. Supply Your Local Configuration Environment
Create a `.env` file in the project root directory and feed the necessary secrets (refer to `.env.example` as a template):
```env
# Server Security Key
GEMINI_API_KEY=your_secured_gemini_api_key_goes_here
```

### 4. Run the Local Development Environment
Launch the concurrent developer stack:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to interact with the system.

### 5. Build for Production Compilation
Compile client assets into optimized, statically served files and bundle the backend TypeScript server into a unified server distribution program:
```bash
npm run build
npm run start
```

---

## 📈 Compliance Standards Reference

* **GHG Protocol Standard**: Calculations are fully integrated using absolute, standardized equivalent calculations (`kg CO2e` and `t CO2e`).
* **EU CSRD (ESRS E1)**: Structure maps directly into standard mandatory disclosure metrics under sub-pillar disclosures regarding corporate climate change adjustments for SMEs active in the European economic boundaries.

---
*Created with care, commitment to sustainability, and precision engineering by **AABISKAR SHARMA**.*
