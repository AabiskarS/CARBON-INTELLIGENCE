/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Company, Facility } from "../types";
import { Building2, Save, Plus, Trash2, ShieldAlert, Layers } from "lucide-react";

interface ProfileFormProps {
  company: Company;
  onUpdate: (updatedCompany: Company) => void;
}

export default function ProfileForm({ company, onUpdate }: ProfileFormProps) {
  const [name, setName] = useState(company.name);
  const [industrySector, setIndustrySector] = useState(company.industrySector);
  const [employeeCount, setEmployeeCount] = useState(company.employeeCount);
  const [reportingYear, setReportingYear] = useState(company.reportingYear);
  const [facilities, setFacilities] = useState<Facility[]>(company.facilities);

  // New facility entry states
  const [newFacName, setNewFacName] = useState("");
  const [newFacType, setNewFacType] = useState<Facility['type']>("office");

  const [notif, setNotif] = useState("");

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      name,
      industrySector,
      employeeCount: Number(employeeCount),
      reportingYear: Number(reportingYear),
      facilities
    });
    showNotification("Company master profile updated successfully!");
  };

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(""), 4000);
  };

  const handleAddFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName.trim()) return;

    const newFac: Facility = {
      id: `fac-${Date.now()}`,
      name: newFacName.trim(),
      type: newFacType
    };

    const updated = [...facilities, newFac];
    setFacilities(updated);
    onUpdate({
      name,
      industrySector,
      employeeCount: Number(employeeCount),
      reportingYear: Number(reportingYear),
      facilities: updated
    });

    setNewFacName("");
    showNotification(`Facility "${newFac.name}" added successfully.`);
  };

  const handleRemoveFacility = (id: string, name: string) => {
    const updated = facilities.filter(f => f.id !== id);
    setFacilities(updated);
    onUpdate({
      name,
      industrySector,
      employeeCount: Number(employeeCount),
      reportingYear: Number(reportingYear),
      facilities: updated
    });
    showNotification(`Facility "${name}" removed.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upper header */}
      <div className="md:flex md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight sm:text-3xl">
            Corporate Profile & Boundaries
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Define organizational boundaries, facility registers, and reporting settings under CSRD requirements.
          </p>
        </div>
      </div>

      {notif && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm font-medium animate-fade-in">
          {notif}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: General master company details */}
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-bold font-sans text-slate-800">Operational Organization</h3>
            <p className="mt-1 text-sm text-slate-500">
              Set your legal entity name, industry segment, and baseline calendar year.
            </p>
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start text-xs text-slate-600 gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">ESRS E1 Guideline:</span> 
                  {' '}SMEs are required to define their reporting boundaries on both owned and leased operational assets.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: General form */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 md:col-span-2">
          <form onSubmit={handleSaveGeneral} className="p-6 space-y-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Legal SME Entity Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  SME Sector classification
                </label>
                <select
                  value={industrySector}
                  onChange={(e) => setIndustrySector(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm"
                >
                  <option value="Metalworking & Industrial Production">Metalworking & Industrial Production</option>
                  <option value="Agribusiness & Food Processing">Agribusiness & Food Processing</option>
                  <option value="Logistics, Transport & Warehousing">Logistics, Transport & Warehousing</option>
                  <option value="SME Retail Operations">SME Retail Operations</option>
                  <option value="Textiles & Footwear Manufacturing">Textiles & Footwear Manufacturing</option>
                  <option value="Software, Tech & Shared Service Offices">Software, Tech & Shared Service Offices</option>
                  <option value="Other Commercial Services">Other Commercial Services</option>
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Total Employees (FTEs)
                </label>
                <input
                  type="number"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Number(e.target.value))}
                  min="1"
                  className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm"
                  required
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Target Reporting Calendar Year
                </label>
                <select
                  value={reportingYear}
                  onChange={(e) => setReportingYear(Number(e.target.value))}
                  className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm"
                >
                  <option value="2026">2026 (Active Target)</option>
                  <option value="2025">2025 (Historical reference)</option>
                  <option value="2024">2024 (Baseline)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                Commit Corporate Profile
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-8" />

      {/* Facilities boundaries */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <h3 className="text-lg font-bold font-sans text-slate-800">Operational Facilities</h3>
          <p className="mt-1 text-sm text-slate-500">
            Map specific facilities within the Portuguese operational control boundary. Activities will be assigned to these assets.
          </p>
          <div className="mt-4 p-4 rounded-xl bg-teal-50 text-teal-800 text-xs leading-relaxed space-y-2 border border-teal-100">
            <div className="font-bold flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Facility Categorization Tips:
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li><span className="font-semibold">Production</span>: Factories with heavy energy machinery.</li>
              <li><span className="font-semibold">Warehouses</span>: Distribution cold chains or storage logistics.</li>
              <li><span className="font-semibold">Retail</span>: High direct public customer footprint.</li>
              <li><span className="font-semibold">Offices</span>: Administrative service workspaces.</li>
              <li><span className="font-semibold">Road Fleet</span>: Group-owned mobile logistics assets.</li>
            </ul>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Add facility card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h4 className="text-sm font-bold font-sans text-slate-800 mb-4">Register New Controlled Boundary Facility</h4>
            <form onSubmit={handleAddFacility} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Facility Name</label>
                <input
                  type="text"
                  placeholder="e.g., Porto Logistics warehouse"
                  value={newFacName}
                  onChange={(e) => setNewFacName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm"
                  required
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Facility Type</label>
                <select
                  value={newFacType}
                  onChange={(e) => setNewFacType(e.target.value as Facility['type'])}
                  className="block w-full px-3 py-2 border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm"
                >
                  <option value="office">Office</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="retail">Retail Hub</option>
                  <option value="production">Production Line</option>
                  <option value="vehicle-fleet">Vehicle Road Fleet</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap h-[38px]"
              >
                <Plus className="h-4 w-4" />
                Add Controlled Boundary
              </button>
            </form>
          </div>

          {/* Active facilities list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-sm font-bold font-sans text-slate-800">
                Registered Controlled Boundary Assets ({facilities.length})
              </h4>
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 py-0.5 px-2 rounded-md font-semibold">
                SME BOUNDARY COHERENCE: OK
              </span>
            </div>

            {facilities.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">No operational facilities registered yet. Add at least one facility (e.g. Headquarters Office) to start reporting carbon activities.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {facilities.map((fac) => (
                  <li key={fac.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800">{fac.name}</h5>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
                          {fac.type === "vehicle-fleet" ? "Vehicle Road Fleet" : fac.type}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: {fac.id}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFacility(fac.id, fac.name)}
                      className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      title="Remove Facility"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
