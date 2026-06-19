/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Company, Activity, EMISSION_FACTORS } from "../types";
import { Download, FileSpreadsheet, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface ReportExporterProps {
  company: Company;
  activities: Activity[];
}

export default function ReportExporter({ company, activities }: ReportExporterProps) {
  const [successNotif, setSuccessNotif] = useState(false);

  // Filter current year
  const currentLogs = activities.filter(
    (a) => new Date(a.date).getFullYear() === company.reportingYear
  );

  // Filter prior year
  const priorLogs = activities.filter(
    (a) => new Date(a.date).getFullYear() === (company.reportingYear - 1)
  );

  // Current statistics
  const currentTotalScope1 = currentLogs
    .filter(a => a.category.startsWith("scope1"))
    .reduce((acc, curr) => acc + curr.emissions, 0);

  const currentTotalScope2 = currentLogs
    .filter(a => a.category.startsWith("scope2"))
    .reduce((acc, curr) => acc + curr.emissions, 0);

  const currentTotal = currentTotalScope1 + currentTotalScope2;

  const stationaryCombustion = currentLogs
    .filter(a => a.category === "scope1_stationary")
    .reduce((acc, curr) => acc + curr.emissions, 0);

  const mobileCombustion = currentLogs
    .filter(a => a.category === "scope1_mobile")
    .reduce((acc, curr) => acc + curr.emissions, 0);

  // Prior statistics
  const priorTotal = priorLogs.reduce((acc, curr) => acc + curr.emissions, 0);

  const handleExportCSV = () => {
    // Compile structured CSV matching standard ESRS E1 draft formats
    let csvContent = "";

    // Header segment
    csvContent += "SME CARBON AUDITOR - ESRS E1 CLIMATE DISCLOSURE STATEMENT (DRAFT ESTIMATE)\n";
    csvContent += `Organization Legal Entity Name,${company.name}\n`;
    csvContent += `Industry Sector Segment,${company.industrySector}\n`;
    csvContent += `Employee Census FTE,${company.employeeCount}\n`;
    csvContent += `Operational Boundary Controlled Facilities,${company.facilities.length} registered assets\n`;
    csvContent += `Target Corporate Reporting Year,${company.reportingYear}\n`;
    csvContent += "Accounting Standards Alignment,GHG Protocol Scope 1 & 2 • Dual Materiality CSRD Concepts\n";
    csvContent += "Auditing status,UNAUDITED INTERNAL ESTIMATE (Contains verify warnings in thesis citations)\n";
    csvContent += "\n";

    // Executive emissions numbers
    csvContent += "MANDATORY CORP FOOTPRINT DISCLOSURE STATEMENT\n";
    csvContent += "Disclosure Category,Category Scope,Value Equivalent (kg CO2e),Emissions (metric tonnes CO2e)\n";
    csvContent += `Scope 1 Stationary Combustion (Natural Gas / Heating Oil),Direct Scope 1,${stationaryCombustion.toFixed(1)},${(stationaryCombustion / 1000).toFixed(3)}\n`;
    csvContent += `Scope 1 Mobile Combustion (Road logistics & sales fleet),Direct Scope 1,${mobileCombustion.toFixed(1)},${(mobileCombustion / 1000).toFixed(3)}\n`;
    csvContent += `Scope 2 Purchased Grid Electricity Mix,Indirect Scope 2,${currentTotalScope2.toFixed(1)},${(currentTotalScope2 / 1000).toFixed(3)}\n`;
    csvContent += `ORGANIZATIONAL SCOPE TOTALS,Scope 1 + Scope 2,${currentTotal.toFixed(1)},${(currentTotal / 1000).toFixed(3)}\n`;
    csvContent += "\n";

    // Year on Year comparative trends
    csvContent += "YEAR-OVER-YEAR CLIMATE BENCHMARKS\n";
    csvContent += "Calendar Year Period,Absolute Emissions (tonnes CO2e),Baseline Delta % Change\n";
    csvContent += `${company.reportingYear},${(currentTotal / 1000).toFixed(3)} t CO2e,${
      priorTotal > 0 ? (((currentTotal - priorTotal) / priorTotal) * 100).toFixed(1) + "%" : "Baseline Yr"
    }\n`;
    if (priorTotal > 0) {
      csvContent += `${company.reportingYear - 1},${(priorTotal / 1000).toFixed(3)} t CO2e,Parent Baseline Year\n`;
    }
    csvContent += "\n";

    // Boundary Mapped Facilities Directory
    csvContent += "BOUNDARY FACILITIES DIRECTORY - BREAKDOWN COHERENCE\n";
    csvContent += "Facility ID,Facility Asset Name,Asset Functional Category,Emissions contribution (kg CO2e),Corporate Mix Percent\n";
    
    company.facilities.forEach((fac) => {
      const facEmissions = currentLogs.filter(a => a.facilityId === fac.id).reduce((s, curr) => s + curr.emissions, 0);
      const mixPct = currentTotal > 0 ? (facEmissions / currentTotal) * 100 : 0;
      csvContent += `${fac.id},${fac.name},${fac.type},${facEmissions.toFixed(1)},${mixPct.toFixed(1)}%\n`;
    });

    // Create blobs and execute browser downloads
    const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Carbon_SME_ESRS_E1_${company.reportingYear}_Draft.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Notify success
    setSuccessNotif(true);
    setTimeout(() => setSuccessNotif(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upper header */}
      <div className="md:flex md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight sm:text-3xl">
            CSRD / ESRS E1 Reporting Exporter
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Export structured climate disclosure packages loosely mapped to legal EU ESRS E1 definitions.
          </p>
        </div>
      </div>

      {successNotif && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-850 text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-5 w-5 text-teal-650 flex-shrink-0" />
          <span>ESRS E1 structured carbon inventory sheet successfully downloaded to your downloads folder!</span>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-3xl overflow-hidden">
        <div className="p-8 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Release Corporate Accounting Report</h3>
            <p className="text-xs text-slate-400">Download formatted files ready for spreadsheet integrations or reporting audits.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download ESRS CSV Sheet
            </button>
            <button
              onClick={window.print}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <FileText className="h-4 w-4" />
              Generate Print PDF
            </button>
          </div>
        </div>

        {/* Preview layout of report */}
        <div className="p-8 space-y-6 max-h-160 overflow-y-auto scrollbar-thin print:max-h-none print:overflow-visible">
          {/* Unaudited Stamp */}
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900 uppercase">UNAUDITED INTERNAL DRAFT DISCLOSURE ESTIMATE ONLY</p>
              <p className="text-xs text-slate-500 mt-1">
                This document contains internal corporate boundaries estimates aligned with GHG Protocol. This represents a preliminary audit draft under CSRD E1 climate Change criteria before external certified review.
              </p>
            </div>
          </div>

          <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-100/30 space-y-6">
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <div>
                <h4 className="font-bold text-lg text-slate-850 font-sans tracking-tight">{company.name}</h4>
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">{company.industrySector}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-slate-900 text-white rounded">
                  ESRS E1 Draft
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Reporting Period: {company.reportingYear}</p>
              </div>
            </div>

            {/* Part 1: Mandatory Scope Indicators */}
            <div className="space-y-3">
              <h5 className="text-xs uppercase font-bold text-slate-450 tracking-wider">A. Boundary emissions totals (Metric tonnes CO2e)</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Scope 1 Direct Direct Emissions</span>
                  <span className="text-xl font-bold font-mono text-slate-850">{(currentTotalScope1 / 1000).toFixed(3)} t CO2e</span>
                  <div className="mt-1.5 text-[11px] text-slate-450 space-y-0.5 border-t border-slate-100 pt-1.5">
                    <p>Stationary Burners: {(stationaryCombustion / 1000).toFixed(3)} t</p>
                    <p>Mobile Vehicle Fleet: {(mobileCombustion / 1005).toFixed(3)} t</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Scope 2 Electricity indirect Emissions</span>
                  <span className="text-xl font-bold font-mono text-slate-850">{(currentTotalScope2 / 1000).toFixed(3)} t CO2e</span>
                  <div className="mt-1.5 text-[11px] text-slate-450 space-y-0.5 border-t border-slate-100 pt-1.5">
                    <p>DGEG-regulated Portugal Residual Grid: { (currentTotalScope2 / 1000).toFixed(3)} t</p>
                    <p>Tariff contract structure: Standard billing mix</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Part 2: YoY Comparison */}
            <div className="space-y-3">
              <h5 className="text-xs uppercase font-bold text-slate-450 tracking-wider">B. Historical Performance Benchmark</h5>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Total Absolute Carbon Footprint (Tone equivalent)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Slight improvements should align with operational equipment efficiency changes.</p>
                </div>
                <div className="text-right font-mono font-bold text-xs text-slate-800 space-y-1">
                  <p>{company.reportingYear}: {(currentTotal / 1000).toFixed(3)} t</p>
                  {priorTotal > 0 && <p className="text-slate-400 text-[11px]">{company.reportingYear - 1}: {(priorTotal / 1000).toFixed(3)} t (Baseline)</p>}
                </div>
              </div>
            </div>

            {/* Part 3: Mapped controlled boundaries */}
            <div className="space-y-3">
              <h5 className="text-xs uppercase font-bold text-slate-450 tracking-wider">C. Controlled corporate asset inventory</h5>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wide">Facility Asset Name</th>
                      <th className="px-4 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wide">Type Category</th>
                      <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wide">Absolute (kg CO2e)</th>
                      <th className="px-4 py-2.5 text-right font-bold text-slate-500 uppercase tracking-wide">Corporate Mix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {company.facilities.map((fac) => {
                      const facEmissions = currentLogs.filter(a => a.facilityId === fac.id).reduce((s, curr) => s + curr.emissions, 0);
                      const mixPct = currentTotal > 0 ? (facEmissions / currentTotal) * 100 : 0;
                      return (
                        <tr key={fac.id}>
                          <td className="px-4 py-2.5 font-semibold text-slate-700">{fac.name}</td>
                          <td className="px-4 py-2.5 capitalize text-slate-500">{fac.type === "vehicle-fleet" ? "Road Fleet" : fac.type}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-600">{facEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800">{mixPct.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
