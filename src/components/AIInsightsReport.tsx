/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Company, Activity, EMISSION_FACTORS } from "../types";
import { Sparkles, Loader2, AlertTriangle, ShieldCheck, Download, Calendar, Flame, Zap, Award } from "lucide-react";

interface AIInsightsReportProps {
  company: Company;
  activities: Activity[];
}

interface AdviceReport {
  executiveSummary: string;
  scopeAnalysis: {
    scope1Assessment: string;
    scope2Assessment: string;
  };
  recommendations: Array<{
    title: string;
    impactScope: string;
    leverType: 'tariff_switch' | 'electrification' | 'hvac_upgrade' | 'other';
    impactRangeQualitative: string;
    description: string;
  }>;
  esrsAlignDocs: string;
}

export default function AIInsightsReport({ company, activities }: AIInsightsReportProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AdviceReport | null>(null);
  const [error, setError] = useState("");

  // 1. Calculate Exact Ledger Math locally to guarantee absolute precision
  const currentYearActivities = activities.filter(
    (a) => new Date(a.date).getFullYear() === company.reportingYear
  );

  const prevYearActivities = activities.filter(
    (a) => new Date(a.date).getFullYear() === company.reportingYear - 1
  );

  const totalEmissionsKg = currentYearActivities.reduce((acc, curr) => acc + curr.emissions, 0);
  const totalScope1Kg = currentYearActivities
    .filter((a) => a.category.startsWith("scope1"))
    .reduce((acc, curr) => acc + curr.emissions, 0);
  const totalScope2Kg = currentYearActivities
    .filter((a) => a.category.startsWith("scope2"))
    .reduce((acc, curr) => acc + curr.emissions, 0);

  // Previous year totals for YoY
  const prevTotalEmissionsKg = prevYearActivities.reduce((acc, curr) => acc + curr.emissions, 0);

  // YoY % change calculation
  let yoyChangePercent: number | null = null;
  if (prevTotalEmissionsKg > 0) {
    yoyChangePercent = ((totalEmissionsKg - prevTotalEmissionsKg) / prevTotalEmissionsKg) * 100;
  }

  const handleGenerateReport = async () => {
    setLoading(true);
    setReport(null);
    setError("");

    // Prepare calculations payload to ground Gemini
    const calculationContext = {
      reportingYear: company.reportingYear,
      summaryCalculations: {
        totalEmissionsKg,
        totalScope1Kg,
        totalScope2Kg,
        totalScope1Tonnes: totalScope1Kg / 1000,
        totalScope2Tonnes: totalScope2Kg / 1000,
        totalEmissionsTonnes: totalEmissionsKg / 1000,
        previousYearTotalEmissionsTonnes: prevTotalEmissionsKg / 1000,
        yoyPercentChange: yoyChangePercent
      }
    };

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          activities: {
            currentActivities: currentYearActivities,
            calculationContext
          }
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setReport(data);
      } else {
        setError(data.error || "Failed to compile AI insights report.");
      }
    } catch (err) {
      setLoading(false);
      setError("Network fault connecting with AI analysis backend. Ensure server.ts is running.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upper header */}
      <div className="md:flex md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight sm:text-3xl">
            AI Corporate ESG Insights (ESRS E1)
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Generate custom Double-Materiality qualitative reports and carbon abatement advice tailored for Portuguese SMEs.
          </p>
        </div>
      </div>

      {currentYearActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-350 p-12 text-center bg-white">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800">Ledger is Empty for {company.reportingYear}</h4>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
            Please log at least one Scope 1 or Scope 2 activity or load the sample pilot company data to run the AI Insights Engine.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-red-650">
                <Flame className="h-4 w-4 text-orange-650" />
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Direct Emissions (Scope 1)</span>
              </div>
              <p className="text-2xl font-black font-mono text-slate-800">
                {(totalScope1Kg / 1000).toFixed(3)} <span className="text-xs font-normal text-slate-400">t CO2e</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Stationary burner feed & logistics fuel</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-violet-650">
                <Zap className="h-4 w-4 text-violet-650" />
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Electric Indirect (Scope 2)</span>
              </div>
              <p className="text-2xl font-black font-mono text-slate-800">
                {(totalScope2Kg / 1000).toFixed(3)} <span className="text-xs font-normal text-slate-400">t CO2e</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">DGEG-tracked residual power consumption</p>
            </div>

            <div className="bg-white border border-teal-200 bg-teal-50/20 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-teal-700">
                <Award className="h-4 w-4 text-teal-600" />
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Carbon Boundary</span>
              </div>
              <p className="text-2xl font-black font-mono text-teal-800">
                {(totalEmissionsKg / 1000).toFixed(3)} <span className="text-xs font-normal text-slate-400">t CO2e</span>
              </p>
              {yoyChangePercent !== null ? (
                <p className={`text-xs mt-1 font-semibold ${yoyChangePercent < 0 ? "text-green-600" : "text-amber-600"}`}>
                  {yoyChangePercent < 0 ? "↓ " : "↑ "} {Math.abs(yoyChangePercent).toFixed(1)}% YoY from prior year ({ (prevTotalEmissionsKg / 1000).toFixed(1) }t)
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">YoY comparison: No prior year data</p>
              )}
            </div>
          </div>

          {/* Trigger button */}
          {!report && !loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
              <div className="inline-flex p-3 rounded-full bg-teal-50 text-teal-600">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Synthesize Corporate Abatement Report</h4>
              <p className="text-sm text-slate-500 max-w-xl mx-auto">
                Trigger Gemini to build a structured climate assessment matching CSRD directions, outlining commercial qualitative abating paths.
              </p>
              <button
                onClick={handleGenerateReport}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs font-bold text-xs cursor-pointer transition-all"
              >
                Assemble AI Draft ESRS Analysis
              </button>
            </div>
          )}

          {/* Loading panel */}
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-teal-600 animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-850">Formulating ESG Double-Materiality Document...</p>
              <p className="text-xs text-slate-400 mt-1 animate-pulse italic">Applying EU CSRD disclosure rules under Portuguese national contexts</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Beautiful Completed Audit-Style Report */}
          {report && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
              {/* Report Header */}
              <div className="p-8 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-1 rounded bg-teal-500/10 text-teal-300 text-[10px] font-bold uppercase px-2 py-0.5 mb-2 border border-teal-500/20">
                    <ShieldCheck className="h-3 w-3" /> Draft CSRD/ESRS Disclosure Assessment
                  </div>
                  <h3 className="text-xl font-bold font-sans tracking-tight">{company.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Calendar reporting year {company.reportingYear} • SME Classification</p>
                </div>
                <div className="text-left sm:text-right text-xs font-mono">
                  <p className="text-slate-400">Total Bound Emissions:</p>
                  <p className="text-lg font-black text-teal-300 font-sans">{(totalEmissionsKg / 1000).toFixed(3)} t CO2e</p>
                </div>
              </div>

              {/* Warning label */}
              <div className="p-4 bg-amber-50 text-amber-900 border-l-4 border-amber-500 text-xs flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">UNAUDITED INTERNAL DRAFT DISCLOSURE:</span>
                  {' '}This report is conceptually modeled on ESRS E1 Climate Change reporting benchmarks for SMEs.
                  This analysis does not constitute audited accounting filings and coefficients should be historically checked prior to definitive submission.
                </div>
              </div>

              {/* Executive summary block */}
              <div className="p-8 space-y-3">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">I. Executive Performance Summary</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-sans">{report.executiveSummary}</p>
              </div>

              {/* Scope assessment details */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-orange-500" /> Scope 1 Direct Emissions Note
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{report.scopeAnalysis.scope1Assessment}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-violet-500" /> Scope 2 Electricity indirect Note
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{report.scopeAnalysis.scope2Assessment}</p>
                </div>
              </div>

              {/* Recommendations grid */}
              <div className="p-8 space-y-4">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">II. Corporate Abatement levers & qualitative ranges</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.recommendations.map((rec, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex rounded-full bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 truncate max-w-44">
                          {rec.impactScope}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                          {rec.impactRangeQualitative}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-800">{rec.title}</h5>
                      <p className="text-xs text-slate-500 leading-relaxed">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ESRS details */}
              <div className="p-8 space-y-3">
                <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">III. CSRD SME ESRS alignment guidance</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{report.esrsAlignDocs}</p>
              </div>

              {/* Download footer */}
              <div className="p-6 bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={window.print}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                >
                  Print Official Document
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-650 hover:bg-teal-700 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors"
                >
                  Re-synthesize Draft
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
