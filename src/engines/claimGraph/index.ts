/**
 * Claim Graph + Evidence Propagation Engine - Public API
 * 
 * Pure graph-based scientific reasoning without numeric scoring.
 */

// Export types
export type {
  Technique,
  EvidenceRelationType,
  EvidenceRole,
  ClaimStatus,
  ValidationState,
  TechniqueAuthority,
  EvidenceNode,
  ClaimNode,
  EvidenceRelation,
  ClaimGraph,
  PropagationResult,
  ReasoningTrace,
  RawEvidenceInput,
} from './types';

// Export claim definitions and helpers
export {
  CLAIM_DEFINITIONS,
  TECHNIQUE_AUTHORITY,
  EVIDENCE_CONCEPTS,
  getTechniqueAuthority,
  getEvidenceConcept,
  isConceptIncompatible,
  getClaimDefinition,
} from './claimDefinitions';

// Export graph construction
export {
  createEvidenceNodes,
  buildClaimGraph,
} from './buildClaimGraph';

// Export propagation
export {
  propagateClaims,
} from './propagateClaims';

// Export reasoning trace generation
export {
  generateReasoningTrace,
  generateScientificReport,
  type ScientificReport,
} from './generateReasoningTrace';

// Import for public API function
import type { RawEvidenceInput, ClaimGraph, PropagationResult, ReasoningTrace } from './types';
import type { ScientificReport } from './generateReasoningTrace';
import { buildClaimGraph } from './buildClaimGraph';
import { propagateClaims } from './propagateClaims';
import { generateReasoningTrace, generateScientificReport } from './generateReasoningTrace';

/**
 * Evaluation result from claim graph engine
 */
export interface ClaimGraphEvaluationResult {
  graph: ClaimGraph;
  propagation: PropagationResult[];
  reasoningTrace: ReasoningTrace[];
  report: ScientificReport;
}

/**
 * Evaluate claim graph from raw evidence inputs
 * 
 * This is the main public API function for the claim graph engine.
 * It builds the graph, propagates claims, generates reasoning traces,
 * and produces a scientific report.
 * 
 * @param inputs - Array of raw evidence inputs (technique + peaks)
 * @returns Complete evaluation result with graph, propagation, traces, and report
 */
export function evaluateClaimGraph(inputs: RawEvidenceInput[]): ClaimGraphEvaluationResult {
  // Build claim graph from raw inputs
  const graph = buildClaimGraph(inputs);
  
  // Propagate claims to determine status
  const propagation = propagateClaims(graph);
  
  // Generate reasoning traces
  const reasoningTrace = generateReasoningTrace(propagation, graph);
  
  // Generate scientific report
  const report = generateScientificReport(propagation, graph);
  
  return {
    graph,
    propagation,
    reasoningTrace,
    report,
  };
}
