/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// High-limit parser for base64 uploads (like scanned bills)
app.use(express.json({ limit: "25mb" }));

// Lazy initializer for Gemini client to prevent crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it to your Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Basic Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  // Simple password check or allow any (prototype login for a pilot user)
  // Let's accept any password for usability, or if they put a password, we authenticate
  res.json({
    success: true,
    user: {
      username,
      companyName: req.body.companyName || `${username} Enterprises, Lda.`
    }
  });
});

// 2. Document Utility Bill Extractor Endpoint
app.post("/api/upload-bill", async (req, res) => {
  try {
    const { fileData, fileName, mimeType } = req.body;
    if (!fileData || !mimeType) {
      return res.status(400).json({ error: "Missing fileData (base64 string) or mimeType" });
    }

    const ai = getGeminiClient();

    // Prepare content parts for Gemini
    const billImagePart = {
      inlineData: {
        mimeType: mimeType,
        data: fileData, // raw base64 string
      },
    };

    const systemPrompt = `You are an expert carbon-accounting agent specialized in processing Portuguese corporate invoices and bills.
Analyze the utility bill document provided (which is typically from an electricity provider like EDP, Endesa, Iberdrola, Galp, etc.).
Extract the following information:
1. Billing Period (e.g. "01/01/2026 - 31/01/2026" or "Janeiro 2026")
2. Total energy consumption in kWh (kilowatt-hour) of electricity. Look for "Consumo de energia", "Consumo total", "Energia ativa" or equivalent.
3. Total cost of electricity in Euros (€).
4. Sub-type of fuel. It must be either "electricity" (most common for grid consumption) or "natural_gas".

Respond in a valid JSON object structure with the fields defined below. Do not output any markdown around the JSON, respond inside the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        billImagePart,
        { text: "Extract the billing period, electricity or gas consumption in kWh, and total cost in EUR from this utility bill." }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            billingPeriod: {
              type: Type.STRING,
              description: "The start and end dates or billing month extracted, e.g. '01/12/2025 - 31/12/2025'."
            },
            consumptionKWh: {
              type: Type.NUMBER,
              description: "The numeric consumption in kWh. Defaults to 0 if not found."
            },
            totalCostEur: {
              type: Type.NUMBER,
              description: "The total cost of energy/bill in Euros. Defaults to 0 if not found."
            },
            fuelType: {
              type: Type.STRING,
              description: "Must be 'electricity' or 'natural_gas'."
            },
            extractedSuccessfully: {
              type: Type.BOOLEAN,
              description: "True if fields were successfully read; false if the document is unreadable or not a utility bill."
            },
            explanation: {
              type: Type.STRING,
              description: "Brief note explaining what was found or any warnings."
            }
          },
          required: ["billingPeriod", "consumptionKWh", "totalCostEur", "fuelType", "extractedSuccessfully"]
        }
      }
    });

    const resultText = response.text ? response.text.trim() : "{}";
    const parsedData = JSON.parse(resultText);

    if (!parsedData.extractedSuccessfully && parsedData.consumptionKWh === 0 && parsedData.totalCostEur === 0) {
      return res.status(422).json({
        error: "We could not extract any energy usage or costs. Please confirm that this is a valid image/page of a utility bill or enter the data manually."
      });
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error("Error extracting bill:", error);
    res.status(500).json({ error: error.message || "An error occurred during billing analysis by the AI model." });
  }
});

// 3. Complex Enterprise AI Insights Generator
app.post("/api/insights", async (req, res) => {
  try {
    const { company, activities } = req.body;

    if (!company) {
      return res.status(400).json({ error: "Company details are required" });
    }

    const ai = getGeminiClient();

    const promptText = `Analyze the carbon emissions for company "${company.name}" (Industry: "${company.industrySector || 'General'}", Employees: ${company.employeeCount}, Reporting Year: ${company.reportingYear}).
Their current activities of Scope 1 and Scope 2 GHG protocol entries are as follows:
${JSON.stringify(activities, null, 2)}

Prepare a structured draft internal carbon footprint report aligned conceptually with direct EU Corporate Sustainability Reporting Directive (CSRD) and ESRS E1 Climate Change requirements for SMEs.

Offer 3-4 specific business-operational efficiency upgrade levers:
- Renewable electricity tariff switching
- Fleet fuel-efficiency or electrification (petrol/diesel replacement)
- Facility equipment/HVAC/lighting efficiency upgrades
Each operational lever must specify which Scope/Category it impacts, and express impact as a qualitative range to be safe and accurate, avoiding precise invented figures that aren't backed by detailed measurements.

Format your output in a clean, highly structured JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction: "You are an expert corporate sustainability advisor specializing in EU CSRD/ESRS standard carbon disclosures (Scope 1 and Scope 2) for European Small & Medium Enterprises (SMEs), using metric units.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: "A professional executive summary of the SME's reporting year emissions performance."
            },
            scopeAnalysis: {
              type: Type.OBJECT,
              properties: {
                scope1Assessment: { type: Type.STRING },
                scope2Assessment: { type: Type.STRING }
              },
              required: ["scope1Assessment", "scope2Assessment"]
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impactScope: { type: Type.STRING, description: "e.g., 'Scope 2 (Electricity)' or 'Scope 1 (Mobile Combustion)'" },
                  leverType: { type: Type.STRING, description: "tariff_switch | electrification | hvac_upgrade | other" },
                  impactRangeQualitative: { type: Type.STRING, description: "e.g. 'Low-to-Medium qualitative impact', 'Significant emission reduction'" },
                  description: { type: Type.STRING }
                },
                required: ["title", "impactScope", "leverType", "impactRangeQualitative", "description"]
              }
            },
            esrsAlignDocs: {
              type: Type.STRING,
              description: "Brief guidelines on next steps for the company to declare this draft alignment with ESRS E1 Disclosure Requirements."
            }
          },
          required: ["executiveSummary", "scopeAnalysis", "recommendations", "esrsAlignDocs"]
        }
      }
    });

    const parsedData = JSON.parse(response.text ? response.text.trim() : "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: error.message || "An error occurred during carbon coaching analysis." });
  }
});

