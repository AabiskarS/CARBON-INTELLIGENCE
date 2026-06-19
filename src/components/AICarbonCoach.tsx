/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Company, Activity } from "../types";
import { MessageSquare, Send, Sparkles, Loader2, Bot, User, RefreshCw, BarChart, HardHat } from "lucide-react";

interface AICarbonCoachProps {
  company: Company;
  activities: Activity[];
}

interface Message {
  role: "user" | "bot";
  content: string;
}

export default function AICarbonCoach({ company, activities }: AICarbonCoachProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: `Olá! I am your AI Corporate Carbon Coach.

I am configured specifically for **${company.name}** and aligned with standard EU CSRD double-materiality disclosure targets (Scope 1 Direct Direct and Scope 2 Purchased Grid Electricity).

How may I assist you in optimizing your operational carbon footprint or formulating abatement solutions? Some specific topics we can analyze include:
• Switching to **Garantias de Origem (d'Origem)** Renewable Tariffs (Scope 2 optimization)
• **Electrification / Fuel-Efficiency** paths for your road vehicle fleet (Scope 1 Mobile)
• Modernizing facility heating & mechanical energy machinery (Scope 1 Stationary)

Ask me anything about your current activity profile!`
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const predefinedPrompts = [
    { text: "What is our best path to cut our Scope 2 grid emissions?", label: "Scope 2 Strategy" },
    { text: "How should we address petrol/diesel usage in our vehicle fleet?", label: "Fleet Abatement" },
    { text: "What are the key CSRD reporting boundaries for our sector?", label: "CSRD Compliance" }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return;

    const userMsg = textToSend.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setSending(true);

    try {
      const history = [...messages, { role: "user", content: userMsg }].map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        content: msg.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          company,
          activities
        })
      });

      const data = await response.json();
      setSending(false);

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "bot", content: data.content }]);
      } else {
        setMessages((prev) => [
          ...prev, 
          { role: "bot", content: `⚠️ Error from coach router: ${data.error || "Failed to compile AI insights."}` }
        ]);
      }
    } catch (err) {
      setSending(false);
      setMessages((prev) => [
        ...prev, 
        { role: "bot", content: "❌ Network error. Verify that the server.ts backend is responding." }
      ]);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: "bot",
        content: `Chat session reset. I am ready to advise **${company.name}** again on SME corporate carbon accounting and abatement paths.`
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-6xl mx-auto h-[600px]">
      {/* Sidebar: contextual parameters */}
      <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
            <HardHat className="h-4 w-4 text-teal-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Boundary Context</h4>
          </div>

          <div className="space-y-3">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Company Name</span>
              <span className="text-xs font-semibold text-slate-700 block truncate">{company.name}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Industry sector</span>
              <span className="text-xs font-semibold text-slate-700 block truncate">{company.industrySector}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Reporting Scope</span>
              <span className="text-xs font-medium text-slate-600 block">Scope 1 (Direct) & Scope 2 (Indirect)</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Active Controlled Facilities</span>
              <span className="text-xs font-semibold text-slate-700 block">
                {company.facilities.length} physical assets mapped
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total ledger logs</span>
              <span className="text-xs font-semibold text-slate-700 block">
                {activities.length} accounting entries
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          <button
            onClick={handleResetChat}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Clear advisor Thread
          </button>
        </div>
      </div>

      {/* Main chat center */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden h-full">
        {/* Chat header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-100/80 text-teal-700 p-1.5 rounded-lg">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Operational Sustainability Advisor</h3>
              <p className="text-[11px] text-slate-400 font-sans">Corporate Carbon Auditor • Powered by Gemini 3.5-Flash</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-0.5 px-2 rounded-md border border-emerald-200/50">
            Audit-Grounded Mode
          </span>
        </div>

        {/* Chat window body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-slate-50/20">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 max-w-[85%] ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`flex-shrink-0 p-1.5 rounded-lg border shadow-xs ${
                  msg.role === "user" 
                    ? "bg-slate-800 border-slate-900 text-white" 
                    : "bg-teal-50 border-teal-200 text-teal-700"
                }`}
              >
                {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-slate-800 text-white rounded-tr-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
              Corporate coach formulation active...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Preset options */}
        {messages.length === 1 && (
          <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
            {predefinedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.text)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-lg text-xs leading-none text-slate-600 font-medium transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-teal-500" />
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder={`Ask about EDP tariffs, fleet electrification, or CSRD alignment...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-hidden"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Consult
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
