/**
 * Fusion Agent Type Definitions
 * 
 * Cross-Tech Evidence Fusion for combining XPS, FTIR, and Raman evidence
 * using technique-specific authority hierarchies and structured confidence calculation.
 */

// ============================================================================
// Core Evidence Types
// ============================================================================

export type TechniqueType = 'XPS' | 'FTIR' | 'Raman';
export type SupportType = 'supports' | 'contradicts' | 'neutral' | 'ambiguous';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ClaimHierarchy = 'primary' | 'supporting' | 'context';
export type ClaimStatus = 'supported' | 'unresolved' | 'contradicted';
export type ContradictionSeverity = 'none' | 'low' | 'medium' | 'high';

/**
 * Evidence Item - A single piece of analytical data from a technique
 */
export interface EvidenceItem {
  technique: TechniqueType;
  type: string;                        // e.g., "oxidation-state", "functional-group", "vibrational-mode"
  value: string | number;              // e.g., "Cu²⁺", "A1g spinel ferrite", 690
  confidence: number;                  // 0-1 from original technique
  weight: number;                      // 0-1 evidence-specific weight
  label: string;                       // Human-readable description
}

/**
 * Technique Support - How a technique supports/contradicts a claim
 */
export interface TechniqueSupport {
  technique: TechniqueType;
  support: SupportType;
  evidenceItems: EvidenceItem[];
  evidenceWeight: number;              // 0-1 technique-specific weight for this claim
  reasoning: string;                   // Why this technique supports/contradicts
}

/**
 * Claim - A scientific assertion about the material
 */
export interface Claim {
  id: string;                          // e.g., "spinel-structure"
  title: string;                       // e.g., "Spinel-like ferrite structure"
  description: string;                 // What this claim asserts
  hierarchy: ClaimHierarchy;           // Claim importance level
  supportingTechniques: TechniqueSupport[];
  confidence: ConfidenceLevel;
  confidenceScore: number;             // 0-1 calculated via formula
  status: ClaimStatus;
  caveats: string[];
}

// ============================================================================
// Evidence Matrix Types
// ============================================================================

/**
 * Matrix Cell - Single cell in evidence matrix (claim × technique)
 */
export interface MatrixCell {
  claimId: string;
  technique: TechniqueType;
  support: SupportType;
  evidenceText: string;                // Short summary for display
  evidenceItems: EvidenceItem[];
}

/**
 * Evidence Matrix - Tabular view of claims × techniques
 */
export interface EvidenceMatrix {
  claims: Claim[];
  techniques: TechniqueType[];
  cells: MatrixCell[][];               // [claimIndex][techniqueIndex]
}

// ============================================================================
// Contradiction Types
// ============================================================================

/**
 * Contradiction - Conflict between evidence from different techniques
 */
export interface Contradiction {
  id: string;
  severity: ContradictionSeverity;
  score: number;                       // 0-1 contradiction strength
  techniques: TechniqueType[];
  claimId: string;
  explanation: string;
  confidenceImpact: number;            // Penalty to apply (0-0.3)
  effectOnConfidence: string;          // Human-readable description
}

// ============================================================================
// Fusion Result Types
// ============================================================================

/**
 * Final Decision - Primary conclusion with confidence
 */
export interface FusionDecision {
  primaryConclusion: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;             // 0-1
}

/**
 * Fusion Result - Complete output from fusion analysis
 */
export interface FusionResult {
  decision: FusionDecision;
  claims: Claim[];
  evidenceMatrix: EvidenceMatrix;
  contradictions: Contradiction[];
  supportedClaims: string[];           // Claim IDs
  unresolvedClaims: string[];          // Claim IDs
  caveats: string[];
  recommendedValidation: string[];
  report: string;                      // Reviewer-style narrative
}

// ============================================================================
// Evidence Weighting Configuration
// ============================================================================

/**
 * Technique Authority Weights for each claim type
 */
export interface TechniqueWeights {
  xps: number;      // 0-1
  ftir: number;     // 0-1
  raman: number;    // 0-1
}

/**
 * Evidence Weight Configuration by claim type
 */
export const TECHNIQUE_AUTHORITY_WEIGHTS: Record<string, TechniqueWeights> = {
  'spinel-structure': {
    xps: 0.6,    // Corroboration
    ftir: 0.2,   // Context
    raman: 1.0,  // Authority
  },
  'oxidation-states': {
    xps: 1.0,    // Authority
    ftir: 0.1,   // Irrelevant
    raman: 0.3,  // Context
  },
  'surface-species': {
    xps: 0.5,    // Corroboration
    ftir: 1.0,   // Authority
    raman: 0.2,  // Context
  },
  'carbonaceous-residue': {
    xps: 0.3,    // Context
    ftir: 0.5,   // Corroboration
    raman: 1.0,  // Authority
  },
  'carbonate-surface': {
    xps: 0.2,    // Context
    ftir: 1.0,   // Authority
    raman: 0.1,  // Irrelevant
  },
};

/**
 * Evidence Item Weights by technique and type
 */
export const EVIDENCE_ITEM_WEIGHTS: Record<TechniqueType, Record<string, number>> = {
  XPS: {
    'primary-oxidation-state': 1.0,
    'satellite': 0.8,
    'binding-energy-shift': 0.6,
    'surface-composition': 0.5,
  },
  FTIR: {
    'diagnostic-functional-group': 1.0,
    'ambiguous-overlap': 0.6,
    'broad-band': 0.5,
    'weak-shoulder': 0.3,
  },
  Raman: {
    'A1g-primary': 1.0,
    'Eg-T2g-supporting': 0.8,
    'lower-ferrite': 0.6,
    'D-G-carbon': 0.5,
  },
};

/**
 * Hierarchy Multipliers for confidence calculation
 */
export const HIERARCHY_MULTIPLIERS: Record<ClaimHierarchy, number> = {
  primary: 1.0,
  supporting: 0.9,
  context: 0.8,
};

/**
 * Contradiction Severity Multipliers
 */
export const CONTRADICTION_SEVERITY_MULTIPLIERS: Record<ContradictionSeverity, number> = {
  high: 0.30,
  medium: 0.15,
  low: 0.05,
  none: 0.00,
};
