/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Company, Activity, EMISSION_FACTORS } from "../types";
import { BarChart3, PieChart, ListFilter, Trash2, Globe, TrendingDown, Layers, Building2 } from "lucide-react";

interface CarbonChartsProps {
  company: Company;
  activities: Activity[];
  onRemoveActivity: (id: string) => void;
}

export default function CarbonCharts({ company, activities, onRemoveActivity }: CarbonChartsProps) {
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Filter current calendar year logs
  const yearlyLogs = activities.filter(
    (a) => new Date(a.date).getFullYear() === company.reportingYear
  );

  // Apply filters
  const filteredActivities = yearlyLogs.filter((a) => {
    const facilityMatch = selectedFacilityFilter === "all" || a.facilityId === selectedFacilityFilter;
    const categoryMatch = selectedCategoryFilter === "all" || a.category === selectedCategoryFilter;
    return facilityMatch && categoryMatch;
  });

  // Calculate Scope sums
  const totalScope1 = yearlyLogs
    .filter((a) => a.category.startsWith("scope1"))
    .reduce((acc, curr) => acc + curr.emissions, 0);

  const totalScope2 = yearlyLogs
    .filter((a) => a.category.startsWith("scope2"))
    .reduce((acc, curr) => acc + curr.emissions, 0);

  const totalEmissions = totalScope1 + totalScope2;

  // Percentage Calculations
  const scope1Percent = totalEmissions > 0 ? (totalScope1 / totalEmissions) * 100 : 0;
  const scope2Percent = totalEmissions > 0 ? (totalScope2 / totalEmissions) * 100 : 0;

  // Category levels sum
  const catSums = {
    scope2_electricity: yearlyLogs.filter(a => a.category === "scope2_electricity").reduce((acc, c) => acc + c.emissions, 0),
    scope1_stationary: yearlyLogs.filter(a => a.category === "scope1_stationary").reduce((acc, c) => acc + c.emissions, 0),
    scope1_mobile: yearlyLogs.filter(a => a.category === "scope1_mobile").reduce((acc, c) => acc + c.emissions, 0)
  };

  // Facility sums
  const facilitySums = company.facilities.reduce((acc, f) => {
    const sum = yearlyLogs.filter(a => a.facilityId === f.id).reduce((s, curr) => s + curr.emissions, 0);
    acc[f.id] = { name: f.name, sum };
    return acc;
  }, {} as Record<string, { name: string; sum: number }>);

  // Get maximum emissions for layout scale
  const maxCategorySum = Math.max(...Object.values(catSums), 1);
  const maxFacilitySum = Math.max(...Object.values(facilitySums).map(f => f.sum), 1);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Overview Indicators */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 pb-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-slate-950 text-white p-2 rounded-xl">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">GHG Scope 1 & 2 Emissions Ledger</h3>
              <p className="text-xs text-slate-400">Inventory breakdown for organizational boundaries of "{company.name}".</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200">
              REPORTING YEAR: {company.reportingYear}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 py-1 px-2.5 rounded-lg border border-emerald-200/50 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" /> Portuguese DGEG Grid Aligned
            </span>
          </div>
        </div>

        {totalEmissions === 0 ? (
          <div className="py-16 text-center">
            <BarChart3 className="h-10 w-10 text-slate-350 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Audit Ledger is Blank</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add your logs or switch details. You can click "Load Sample Data" on the upper banner to seed realistic logs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-6">
            {/* Left: Scope Breakdown Meter */}
            <div className="md:col-span-4 bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                  <PieChart className="h-4 w-4 text-teal-650" /> Boundary Scope Mix
                </h4>
                <p className="text-xs text-slate-400 mt-1">Breakdown of Direct versus Indirect indirect scopes.</p>
              </div>

              {/* Scope Stack Gauge */}
              <div className="space-y-4">
                <div className="h-5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner border border-slate-300">
                  <div 
                    style={{ width: `${scope1Percent}%` }} 
                    className="bg-orange-500 transition-all duration-550" 
                    title={`Scope 1: ${scope1Percent.toFixed(1)}%`}
                  />
                  <div 
                    style={{ width: `${scope2Percent}%` }} 
                    className="bg-violet-600 transition-all duration-550" 
                    title={`Scope 2: ${scope2Percent.toFixed(1)}%`}
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-orange-500 rounded-xs" />
                      <span className="font-semibold text-slate-700">Scope 1 (Direct Fuels)</span>
                    </div>
                    <span className="font-mono font-bold">
                      {scope1Percent.toFixed(1)}% ({(totalScope1 / 1000).toFixed(3)} t)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-violet-600 rounded-xs" />
                      <span className="font-semibold text-slate-700">Scope 2 (Electricity)</span>
                    </div>
                    <span className="font-mono font-bold">
                      {scope2Percent.toFixed(1)}% ({(totalScope2 / 1000).toFixed(3)} t)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center border-t border-slate-200">
                <p className="text-[11px] text-slate-450 italic">Total: {(totalEmissions / 1000).toFixed(3)} tonnes CO2e</p>
              </div>
            </div>

            {/* Middle: Category charts */}
            <div className="md:col-span-4 bg-slate-50/50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                  <BarChart3 className="h-4 w-4 text-teal-650" /> Category Breakdown
                </h4>
                <p className="text-xs text-slate-400 mt-1">Logged metrics grouped by GHG categorization.</p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Scope 2 Electricity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">Scope 2 Indirect Electricity</span>
                    <span className="font-mono font-bold">{(catSums.scope2_electricity / 1000).toFixed(2)} t</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-sm overflow-hidden">
                    <div 
                      style={{ width: `${(catSums.scope2_electricity / maxCategorySum) * 100}%` }} 
                      className="h-full bg-violet-500 rounded-sm"
                    />
                  </div>
                </div>

                {/* Scope 1 Stationary */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">Scope 1 Stationary Burn</span>
                    <span className="font-mono font-bold">{(catSums.scope1_stationary / 1000).toFixed(2)} t</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-sm overflow-hidden">
                    <div 
                      style={{ width: `${(catSums.scope1_stationary / maxCategorySum) * 100}%` }} 
                      className="h-full bg-amber-500 rounded-sm"
                    />
                  </div>
                </div>

                {/* Scope 1 Mobile */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-semibold">Scope 1 Mobile Fleet</span>
                    <span className="font-mono font-bold">{(catSums.scope1_mobile / 1000).toFixed(2)} t</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-sm overflow-hidden">
                    <div 
                      style={{ width: `${(catSums.scope1_mobile / maxCategorySum) * 100}%` }} 
                      className="h-full bg-orange-500 rounded-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Facility breakdown chart */}
            <div className="md:col-span-4 bg-slate-50/50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                  <Layers className="h-4 w-4 text-teal-650" /> Facility Asset Breakdown
                </h4>
                <p className="text-xs text-slate-400 mt-1">Comparison across organizational facilities.</p>
              </div>

              <div className="space-y-3.5 text-xs max-h-52 overflow-y-auto pr-1">
                {Object.entries(facilitySums).map(([fid, fData]) => {
                  const facilityPercentFactor = fData.sum > 0 ? (fData.sum / maxFacilitySum) * 100 : 0;
                  return (
                    <div key={fid} className="space-y-1">
                      <div className="flex justify-between text-slate-700">
                        <span className="font-semibold truncate max-w-[200px]">{fData.name}</span>
                        <span className="font-mono font-bold">{(fData.sum / 1000).toFixed(2)} t</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-sm overflow-hidden flex">
                        <div 
                          style={{ width: `${facilityPercentFactor}%` }} 
                          className="h-full bg-teal-600 rounded-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Structured Ledger Entries with live filtering */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Historical Activity Ledger Ledger</h4>
            <p className="text-xs text-slate-500">Log entries for reporting boundaries of {company.reportingYear}.</p>
          </div>

          {/* Interactive filter widgets */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
              <ListFilter className="h-3.5 w-3.5 text-teal-650" />
              <span>Asset:</span>
              <select
                value={selectedFacilityFilter}
                onChange={(e) => setSelectedFacilityFilter(e.target.value)}
                className="font-semibold text-slate-700 bg-transparent py-0 border-none outline-hidden focus:ring-0 cursor-pointer"
              >
                <option value="all">All Facilities</option>
                {company.facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
              <span>Category:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="font-semibold text-slate-700 bg-transparent py-0 border-none outline-hidden focus:ring-0 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="scope1_stationary">Scope 1 Stationary</option>
                <option value="scope1_mobile">Scope 1 Mobile Fleet</option>
                <option value="scope2_electricity">Scope 2 Electricity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger list */}
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400">No activities match your filtering selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-150">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Facility Asset</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Scope</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type / Input</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Usage / Value</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Emissions Equivalent</th>
                  <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredActivities.map((act) => {
                  const linkedFacility = company.facilities.find(f => f.id === act.facilityId);
                  const isScope1 = act.category.startsWith("scope1");

                  return (
                    <tr key={act.id} className="hover:bg-slate-50/55 transition-colors">
                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-semibold text-slate-700">
                        {act.date}
                      </td>

                      {/* Facility Name */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-800">
                        {linkedFacility?.name || "Unmapped Facility"}
                      </td>

                      {/* Scope Flag */}
                      <td className="px-6 py-4 whitespace-nowrap text-[11px] font-mono">
                        <span className={`inline-flex rounded-md font-bold px-1.5 py-0.5 border ${
                          isScope1 
                            ? "bg-orange-50 border-orange-200 text-orange-700" 
                            : "bg-violet-50 border-violet-200 text-violet-700"
                        }`}>
                          {isScope1 ? "Scope 1 Direct" : "Scope 2 Indirect"}
                        </span>
                      </td>

                      {/* Sub-type and category description */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className="font-medium text-slate-800 uppercase tracking-wider font-mono bg-slate-100/80 px-1 py-0.5 rounded text-[11px] mr-1">
                          {act.subType}
                        </span>
                        <span className="text-slate-400 text-[11px] block truncate max-w-44 lg:max-w-xs" title={act.description}>
                          {act.description || "-"}
                        </span>
                      </td>

                      {/* Value and unit */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold font-mono text-slate-750">
                        {act.value.toLocaleString(undefined, { maximumFractionDigits: 1 })} {act.unit}
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono font-semibold text-slate-600">
                        {act.cost ? `${act.cost.toFixed(2)} €` : "-"}
                      </td>

                      {/* Total calculated emissions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <span className="font-bold text-slate-800 font-mono">
                          {act.emissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-slate-400 font-normal ml-0.5 text-[11px]">kg</span>
                      </td>

                      {/* Action trigger */}
                      <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                        <button
                          onClick={() => onRemoveActivity(act.id)}
                          className="p-1 px-2 text-slate-400 hover:bg-red-50 hover:text-red-650 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                          title="Delete Ledger Log"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
