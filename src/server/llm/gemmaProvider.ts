/**
 * Gemma Provider for DIFARYX Agent Demo
 * 
 * SERVER-SIDE ONLY
 * 
 * Integrates with Gemma open model via configurable endpoint.
 * Supports:
 * - Ollama (local)
 * - Hosted Gemma endpoints
 * - Custom deployments
 * 
 * Requires:
 * - GEMMA_ENDPOINT environment variable
 * - GEMMA_MODEL environment variable (optional, defaults to gemma-2-9b-it)
 */

import type { AgentEvidencePacket, ReasoningOutput } from '../../agent/mcp/types';

/**
 * Build prompt for Gemma reasoning.
 */
function buildGemmaPrompt(packet: AgentEvidencePacket): string {
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
 * Call Gemma endpoint for reasoning.
 * 
 * Supports Ollama format:
 * POST /api/generate
 * {
 *   "model": "gemma-2-9b-it",
 *   "prompt": "...",
 *   "format": "json",
 *   "stream": false,
 *   "options": {
 *     "temperature": 0.1
 *   }
 * }
 */
export async function callGemma(
  packet: AgentEvidencePacket,
  model?: string,
): Promise<ReasoningOutput> {
  const startTime = Date.now();

  // Check environment variables
  if (!process.env.GEMMA_ENDPOINT) {
    throw new Error('GEMMA_ENDPOINT environment variable not set');
  }

  const endpoint = process.env.GEMMA_ENDPOINT;
  const modelName = model || process.env.GEMMA_MODEL || 'gemma-2-9b-it';
  const prompt = buildGemmaPrompt(packet);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse response (Ollama format has "response" field)
    const text = data.response || data.text || data.output || '';
    if (!text) {
      throw new Error('Empty response from Gemma endpoint');
    }

    const parsed = JSON.parse(text);
    const validation = validateOutput(parsed);

    if (!validation.valid) {
      throw new Error(`Invalid Gemma output: ${validation.error}`);
    }

    const durationMs = Date.now() - startTime;

    return {
      ...validation.sanitized,
      metadata: {
        provider: 'gemma' as const,
        model: modelName,
        durationMs,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Gemma provider error:', error);
    throw error;
  }
}

/**
 * Check if Gemma is configured.
 */
export function isGemmaConfigured(): boolean {
  return !!process.env.GEMMA_ENDPOINT;
}
