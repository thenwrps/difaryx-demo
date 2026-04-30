/**
 * LLM Provider Router for DIFARYX Agent Demo
 * 
 * SERVER-SIDE ONLY
 * 
 * Routes reasoning requests to appropriate provider:
 * - deterministic: No LLM, use deterministic reasoning
 * - vertex-gemini: Google Cloud Vertex AI Gemini
 * - gemma: Open model via configurable endpoint
 * 
 * Includes fallback logic: if LLM fails, use deterministic reasoning.
 */

import type {
  AgentEvidencePacket,
  ReasoningOutput,
  ModelProvider,
  ReasoningResponse,
} from '../../agent/mcp/types';
import { callVertexGemini, isVertexAIConfigured } from './vertexGemini';
import { callGemma, isGemmaConfigured } from './gemmaProvider';

/**
 * Generate deterministic reasoning output from evidence packet.
 * This is the fallback when LLM is not available or fails.
 */
function generateDeterministicReasoning(packet: AgentEvidencePacket): ReasoningOutput {
  const startTime = Date.now();
  const topCandidate = packet.candidates[0];

  if (!topCandidate) {
    throw new Error('No candidates available for deterministic reasoning');
  }

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
  for (let i = 1; i < Math.min(4, packet.candidates.length); i++) {
    const candidate = packet.candidates[i];
    rejectedAlternatives.push(
      `${candidate.label}: lower match score (${(candidate.score * 100).toFixed(1)}% vs ${(topCandidate.score * 100).toFixed(1)}%)`,
    );
  }

  const decisionLogic = `Selected ${topCandidate.label} based on highest feature match score (${(topCandidate.score * 100).toFixed(1)}%) and strongest agreement with detected ${packet.context.toUpperCase()} features. The candidate shows ${topCandidate.matchedFeatures} matched features out of ${topCandidate.totalFeatures} expected. ${topCandidate.missingFeatures.length > 0 ? `Missing features: ${topCandidate.missingFeatures.join(', ')}. ` : ''}${topCandidate.unexplainedFeatures.length > 0 ? `Unexplained features: ${topCandidate.unexplainedFeatures.join(', ')} suggest possible impurities or secondary phases.` : 'All detected features are explained by this assignment.'}`;

  const uncertainty: string[] = [...packet.uncertaintyFlags];
  if (topCandidate.missingFeatures.length > 0) {
    uncertainty.push(`Missing expected features: ${topCandidate.missingFeatures.join(', ')}`);
  }
  if (topCandidate.unexplainedFeatures.length > 0) {
    uncertainty.push(`Unexplained features present: ${topCandidate.unexplainedFeatures.join(', ')}`);
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

  const durationMs = Date.now() - startTime;

  return {
    primaryResult: topCandidate.label,
    confidence: Math.max(0, Math.min(1, topCandidate.score * 0.95)),
    evidenceSummary,
    rejectedAlternatives,
    decisionLogic,
    uncertainty,
    recommendedNextStep,
    metadata: {
      provider: 'deterministic',
      model: 'deterministic-reasoning-v1',
      durationMs,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Route reasoning request to appropriate provider.
 */
export async function routeReasoning(
  packet: AgentEvidencePacket,
  provider: ModelProvider,
  model?: string,
): Promise<ReasoningResponse> {
  try {
    // Deterministic mode
    if (provider === 'deterministic') {
      const output = generateDeterministicReasoning(packet);
      return {
        success: true,
        output,
        fallbackUsed: false,
      };
    }

    // Vertex AI Gemini mode
    if (provider === 'vertex-gemini') {
      if (!isVertexAIConfigured()) {
        console.warn('Vertex AI not configured, falling back to deterministic reasoning');
        const output = generateDeterministicReasoning(packet);
        return {
          success: true,
          output,
          fallbackUsed: true,
        };
      }

      try {
        const output = await callVertexGemini(packet, model);
        return {
          success: true,
          output,
          fallbackUsed: false,
        };
      } catch (error) {
        console.error('Vertex AI Gemini failed, falling back to deterministic reasoning:', error);
        const output = generateDeterministicReasoning(packet);
        return {
          success: true,
          output,
          fallbackUsed: true,
        };
      }
    }

    // Gemma mode
    if (provider === 'gemma') {
      if (!isGemmaConfigured()) {
        console.warn('Gemma not configured, falling back to deterministic reasoning');
        const output = generateDeterministicReasoning(packet);
        return {
          success: true,
          output,
          fallbackUsed: true,
        };
      }

      try {
        const output = await callGemma(packet, model);
        return {
          success: true,
          output,
          fallbackUsed: false,
        };
      } catch (error) {
        console.error('Gemma failed, falling back to deterministic reasoning:', error);
        const output = generateDeterministicReasoning(packet);
        return {
          success: true,
          output,
          fallbackUsed: true,
        };
      }
    }

    // Unknown provider
    return {
      success: false,
      error: `Unknown provider: ${provider}`,
    };
  } catch (error) {
    console.error('Routing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown routing error',
    };
  }
}

/**
 * Get provider status for UI display.
 */
export function getProviderStatus(provider: ModelProvider): {
  provider: ModelProvider;
  configured: boolean;
  displayName: string;
} {
  if (provider === 'deterministic') {
    return {
      provider: 'deterministic',
      configured: true,
      displayName: 'Deterministic',
    };
  }

  if (provider === 'vertex-gemini') {
    return {
      provider: 'vertex-gemini',
      configured: isVertexAIConfigured(),
      displayName: 'Vertex AI Gemini',
    };
  }

  if (provider === 'gemma') {
    return {
      provider: 'gemma',
      configured: isGemmaConfigured(),
      displayName: 'Gemma',
    };
  }

  return {
    provider,
    configured: false,
    displayName: 'Unknown',
  };
}
