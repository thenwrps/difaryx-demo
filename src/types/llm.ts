/**
 * LLM Integration Types for DIFARYX Agent Demo
 * 
 * These types define the contract between deterministic tools and LLM reasoning.
 * LLMs receive ONLY structured evidence packets - they do NOT generate raw data.
 */

export type ModelMode = 'deterministic' | 'gemini' | 'gemma';

export type LLMStatus = 'idle' | 'running' | 'complete' | 'error';

export type LLMProvider = 'gemini' | 'gemma';

/**
 * Evidence packet sent to LLM for reasoning.
 * Contains ONLY structured data from deterministic tools.
 * LLM must NOT invent peaks, values, or measurements.
 */
export interface AgentEvidencePacket {
  context: 'xrd' | 'xps' | 'ftir' | 'raman';
  datasetId: string;
  datasetName: string;
  materialSystem: string;
  
  signalSummary: {
    featureCount: number;
    noiseLevel?: number;
    signalQuality?: 'high' | 'medium' | 'low';
  };
  
  detectedFeatures: Array<{
    position: number;
    intensity: number;
    assignment?: string;
    confidence?: number;
  }>;
  
  candidates: Array<{
    label: string;
    score: number;
    matchedFeatures: number;
    totalFeatures: number;
    missingFeatures: string[];
    unexplainedFeatures: string[];
  }>;
  
  fusedScore: number;
  uncertaintyFlags: string[];
  processingNotes: string[];
}

/**
 * LLM reasoning output.
 * Must be validated before rendering.
 */
export interface LLMReasoningOutput {
  primaryResult: string;
  confidence: number;  // Must be clamped to [0, 1]
  evidenceSummary: string[];
  rejectedAlternatives: string[];
  decisionLogic: string;
  uncertainty: string[];
  recommendedNextStep: string;
}

/**
 * Extended state for LLM integration.
 */
export interface LLMState {
  modelMode: ModelMode;
  llmStatus: LLMStatus;
  llmOutput?: LLMReasoningOutput;
  llmError?: string;
  llmDurationMs?: number;
}

/**
 * LLM tool trace entry.
 */
export interface LLMToolTraceEntry {
  id: string;
  timestamp: string;
  toolName: 'llm_reasoning';
  displayName: 'LLM Reasoning';
  provider: LLMProvider;
  model: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  inputSummary: string;
  outputSummary: string;
  durationMs: number;
  errorMessage?: string;
}
