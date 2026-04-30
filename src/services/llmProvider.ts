/**
 * LLM Provider Integration for DIFARYX Agent Demo
 * 
 * Supports:
 * - Gemini (Google Cloud)
 * - Gemma (Open/Local Model)
 * 
 * This is SERVER-SIDE ONLY code.
 * Frontend calls API endpoints, not these functions directly.
 */

import type { AgentEvidencePacket, LLMReasoningOutput, ModelMode } from '../types/llm';
import { buildLLMPrompt, validateLLMOutput } from './llmPrompt';

/**
 * API endpoint for LLM reasoning.
 * Frontend calls this, backend handles provider routing.
 */
export const LLM_API_ENDPOINT = '/api/llm/reason';

/**
 * Call LLM reasoning API from frontend.
 * This is the ONLY function the frontend should use.
 */
export async function callLLMReasoning(
  packet: AgentEvidencePacket,
  modelMode: 'gemini' | 'gemma',
): Promise<{
  success: boolean;
  output?: LLMReasoningOutput;
  error?: string;
  durationMs: number;
}> {
  const startTime = Date.now();

  try {
    const response = await fetch(LLM_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packet,
        modelMode,
      }),
    });

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        durationMs,
      };
    }

    const data = await response.json();

    // Validate output
    const validation = validateLLMOutput(data.output);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid LLM output: ${validation.error}`,
        durationMs,
      };
    }

    return {
      success: true,
      output: validation.sanitized as LLMReasoningOutput,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs,
    };
  }
}

/**
 * Mock LLM reasoning for development/demo.
 * This simulates realistic LLM behavior without actual API calls.
 * 
 * IMPORTANT: This is for DEMO ONLY. Remove in production.
 */
export async function mockLLMReasoning(
  packet: AgentEvidencePacket,
  modelMode: 'gemini' | 'gemma',
): Promise<{
  success: boolean;
  output?: LLMReasoningOutput;
  error?: string;
  durationMs: number;
}> {
  const startTime = Date.now();

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, modelMode === 'gemini' ? 1200 : 800));

  const topCandidate = packet.candidates[0];
  const secondCandidate = packet.candidates[1];

  if (!topCandidate) {
    return {
      success: false,
      error: 'No candidates available for reasoning',
      durationMs: Date.now() - startTime,
    };
  }

  // Build reasoning based on actual evidence
  const evidenceSummary: string[] = [
    `${packet.signalSummary.featureCount} ${packet.context.toUpperCase()} features detected and analyzed`,
    `Top candidate ${topCandidate.label} shows ${topCandidate.matchedFeatures}/${topCandidate.totalFeatures} feature matches`,
    `Fused evidence score: ${(packet.fusedScore * 100).toFixed(1)}%`,
  ];

  if (topCandidate.score >= 0.85) {
    evidenceSummary.push('Strong agreement across multiple evidence dimensions');
  } else if (topCandidate.score >= 0.70) {
    evidenceSummary.push('Moderate agreement with some uncertainty factors');
  } else {
    evidenceSummary.push('Limited agreement, significant uncertainty present');
  }

  const rejectedAlternatives: string[] = [];
  if (secondCandidate) {
    rejectedAlternatives.push(
      `${secondCandidate.label} rejected: lower match score (${(secondCandidate.score * 100).toFixed(1)}% vs ${(topCandidate.score * 100).toFixed(1)}%)`,
    );
    if (secondCandidate.missingFeatures.length > 0) {
      rejectedAlternatives.push(
        `${secondCandidate.label}: missing critical features (${secondCandidate.missingFeatures.slice(0, 2).join(', ')})`,
      );
    }
  }

  for (let i = 2; i < Math.min(4, packet.candidates.length); i++) {
    const candidate = packet.candidates[i];
    rejectedAlternatives.push(
      `${candidate.label}: insufficient match score (${(candidate.score * 100).toFixed(1)}%)`,
    );
  }

  const decisionLogic = `Selected ${topCandidate.label} based on highest feature match score (${(topCandidate.score * 100).toFixed(1)}%) and strongest agreement with detected ${packet.context.toUpperCase()} features. The candidate shows ${topCandidate.matchedFeatures} matched features out of ${topCandidate.totalFeatures} expected, with ${topCandidate.missingFeatures.length === 0 ? 'no' : topCandidate.missingFeatures.length} missing features. ${topCandidate.unexplainedFeatures.length > 0 ? `${topCandidate.unexplainedFeatures.length} unexplained features suggest possible impurities or secondary phases.` : 'All detected features are explained by this assignment.'} The fused evidence score of ${(packet.fusedScore * 100).toFixed(1)}% ${packet.fusedScore >= 0.85 ? 'strongly supports' : packet.fusedScore >= 0.70 ? 'moderately supports' : 'weakly supports'} this conclusion.`;

  const uncertainty: string[] = [...packet.uncertaintyFlags];
  if (topCandidate.missingFeatures.length > 0) {
    uncertainty.push(`Missing expected features: ${topCandidate.missingFeatures.join(', ')}`);
  }
  if (topCandidate.unexplainedFeatures.length > 0) {
    uncertainty.push(`Unexplained features present: ${topCandidate.unexplainedFeatures.join(', ')}`);
  }
  if (packet.signalSummary.signalQuality === 'low') {
    uncertainty.push('Low signal quality may affect feature detection accuracy');
  }
  if (uncertainty.length === 0) {
    uncertainty.push('No significant uncertainty factors identified');
  }

  const recommendedNextStep =
    packet.context === 'xrd'
      ? 'Validate with complementary techniques (XPS for surface chemistry, Raman for structural confirmation)'
      : packet.context === 'xps'
        ? 'Perform quantitative peak fitting and compare with XRD phase assignment'
        : packet.context === 'ftir'
          ? 'Cross-reference bonding signatures with XRD and XPS results'
          : 'Compare Raman fingerprint with XRD phase assignment and literature references';

  const output: LLMReasoningOutput = {
    primaryResult: topCandidate.label,
    confidence: Math.max(0, Math.min(1, topCandidate.score * 0.95)), // Slightly conservative
    evidenceSummary,
    rejectedAlternatives,
    decisionLogic,
    uncertainty,
    recommendedNextStep,
  };

  return {
    success: true,
    output,
    durationMs: Date.now() - startTime,
  };
}

// ============================================================================
// SERVER-SIDE ONLY CODE BELOW
// These functions should ONLY run on the backend/API routes
// ============================================================================

/**
 * Run Gemini reasoning (SERVER-SIDE ONLY).
 * 
 * To use in production:
 * 1. npm install @google/generative-ai
 * 2. Set GEMINI_API_KEY environment variable
 * 3. Deploy this function to your backend
 */
export async function runGeminiReasoning(
  packet: AgentEvidencePacket,
): Promise<LLMReasoningOutput> {
  // This is a placeholder for the actual Gemini integration
  // In production, this would be:
  
  /*
  import { GoogleGenerativeAI } from '@google/generative-ai';
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });
  
  const prompt = buildLLMPrompt(packet);
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  const parsed = JSON.parse(text);
  const validation = validateLLMOutput(parsed);
  
  if (!validation.valid) {
    throw new Error(`Invalid Gemini output: ${validation.error}`);
  }
  
  return validation.sanitized as LLMReasoningOutput;
  */
  
  throw new Error('Gemini integration not configured. Set GEMINI_API_KEY and deploy backend.');
}

/**
 * Run Gemma reasoning (SERVER-SIDE ONLY).
 * 
 * To use in production:
 * 1. Deploy Gemma model locally or use hosted endpoint
 * 2. Set GEMMA_ENDPOINT environment variable
 * 3. Deploy this function to your backend
 */
export async function runGemmaReasoning(
  packet: AgentEvidencePacket,
): Promise<LLMReasoningOutput> {
  // This is a placeholder for the actual Gemma integration
  // In production, this would be:
  
  /*
  const response = await fetch(process.env.GEMMA_ENDPOINT!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: buildLLMPrompt(packet),
      format: 'json',
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Gemma API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const parsed = JSON.parse(data.response || data.text || '{}');
  const validation = validateLLMOutput(parsed);
  
  if (!validation.valid) {
    throw new Error(`Invalid Gemma output: ${validation.error}`);
  }
  
  return validation.sanitized as LLMReasoningOutput;
  */
  
  throw new Error('Gemma integration not configured. Set GEMMA_ENDPOINT and deploy backend.');
}

/**
 * LLM router (SERVER-SIDE ONLY).
 * Routes to appropriate provider based on modelMode.
 */
export async function runLLM(
  packet: AgentEvidencePacket,
  modelMode: ModelMode,
): Promise<LLMReasoningOutput | null> {
  if (modelMode === 'gemini') {
    return runGeminiReasoning(packet);
  }
  if (modelMode === 'gemma') {
    return runGemmaReasoning(packet);
  }
  return null;
}
