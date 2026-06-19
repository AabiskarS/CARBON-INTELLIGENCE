/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Facility, Activity, ActivityCategory, EMISSION_FACTORS } from "../types";
import { PlusCircle, Info, Calendar, Sparkles, Building } from "lucide-react";

interface AddActivityFormProps {
  facilities: Facility[];
  onAddActivity: (activity: Omit<Activity, "id" | "emissions">) => void;
}

export default function AddActivityForm({ facilities, onAddActivity }: AddActivityFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [facilityId, setFacilityId] = useState(facilities[0]?.id || "");
  const [category, setCategory] = useState<ActivityCategory>("scope2_electricity");
  const [subType, setSubType] = useState<Activity['subType']>("electricity");
  const [value, setValue] = useState<number | "">("");
  const [cost, setCost] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const [calcEmissions, setCalcEmissions] = useState(0);

  // Auto-switch subtype/unit based on category choice
  useEffect(() => {
    if (category === "scope2_electricity") {
      setSubType("electricity");
    } else if (category === "scope1_mobile") {
      setSubType("diesel");
    } else if (category === "scope1_stationary") {
      setSubType("natural_gas");
    }
  }, [category]);

  // Determine current unit
  const currentUnit = (subType === "electricity" || subType === "natural_gas") ? "kWh" : "litres";

  // Calculate live preview of emissions
  useEffect(() => {
    if (value && typeof value === "number") {
      const factorObj = EMISSION_FACTORS[subType];
      if (factorObj) {
        setCalcEmissions(value * factorObj.factor);
      }
    } else {
      setCalcEmissions(0);
    }
  }, [value, subType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) {
      alert("Please select or add an operational facility boundary first.");
      return;
    }
    if (!value || Number(value) <= 0) {
      alert("Please enter a valid positive measurement value.");
      return;
    }

    onAddActivity({
      date,
      facilityId,
      category,
      subType,
      value: Number(value),
      unit: currentUnit,
      cost: cost ? Number(cost) : undefined,
      description: description.trim() || undefined
    });

    // Reset inputs
    setValue("");
    setCost("");
    setDescription("");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-teal-50 text-teal-700 p-2 rounded-lg">
          <PlusCircle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Add Raw Carbon Log Entry</h3>
          <p className="text-xs text-slate-400">Log Scope 1 & 2 fuel and power usage metrics manual entry.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Select Controlled Facility
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building className="h-4 w-4" />
              </div>
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm"
                required
              >
                {facilities.length === 0 ? (
                  <option value="">-- No Facilities Defined --</option>
                ) : (
                  facilities.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} ({fac.type})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Log Date
            </label>
            <div className="relative rounded-lg shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              GHG Protocol Account Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
              required
            >
              <option value="scope2_electricity">Scope 2 Indirect Grid Electricity</option>
              <option value="scope1_stationary">Scope 1 Stationary Burn (Gas/Fuels)</option>
              <option value="scope1_mobile">Scope 1 Mobile Combustion (Fleet Vehicles)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Resource Sub-type
            </label>
            <select
              value={subType}
              onChange={(e) => setSubType(e.target.value as Activity['subType'])}
              className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
              required
            >
              {category === "scope2_electricity" && (
                <option value="electricity">Direct Grid Electricity</option>
              )}
              {category === "scope1_stationary" && (
                <>
                  <option value="natural_gas">Natural Gas Pipeline</option>
                  <option value="diesel">Generator/Boiler Heating Diesel</option>
                </>
              )}
              {category === "scope1_mobile" && (
                <>
                  <option value="diesel">Corporate Diesel Vehicle Fuel</option>
                  <option value="petrol">Corporate Gasoline/Petrol Vehicle Fuel</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Measurement Value ({currentUnit})
            </label>
            <div className="relative rounded-lg shadow-xs">
              <input
                type="number"
                placeholder={`e.g. 5000`}
                value={value}
                onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
                min="0.1"
                step="any"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
                required
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-xs font-semibold">
                {currentUnit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
              Billing/Resource Cost (EUR €) - Optional
            </label>
            <div className="relative rounded-lg shadow-xs">
              <input
                type="number"
                placeholder="e.g. 450"
                value={cost}
                onChange={(e) => setCost(e.target.value === "" ? "" : Number(e.target.value))}
                min="0"
                step="any"
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
              />
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-xs font-semibold">
                EUR (€)
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
            Short annotation/billing details
          </label>
          <input
            type="text"
            placeholder="e.g. EDP invoice #5512A, Q1 main factory feed"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
          />
        </div>

        {/* Live dynamic calculation metrics */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Info className="h-4 w-4 text-teal-600" />
            <div>
              <p className="font-semibold">Factor coefficient applied:</p>
              <p className="text-[11px] text-slate-400">
                {EMISSION_FACTORS[subType]?.factor} kg CO2e / {currentUnit} ({EMISSION_FACTORS[subType]?.description})
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-500">Live Computed Carbon Output:</p>
            <p className="text-sm font-black text-teal-700 font-mono">
              {calcEmissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO2e
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-1 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          Commit Log entry to Ledger
        </button>
      </form>
    </div>
  );
}
