/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { Company, Activity } from "./types";
import { SAMPLE_COMPANY, SAMPLE_ACTIVITIES } from "./sampleData";
import { auth, db, signOut, handleFirestoreError, OperationType } from "./lib/firebase";

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
  Layers,
  Loader2,
  Database
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [firestoreSyncing, setFirestoreSyncing] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "add_activity" | "insights" | "coach" | "profile" | "exporter"
  >("dashboard");

  const [logType, setLogType] = useState<"manual" | "scan" | "bulk_csv">("manual");

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore real-time updates for company and activities
  useEffect(() => {
    if (!currentUser) {
      setCompany(null);
      setActivities([]);
      return;
    }

    const userId = currentUser.uid;
    const companyDocRef = doc(db, "users", userId);
    const activitiesColRef = collection(db, "users", userId, "activities");

    // Real-time listener for user's company profile
    const unsubCompany = onSnapshot(
      companyDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCompany({
            name: data.name || (currentUser.displayName ? `${currentUser.displayName}'s SME` : "Portuguese SME Corp"),
            industrySector: data.industrySector || "General Business",
            employeeCount: data.employeeCount ?? 15,
            reportingYear: data.reportingYear ?? 2026,
            facilities: data.facilities && data.facilities.length > 0
              ? data.facilities
              : [{ id: "fac-main", name: "Headquarters Office", type: "office" }]
          });
        } else {
          // Initialize default company profile in Firestore for new user
          const initialCompany: Company = {
            name: currentUser.displayName ? `${currentUser.displayName}'s Organization` : "Santos & Filhos, Lda.",
            industrySector: "Software, Tech & Shared Service Offices",
            employeeCount: 15,
            reportingYear: 2026,
            facilities: [
              { id: "fac-main", name: "Headquarters Office", type: "office" }
            ]
          };

          try {
            await setDoc(companyDocRef, {
              ...initialCompany,
              userId,
              updatedAt: new Date().toISOString()
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${userId}`);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      }
    );

    // Real-time listener for user's carbon activities
    const unsubActivities = onSnapshot(
      activitiesColRef,
      (snapshot) => {
        const items: Activity[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Activity);
        });
        // Sort newest first
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivities(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}/activities`);
      }
    );

    return () => {
      unsubCompany();
      unsubActivities();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setCompany(null);
      setActivities([]);
      setActiveTab("dashboard");
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Corporate Profile updates persisted to Firestore
  const handleUpdateCompany = async (updatedCompany: Company) => {
    if (!currentUser) return;
    setFirestoreSyncing(true);
    const userId = currentUser.uid;
    try {
      await setDoc(
        doc(db, "users", userId),
        {
          ...updatedCompany,
          userId,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setFirestoreSyncing(false);
    }
  };

  // Load sample baseline activities on demand directly into Firestore
  const handleLoadSampleActivities = async () => {
    if (!currentUser || !company) return;
    setFirestoreSyncing(true);
    const userId = currentUser.uid;

    try {
      // 1. Update facilities in Firestore
      await setDoc(
        doc(db, "users", userId),
        {
          facilities: SAMPLE_COMPANY.facilities,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      // 2. Batch commit sample activities into user's Firestore subcollection
      const batch = writeBatch(db);
      SAMPLE_ACTIVITIES.forEach((act) => {
        const actRef = doc(db, "users", userId, "activities", act.id);
        batch.set(actRef, {
          ...act,
          userId,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/activities`);
    } finally {
      setFirestoreSyncing(false);
    }
  };

  // Helper for emission factors
  const requireEmissionFactorFactor = (subType: Activity["subType"]): number => {
    const map: Record<Activity["subType"], number> = {
      electricity: 0.235,
      diesel: 2.68,
      petrol: 2.31,
      natural_gas: 0.202
    };
    return map[subType] || 0;
  };

  // Add individual activity to Firestore
  const handleAddActivity = async (newAct: Omit<Activity, "id" | "emissions">) => {
    if (!currentUser) return;
    setFirestoreSyncing(true);
    const userId = currentUser.uid;
    const rate = requireEmissionFactorFactor(newAct.subType);
    const emissionsEquivalent = Math.round(newAct.value * rate * 100) / 100;
    const activityId = `act-${Date.now()}`;

    const fullActivity: Activity = {
      ...newAct,
      id: activityId,
      emissions: emissionsEquivalent,
      userId,
      createdAt: new Date().toISOString()
    };

    try {
      const actRef = doc(db, "users", userId, "activities", activityId);
      await setDoc(actRef, fullActivity);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${userId}/activities/${activityId}`);
    } finally {
      setFirestoreSyncing(false);
    }
  };

  // Direct append bulk activities (from csv load) into Firestore
  const handleImportActivities = async (newActivities: Activity[]) => {
    if (!currentUser) return;
    setFirestoreSyncing(true);
    const userId = currentUser.uid;

    try {
      const batch = writeBatch(db);
      newActivities.forEach((act) => {
        const actId = act.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const actRef = doc(db, "users", userId, "activities", actId);
        batch.set(actRef, {
          ...act,
          id: actId,
          userId,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/activities`);
    } finally {
      setFirestoreSyncing(false);
    }
  };

  // Remove individual log line from Firestore
  const handleRemoveActivity = async (id: string) => {
    if (!currentUser) return;
    setFirestoreSyncing(true);
    const userId = currentUser.uid;
    try {
      await deleteDoc(doc(db, "users", userId, "activities", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}/activities/${id}`);
    } finally {
      setFirestoreSyncing(false);
    }
  };

  // Show loading spinner while determining Firebase auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
            Connecting to Firebase Cloud Services...
          </p>
        </div>
      </div>
    );
  }

  // Core Authentication gating
  if (!currentUser || !company) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Upper Navigation deck banner */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Corporate Brand */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-500/20">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5 leading-none">
                  CARBON<span className="text-teal-400">INTELLIGENCE</span>
                </h1>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider flex items-center gap-1">
                  <Database className="h-2.5 w-2.5 text-teal-400" />
                  Cloud Firestore Connected
                </p>
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
            <div className="flex items-center gap-3">
              {firestoreSyncing && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] text-teal-400 font-mono">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Syncing Firestore...
                </span>
              )}
              <div className="flex items-center gap-2 bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-700">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="h-5 w-5 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="h-3.5 w-3.5 text-teal-400" />
                )}
                <span
                  className="text-[11px] font-mono text-slate-300 font-semibold truncate max-w-36"
                  title={currentUser.email || currentUser.displayName || ""}
                >
                  {currentUser.displayName || currentUser.email}
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

      {/* Active boundaries banner */}
      <div className="bg-slate-800 border-b border-slate-700 text-slate-200">
        <div className="max-w-7xl mx-auto py-2.5 px-4 sm:px-6 lg:px-8 text-xs flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="font-medium text-center sm:text-left flex items-center gap-1.5">
            <Fingerprint className="h-4 w-4 text-teal-400" />
            Active Organization:{" "}
            <span className="font-bold text-white underline">{company.name}</span> with{" "}
            <span className="font-bold text-teal-400">{activities.length}</span> verified entries in Firestore.
          </p>
          {activities.length === 0 && (
            <button
              onClick={handleLoadSampleActivities}
              className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-xs cursor-pointer text-[10px] uppercase tracking-wider transition-colors"
            >
              🚀 Initialize Portuguese Pilot Data
            </button>
          )}
        </div>
      </div>

      {/* Main viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            company={company}
            activities={activities}
            onRemoveActivity={handleRemoveActivity}
          />
        )}

        {activeTab === "add_activity" && (
          <div className="space-y-8">
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
                facilities={company.facilities}
                onAddActivity={handleAddActivity}
              />
            )}

            {logType === "scan" && (
              <BillUploadForm
                facilities={company.facilities}
                onAddActivity={handleAddActivity}
              />
            )}

            {logType === "bulk_csv" && (
              <CSVImporter
                facilities={company.facilities}
                onImportActivities={handleImportActivities}
              />
            )}
          </div>
        )}

        {activeTab === "insights" && (
          <AIInsightsReport
            company={company}
            activities={activities}
          />
        )}

        {activeTab === "coach" && (
          <AICarbonCoach
            company={company}
            activities={activities}
          />
        )}

        {activeTab === "profile" && (
          <ProfileForm
            company={company}
            onUpdate={handleUpdateCompany}
          />
        )}

        {activeTab === "exporter" && (
          <ReportExporter
            company={company}
            activities={activities}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 mt-auto text-center text-xs">
        <p className="font-sans">© 2026 CarbonFootprint Enterprise SME Audit Coherence Tool.</p>
        <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">
          Powered by Cloud Firestore & Google AI • Conceptually mapped to EU CSRD & ESRS E1 standards.
        </p>
      </footer>
    </div>
  );
}
