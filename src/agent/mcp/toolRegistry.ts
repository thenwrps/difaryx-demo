/**
 * MCP-Style Tool Registry for DIFARYX Agent Demo
 * 
 * Defines all available tools in the scientific reasoning pipeline.
 * Each tool has a structured schema for inputs and outputs.
 */

import type { ToolDefinition, ToolName } from './types';

/**
 * Complete tool registry for DIFARYX agent workflows.
 */
export const TOOL_REGISTRY: Record<ToolName, ToolDefinition> = {
  baseline_correction: {
    name: 'baseline_correction',
    displayName: 'Baseline Correction',
    description: 'Apply baseline correction to raw spectroscopic data',
    inputSchema: {
      type: 'object',
      properties: {
        dataPoints: {
          type: 'array',
          description: 'Raw data points (x, y pairs)',
        },
        method: {
          type: 'string',
          enum: ['linear', 'polynomial', 'shirley'],
          description: 'Baseline correction method',
        },
      },
      required: ['dataPoints', 'method'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        correctedData: {
          type: 'array',
          description: 'Baseline-corrected data points',
        },
        baselineData: {
          type: 'array',
          description: 'Calculated baseline',
        },
      },
    },
    provider: 'deterministic',
  },

  feature_detection: {
    name: 'feature_detection',
    displayName: 'Feature Detection',
    description: 'Detect peaks, bands, or features in spectroscopic data',
    inputSchema: {
      type: 'object',
      properties: {
        dataPoints: {
          type: 'array',
          description: 'Processed data points',
        },
        context: {
          type: 'string',
          enum: ['xrd', 'xps', 'ftir', 'raman'],
          description: 'Spectroscopic technique context',
        },
        minProminence: {
          type: 'number',
          description: 'Minimum peak prominence threshold',
        },
      },
      required: ['dataPoints', 'context'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        features: {
          type: 'array',
          description: 'Detected features with position and intensity',
        },
        featureCount: {
          type: 'number',
          description: 'Total number of detected features',
        },
      },
    },
    provider: 'deterministic',
  },

  reference_search: {
    name: 'reference_search',
    displayName: 'Reference Search',
    description: 'Search reference database for candidate matches',
    inputSchema: {
      type: 'object',
      properties: {
        features: {
          type: 'array',
          description: 'Detected features to match',
        },
        context: {
          type: 'string',
          enum: ['xrd', 'xps', 'ftir', 'raman'],
          description: 'Spectroscopic technique context',
        },
        database: {
          type: 'string',
          description: 'Reference database to search',
        },
      },
      required: ['features', 'context'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        candidates: {
          type: 'array',
          description: 'Candidate matches from reference database',
        },
        candidateCount: {
          type: 'number',
          description: 'Total number of candidates found',
        },
      },
    },
    provider: 'deterministic',
  },

  match_scoring: {
    name: 'match_scoring',
    displayName: 'Match Review',
    description: 'Review candidate matches against detected features',
    inputSchema: {
      type: 'object',
      properties: {
        features: {
          type: 'array',
          description: 'Detected features',
        },
        candidates: {
          type: 'array',
          description: 'Candidate matches to review',
        },
        scoringMethod: {
          type: 'string',
          enum: ['overlap', 'weighted', 'bayesian'],
          description: 'Review method',
        },
      },
      required: ['features', 'candidates'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        rankedCandidates: {
          type: 'array',
          description: 'Candidates ordered by match review',
        },
        topScore: {
          type: 'number',
          description: 'Highest match score',
        },
      },
    },
    provider: 'deterministic',
  },

  evidence_fusion: {
    name: 'evidence_fusion',
    displayName: 'Evidence Fusion',
    description: 'Fuse evidence from multiple sources and assess uncertainty',
    inputSchema: {
      type: 'object',
      properties: {
        rankedCandidates: {
          type: 'array',
          description: 'Ranked candidate matches',
        },
        features: {
          type: 'array',
          description: 'Detected features',
        },
        context: {
          type: 'string',
          description: 'Analysis context',
        },
      },
      required: ['rankedCandidates', 'features'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        fusedScore: {
          type: 'number',
          description: 'Combined evidence score',
        },
        uncertaintyFlags: {
          type: 'array',
          description: 'Identified uncertainty factors',
        },
        evidencePacket: {
          type: 'object',
          description: 'Structured evidence for reasoning',
        },
      },
    },
    provider: 'deterministic',
    canInsertLlmAfter: true,
  },

  llm_reasoning: {
    name: 'llm_reasoning',
    displayName: 'LLM Reasoning',
    description: 'Apply LLM reasoning over structured evidence packet',
    inputSchema: {
      type: 'object',
      properties: {
        evidencePacket: {
          type: 'object',
          description: 'Structured evidence from deterministic tools',
        },
        provider: {
          type: 'string',
          enum: ['vertex-gemini', 'gemma'],
          description: 'LLM provider to use',
        },
        model: {
          type: 'string',
          description: 'Specific model name',
        },
      },
      required: ['evidencePacket', 'provider'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        primaryResult: {
          type: 'string',
          description: 'Primary reasoning conclusion',
        },
        confidence: {
          type: 'number',
          description: 'Confidence score (0-1)',
        },
        evidenceSummary: {
          type: 'array',
          description: 'Summary of evidence considered',
        },
        decisionLogic: {
          type: 'string',
          description: 'Explanation of reasoning process',
        },
      },
    },
    provider: 'llm',
  },

  report_generation: {
    name: 'report_generation',
    displayName: 'Report Generation',
    description: 'Generate structured scientific report from reasoning output',
    inputSchema: {
      type: 'object',
      properties: {
        reasoningOutput: {
          type: 'object',
          description: 'Output from reasoning step',
        },
        evidencePacket: {
          type: 'object',
          description: 'Original evidence packet',
        },
        format: {
          type: 'string',
          enum: ['json', 'markdown', 'pdf'],
          description: 'Report output format',
        },
      },
      required: ['reasoningOutput', 'evidencePacket'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        report: {
          type: 'string',
          description: 'Generated report content',
        },
        metadata: {
          type: 'object',
          description: 'Report metadata',
        },
      },
    },
    provider: 'deterministic',
  },
};

/**
 * Get tool definition by name.
 */
export function getToolDefinition(name: ToolName): ToolDefinition {
  return TOOL_REGISTRY[name];
}

/**
 * Get all tool names.
 */
export function getAllToolNames(): ToolName[] {
  return Object.keys(TOOL_REGISTRY) as ToolName[];
}

/**
 * Get tools by provider.
 */
export function getToolsByProvider(provider: 'deterministic' | 'llm'): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).filter((tool) => tool.provider === provider);
}

/**
 * Get tool that can have LLM inserted after it.
 */
export function getLlmInsertionPoint(): ToolDefinition | undefined {
  return Object.values(TOOL_REGISTRY).find((tool) => tool.canInsertLlmAfter);
}
