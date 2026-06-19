/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useRef } from "react";
import { Facility, Activity, ActivityCategory, EMISSION_FACTORS } from "../types";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw, Layers } from "lucide-react";

interface CSVImporterProps {
  facilities: Facility[];
  onImportActivities: (newActivities: Activity[]) => void;
}

interface ParsedRow {
  date: string;
  facilityName: string;
  facilityId: string;
  category: ActivityCategory;
  subType: Activity['subType'];
  value: number;
  unit: 'kWh' | 'litres';
  cost?: number;
  description: string;
  isValid: boolean;
  error?: string;
  calcEmissions: number;
}

export default function CSVImporter({ facilities, onImportActivities }: CSVImporterProps) {
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    setSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setErrorMsg("Please upload a valid comma-separated (.csv) spreadsheet file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    try {
      if (!text.trim()) {
        setErrorMsg("The uploaded CSV spreadsheet file appears to be completely empty.");
        return;
      }

      const lines = text.split(/\r?\n/);
      if (lines.length < 2) {
        setErrorMsg("CSV must contain at least a header row and one transactional activity line.");
        return;
      }

      // Read header keys
      // Expected headers: date, facility, category, value, unit, subtype, cost, description
      const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/['"]/g, ""));
      
      const dateIdx = headers.indexOf("date");
      const facilityIdx = headers.indexOf("facility");
      const categoryIdx = headers.indexOf("category");
      const valueIdx = headers.indexOf("value");
      const unitIdx = headers.indexOf("unit");
      const subtypeIdx = headers.indexOf("subtype");
      const costIdx = headers.indexOf("cost");
      const descIdx = headers.indexOf("description");

      if (dateIdx === -1 || facilityIdx === -1 || categoryIdx === -1 || valueIdx === -1) {
        setErrorMsg("Missing critical headers. Your CSV columns must include: 'date', 'facility', 'category', and 'value'.");
        return;
      }

      const rowsToImport: ParsedRow[] = [];
      // TODO: This parser is intentionally lightweight and does not support quoted values containing commas.
      // A more robust production-ready importer should use a proper CSV parser library.

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip blank lines

        // Parse line respecting quotes optionally (basic split is fully adequate for simple CSV rows)
        const columns = line.split(",").map(col => col.trim().replace(/['"]/g, ""));
        
        const rawDate = columns[dateIdx] || "";
        const rawFacility = columns[facilityIdx] || "";
        const rawCategory = columns[categoryIdx] || "";
        const rawValue = Number(columns[valueIdx]);
        const rawUnit = (columns[unitIdx] || "").toLowerCase();
        const rawSubtype = (columns[subtypeIdx] || "").toLowerCase();
        const rawCost = costIdx !== -1 && columns[costIdx] ? Number(columns[costIdx]) : undefined;
        const rawDesc = descIdx !== -1 ? columns[descIdx] || "" : "CSV Ingestion Load";

        let isValid = true;
        let error = "";

        // Validate date
        if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          isValid = false;
          error = "Date must be in absolute YYYY-MM-DD format.";
        }

        // Match facility by ID or name against the current company facility list.
        const normalizedFacilityText = rawFacility.trim().toLowerCase();
        let matchedFacility = facilities.find((f) => {
          return (
            f.id.toLowerCase() === normalizedFacilityText ||
            f.name.toLowerCase() === normalizedFacilityText
          );
        });

        if (!matchedFacility) {
          // Fallback: match by facility id or register a placeholder
          isValid = false;
          error = `Operational facility "${rawFacility}" is not registered in corporate boundaries.`;
        }

        // Validate Category and resolve subtype
        let category: ActivityCategory = "scope2_electricity";
        let subType: Activity['subType'] = "electricity";

        const normCat = rawCategory.toLowerCase();
        if (normCat.includes("electricity") || normCat.includes("scope2")) {
          category = "scope2_electricity";
          subType = "electricity";
        } else if (normCat.includes("stationary") || normCat.includes("gas") || normCat.includes("heating")) {
          category = "scope1_stationary";
          subType = rawSubtype.includes("gas") ? "natural_gas" : "diesel";
        } else if (normCat.includes("mobile") || normCat.includes("fleet") || normCat.includes("car")) {
          category = "scope1_mobile";
          subType = rawSubtype.includes("petrol") || rawSubtype.includes("gasolina") ? "petrol" : "diesel";
        } else {
          isValid = false;
          error = `Category must be 'scope1_stationary', 'scope1_mobile', or 'scope2_electricity'.`;
        }

        // Calculate emissions preview if valid
        let calcEmissions = 0;
        if (isValid && !isNaN(rawValue) && rawValue > 0) {
          const factorObj = EMISSION_FACTORS[subType];
          if (factorObj) {
            calcEmissions = rawValue * factorObj.factor;
          } else {
            isValid = false;
            if (!error) error = `No emission factor configured for subtype "${subType}".`;
          }
        } else {
          isValid = false;
          if (!error) error = "Measurement value must be a valid positive number.";
        }

        const normalizedUnit = rawUnit === "litres" || rawUnit === "litros" ? "litres" : "kWh";

        rowsToImport.push({
          date: rawDate,
          facilityName: matchedFacility?.name || rawFacility,
          facilityId: matchedFacility?.id || "unassigned",
          category,
          subType,
          value: isNaN(rawValue) ? 0 : rawValue,
          unit: normalizedUnit,
          cost: rawCost,
          description: rawDesc || `CSV line ${i}`,
          isValid,
          error,
          calcEmissions
        });
      }

      setParsedRows(rowsToImport);
    } catch (err) {
      setErrorMsg("Failed to parse this spreadsheet structure. Confirm formatting and try again.");
    }
  };

  const handleCommitImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg("No valid rows were found to import. Correct validation labels first.");
      return;
    }

    const compiledActivities: Activity[] = validRows.map((r, i) => ({
      id: `csv-${Date.now()}-${i}`,
      date: r.date,
      facilityId: r.facilityId,
      category: r.category,
      subType: r.subType,
      value: r.value,
      unit: r.unit,
      emissions: r.calcEmissions,
      cost: r.cost,
      description: r.description
    }));

    onImportActivities(compiledActivities);
    setSuccess(true);
    setParsedRows([]);
    setCsvText("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">CSV Bulk Activity Import</h3>
            <p className="text-xs text-slate-400">Import structured historical data directly to bypass manual logging lines.</p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">All valid CSV rows successfully merged into active carbon ledger!</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-850 text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CSV Guidlines */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-3 mb-6">
          <p className="font-bold text-slate-700 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-emerald-600" /> Expected CSV Column Headers Structure:
          </p>
          <code className="block bg-slate-100 p-2 rounded text-indigo-700 select-all font-mono">
            date, facility, category, value, unit, subtype, cost, description
          </code>
          <p className="text-[11px] text-slate-500 leading-normal">
            • <span className="font-semibold">date</span>: "YYYY-MM-DD" style e.g., <code className="bg-white py-0.5 px-1 rounded font-mono">2026-01-18</code>.<br />
            • <span className="font-semibold">facility</span>: Facility name e.g., <code className="bg-white py-0.5 px-1 rounded font-mono">Aveiro Production Plant</code>.<br />
            • <span className="font-semibold">category</span>: <code className="bg-white py-0.5 px-1 rounded font-mono">scope2_electricity</code>, <code className="bg-white py-0.5 px-1 rounded font-mono">scope1_stationary</code>, or <code className="bg-white py-0.5 px-1 rounded font-mono">scope1_mobile</code>.<br />
            • <span className="font-semibold">unit & subtype</span>: <code className="bg-white py-0.5 px-1 rounded font-mono">kWh</code> (electricity, gas) or <code className="bg-white py-0.5 px-1 rounded font-mono">litres</code> (diesel, petrol).
          </p>
        </div>

        {/* Trigger files upload */}
        <div className="flex gap-4">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            Upload CSV Activity Log
          </button>
        </div>
      </div>

      {/* Review CSV items */}
      {parsedRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-fade-in-up">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Spreadsheet Row Verification</h4>
              <p className="text-[11px] text-slate-400">Total lines discovered: {parsedRows.length} ({parsedRows.filter(r => r.isValid).length} compliant, {parsedRows.filter(r => !r.isValid).length} warnings)</p>
            </div>
            <button
              onClick={() => {
                setParsedRows([]);
                setCsvText("");
              }}
              className="p-1 px-2 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-500 cursor-pointer inline-flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Realize fresh file
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
            {parsedRows.map((row, idx) => (
              <div key={idx} className={`p-4 flex items-center justify-between gap-3 ${row.isValid ? "hover:bg-slate-50/50" : "bg-red-50/40"}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] font-semibold text-slate-650">{row.date}</span>
                    <span className="font-semibold text-slate-800">{row.facilityName}</span>
                    <span className="text-slate-400">({row.category})</span>
                  </div>
                  {row.isValid ? (
                    <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-mono bg-emerald-50 text-emerald-800 inline-block px-1 rounded">
                      Emissions equivalent: {row.calcEmissions.toFixed(1)} kg CO2e
                    </p>
                  ) : (
                    <p className="text-[11px] text-red-650 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Error: {row.error}
                    </p>
                  )}
                </div>
                <div className="text-right font-mono font-bold text-slate-600 whitespace-nowrap">
                  {row.value} {row.unit}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-4">
            <button
              onClick={handleCommitImport}
              disabled={parsedRows.filter(r => r.isValid).length === 0}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-all disabled:opacity-40"
            >
              Ingest Selected Records ({parsedRows.filter(r => r.isValid).length} files)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
