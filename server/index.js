import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize Gemini API
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

app.post('/run-agent', async (req, res) => {
  const { goal, dataset } = req.body;

  try {
    // Pipeline Simulation
    
    // 1. Goal Interpreter & Planner (Mocked delay to simulate agent thought process)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 2. Tool Orchestrator & Execution Controller
    // Simulating XRD Analyzer tool running
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 3. Evidence Fusion
    // We mock the analysis output based on the provided dataset
    const mockAnalysisOutput = `
    XRD Phase Matching Results:
    Peaks detected: ${dataset?.peaks ? dataset.peaks.join(', ') : '20.1, 30.2, 35.5, 43.3, 57.2'}
    Reference Library: Spinel structure (e.g., CuFe2O4) matches 5/5 peaks.
    No significant impurity phases detected above 2% threshold.
    `;

    // 4. Reasoning Layer (Gemini)
    let final_decision = "Spinel ferrite structure likely present (Fallback Mode)";
    let confidence = 85;
    let evidence = ["Peak alignment with reference", "No major impurity peaks", "Consistent pattern shape"];

    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
      
      const prompt = `
      You are an expert scientific data interpretation agent.
      
      User Goal: "${goal}"
      
      Experimental Evidence:
      ${mockAnalysisOutput}
      
      Your task is to provide a final decision, a confidence score (0-100), and a short list of 3 key pieces of evidence supporting your decision.
      Format your response EXACTLY as a JSON object with this structure:
      {
        "final_decision": "A concise, credible scientific conclusion (1 sentence)",
        "confidence": 92,
        "evidence": ["evidence point 1", "evidence point 2", "evidence point 3"]
      }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Parse the JSON output from Gemini
      try {
        // Strip markdown code block formatting if present
        const jsonStr = text.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.final_decision) final_decision = parsed.final_decision;
        if (parsed.confidence) confidence = parsed.confidence;
        if (parsed.evidence && Array.isArray(parsed.evidence)) evidence = parsed.evidence;
      } catch (parseErr) {
        console.error("Failed to parse Gemini output:", parseErr);
        console.log("Raw Gemini Output:", text);
      }
    } else {
      console.warn("GEMINI_API_KEY not set. Using fallback mock response.");
    }

    // 5. Decision Generator (Return result)
    res.json({
      success: true,
      data: {
        final_decision,
        confidence,
        evidence
      }
    });

  } catch (error) {
    console.error("Agent execution error:", error);
    res.status(500).json({ success: false, error: "Failed to execute agent pipeline." });
  }
});

app.listen(PORT, () => {
  console.log(`DIFARYX Agent Backend running on port ${PORT}`);
});
