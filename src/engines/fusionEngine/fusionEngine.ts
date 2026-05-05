// Fusion Engine - Main API

import type { FusionInput, FusionResult, EvidenceNode, Technique } from './types';

/**
 * Evaluate multi-technique evidence and generate scientific conclusion
 * @param input - Fusion input containing evidence nodes
 * @returns Fusion result with conclusion and reasoning
 */
export function evaluate(input: FusionInput): FusionResult {
  const { evidence } = input;

  // Detect evidence by technique and spectral range
  const ramanA1g = detectRamanA1g(evidence);
  const xrdSpinel = detectXRDSpinel(evidence);
  const ftirMO = detectFTIRMetalOxygen(evidence);

  // Collect highlighted evidence IDs
  const highlightedEvidenceIds: string[] = [];
  if (ramanA1g) highlightedEvidenceIds.push(ramanA1g.id);
  if (xrdSpinel) highlightedEvidenceIds.push(xrdSpinel.id);
  if (ftirMO) highlightedEvidenceIds.push(ftirMO.id);

  // Evaluate convergent evidence
  if (ramanA1g && xrdSpinel) {
    // Convergent spinel ferrite interpretation
    return generateSpinelFerriteResult(ramanA1g, xrdSpinel, ftirMO, highlightedEvidenceIds);
  }

  // Insufficient evidence - return working review
  return generateWorkingReviewResult(evidence, highlightedEvidenceIds);
}

/**
 * Detect Raman A1g-like evidence around 650–720 cm⁻¹
 */
function detectRamanA1g(evidence: EvidenceNode[]): EvidenceNode | null {
  return evidence.find(
    (e) =>
      e.technique === 'Raman' &&
      e.unit === 'cm⁻¹' &&
      e.x >= 650 &&
      e.x <= 720
  ) || null;
}

/**
 * Detect XRD spinel-like evidence in 30–60° 2θ range
 */
function detectXRDSpinel(evidence: EvidenceNode[]): EvidenceNode | null {
  return evidence.find(
    (e) =>
      e.technique === 'XRD' &&
      e.unit === '2θ' &&
      e.x >= 30 &&
      e.x <= 60
  ) || null;
}

/**
 * Detect FTIR metal-oxygen evidence around 400–700 cm⁻¹
 */
function detectFTIRMetalOxygen(evidence: EvidenceNode[]): EvidenceNode | null {
  return evidence.find(
    (e) =>
      e.technique === 'FTIR' &&
      e.unit === 'cm⁻¹' &&
      e.x >= 400 &&
      e.x <= 700
  ) || null;
}

/**
 * Generate spinel ferrite interpretation when Raman + XRD converge
 */
function generateSpinelFerriteResult(
  ramanA1g: EvidenceNode,
  xrdSpinel: EvidenceNode,
  ftirMO: EvidenceNode | null,
  highlightedEvidenceIds: string[]
): FusionResult {
  const basis: string[] = [
    `Raman: ${ramanA1g.label} at ${ramanA1g.x} ${ramanA1g.unit} characteristic of tetrahedral-site cation vibrations in spinel lattice`,
    `XRD: ${xrdSpinel.label} at ${xrdSpinel.x}° ${xrdSpinel.unit} consistent with cubic spinel phase`,
  ];

  if (ftirMO) {
    basis.push(
      `FTIR: ${ftirMO.label} at ${ftirMO.x} ${ftirMO.unit} supports metal-oxygen framework`
    );
  }

  const crossTech = ftirMO
    ? 'Raman vibrational symmetry and XRD long-range order independently converge on cubic spinel structure. FTIR metal-oxygen band provides additional support. No contradictions observed across techniques.'
    : 'Raman vibrational symmetry and XRD long-range order independently converge on cubic spinel structure. Complementary techniques provide convergent structural assignment.';

  const limitations: string[] = [
    'XRD provides bulk-averaged structure; surface reconstruction or amorphous surface layers not detected',
    'Cation distribution between tetrahedral and octahedral sites not determined from current evidence',
    'Raman selection rules may obscure certain vibrational modes depending on laser polarization',
  ];

  const decision =
    'Proceed with spinel ferrite structural assignment for downstream analysis and reporting.';

  return {
    conclusion:
      'Convergent multi-technique evidence supports spinel ferrite structure with characteristic vibrational and diffraction signatures.',
    basis,
    crossTech,
    limitations,
    decision,
    highlightedEvidenceIds,
  };
}

/**
 * Generate working review when evidence is insufficient for definitive assignment
 */
function generateWorkingReviewResult(
  evidence: EvidenceNode[],
  highlightedEvidenceIds: string[]
): FusionResult {
  const techniques = [...new Set(evidence.map((e) => e.technique))];
  const techniqueList = techniques.join(', ');

  const basis = evidence.map(
    (e) => `${e.technique}: ${e.label} at ${e.x} ${e.unit}`
  );

  const conclusion =
    techniques.length > 0
      ? `Current evidence from ${techniqueList} provides preliminary characterization. Additional complementary techniques required for definitive structural assignment.`
      : 'No evidence provided for evaluation. Multi-technique characterization required for structural assignment.';

  const crossTech =
    techniques.length > 1
      ? `${techniques.length} techniques provide complementary information. Convergent evidence from Raman and XRD required for spinel structure assignment.`
      : techniques.length === 1
      ? 'Single-technique observation. Cross-validation with complementary techniques recommended for definitive assignment.'
      : 'No cross-technique validation available.';

  const limitations =
    techniques.length > 0
      ? [
          'Insufficient convergent evidence for definitive structural assignment',
          'Technique-specific limitations apply to current observations',
          'Additional characterization required to resolve structural ambiguity',
        ]
      : ['No evidence available for evaluation'];

  const decision =
    techniques.length > 0
      ? 'Proceed with additional characterization using complementary techniques. Recommend Raman and XRD for structural assignment.'
      : 'Initiate multi-technique characterization with Raman, XRD, XPS, and FTIR.';

  return {
    conclusion,
    basis,
    crossTech,
    limitations,
    decision,
    highlightedEvidenceIds,
  };
}
