/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ShieldCheck, Loader2, Sparkles, Lock, Play } from "lucide-react";
import { auth, googleProvider, signInWithPopup } from "../lib/firebase";

interface LoginFormProps {
  onTryDemo: () => void;
}

export default function LoginForm({ onTryDemo }: LoginFormProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in App.tsx will automatically pick up the user and load their Firestore data
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        setError(err.message || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-teal-600 text-white shadow-xl shadow-teal-600/10 mb-6">
          <ShieldCheck className="h-9 w-9" />
        </div>
        <h2 className="text-3xl font-bold font-sans tracking-tight text-slate-900">
          CarbonFootprint Enterprise
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Scope 1 & 2 GHG Protocol Accounting for Portuguese SMEs (CSRD/ESRS)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-10 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl text-center">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 text-left">
              <p className="text-xs font-medium text-red-700">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-900">
              Welcome to your Carbon Ledger
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Sign in with your Google account to access your private Firestore ledger, or try the interactive demo mode with pre-generated AI insights.
            </p>
          </div>

          {/* Action Buttons: Sign In With Google & Try Demo */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {/* Primary Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 border border-slate-300 rounded-xl shadow-xs text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-teal-600" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* Try Demo Button */}
            <button
              type="button"
              onClick={onTryDemo}
              className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl shadow-xs text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all cursor-pointer shrink-0"
              title="Explore full platform in demo mode without signing in"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Try Demo</span>
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <Lock className="h-3.5 w-3.5 text-teal-600" />
            <span>Try Demo runs in-memory • Google Sign-In syncs to Cloud Firestore</span>
          </div>

          <div className="mt-6 bg-slate-50/80 rounded-xl p-4 text-left border border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-teal-600" />
              Enterprise Features Available in Demo
            </h4>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
              <li>Scope 1 & Scope 2 greenhouse gas calculations (IPCC & DGEG factors)</li>
              <li>Pre-generated AI Carbon Insights & Climate Coach responses</li>
              <li>Sample EDP utility bill scan & CSRD E1 export tool</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
