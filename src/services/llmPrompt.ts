/**
 * LLM Prompt Builder for DIFARYX Agent Demo
 * 
 * Builds structured prompts that enforce:
 * - NO data invention
 * - NO hallucinated measurements
 * - ONLY reasoning over provided evidence
 */

import type { AgentEvidencePacket } from '../types/llm';

/**
 * Build the system prompt for DIFARYX LLM reasoning.
 * This prompt is CRITICAL - it prevents hallucination.
 */
export function buildSystemPrompt(): string {
  return `You are DIFARYX, an autonomous scientific reasoning system for materials characterization.

CRITICAL RULES:
1. Use ONLY the structured evidence provided below
2. Do NOT invent data, peaks, values, or measurements
3. Do NOT assume missing values or fabricate features
4. Do NOT generate new scientific data
5. Your role is REASONING ONLY, not data generation

Your task:
- Analyze the provided evidence packet
- Reason over candidate rankings and feature matches
- Identify strengths and weaknesses in the evidence
- Make a decision with explicit uncertainty
- Recommend next steps

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
 * Build the evidence prompt from the packet.
 */
export function buildEvidencePrompt(packet: AgentEvidencePacket): string {
  const contextLabels = {
    xrd: 'X-Ray Diffraction (XRD) Phase Identification',
    xps: 'X-ray Photoelectron Spectroscopy (XPS) Surface Chemistry',
    ftir: 'Fourier Transform Infrared (FTIR) Bonding Analysis',
    raman: 'Raman Spectroscopy Structural Fingerprint',
  };

  return `
CONTEXT: ${contextLabels[packet.context]}
DATASET: ${packet.datasetName} (ID: ${packet.datasetId})
MATERIAL SYSTEM: ${packet.materialSystem}

SIGNAL SUMMARY:
- Feature count: ${packet.signalSummary.featureCount}
- Noise level: ${packet.signalSummary.noiseLevel ?? 'not assessed'}
- Signal quality: ${packet.signalSummary.signalQuality ?? 'not assessed'}

DETECTED FEATURES:
${packet.detectedFeatures.map((f, i) => 
  `  ${i + 1}. Position: ${f.position.toFixed(2)}, Intensity: ${f.intensity.toFixed(1)}${f.assignment ? `, Assignment: ${f.assignment}` : ''}${f.confidence ? `, Confidence: ${(f.confidence * 100).toFixed(0)}%` : ''}`
).join('\n')}

CANDIDATE RANKINGS:
${packet.candidates.map((c, i) => 
  `  ${i + 1}. ${c.label}
     - Score: ${(c.score * 100).toFixed(1)}%
     - Matched features: ${c.matchedFeatures}/${c.totalFeatures}
     - Missing features: ${c.missingFeatures.length > 0 ? c.missingFeatures.join(', ') : 'none'}
     - Unexplained features: ${c.unexplainedFeatures.length > 0 ? c.unexplainedFeatures.join(', ') : 'none'}`
).join('\n\n')}

FUSED EVIDENCE SCORE: ${(packet.fusedScore * 100).toFixed(1)}%

UNCERTAINTY FLAGS:
${packet.uncertaintyFlags.length > 0 ? packet.uncertaintyFlags.map(f => `- ${f}`).join('\n') : '- None'}

PROCESSING NOTES:
${packet.processingNotes.length > 0 ? packet.processingNotes.map(n => `- ${n}`).join('\n') : '- None'}

Based on this evidence ONLY, provide your reasoning in the required JSON format.`;
}

/**
 * Build the complete prompt for LLM reasoning.
 */
export function buildLLMPrompt(packet: AgentEvidencePacket): string {
  return `${buildSystemPrompt()}

${buildEvidencePrompt(packet)}`;
}

/**
 * Validate LLM output to prevent hallucination and ensure safety.
 */
export function validateLLMOutput(output: any): {
  valid: boolean;
  error?: string;
  sanitized?: any;
} {
  // Check required fields
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

  // Validate types
  if (typeof output.primaryResult !== 'string' || output.primaryResult.length === 0) {
    return { valid: false, error: 'primaryResult must be a non-empty string' };
  }

  if (typeof output.confidence !== 'number') {
    return { valid: false, error: 'confidence must be a number' };
  }

  if (!Array.isArray(output.evidenceSummary)) {
    return { valid: false, error: 'evidenceSummary must be an array' };
  }

  if (!Array.isArray(output.rejectedAlternatives)) {
    return { valid: false, error: 'rejectedAlternatives must be an array' };
  }

  if (typeof output.decisionLogic !== 'string' || output.decisionLogic.length === 0) {
    return { valid: false, error: 'decisionLogic must be a non-empty string' };
  }

  if (!Array.isArray(output.uncertainty)) {
    return { valid: false, error: 'uncertainty must be an array' };
  }

  if (typeof output.recommendedNextStep !== 'string' || output.recommendedNextStep.length === 0) {
    return { valid: false, error: 'recommendedNextStep must be a non-empty string' };
  }

  // Sanitize and clamp values
  const sanitized = {
    primaryResult: String(output.primaryResult).trim(),
    confidence: Math.max(0, Math.min(1, Number(output.confidence))),
    evidenceSummary: output.evidenceSummary.filter((e: any) => typeof e === 'string' && e.length > 0),
    rejectedAlternatives: output.rejectedAlternatives.filter((r: any) => typeof r === 'string' && r.length > 0),
    decisionLogic: String(output.decisionLogic).trim(),
    uncertainty: output.uncertainty.filter((u: any) => typeof u === 'string' && u.length > 0),
    recommendedNextStep: String(output.recommendedNextStep).trim(),
  };

  return { valid: true, sanitized };
}
