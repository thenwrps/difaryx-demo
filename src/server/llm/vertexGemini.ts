/**
 * Vertex AI Gemini Provider for DIFARYX Agent Demo
 * 
 * SERVER-SIDE ONLY
 * 
 * Integrates with Google Cloud Vertex AI for Gemini reasoning.
 * Requires:
 * - @google-cloud/vertexai or @google/genai package
 * - GOOGLE_CLOUD_PROJECT environment variable
 * - GOOGLE_CLOUD_LOCATION environment variable
 * - GOOGLE_GENAI_USE_VERTEXAI=true environment variable
 * - Service account with Vertex AI permissions
 */

import type { AgentEvidencePacket, ReasoningOutput } from '../../agent/mcp/types';

/**
 * Build prompt for Gemini reasoning.
 */
function buildGeminiPrompt(packet: AgentEvidencePacket): string {
  const contextLabels = {
    xrd: 'X-Ray Diffraction (XRD) Phase Identification',
    xps: 'X-ray Photoelectron Spectroscopy (XPS) Surface Chemistry',
    ftir: 'Fourier Transform Infrared (FTIR) Bonding Analysis',
    raman: 'Raman Spectroscopy Structural Fingerprint',
  };

  return `You are DIFARYX, an autonomous scientific reasoning system for materials characterization.

CRITICAL RULES:
1. Use ONLY the structured evidence provided below
2. Do NOT invent data, peaks, values, or measurements
3. Do NOT assume missing values or fabricate features
4. Do NOT generate new scientific data
5. Your role is REASONING ONLY, not data generation

CONTEXT: ${contextLabels[packet.context]}
DATASET: ${packet.datasetName}
MATERIAL SYSTEM: ${packet.materialSystem}

SIGNAL SUMMARY:
- Feature count: ${packet.signalSummary.featureCount}
- Signal quality: ${packet.signalSummary.signalQuality ?? 'not assessed'}

DETECTED FEATURES:
${packet.detectedFeatures.map((f, i) => 
  `${i + 1}. Position: ${f.position.toFixed(2)}, Intensity: ${f.intensity.toFixed(1)}${f.assignment ? `, Assignment: ${f.assignment}` : ''}`
).join('\n')}

CANDIDATE RANKINGS:
${packet.candidates.map((c, i) => 
  `${i + 1}. ${c.label}
   - Score: ${(c.score * 100).toFixed(1)}%
   - Matched features: ${c.matchedFeatures}/${c.totalFeatures}
   - Missing: ${c.missingFeatures.length > 0 ? c.missingFeatures.join(', ') : 'none'}
   - Unexplained: ${c.unexplainedFeatures.length > 0 ? c.unexplainedFeatures.join(', ') : 'none'}`
).join('\n\n')}

FUSED EVIDENCE SCORE: ${(packet.fusedScore * 100).toFixed(1)}%

UNCERTAINTY FLAGS:
${packet.uncertaintyFlags.length > 0 ? packet.uncertaintyFlags.map(f => `- ${f}`).join('\n') : '- None'}

Return ONLY valid JSON in this exact format:
{
  "primaryResult": "string - the selected candidate or conclusion",
  "confidence": number between 0 and 1,
  "evidenceSummary": ["array", "of", "evidence", "bullets"],
  "rejectedAlternatives": ["array", "of", "rejected", "candidates", "with", "reasons"],
  "decisionLogic": "string - explain your reasoning process",
  "uncertainty": ["array", "of", "uncertainty", "factors"],
  "recommendedNextStep": "string - what should be done next"
}`;
}

/**
 * Validate and sanitize LLM output.
 */
function validateOutput(output: any): { valid: boolean; error?: string; sanitized?: any } {
  if (!output || typeof output !== 'object') {
    return { valid: false, error: 'Output is not a valid object' };
  }

  const required = [
    'primaryResult',
    'confidence',
    'evidenceSummary',
    'rejectedAlternatives',
    'decisionLogic',
    'uncertainty',
    'recommendedNextStep',
  ];

  for (const field of required) {
    if (!(field in output)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  const sanitized = {
    primaryResult: String(output.primaryResult).trim(),
    confidence: Math.max(0, Math.min(1, Number(output.confidence))),
    evidenceSummary: Array.isArray(output.evidenceSummary)
      ? output.evidenceSummary.filter((e: any) => typeof e === 'string' && e.length > 0)
      : [],
    rejectedAlternatives: Array.isArray(output.rejectedAlternatives)
      ? output.rejectedAlternatives.filter((r: any) => typeof r === 'string' && r.length > 0)
      : [],
    decisionLogic: String(output.decisionLogic).trim(),
    uncertainty: Array.isArray(output.uncertainty)
      ? output.uncertainty.filter((u: any) => typeof u === 'string' && u.length > 0)
      : [],
    recommendedNextStep: String(output.recommendedNextStep).trim(),
  };

  return { valid: true, sanitized };
}

/**
 * Call Vertex AI Gemini for reasoning.
 * 
 * PRODUCTION IMPLEMENTATION:
 * 
 * import { VertexAI } from '@google-cloud/vertexai';
 * 
 * const vertexAI = new VertexAI({
 *   project: process.env.GOOGLE_CLOUD_PROJECT!,
 *   location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
 * });
 * 
 * const model = vertexAI.getGenerativeModel({
 *   model: 'gemini-2.0-flash-exp',
 *   generationConfig: {
 *     responseMimeType: 'application/json',
 *     temperature: 0.1,
 *     maxOutputTokens: 2048,
 *   },
 * });
 * 
 * const result = await model.generateContent(prompt);
 * const response = result.response;
 * const text = response.text();
 * const parsed = JSON.parse(text);
 */
export async function callVertexGemini(
  packet: AgentEvidencePacket,
  model = 'gemini-2.0-flash-exp',
): Promise<ReasoningOutput> {
  const startTime = Date.now();

  // Check environment variables
  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable not set');
  }

  if (!process.env.GOOGLE_GENAI_USE_VERTEXAI) {
    throw new Error('GOOGLE_GENAI_USE_VERTEXAI environment variable not set to true');
  }

  const prompt = buildGeminiPrompt(packet);

  try {
    // PRODUCTION: Uncomment this block and install @google-cloud/vertexai
    /*
    const { VertexAI } = await import('@google-cloud/vertexai');
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    const generativeModel = vertexAI.getGenerativeModel({
      model,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    });

    const result = await generativeModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const parsed = JSON.parse(text);

    const validation = validateOutput(parsed);
    if (!validation.valid) {
      throw new Error(`Invalid Vertex AI output: ${validation.error}`);
    }

    const durationMs = Date.now() - startTime;

    return {
      ...validation.sanitized,
      metadata: {
        provider: 'vertex-gemini' as const,
        model,
        durationMs,
        timestamp: new Date().toISOString(),
      },
    };
    */

    // DEMO MODE: Throw error to indicate Vertex AI not configured
    throw new Error(
      'Vertex AI Gemini not configured. Set GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, and GOOGLE_GENAI_USE_VERTEXAI=true, then install @google-cloud/vertexai package.',
    );
  } catch (error) {
    console.error('Vertex AI Gemini error:', error);
    throw error;
  }
}

/**
 * Check if Vertex AI is configured.
 */
export function isVertexAIConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLOUD_PROJECT &&
    process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true'
  );
}
