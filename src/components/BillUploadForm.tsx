/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Facility, Activity, ActivityCategory, EMISSION_FACTORS } from "../types";
import { FileUp, Sparkles, Loader2, AlertCircle, CheckCircle, HelpCircle, Edit } from "lucide-react";

interface BillUploadFormProps {
  facilities: Facility[];
  onAddActivity: (activity: Omit<Activity, "id" | "emissions">) => void;
}

export default function BillUploadForm({ facilities, onAddActivity }: BillUploadFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState("");
  
  // Extracted preview variables
  const [extractedData, setExtractedData] = useState<{
    billingPeriod: string;
    consumptionKWh: number;
    totalCostEur: number;
    fuelType: 'electricity' | 'natural_gas';
    explanation: string;
  } | null>(null);

  // Review fields
  const [facilityId, setFacilityId] = useState(facilities[0]?.id || "");
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split("T")[0]);
  const [reviewPeriod, setReviewPeriod] = useState("");
  const [reviewConsumption, setReviewConsumption] = useState<number>(0);
  const [reviewCost, setReviewCost] = useState<number>(0);
  const [reviewFuelType, setReviewFuelType] = useState<'electricity' | 'natural_gas'>('electricity');

  const [committed, setCommitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragActive(false);
    setError("");
    setExtractedData(null);
    setCommitted(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setExtractedData(null);
    setCommitted(false);
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    // We accept general PNG/JPEG/JPG images and PDFs. Let's verify size < 10mb
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Supported file types are PNG, JPEG/JPG, and PDF invoices.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit. Compress your scans.");
      return;
    }

    setFile(selectedFile);
    uploadAndExtract(selectedFile);
  };

  const uploadAndExtract = (selectedFile: File) => {
    setLoading(true);
    setLoadingStep("Reading local file bytes into memory...");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setLoadingStep("Encrypting payload and transmitting to Gemini Engine...");
        const base64Data = (reader.result as string).split(",")[1];

        const payload = {
          fileData: base64Data,
          fileName: selectedFile.name,
          mimeType: selectedFile.type
        };

        setLoadingStep("Multimodal Gemini model analyzing layout of EDP/Iberdrola bill...");
        const response = await fetch("/api/upload-bill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        setLoading(false);

        if (response.ok) {
          setExtractedData(result);
          // Pre-fill review inputs
          setReviewPeriod(result.billingPeriod || "Extracted Period");
          setReviewConsumption(result.consumptionKWh || 0);
          setReviewCost(result.totalCostEur || 0);
          setReviewFuelType(result.fuelType || "electricity");
        } else {
          setError(result.error || "Gemini could not identify consumption on this receipt. Verify quality and try again.");
        }
      } catch (err: any) {
        setLoading(false);
        setError("Network error contacting document extraction server. Please check your developer terminal logs.");
      }
    };

    reader.onerror = () => {
      setLoading(false);
      setError("Failed to read the local file bytes.");
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleCommitReview = () => {
    if (!facilityId) {
      alert("Please select a controlled facility boundary before committing.");
      return;
    }

    const category: ActivityCategory = reviewFuelType === "electricity" ? "scope2_electricity" : "scope1_stationary";

    onAddActivity({
      date: reviewDate,
      facilityId,
      category,
      subType: reviewFuelType,
      value: Number(reviewConsumption),
      unit: "kWh",
      cost: reviewCost > 0 ? Number(reviewCost) : undefined,
      description: `AI Extracted EDP/Invoice - Billing Period: "${reviewPeriod}"`
    });

    setCommitted(true);
    setExtractedData(null);
    setFile(null);
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-violet-50 text-violet-700 p-2 rounded-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Direct Invoice Scanning (OCR)</h3>
            <p className="text-xs text-slate-400">Scan EDP, Endesa or Galp electricity / gas bills to populate entries using Gemini AI.</p>
          </div>
        </div>

        {committed && (
          <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>AI extracted activity confirmed, verified, and successfully committed to the corporate ledger!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Drag and Drop Zone */}
        {!loading && !extractedData && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 h-64 text-center transition-all ${
              dragActive ? "border-teal-500 bg-teal-50/50" : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
            }`}
            onClick={onButtonClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileChange}
            />
            <div className="bg-white group-hover:scale-105 transition-transform p-3 rounded-xl shadow-xs border border-slate-200 text-slate-400 mb-4">
              <FileUp className="h-6 w-6 text-violet-600" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Drag & drop utility invoice scan, or <span className="text-violet-600 underline">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-1.5 font-sans leading-wider">
              Supports PDF, PNG, JPG files (Max 10MB)
            </p>
          </div>
        )}

        {/* Uploading Skeleton */}
        {loading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 p-12 bg-slate-55 text-center h-64">
            <Loader2 className="h-10 w-10 text-violet-600 animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-800">Processing Corporate Bill</p>
            <p className="text-xs text-slate-400 mt-1 animate-pulse italic">{loadingStep}</p>
          </div>
        )}
      </div>

      {/* Verification and prefill Review Area (Never Auto-saved!) */}
      {extractedData && (
        <div className="bg-teal-50/30 border border-teal-200/80 rounded-2xl p-6 shadow-xs space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-teal-200/50 pb-3">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-teal-700" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Step 2: Review and File Verification</h4>
                <p className="text-xs text-slate-500">Examine Gemini extracted parameters before releasing into official ledger.</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-teal-100/80 text-teal-800 font-bold py-0.5 px-2 rounded">
              PENDING DIRECT SIGN-OFF
            </span>
          </div>

          <div className="p-4 bg-white border border-teal-200/60 rounded-xl space-y-2">
            <div className="flex items-start text-xs text-slate-600 gap-1.5">
              <HelpCircle className="h-4 w-4 text-violet-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">Extracted metadata feedback:</span>
                {" "}{extractedData.explanation}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Linked Company Boundary Asset
              </label>
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
                required
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Filing Date (Filing context)
              </label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Billing Cycle / Period
              </label>
              <input
                type="text"
                value={reviewPeriod}
                onChange={(e) => setReviewPeriod(e.target.value)}
                className="w-full bg-white px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
                placeholder="e.g. 01/12/2025 - 31/12/2025"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Filing fuel / resource sub-type
              </label>
              <select
                value={reviewFuelType}
                onChange={(e) => setReviewFuelType(e.target.value as 'electricity' | 'natural_gas')}
                className="w-full bg-white px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
                required
              >
                <option value="electricity">Direct Grid Electricity (Scope 2)</option>
                <option value="natural_gas">Natural Gas Pipeline (Scope 1)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Consumption Value (kWh)
              </label>
              <input
                type="number"
                value={reviewConsumption}
                onChange={(e) => setReviewConsumption(Number(e.target.value))}
                min="0.1"
                step="any"
                className="w-full bg-white px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Total Extracted Cost (EUR €)
              </label>
              <input
                type="number"
                value={reviewCost}
                onChange={(e) => setReviewCost(Number(e.target.value))}
                min="0"
                step="any"
                className="w-full bg-white px-3 py-2 border border-slate-200 focus:ring-2 focus:ring-teal-500 rounded-xl text-slate-900 text-sm focus:outline-hidden"
              />
            </div>
          </div>

          {/* Recalculation panel */}
          <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              <span className="font-semibold block text-slate-700">Ledger accounting preview:</span>
              Category: {reviewFuelType === "electricity" ? "Scope 2 electricity" : "Scope 1 stationary"} @ {EMISSION_FACTORS[reviewFuelType]?.factor} kg CO2e/kWh
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Commit emissions output:</p>
              <p className="text-base font-black text-teal-800 font-mono">
                {(reviewConsumption * (EMISSION_FACTORS[reviewFuelType]?.factor || 0)).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO2e
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                setExtractedData(null);
                setFile(null);
              }}
              className="flex-1 text-center py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
            >
              Cancel and Discard Scans
            </button>
            <button
              type="button"
              onClick={handleCommitReview}
              className="flex-1 text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs cursor-pointer transition-all"
            >
              Verify, Approve & Commit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
