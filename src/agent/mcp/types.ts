/**
 * MCP-Style Tool Schema for DIFARYX Agent Demo
 * 
 * Model Context Protocol (MCP) inspired types for structured tool calling
 * and reasoning in scientific agent workflows.
 */

export type ModelProvider = 'deterministic' | 'vertex-gemini' | 'gemma';

export type ToolName =
  | 'baseline_correction'
  | 'feature_detection'
  | 'reference_search'
  | 'match_scoring'
  | 'evidence_fusion'
  | 'llm_reasoning'
  | 'report_generation';

export type ToolStatus = 'pending' | 'running' | 'complete' | 'error';

/**
 * Tool call request following MCP-style structure.
 */
export interface ToolCall {
  id: string;
  name: ToolName;
  arguments: Record<string, any>;
  timestamp: string;
}

/**
 * Tool execution result following MCP-style structure.
 */
export interface ToolResult {
  id: string;
  toolCallId: string;
  name: ToolName;
  status: ToolStatus;
  output: any;
  error?: string;
  durationMs: number;
  timestamp: string;
}

/**
 * Structured evidence packet for LLM reasoning.
 * Contains ONLY deterministic tool outputs - no raw data generation.
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
  
  toolTrace: ToolResult[];
}

/**
 * LLM reasoning output following MCP-style structure.
 */
export interface ReasoningOutput {
  primaryResult: string;
  confidence: number;
  evidenceSummary: string[];
  rejectedAlternatives: string[];
  decisionLogic: string;
  uncertainty: string[];
  recommendedNextStep: string;
  metadata: {
    provider: ModelProvider;
    model: string;
    durationMs: number;
    timestamp: string;
  };
}

/**
 * Tool definition in the registry.
 */
export interface ToolDefinition {
  name: ToolName;
  displayName: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  outputSchema: {
    type: 'object';
    properties: Record<string, any>;
  };
  provider: 'deterministic' | 'llm';
  canInsertLlmAfter?: boolean;
}

/**
 * Provider configuration.
 */
export interface ProviderConfig {
  provider: ModelProvider;
  enabled: boolean;
  model?: string;
  endpoint?: string;
  projectId?: string;
  location?: string;
}

/**
 * Reasoning request to server.
 */
export interface ReasoningRequest {
  packet: AgentEvidencePacket;
  provider: ModelProvider;
  model?: string;
}

/**
 * Reasoning response from server.
 */
export interface ReasoningResponse {
  success: boolean;
  output?: ReasoningOutput;
  error?: string;
  fallbackUsed?: boolean;
}
