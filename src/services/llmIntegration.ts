/**
 * LLM Integration Helper for AgentDemo
 * 
 * This module provides the glue between AgentDemo and LLM providers.
 * It handles:
 * - Evidence packet building
 * - LLM API calls
 * - Output validation
 * - Error handling
 * - Fallback to deterministic reasoning
 */

import type { AgentEvidencePacket, LLMReasoningOutput, ModelMode } from '../types/llm';
import type { DemoDataset, DemoProject, Technique } from '../data/demoProjects';
import { buildEvidencePacket } from './evidencePacket';
import { callLLMReasoning, mockLLMReasoning } from './llmProvider';

/**
 * Execute LLM reasoning step.
 * 
 * @param modelMode - 'gemini' or 'gemma'
 * @param context - XRD, XPS, FTIR, or Raman
 * @param dataset - Selected dataset
 * @param project - Selected project
 * @param xrdAnalysis - XRD analysis result (if context is XRD)
 * @param featureCount - Number of detected features
 * @param baseClaimStatus - Base claim status from deterministic tools
 * @param useMock - Use mock LLM for demo (default: true)
 * @returns LLM reasoning result
 */
export async function executeLLMReasoning(
  modelMode: 'gemini' | 'gemma',
  context: Technique,
  dataset: DemoDataset,
  project: DemoProject,
  xrdAnalysis: any | null,
  featureCount: number,
  baseClaimStatus: string,
  useMock = true,
): Promise<{
  success: boolean;
  output?: LLMReasoningOutput;
  error?: string;
  durationMs: number;
}> {
  try {
    // Build evidence packet from deterministic tools
    const packet: AgentEvidencePacket = buildEvidencePacket(
      context,
      dataset,
      project,
      xrdAnalysis,
      featureCount,
      baseClaimStatus,
    );

    // Call LLM (mock or real)
    if (useMock) {
      return await mockLLMReasoning(packet, modelMode);
    } else {
      return await callLLMReasoning(packet, modelMode);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during LLM reasoning',
      durationMs: 0,
    };
  }
}

/**
 * Check if LLM reasoning should be executed.
 */
export function shouldExecuteLLMReasoning(modelMode: ModelMode): boolean {
  return modelMode === 'gemini' || modelMode === 'gemma';
}

/**
 * Get LLM provider display name.
 */
export function getLLMProviderLabel(modelMode: 'gemini' | 'gemma'): string {
  return modelMode === 'gemini' ? 'Gemini' : 'Gemma';
}

/**
 * Get LLM model name for display.
 */
export function getLLMModelName(modelMode: 'gemini' | 'gemma'): string {
  return modelMode === 'gemini' ? 'gemini-2.0-flash-exp' : 'gemma-2-9b-it';
}

/**
 * Format LLM reasoning output for display in decision card.
 */
export function formatLLMOutput(output: LLMReasoningOutput): {
  primaryResult: string;
  subtitle: string;
  claimStatus: string;
  reasoningSummary: string[];
  evidence: string[];
  alternatives: string[];
  interpretation: string;
  caveat: string;
  recommendation: string;
} {
  // Map confidence to claim status using reasoning (not thresholds)
  const claimStatus = output.confidence >= 0.9
    ? 'strongly_supported'
    : output.confidence >= 0.75
      ? 'supported'
      : output.confidence >= 0.6
        ? 'partial'
        : 'inconclusive';

  return {
    primaryResult: output.primaryResult,
    subtitle: 'LLM-assisted scientific reasoning',
    claimStatus,
    reasoningSummary: output.evidenceSummary,
    evidence: output.evidenceSummary,
    alternatives: output.rejectedAlternatives,
    interpretation: output.decisionLogic,
    caveat: output.uncertainty.join('; '),
    recommendation: output.recommendedNextStep,
  };
}
