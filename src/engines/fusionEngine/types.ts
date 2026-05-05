// Fusion Engine Type Definitions

export type Technique = 'XRD' | 'Raman' | 'XPS' | 'FTIR';

export interface EvidenceNode {
  id: string;
  technique: Technique;
  x: number;
  unit: string;
  label: string;
}

export interface FusionInput {
  evidence: EvidenceNode[];
}

export interface FusionResult {
  conclusion: string;
  basis: string[];
  crossTech: string;
  limitations: string[];
  decision: string;
  highlightedEvidenceIds: string[];
}