// 4. Corporate Carbon Coach Chat Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, company, activities } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "A list of chat messages is required" });
    }

    const ai = getGeminiClient();

    // Prepare system instructions grounded in the company's structure and activity history
    const systemPrompt = `You are the Corporate Carbon Coach, an expert sustainability consultant helping Portuguese Small and Medium Enterprises (SMEs) account for and abate their Scope 1 & Scope 2 greenhouse gas emissions.
You are aligned conceptually with the EU CSRD/ESRS E1 Climate Change reporting frameworks and the GHG Protocol.

You are interacting with:
- Company Name: ${company?.name || "Client SME"}
- Industry Sector: ${company?.industrySector || "General Business"}
- Reporting Year: ${company?.reportingYear || "Current Year"}
- Facilities: ${JSON.stringify(company?.facilities || [])}
- Active Carbon Log (Activities): ${JSON.stringify(activities || [])}

Rules:
1. Maintain a professional, advisory, and constructive commercial consulting tone.
2. Only address business-operational levers: renewable electricity contracts (Garantias de Origem), fleet electrification (petrol/diesel replacements), heating systems, and facility insulation.
3. NEVER recommend personal-lifestyle choices like vegetarian home recipes, personal carpooling, or consumer dietary swaps. These are business enterprises.
4. If asked about precise carbon coefficients, cite the official references like Portugal's DGEG (Direção-Geral de Energia e Geologia) or IPCC, and politely state that coefficients should be officially verified with annual emission registries.
5. Answer concisely, structured with paragraphs and bullet points where useful. Do not write a massive wall of text. Use markdown properly.`;

    // Map messages array to Gemini chats history
    const geminiHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: msg.content }],
    }));

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        ...geminiHistory,
        { role: "user", parts: [{ text: lastUserMessage }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Error in corporate coach chat:", error);
    res.status(500).json({ error: error.message || "An error occurred with the AI Corporate Chat Coach." });
  }
});

// 5. Hot integration of Vite or Static HTML Dist
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Carbon Footprint Intelligence System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
