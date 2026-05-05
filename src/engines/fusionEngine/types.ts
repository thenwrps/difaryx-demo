// Fusion Engine Type Definitions

export type Technique = 'XRD' | 'Raman' | 'XPS' | 'FTIR';

export type EvidenceCategory = 'crystalline' | 'non-crystalline';

export interface EvidenceNode {
  id: string;
  technique: Technique;
  x: number;
  unit: string;
  label: string;
  inferredCategory?: EvidenceCategory;
  concept?: string;
}

export interface FusionInput {
  evidence: EvidenceNode[];
}

// Peak input for evidence node creation
export interface PeakInput {
  id: string;
  position: number;  // 2θ for XRD, wavenumber for FTIR/Raman, binding energy for XPS
  intensity: number;
  label?: string;
  assignment?: string;  // For XPS chemical state assignments
  hkl?: string;  // For XRD Miller indices
}

// Raw input for evidence node creation
export interface RawEvidenceInput {
  technique: Technique;
  peaks: PeakInput[];
}

export type ClaimType = 'structure' | 'chemical' | 'surface';

export interface Claim {
  id: string;
  type: ClaimType;
  category: string;
  requiredEvidenceIds: string[];
  optionalEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  requiredConcepts: string[];
  incompatibleConcepts: string[];
}

export type ClaimStatus = 'active' | 'partial' | 'unsupported' | 'invalid';

export interface ReasoningTraceItem {
  claimId: string;
  status: ClaimStatus;
  evidenceIds: string[];
  contradictingEvidenceIds: string[];
  group: string;
  isExclusiveConflict: boolean;
  categoryConflict: boolean;
  conceptMatch: boolean;
  conceptConflict: boolean;
  isDominant: boolean;
}

export interface FusionResult {
  conclusion: string;
  basis: string[];
  crossTech: string;
  limitations: string[];
  decision: string;
  reasoningTrace: ReasoningTraceItem[];
  highlightedEvidenceIds: string[];
}
