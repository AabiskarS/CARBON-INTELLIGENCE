/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Company, Activity, SessionState } from "./types";
import { SAMPLE_COMPANY, SAMPLE_ACTIVITIES } from "./sampleData";

// Components
import LoginForm from "./components/LoginForm";
import ProfileForm from "./components/ProfileForm";
import AddActivityForm from "./components/AddActivityForm";
import BillUploadForm from "./components/BillUploadForm";
import CarbonCharts from "./components/CarbonCharts";
import AICarbonCoach from "./components/AICarbonCoach";
import AIInsightsReport from "./components/AIInsightsReport";
import ReportExporter from "./components/ReportExporter";
import CSVImporter from "./components/CSVImporter";

// Icons
import {
  Building2,
  CalendarDays,
  FileSpreadsheet,
  Globe,
  LogOut,
  Sparkles,
  User,
  LayoutDashboard,
  PlusSquare,
  Compass,
  MessageSquare,
  Fingerprint,
  Layers
} from "lucide-react";

export default function App() {
  const [session, setSession] = useState<SessionState>({
    isAuthenticated: false,
    username: null,
    company: null,
    activities: []
  });

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "add_activity" | "insights" | "coach" | "profile" | "exporter"
  >("dashboard");

  const [logType, setLogType] = useState<"manual" | "scan" | "bulk_csv">("manual");

  // Load session state from LocalStorage on mount to preserve user activity
  useEffect(() => {
    const savedSession = localStorage.getItem("carbon_sme_session_state");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.isAuthenticated) {
          setSession(parsed);
        }
      } catch (err) {
        console.error("Failed to parse LocalStorage carbon session state.");
      }
    }
  }, []);

  // Update LocalStorage on session state changes
  const saveSessionState = (newSession: SessionState) => {
    setSession(newSession);
    localStorage.setItem("carbon_sme_session_state", JSON.stringify(newSession));
  };

  const handleLoginSuccess = (username: string, companyName: string, isDefaultPilot: boolean) => {
    let companyObj: Company;

    if (isDefaultPilot) {
      // Create empty pilot company layout (the sample activities are gated and loaded click-to-initialize)
      companyObj = {
        name: companyName,
        industrySector: SAMPLE_COMPANY.industrySector,
        employeeCount: SAMPLE_COMPANY.employeeCount,
        reportingYear: SAMPLE_COMPANY.reportingYear,
        facilities: SAMPLE_COMPANY.facilities
      };
    } else {
      // Real sandbox company starting completely empty
      companyObj = {
        name: companyName,
        industrySector: "Software, Tech & Shared Service Offices",
        employeeCount: 15,
        reportingYear: 2026,
        facilities: [
          { id: "fac-main", name: "Headquarters Office", type: "office" }
        ]
      };
    }

    const newSession: SessionState = {
      isAuthenticated: true,
      username,
      company: companyObj,
      activities: [] // starts completely empty!
    };

    saveSessionState(newSession);
  };

  const handleLogout = () => {
    const cleared: SessionState = {
      isAuthenticated: false,
      username: null,
      company: null,
      activities: []
    };
    setSession(cleared);
    localStorage.removeItem("carbon_sme_session_state");
    setActiveTab("dashboard");
  };

  // Corporate Profile updates
  const handleUpdateCompany = (updatedCompany: Company) => {
    const newSession = {
      ...session,
      company: updatedCompany
    };
    saveSessionState(newSession);
  };

  // Load sample baseline activities on demand
  const handleLoadSampleActivities = () => {
    if (!session.company) return;

    // Load original layout and seed records
    const newSession = {
      ...session,
      company: {
        ...session.company,
        facilities: SAMPLE_COMPANY.facilities
      },
      activities: SAMPLE_ACTIVITIES
    };
    saveSessionState(newSession);
    alert("Sample pilot data loaded! Mapped 4 operational facilities (production, office, warehouse, fleet) and 7 baseline carbon entries.");
  };

  // Add individual activity
  const handleAddActivity = (newAct: Omit<Activity, "id" | "emissions">) => {
    const rate = requireEmissionFactorFactor(newAct.subType);
    const emissionsEquivalent = newAct.value * rate;

    const fullActivity: Activity = {
      ...newAct,
      id: `act-${Date.now()}`,
      emissions: emissionsEquivalent
    };

    const newSession = {
      ...session,
      activities: [fullActivity, ...session.activities]
    };
    saveSessionState(newSession);
  };

  // Direct append bulk activities (from csv load)
  const handleImportActivities = (newActivities: Activity[]) => {
    const newSession = {
      ...session,
      activities: [...newActivities, ...session.activities]
    };
    saveSessionState(newSession);
  };

  // Remove individual log line
  const handleRemoveActivity = (id: string) => {
    const remaining = session.activities.filter((a) => a.id !== id);
    const newSession = {
      ...session,
      activities: remaining
    };
    saveSessionState(newSession);
  };

  const requireEmissionFactorFactor = (subType: Activity["subType"]): number => {
    const map: Record<Activity["subType"], number> = {
      electricity: 0.235,
      diesel: 2.68,
      petrol: 2.31,
      natural_gas: 0.202
    };
    return map[subType] || 0;
  };

  // Core Authentication gating
  if (!session.isAuthenticated || !session.company) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-55 flex flex-col font-sans text-slate-800">
      {/* Upper Navigation deck banner */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Corporate Brand */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-500/20">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5 leading-none">
                  CARBON<span className="text-teal-400">INTELLIGENCE</span>
                </h1>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider">SME ESG Accounting Port</p>
              </div>
            </div>

            {/* Middle Nav Links */}
            <nav className="hidden lg:flex space-x-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  activeTab === "dashboard" ? "bg-slate-800 text-teal-400" : "text-slate-300 hover:bg-slate-800/55 hover:text-white"
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Ledger Dashboard
              </button>
              <button
                onClick={() => setActiveTab("add_activity")}
                className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  activeTab === "add_activity" ? "bg-slate-800 text-teal-400" : "text-slate-300 hover:bg-slate-800/55 hover:text-white"
                }`}
              >
                <PlusSquare className="h-3.5 w-3.5" />
                Input Logs & Scans
              </button>
              <button
                onClick={() => setActiveTab("insights")}
                className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  activeTab === "insights" ? "bg-slate-800 text-teal-400" : "text-slate-300 hover:bg-slate-800/55 hover:text-white"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                AI Abate Insights
              </button>
              <button
                onClick={() => setActiveTab("coach")}
                className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  activeTab === "coach" ? "bg-slate-800 text-teal-400" : "text-slate-300 hover:bg-slate-800/55 hover:text-white"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Climate Coach
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  activeTab === "profile" ? "bg-slate-800 text-teal-400" : "text-slate-300 hover:bg-slate-800/55 hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Boundary Assets
              </button>
              <button
                onClick={() => setActiveTab("exporter")}
                className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                  activeTab === "exporter" ? "bg-slate-800 text-teal-400" : "text-slate-300 hover:bg-slate-800/55 hover:text-white"
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                CSRD E1 Exporter
              </button>
            </nav>

            {/* Right: Controller Profile and Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-700">
                <User className="h-3.5 w-3.5 text-teal-400" />
                <span className="text-[11px] font-mono text-slate-300 font-semibold truncate max-w-32" title={session.username || ""}>
                  {session.username}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-300 transition-colors cursor-pointer"
                title="Log Out Session"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Gated demo seed banner */}
      <div className="bg-gradient-to-r from-teal-550 to-emerald-600 bg-teal-650 text-white shadow-inner">
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8 text-xs flex flex-col sm:flex-row justify-between items-center gap-2 bg-[#345d00]">
          <p className="font-semibold text-center sm:text-left flex items-center gap-1.5">
            <Fingerprint className="h-4 w-4 text-teal-200" />
            Active Controlled Boundaries:{" "}
            <span className="font-bold underline">{session.company.name}</span> with{" "}
            {session.activities.length} accounting logs committed.
          </p>
          {session.activities.length === 0 && (
            <button
              onClick={handleLoadSampleActivities}
              className="px-3 py-1 bg-white hover:bg-slate-50 text-teal-700 font-black rounded-lg shadow-xs cursor-pointer text-[10px] uppercase tracking-wider transition-colors"
            >
              🚀 Initialize Portuguese SME Sample Data
            </button>
          )}
        </div>
      </div>

      {/* Main viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#96c192]">
        {/* Mobile quick tab controller */}
        <div className="lg:hidden mb-6 flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg text-center ${
              activeTab === "dashboard" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            Ledger
          </button>
          <button
            onClick={() => setActiveTab("add_activity")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg text-center ${
              activeTab === "add_activity" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            Logs
          </button>
          <button
            onClick={() => setActiveTab("insights")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg text-center ${
              activeTab === "insights" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            AI Insight
          </button>
          <button
            onClick={() => setActiveTab("coach")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg text-center ${
              activeTab === "coach" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            Coach
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg text-center ${
              activeTab === "profile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            Assets
          </button>
        </div>

        {/* View switching logic */}
        {activeTab === "dashboard" && (
          <CarbonCharts
            company={session.company}
            activities={session.activities}
            onRemoveActivity={handleRemoveActivity}
          />
        )}

        {activeTab === "add_activity" && (
          <div className="space-y-8 animate-fade-in">
            {/* Mode selection banner */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-xl bg-slate-150 p-1 border border-slate-200">
                <button
                  onClick={() => setLogType("manual")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    logType === "manual" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Manual Logging Entry
                </button>
                <button
                  onClick={() => setLogType("scan")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    logType === "scan" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Scan Utility Invoices (EDP AI Bill)
                </button>
                <button
                  onClick={() => setLogType("bulk_csv")}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                    logType === "bulk_csv" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Bulk CSV Import
                </button>
              </div>
            </div>

            {logType === "manual" && (
              <AddActivityForm
                facilities={session.company.facilities}
                onAddActivity={handleAddActivity}
              />
            )}

            {logType === "scan" && (
              <BillUploadForm
                facilities={session.company.facilities}
                onAddActivity={handleAddActivity}
              />
            )}

            {logType === "bulk_csv" && (
              <CSVImporter
                facilities={session.company.facilities}
                onImportActivities={handleImportActivities}
              />
            )}
          </div>
        )}

        {activeTab === "insights" && (
          <AIInsightsReport
            company={session.company}
            activities={session.activities}
          />
        )}

        {activeTab === "coach" && (
          <AICarbonCoach
            company={session.company}
            activities={session.activities}
          />
        )}

        {activeTab === "profile" && (
          <ProfileForm
            company={session.company}
            onUpdate={handleUpdateCompany}
          />
        )}

        {activeTab === "exporter" && (
          <ReportExporter
            company={session.company}
            activities={session.activities}
          />
        )}
      </main>

      {/* Humble Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-850 mt-auto text-center text-xs">
        <p className="font-sans">© 2026 CarbonFootprint Enterprise SME Audit Coherence Tool.</p>
        <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Conceptually mapped to EU Corporate Sustainability Reporting Disclosures (CSRD) & ESRS E1 standards.</p>
      </footer>
    </div>
  );
}
