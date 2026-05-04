import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

dotenv.config();

console.log("SERVER FILE LOADED:", import.meta.url);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Gemini
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// MiMo OpenAI-compatible client
const mimoClient =
  process.env.MIMO_API_KEY && process.env.MIMO_BASE_URL
    ? new OpenAI({
        apiKey: process.env.MIMO_API_KEY,
        baseURL: process.env.MIMO_BASE_URL
      })
    : null;

function safeParseJson(text = "") {
  try {
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function fallbackDecision(reasoningMode = "fallback") {
  return {
    final_decision:
      "Spinel ferrite phase is likely present based on the provided XRD peak evidence.",
    confidence: 85,
    evidence: [
      "Key diffraction peaks align with a spinel ferrite reference pattern.",
      "No dominant impurity phase is indicated in the provided peak list.",
      "The observed pattern is consistent with crystalline ferrite screening evidence."
    ],
    reasoningMode
  };
}

function buildXrdPrompt(goal, dataset) {
  const peaks = dataset?.peaks?.length
    ? dataset.peaks.join(", ")
    : "30.2, 35.5, 43.3, 57.2";

  return `
You are DIFARYX, an expert scientific reasoning agent for materials characterization.

Goal:
${goal || "Identify the likely crystalline phase from XRD evidence."}

Experimental evidence:
XRD peaks detected at 2θ = ${peaks} degrees.
Candidate reference: spinel ferrite structure such as CuFe2O4.
Screening note: no significant impurity peaks are provided above the screening threshold.

Task:
Return ONLY valid JSON with this exact structure:
{
  "final_decision": "one concise scientific conclusion",
  "confidence": 0,
  "evidence": ["evidence point 1", "evidence point 2", "evidence point 3"]
}

Rules:
- confidence must be an integer from 0 to 100
- evidence must contain exactly 3 items
- do not include markdown
- do not include explanations outside JSON
`;
}

async function runGeminiReasoning(prompt) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro-latest"
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = safeParseJson(text);

  if (!parsed) {
    throw new Error(`Gemini returned non-JSON output: ${text}`);
  }

  return parsed;
}

async function runMimoReasoning(prompt) {
  if (!mimoClient) {
    throw new Error("MIMO_API_KEY or MIMO_BASE_URL is missing.");
  }

  const response = await mimoClient.chat.completions.create({
    model: "mimo-v2.5",
    messages: [
      {
        role: "system",
        content:
          "You are DIFARYX, a scientific reasoning system for materials characterization. Return only valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const text = response.choices?.[0]?.message?.content || "";
  const parsed = safeParseJson(text);

  if (!parsed) {
    throw new Error(`MiMo returned non-JSON output: ${text}`);
  }

  return parsed;
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "DIFARYX Agent Backend",
    endpoints: ["/health", "/run-agent", "/api/mimo-agent"]
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "DIFARYX Agent Backend",
    port: PORT,
    gemini: Boolean(process.env.GEMINI_API_KEY),
    mimo: Boolean(process.env.MIMO_API_KEY && process.env.MIMO_BASE_URL),
    mimoBaseUrl: process.env.MIMO_BASE_URL || null
  });
});

app.post("/run-agent", async (req, res) => {
  const { goal, dataset, reasoningMode = "gemini" } = req.body;

  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const prompt = buildXrdPrompt(goal, dataset);

    let data;

    if (reasoningMode === "mimo") {
      data = await runMimoReasoning(prompt);
    } else if (reasoningMode === "gemini") {
      data = await runGeminiReasoning(prompt);
    } else {
      data = fallbackDecision("deterministic");
    }

    res.json({
      success: true,
      data: {
        final_decision: data.final_decision || fallbackDecision().final_decision,
        confidence:
          typeof data.confidence === "number"
            ? data.confidence
            : fallbackDecision().confidence,
        evidence: Array.isArray(data.evidence)
          ? data.evidence.slice(0, 3)
          : fallbackDecision().evidence,
        reasoningMode
      }
    });
  } catch (error) {
    console.error("Agent execution error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to execute agent pipeline.",
      detail: error.message
    });
  }
});

app.post("/api/mimo-agent", async (req, res) => {
  const { input } = req.body;

  try {
    const prompt = `
You are DIFARYX, an expert scientific reasoning system.

Analyze this input:
${input || "Analyze XRD peaks at 30.2, 35.5, 43.3, 57.2 degrees."}

Return ONLY valid JSON:
{
  "final_decision": "concise scientific conclusion",
  "confidence": 0,
  "evidence": ["point 1", "point 2", "point 3"]
}
`;

    const data = await runMimoReasoning(prompt);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error("MiMo error:", error);

    res.status(500).json({
      success: false,
      error: "MiMo failed",
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`DIFARYX Agent Backend running on port ${PORT}`);
});