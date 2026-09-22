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
import { calculateEmissions } from "./lib/emissions";
import { auth, db, signOut, handleFirestoreError, OperationType, googleProvider, signInWithPopup } from "./lib/firebase";
import { DEMO_COMPANY, DEMO_ACTIVITIES } from "./demoResponses";

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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [firestoreSyncing, setFirestoreSyncing] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "add_activity" | "insights" | "coach" | "profile" | "exporter"
  >("dashboard");

  const [logType, setLogType] = useState<"manual" | "scan" | "bulk_csv">("manual");

  const handleStartDemo = () => {
    setIsDemoMode(true);
    setCompany(DEMO_COMPANY);
    setActivities(DEMO_ACTIVITIES);
    setActiveTab("dashboard");
  };

  const handleExitDemo = () => {
    setIsDemoMode(false);
    setCompany(null);
    setActivities([]);
    setActiveTab("dashboard");
  };

  const handleGoogleSignInFromDemo = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsDemoMode(false);
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
    }
  };

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setIsDemoMode(false);
      } else {
        if (!isDemoMode) {
          setCompany(null);
          setActivities([]);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore real-time updates for company and activities
  useEffect(() => {
    if (!currentUser) {
      if (!isDemoMode) {
        setCompany(null);
        setActivities([]);
      }
      return;
    }

    // Reset memory before listening to Firestore
    if (!isDemoMode) {
      setActivities([]);
    }

    const userId = currentUser.uid;
    const companyDocRef = doc(db, "users", userId);
    const activitiesColRef = collection(db, "users", userId, "activities");

    // Real-time listener for user's company profile
    const unsubCompany = onSnapshot(
      companyDocRef,
      async (docSnap) => {
        const defaultOrgName = currentUser.displayName
          ? `${currentUser.displayName}'s Organization`
          : currentUser.email
          ? `${currentUser.email.split("@")[0]}'s Organization`
          : "My Organization";

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Check if document contains old prototype placeholder company names
          const isOldSampleName =
            data.name === "Santos & Filhos, Lda." ||
            data.name === "Serralharia Central de Aveiro, Lda." ||
            data.name === "Padaria Central" ||
            data.name === "Padaria Central, Lda." ||
            data.name === "Demo Enterprises, Lda.";

          const finalName = (!data.name || isOldSampleName) ? defaultOrgName : data.name;

          if (isOldSampleName) {
            // Overwrite old prototype company name in Firestore with the user's actual organization
            setDoc(companyDocRef, { name: defaultOrgName }, { merge: true }).catch(() => {});
          }

          setCompany({
            name: finalName,
            industrySector: data.industrySector || "General Business",
            employeeCount: data.employeeCount ?? 10,
            reportingYear: data.reportingYear ?? new Date().getFullYear(),
            facilities: data.facilities && data.facilities.length > 0
              ? data.facilities
              : [{ id: "fac-1", name: "Main Facility", type: "office" }]
          });
        } else {
          // Initialize fresh company profile in Firestore for new user
          const initialCompany: Company = {
            name: defaultOrgName,
            industrySector: "General Business",
            employeeCount: 10,
            reportingYear: new Date().getFullYear(),
            facilities: [
              { id: "fac-1", name: "Main Facility", type: "office" }
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

    // Old prototype sample activity IDs to filter out and prune from real accounts
    const sampleIds = new Set([
      "act-1", "act-2", "act-3", "act-4", "act-5", "act-6", "act-7", "act-8",
      "demo-act-1", "demo-act-2", "demo-act-3", "demo-act-4", "demo-act-5"
    ]);

    // Real-time listener for user's carbon activities
    const unsubActivities = onSnapshot(
      activitiesColRef,
      (snapshot) => {
        const items: Activity[] = [];
        snapshot.forEach((docSnap) => {
          const act = docSnap.data() as Activity;
          // If this document is an old sample prototype item accidentally saved in the user's collection, delete it
          if (sampleIds.has(docSnap.id) || (act.id && sampleIds.has(act.id))) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }
          items.push(act);
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
    if (isDemoMode) {
      handleExitDemo();
      return;
    }
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

  // Corporate Profile updates persisted to Firestore (or in-memory in Demo Mode)
  const handleUpdateCompany = async (updatedCompany: Company) => {
    if (isDemoMode) {
      setCompany(updatedCompany);
      return;
    }
    if (!currentUser) return;
    setFirestoreSyncing(true);
    const userId = currentUser.uid;
    try {
      const sanitizedCompany: Record<string, any> = {
        name: updatedCompany.name || "My Organization",
        industrySector: updatedCompany.industrySector || "General Business",
        employeeCount: Number(updatedCompany.employeeCount) || 1,
        reportingYear: Number(updatedCompany.reportingYear) || new Date().getFullYear(),
        facilities: updatedCompany.facilities || [],
        userId,
        updatedAt: new Date().toISOString()
      };
      Object.keys(sanitizedCompany).forEach((k) => {
        if (sanitizedCompany[k] === undefined) delete sanitizedCompany[k];
      });

      await setDoc(doc(db, "users", userId), sanitizedCompany, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setFirestoreSyncing(false);
    }
  };

  // Add individual activity to Firestore (or in-memory in Demo Mode)
  const handleAddActivity = async (newAct: Omit<Activity, "id" | "emissions">) => {
    const emissionsEquivalent = calculateEmissions(newAct.value, newAct.subType);
    const activityId = `act-${Date.now()}`;

    // Guarantee no undefined fields can ever be passed to Firestore
    const sanitizedActivity: Record<string, any> = {
      id: activityId,
      date: newAct.date || new Date().toISOString().split("T")[0],
      facilityId: newAct.facilityId || "fac-1",
      category: newAct.category,
      subType: newAct.subType,
      value: Number(newAct.value) || 0,
      unit: newAct.unit || "kWh",
      emissions: emissionsEquivalent,
      cost: newAct.cost !== undefined && newAct.cost !== null && !isNaN(Number(newAct.cost)) ? Number(newAct.cost) : null,
      description: newAct.description !== undefined && newAct.description !== null ? String(newAct.description) : "",
      userId: currentUser ? currentUser.uid : "demo-user",
      createdAt: new Date().toISOString()
    };

    // Filter out any undefined keys
    Object.keys(sanitizedActivity).forEach((key) => {
      if (sanitizedActivity[key] === undefined) {
        delete sanitizedActivity[key];
      }
    });

    const fullActivity = sanitizedActivity as Activity;

    if (isDemoMode) {
      setActivities((prev) => [fullActivity, ...prev]);
      return;
    }

    if (!currentUser) return;
    setFirestoreSyncing(true);
    const userId = currentUser.uid;

    try {
      const actRef = doc(db, "users", userId, "activities", activityId);
      await setDoc(actRef, fullActivity);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${userId}/activities/${activityId}`);
    } finally {
      setFirestoreSyncing(false);
    }
  };

  // Direct append bulk activities (from csv load) into Firestore (or in-memory in Demo Mode)
  const handleImportActivities = async (newActivities: Activity[]) => {
    const sanitizedList: Activity[] = newActivities.map((act) => {
      const actId = act.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const cleanItem: Record<string, any> = {
        id: actId,
        date: act.date || new Date().toISOString().split("T")[0],
        facilityId: act.facilityId || "fac-1",
        category: act.category,
        subType: act.subType,
        value: Number(act.value) || 0,
        unit: act.unit || "kWh",
        emissions: Number(act.emissions) || 0,
        cost: act.cost !== undefined && act.cost !== null && !isNaN(Number(act.cost)) ? Number(act.cost) : null,
        description: act.description !== undefined && act.description !== null ? String(act.description) : "",
        userId: currentUser ? currentUser.uid : "demo-user",
        createdAt: new Date().toISOString()
      };
      Object.keys(cleanItem).forEach((k) => {
        if (cleanItem[k] === undefined) delete cleanItem[k];
      });
      return cleanItem as Activity;
    });

    if (isDemoMode) {
      setActivities((prev) => [...sanitizedList, ...prev]);
      return;
    }

    if (!currentUser) return;
    setFirestoreSyncing(true);
    const userId = currentUser.uid;

    try {
      const batch = writeBatch(db);
      sanitizedList.forEach((act) => {
        const actRef = doc(db, "users", userId, "activities", act.id);
        batch.set(actRef, act);
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}/activities`);
    } finally {
      setFirestoreSyncing(false);
    }
  };

  // Remove individual log line from Firestore (or in-memory in Demo Mode)
  const handleRemoveActivity = async (id: string) => {
    if (isDemoMode) {
      setActivities((prev) => prev.filter((a) => a.id !== id));
      return;
    }

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
  if (!currentUser && !isDemoMode) {
    return <LoginForm onTryDemo={handleStartDemo} />;
  }

  if (!company) {
    if (isDemoMode) {
      setCompany(DEMO_COMPANY);
      setActivities(DEMO_ACTIVITIES);
    }
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Banner: Demo Mode Announcement */}
      {isDemoMode && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-amber-500 sticky top-0 z-50 shadow-xs">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="bg-slate-900 text-amber-300 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider">
              Demo Mode
            </span>
            <span>
              Demo Mode — AI responses are pre-generated. Sign in with Google to use the live system.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleGoogleSignInFromDemo}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Sign in with Google
            </button>
            <button
              onClick={handleExitDemo}
              className="px-2.5 py-1 text-slate-900 hover:text-black font-semibold text-xs cursor-pointer underline"
            >
              Exit Demo
            </button>
          </div>
        </div>
      )}

      {/* Upper Navigation deck banner */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Corporate Brand */}
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="CarbonLedger" width="32" height="32" />
              <div>
                <h1 className="text-sm font-black tracking-tight flex items-center gap-1.5 leading-none">
                  CarbonLedger
                </h1>
                {isDemoMode ? (
                  <p className="text-[10px] text-amber-300 mt-1 uppercase font-mono tracking-wider flex items-center gap-1">
                    <Database className="h-2.5 w-2.5 text-amber-300" />
                    In-Memory Mode (Demo)
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-wider flex items-center gap-1">
                    <Database className="h-2.5 w-2.5 text-teal-400" />
                    Cloud Firestore Connected
                  </p>
                )}
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
              {isDemoMode ? (
                <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 py-1.5 px-3 rounded-xl text-amber-200">
                  <User className="h-3.5 w-3.5 text-amber-300" />
                  <span className="text-[11px] font-mono font-semibold">Demo Reviewer</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-700">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser?.displayName || "User"}
                      className="h-5 w-5 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-3.5 w-3.5 text-teal-400" />
                  )}
                  <span
                    className="text-[11px] font-mono text-slate-300 font-semibold truncate max-w-36"
                    title={currentUser?.email || currentUser?.displayName || ""}
                  >
                    {currentUser?.displayName || currentUser?.email}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-300 transition-colors cursor-pointer"
                title={isDemoMode ? "Exit Demo Mode" : "Log Out Session"}
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
            <span className="font-bold text-teal-400">{activities.length}</span>{" "}
            {isDemoMode ? "sample activities (In-Memory Demo)." : "verified entries in Firestore."}
          </p>
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
            onNavigateToAdd={() => setActiveTab("add_activity")}
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
                isDemoMode={isDemoMode}
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
            isDemoMode={isDemoMode}
          />
        )}

        {activeTab === "coach" && (
          <AICarbonCoach
            company={company}
            activities={activities}
            isDemoMode={isDemoMode}
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
        <p className="font-sans text-slate-400">© 2026 CarbonLedger · Built for CSRD/ESRS E1 preparation</p>
        <p className="text-[11px] text-slate-500 mt-1 opacity-80 font-sans">
          Reports are drafts — verify with an accredited auditor before submission.
        </p>
      </footer>
    </div>
  );
}
