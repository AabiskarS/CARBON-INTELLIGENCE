/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldCheck, Building2, User, KeyRound, Loader2 } from "lucide-react";

interface LoginFormProps {
  onLoginSuccess: (username: string, companyName: string, loadSample: boolean) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState("sustainability@sme.pt");
  const [password, setPassword] = useState("portugal-csr");
  const [companyName, setCompanyName] = useState("Serralharia Central de Aveiro, Lda.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please key in a valid username or email.");
      return;
    }

    setLoading(true);

    try {
      // Simulate backend authentication
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, companyName }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        // Log in, and let the caller know what company we established
        onLoginSuccess(username, companyName, username === "sustainability@sme.pt");
      } else {
        setError(data.error || "Authentication failed. Clear invalid logs.");
      }
    } catch (err: any) {
      setLoading(false);
      setError("Could not connect to the authentication server. Verify the server is running.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-xs font-medium text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Business Controller Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm text-slate-900 transition-colors"
                  placeholder="sustainability@company.pt"
                  required
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Use <code className="font-mono bg-slate-100 py-0.5 px-1 rounded text-teal-700">sustainability@sme.pt</code> to log into the pre-loaded pilot.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Secret Access Token
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm text-slate-900 transition-colors"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Corporate Entity Name
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm text-slate-900 transition-colors"
                  placeholder="E.g., Santos & Filhos, Lda."
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Authenticating Company...
                  </>
                ) : (
                  "Access Intelligence Portal"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200/60 pt-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Prototype Features:</h4>
            <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
              <li>Scope 1 Direct & Scope 2 Indirect Carbon Accounting</li>
              <li>SME-adapted European factors with warnings for academic thesis citations</li>
              <li>Interactive receipt-scanning & bill extraction using Gemini AI</li>
              <li>ESRS E1 ESG disclosure matching & qualitative abating engines</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
