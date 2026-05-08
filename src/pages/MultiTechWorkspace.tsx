import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BookOpen, CheckCircle2, FileText, LockKeyhole, Play, Save, Upload } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import { LockedScientificContext } from '../components/locked-context/LockedScientificContext';
import {
  DEFAULT_PROJECT_ID,
  Technique,
  demoProjects,
  getDatasetsByTechnique,
  getNotebookPath,
  getProject,
  getWorkspaceRoute,
} from '../data/demoProjects';
import { formatChemicalFormula } from '../utils';
import { evaluate as evaluateFusionEngine, createEvidenceNodes, type EvidenceNode, type FusionResult, type EvidenceCategory, type PeakInput } from '../engines/fusionEngine';
import {
  createProcessingResultFromXrdDemo,
  saveProcessingResult,
} from '../data/workflowPipeline';
import {
  AXIS_DEFAULTS_BY_TECHNIQUE,
  BETA_TECHNIQUES,
  CLAIM_BOUNDARY_BY_TECHNIQUE,
  EVIDENCE_ROLE_BY_TECHNIQUE,
  FEATURE_TABLE_TITLES,
  INSUFFICIENT_EVIDENCE_MESSAGE,
  QUALITY_LABELS,
  createUploadedSignalRun,
  getUploadedSignalStorageStatus,
  mapUploadedSignalColumns,
  parseUploadedSignalText,
  readUploadedSignalRuns,
  saveUploadedSignalRun,
  type ParsedUploadedSignalSuccess,
  type Technique as UploadedTechnique,
  type UploadedSignalRun,
} from '../data/uploadedSignalRuns';
import {
  getConditionBoundaryNotes,
  getConditionLockStatusLabel,
  getLatestExperimentConditionLock,
} from '../data/experimentConditionLock';

// Cross-tech evidence types
interface CrossTechEvidence {
  id: string;
  technique: Technique;
  description: string;
  linkedEvidenceIds: string[];
  claimId?: string;
  xValue?: number | number[];
  xUnit?: string;
  highlightLabel?: string;
  highlightRole?: 'primary' | 'supporting';
}

interface CrossTechClaim {
  id: string;
  title: string;
  description: string;
  linkedEvidenceIds: string[];
  interpretation?: string;
  evidenceBasis?: string;
  limitations?: string;
  recommendedValidation?: string;
}

interface MatrixCell {
  claimId: string;
  technique: Technique;
  status: 'Supports' | 'Context' | 'Ambiguous' | 'Not addressed' | 'Potential limitation';
  evidenceId?: string;
}

interface GraphHighlight {
  position: number;
  intensity: number;
  label?: string;
  role: 'selected' | 'linked';
}

// Demo evidence data for cross-tech interaction
const demoEvidenceItems: CrossTechEvidence[] = [
  {
    id: 'raman-a1g',
    technique: 'Raman',
    description: 'A₁g mode at ~690 cm⁻¹ characteristic of spinel structure',
    linkedEvidenceIds: ['xrd-spinel', 'ftir-mo-band'],
    claimId: 'spinel-ferrite',
    xValue: 690,
    xUnit: 'cm⁻¹',
    highlightLabel: 'A₁g spinel',
    highlightRole: 'primary',
  },
  {
    id: 'xrd-spinel',
    technique: 'XRD',
    description: 'Spinel phase reflections at 2θ = 30.1°, 35.5°, 43.2°, 57.1°',
    linkedEvidenceIds: ['raman-a1g'],
    claimId: 'spinel-ferrite',
    xValue: [30.1, 35.5, 43.2, 57.1],
    xUnit: '2θ',
    highlightLabel: 'Spinel reflections',
    highlightRole: 'primary',
  },
  {
    id: 'xps-cu-fe',
    technique: 'XPS',
    description: 'Cu 2p₃/₂ at 933.8 eV and Fe 2p₃/₂ at 710.5 eV indicate mixed oxidation states',
    linkedEvidenceIds: ['ftir-mo-band'],
    claimId: 'oxidation-state',
    xValue: [933.8, 710.5],
    xUnit: 'eV',
    highlightLabel: 'Cu/Fe peaks',
    highlightRole: 'primary',
  },
  {
    id: 'ftir-mo-band',
    technique: 'FTIR',
    description: 'Metal-oxygen stretching band at 580 cm⁻¹ consistent with ferrite framework',
    linkedEvidenceIds: ['raman-a1g', 'xps-cu-fe'],
    claimId: 'metal-oxygen',
    xValue: 580,
    xUnit: 'cm⁻¹',
    highlightLabel: 'M-O stretch',
    highlightRole: 'primary',
  },
  {
    id: 'ftir-hydroxyl',
    technique: 'FTIR',
    description: 'Hydroxyl/water bands at 3400 cm⁻¹ indicate surface-adsorbed species',
    linkedEvidenceIds: [],
    claimId: 'surface-hydroxyl',
    xValue: 3400,
    xUnit: 'cm⁻¹',
    highlightLabel: 'OH/H₂O',
    highlightRole: 'primary',
  },
  {
    id: 'ftir-carbonate',
    technique: 'FTIR',
    description: 'Carbonate/carboxylate bands at 1380 cm⁻¹ and 1580 cm⁻¹',
    linkedEvidenceIds: [],
    claimId: 'carbonate-surface',
    xValue: [1380, 1580],
    xUnit: 'cm⁻¹',
    highlightLabel: 'Carbonate',
    highlightRole: 'primary',
  },
];

const demoClaims: CrossTechClaim[] = [
  {
    id: 'spinel-ferrite',
    title: 'Spinel ferrite assignment',
    description: 'Convergent structural evidence from Raman and XRD',
    linkedEvidenceIds: ['raman-a1g', 'xrd-spinel'],
    interpretation: 'The Raman A₁g mode at ~690 cm⁻¹ and XRD reflections at characteristic 2θ positions provide complementary evidence for cubic spinel structure. Vibrational spectroscopy probes local symmetry while diffraction confirms long-range order, yielding convergent structural assignment.',
    evidenceBasis: 'Raman A₁g mode is diagnostic of tetrahedral-site cation vibrations in spinel lattice. XRD reflections match reference patterns for cubic spinel phase (space group Fd-3m). Both techniques independently support the same structural conclusion.',
    limitations: 'XRD provides bulk-averaged structure; surface reconstruction or amorphous surface layers may not be detected. Raman selection rules may obscure certain vibrational modes depending on laser polarization and crystal orientation.',
    recommendedValidation: 'High-resolution TEM for direct lattice imaging. Synchrotron XRD for detailed Rietveld refinement. Polarized Raman to confirm symmetry assignment.',
  },
  {
    id: 'oxidation-state',
    title: 'Cu/Fe oxidation-state consistency',
    description: 'XPS binding energies support mixed-valence ferrite',
    linkedEvidenceIds: ['xps-cu-fe'],
    interpretation: 'XPS Cu 2p₃/₂ and Fe 2p₃/₂ binding energies indicate mixed oxidation states consistent with copper-iron ferrite composition. The presence of satellite features and peak positions support Cu²⁺ and Fe³⁺ as dominant species, though minor contributions from other oxidation states cannot be excluded.',
    evidenceBasis: 'Cu 2p₃/₂ at 933.8 eV with satellite structure is characteristic of Cu²⁺. Fe 2p₃/₂ at 710.5 eV is consistent with Fe³⁺ in oxide environment. Peak shapes and satellite intensities align with literature values for spinel ferrites.',
    limitations: 'XPS is surface-sensitive (~5 nm); bulk oxidation states may differ. Peak fitting is model-dependent and alternative oxidation-state distributions may yield similar spectra. Charging effects and adventitious carbon may shift binding energies.',
    recommendedValidation: 'Depth-profiling XPS or angle-resolved XPS to assess surface vs bulk. Mössbauer spectroscopy for bulk Fe oxidation states. XANES for element-specific oxidation-state determination.',
  },
  {
    id: 'metal-oxygen',
    title: 'Metal–oxygen bonding',
    description: 'FTIR metal-oxygen band reinforces ferrite framework',
    linkedEvidenceIds: ['ftir-mo-band'],
    interpretation: 'The FTIR metal-oxygen stretching band at 580 cm⁻¹ is consistent with M-O vibrations in spinel ferrite framework. This band position aligns with literature values for tetrahedral and octahedral metal-oxygen coordination in ferrite lattices.',
    evidenceBasis: 'Metal-oxygen stretching modes in spinel ferrites typically appear in the 400–600 cm⁻¹ region. The observed band at 580 cm⁻¹ falls within this range and is attributed to Fe-O and Cu-O vibrations in the spinel structure.',
    limitations: 'FTIR provides vibrational information but limited structural detail. Band assignment is empirical and may overlap with other oxide phases. Surface vs bulk contributions cannot be distinguished in transmission mode.',
    recommendedValidation: 'Raman spectroscopy for complementary vibrational analysis. Neutron diffraction for precise oxygen positions. DFT calculations to assign vibrational modes.',
  },
  {
    id: 'surface-hydroxyl',
    title: 'Surface hydroxyl/water species',
    description: 'FTIR hydroxyl bands indicate surface hydration',
    linkedEvidenceIds: ['ftir-hydroxyl'],
    interpretation: 'Broad FTIR bands at 3400 cm⁻¹ indicate surface-adsorbed water and hydroxyl groups. These species are common on oxide surfaces exposed to ambient conditions and may influence surface reactivity and catalytic behavior.',
    evidenceBasis: 'The 3400 cm⁻¹ band is characteristic of O-H stretching vibrations. Band broadness suggests hydrogen bonding and heterogeneous surface sites. Intensity indicates significant surface coverage under ambient conditions.',
    limitations: 'FTIR cannot distinguish between physisorbed water and chemisorbed hydroxyl groups. Surface coverage may vary with humidity and sample history. Contribution to bulk properties is likely minimal.',
    recommendedValidation: 'Temperature-programmed desorption to quantify water/hydroxyl content. In situ FTIR under controlled atmosphere. XPS O 1s to distinguish oxide, hydroxyl, and water oxygen.',
  },
  {
    id: 'carbonate-surface',
    title: 'Carbonate/carboxylate surface contribution',
    description: 'FTIR carbonate bands suggest surface contamination or CO₂ adsorption',
    linkedEvidenceIds: ['ftir-carbonate'],
    interpretation: 'FTIR bands at 1380 cm⁻¹ and 1580 cm⁻¹ are assigned to carbonate or carboxylate species on the surface. These may arise from atmospheric CO₂ adsorption or residual organic species from synthesis. Surface carbonates can affect catalytic activity and surface charge.',
    evidenceBasis: 'Carbonate C-O stretching modes typically appear at 1300–1600 cm⁻¹. The observed bands match literature values for surface-bound carbonate or carboxylate. Absence of corresponding XPS C 1s analysis keeps assignment validation-limited.',
    limitations: 'FTIR cannot distinguish between carbonate, bicarbonate, and carboxylate without isotopic labeling. Surface vs bulk contribution unclear. May be sample-preparation artifact rather than intrinsic property.',
    recommendedValidation: 'XPS C 1s and O 1s for chemical-state analysis. Thermal treatment to assess stability. In situ FTIR with CO₂ exposure to confirm adsorption mechanism.',
  },
  {
    id: 'carbonaceous-residue',
    title: 'Carbonaceous residue/disorder',
    description: 'Potential Raman D/G bands if present',
    linkedEvidenceIds: [],
    interpretation: 'No clear evidence of carbonaceous residue or disorder in the current Raman spectrum. If D and G bands were observed at ~1350 cm⁻¹ and ~1580 cm⁻¹, they would indicate amorphous carbon or graphitic contamination from synthesis.',
    evidenceBasis: 'Raman D and G bands are diagnostic of sp² carbon. Their absence suggests minimal carbonaceous contamination. FTIR carbonate bands do not correspond to Raman-active carbon species.',
    limitations: 'Raman may not detect trace carbon if fluorescence or low cross-section. Carbon content below detection limit cannot be excluded.',
    recommendedValidation: 'Combustion analysis for total carbon content. TEM for direct imaging of carbon phases. XPS C 1s for surface carbon speciation.',
  },
];

// Review output interface
interface ReviewOutput {
  conclusion: string;
  basis: string[];
  crossTechConsistency: string;
  limitations: string[];
  decision: string;
  recommendedValidation: string[];
}

// Fusion reasoning output interface
interface FusionReasoningOutput {
  scope: 'claim' | 'evidence' | 'project';
  title: string;
  conclusion: string;
  reasoningTrace: {
    claim: string;
    observed: string[];
    linked: string[];
    crossCheck: string[];
    limitation: string[];
    decision: string;
  };
  basis: string[];
  limitations: string[];
  decision: string;
  recommendedValidation: string[];
  notebookDraft: string;
  highlightedEvidenceIds: string[];
}

// Deterministic cross-tech review function
function runCrossTechReview(context: {
  selectedClaim?: CrossTechClaim | null;
  selectedEvidence?: CrossTechEvidence | null;
  linkedEvidence?: CrossTechEvidence[];
  activeTechniques: Set<Technique>;
  projectName: string;
}): ReviewOutput {
  const { selectedClaim, selectedEvidence, linkedEvidence = [], activeTechniques, projectName } = context;

  // If specific claim or evidence is selected
  if (selectedClaim || selectedEvidence) {
    const claim = selectedClaim || demoClaims.find((c) => c.id === selectedEvidence?.claimId);
    
    if (claim) {
      // Generate claim-specific review
      const claimEvidence = demoEvidenceItems.filter((e) => claim.linkedEvidenceIds.includes(e.id));
      
      return {
        conclusion: claim.interpretation || claim.description,
        basis: claimEvidence.map((e) => `${e.technique}: ${e.description}`),
        crossTechConsistency: generateCrossTechConsistency(claim, claimEvidence),
        limitations: parseLimitations(claim.limitations || ''),
        decision: generateDecision(claim),
        recommendedValidation: parseValidation(claim.recommendedValidation || ''),
      };
    }
  }

  // Default: project-level review using all active techniques
  const activeTechniquesList = Array.from(activeTechniques);
  const projectEvidence = demoEvidenceItems.filter((e) => activeTechniques.has(e.technique));
  
  return {
    conclusion: `Multi-technique characterization of ${projectName} provides convergent evidence for spinel ferrite structure with mixed Cu/Fe oxidation states. ${activeTechniquesList.join(', ')} techniques yield complementary structural, chemical, and vibrational information.`,
    basis: projectEvidence.map((e) => `${e.technique}: ${e.description}`),
    crossTechConsistency: `${activeTechniquesList.length} techniques provide complementary evidence. Raman and XRD independently confirm spinel structure. XPS provides surface oxidation-state information. FTIR supports metal-oxygen framework and detects surface species. No major contradictions observed across techniques.`,
    limitations: [
      'XRD provides bulk-averaged structure; surface may differ',
      'XPS is surface-sensitive (~5 nm); bulk composition may vary',
      'FTIR band assignments are empirical',
      'Raman selection rules may obscure certain modes',
      'Surface species (hydroxyl, carbonate) may be ambient artifacts',
    ],
    decision: `Use spinel ferrite assignment as a working interpretation for ${projectName}; phase purity and surface-state claims remain validation-limited. Recommend validation experiments to confirm surface vs bulk consistency.`,
    recommendedValidation: [
      'High-resolution TEM for direct lattice imaging',
      'Depth-profiling XPS for surface vs bulk oxidation states',
      'Temperature-programmed desorption for surface species quantification',
      'In situ characterization under controlled atmosphere',
    ],
  };
}

function generateReasoningTrace(context: {
  selectedClaim?: CrossTechClaim | null;
  selectedEvidence?: CrossTechEvidence | null;
  linkedEvidence?: CrossTechEvidence[];
  activeTechniques: Set<Technique>;
}): {
  claim: string;
  observed: string[];
  linked: string[];
  crossCheck: string[];
  limitation: string[];
  decision: string;
} {
  const { selectedClaim, selectedEvidence, linkedEvidence = [], activeTechniques } = context;

  // Claim-level reasoning
  if (selectedClaim) {
    const claimEvidence = demoEvidenceItems.filter((e) => selectedClaim.linkedEvidenceIds.includes(e.id));
    const techniques = [...new Set(claimEvidence.map((e) => e.technique))];
    
    // Separate primary and supporting evidence
    const primaryEvidence = claimEvidence.filter((e) => e.highlightRole === 'primary');
    const supportingEvidence = claimEvidence.filter((e) => e.highlightRole === 'supporting');
    
    return {
      claim: selectedClaim.title,
      observed: primaryEvidence.map((e) => e.description),
      linked: primaryEvidence.length > 1 
        ? [`${techniques.join(' and ')} evidence converge on ${selectedClaim.title.toLowerCase()}`]
        : [],
      crossCheck: supportingEvidence.map((e) => `${e.technique}: ${e.description}`),
      limitation: parseLimitations(selectedClaim.limitations || ''),
      decision: generateDecision(selectedClaim),
    };
  }

  // Evidence-level reasoning
  if (selectedEvidence) {
    const claim = demoClaims.find((c) => c.id === selectedEvidence.claimId);
    const allEvidence = [selectedEvidence, ...linkedEvidence];
    
    return {
      claim: claim?.title || 'Evidence-driven interpretation',
      observed: [selectedEvidence.description],
      linked: linkedEvidence.map((e) => `${e.technique}: ${e.description}`),
      crossCheck: linkedEvidence.length > 0
        ? [`${linkedEvidence.length} technique${linkedEvidence.length === 1 ? '' : 's'} provide${linkedEvidence.length === 1 ? 's' : ''} corroborating evidence`]
        : ['No direct cross-technique corroboration available'],
      limitation: claim ? parseLimitations(claim.limitations || '') : ['Technique-specific limitations apply'],
      decision: claim ? generateDecision(claim) : 'Proceed with current interpretation',
    };
  }

  // Project-level reasoning
  const activeTechniquesList = Array.from(activeTechniques);
  const projectEvidence = demoEvidenceItems.filter((e) => activeTechniques.has(e.technique));
  
  return {
    claim: 'Project-level multi-technique interpretation',
    observed: projectEvidence.slice(0, 4).map((e) => `${e.technique}: ${e.description}`),
    linked: ['All active techniques provide complementary structural, vibrational, surface-chemical, and bonding information'],
    crossCheck: [
      'Raman and XRD independently confirm spinel structure',
      'XPS provides surface oxidation-state information',
      'FTIR supports metal-oxygen framework and detects surface species',
    ],
    limitation: [
      'XRD provides bulk-averaged structure; surface may differ',
      'XPS is surface-sensitive (~5 nm); bulk composition may vary',
      'FTIR band assignments are empirical',
      'Raman selection rules may obscure certain modes',
    ],
    decision: 'Proceed with spinel ferrite structural assignment; recommend validation experiments',
  };
}

// Deterministic fusion reasoning runner
function runFusionReasoning(context: {
  selectedClaim?: CrossTechClaim | null;
  selectedEvidence?: CrossTechEvidence | null;
  linkedEvidence?: CrossTechEvidence[];
  activeTechniques: Set<Technique>;
  projectName: string;
}): FusionReasoningOutput {
  const { selectedClaim, selectedEvidence, linkedEvidence = [], activeTechniques, projectName } = context;

  // Generate reasoning trace
  const reasoningTrace = generateReasoningTrace({
    selectedClaim,
    selectedEvidence,
    linkedEvidence,
    activeTechniques,
  });

  // Claim-level reasoning
  if (selectedClaim) {
    const claimEvidence = demoEvidenceItems.filter((e) => selectedClaim.linkedEvidenceIds.includes(e.id));
    
    return {
      scope: 'claim',
      title: `Cross-Tech Review: ${selectedClaim.title}`,
      conclusion: selectedClaim.interpretation || selectedClaim.description,
      reasoningTrace,
      basis: claimEvidence.map((e) => `${e.technique}: ${e.description}`),
      limitations: parseLimitations(selectedClaim.limitations || ''),
      decision: generateDecision(selectedClaim),
      recommendedValidation: parseValidation(selectedClaim.recommendedValidation || ''),
      notebookDraft: generateNotebookDraft('claim', selectedClaim, claimEvidence, projectName),
      highlightedEvidenceIds: claimEvidence.map((e) => e.id),
    };
  }

  // Evidence-level reasoning
  if (selectedEvidence) {
    const claim = demoClaims.find((c) => c.id === selectedEvidence.claimId);
    const allEvidence = [selectedEvidence, ...linkedEvidence];
    
    return {
      scope: 'evidence',
      title: `Cross-Tech Review: ${selectedEvidence.technique} Evidence`,
      conclusion: claim?.interpretation || selectedEvidence.description,
      reasoningTrace,
      basis: allEvidence.map((e) => `${e.technique}: ${e.description}`),
      limitations: claim ? parseLimitations(claim.limitations || '') : ['Technique-specific limitations apply'],
      decision: claim ? generateDecision(claim) : 'Proceed with current interpretation.',
      recommendedValidation: claim ? parseValidation(claim.recommendedValidation || '') : [],
      notebookDraft: generateNotebookDraft('evidence', claim, allEvidence, projectName),
      highlightedEvidenceIds: allEvidence.map((e) => e.id),
    };
  }

  // Project-level reasoning
  const activeTechniquesList = Array.from(activeTechniques);
  const projectEvidence = demoEvidenceItems.filter((e) => activeTechniques.has(e.technique));
  
  return {
    scope: 'project',
    title: `Cross-Tech Review: ${projectName}`,
    conclusion: `Multi-technique characterization of ${projectName} provides convergent evidence for spinel ferrite structure with mixed Cu/Fe oxidation states. ${activeTechniquesList.join(', ')} techniques yield complementary structural, chemical, and vibrational information.`,
    reasoningTrace,
    basis: projectEvidence.map((e) => `${e.technique}: ${e.description}`),
    limitations: [
      'XRD provides bulk-averaged structure; surface may differ',
      'XPS is surface-sensitive (~5 nm); bulk composition may vary',
      'FTIR band assignments are empirical',
      'Raman selection rules may obscure certain modes',
      'Surface species (hydroxyl, carbonate) may be ambient artifacts',
    ],
    decision: `Use spinel ferrite assignment as a working interpretation for ${projectName}; phase purity and surface-state claims remain validation-limited. Recommend validation experiments to confirm surface vs bulk consistency.`,
    recommendedValidation: [
      'High-resolution TEM for direct lattice imaging',
      'Depth-profiling XPS for surface vs bulk oxidation states',
      'Temperature-programmed desorption for surface species quantification',
      'In situ characterization under controlled atmosphere',
    ],
    notebookDraft: generateNotebookDraft('project', null, projectEvidence, projectName),
    highlightedEvidenceIds: projectEvidence.map((e) => e.id),
  };
}

function generateNotebookDraft(
  scope: 'claim' | 'evidence' | 'project',
  claim: CrossTechClaim | null | undefined,
  evidence: CrossTechEvidence[],
  projectName: string,
): string {
  const techniques = [...new Set(evidence.map((e) => e.technique))];
  
  if (scope === 'claim' && claim) {
    return `# Cross-Tech Review: ${claim.title}

## Summary
${claim.interpretation || claim.description}

## Supporting Data
${evidence.map((e) => `- **${e.technique}**: ${e.description}`).join('\n')}

## Cross-Technique Consistency
${generateCrossTechConsistency(claim, evidence)}

## Limitations
${parseLimitations(claim.limitations || '').map((l) => `- ${l}`).join('\n')}

## Recommended Validation
${parseValidation(claim.recommendedValidation || '').map((v) => `- ${v}`).join('\n')}

## Decision
${generateDecision(claim)}
`;
  }
  
  if (scope === 'evidence') {
    return `# Cross-Tech Review: Evidence-Driven Interpretation

## Summary
${claim?.interpretation || 'Evidence-driven interpretation from selected observation'}

## Supporting Data
${evidence.map((e) => `- **${e.technique}**: ${e.description}`).join('\n')}

## Cross-Technique Consistency
${evidence.length > 1 ? `${evidence.length} techniques provide complementary evidence for this interpretation.` : 'Single-technique observation; cross-validation recommended.'}

## Limitations
${claim ? parseLimitations(claim.limitations || '').map((l) => `- ${l}`).join('\n') : '- Technique-specific limitations apply'}

## Decision
${claim ? generateDecision(claim) : 'Proceed with current interpretation; recommend cross-technique validation.'}
`;
  }
  
  // Project-level
  return `# Cross-Tech Review: ${projectName}

## Summary
Multi-technique characterization of ${projectName} provides convergent evidence for spinel ferrite structure with mixed Cu/Fe oxidation states. ${techniques.join(', ')} techniques yield complementary structural, chemical, and vibrational information.

## Evidence by Technique

${techniques.map((tech) => {
  const techEvidence = evidence.filter((e) => e.technique === tech);
  return `### ${tech}\n${techEvidence.map((e) => `- ${e.description}`).join('\n')}`;
}).join('\n\n')}

## Cross-Technique Consistency
${techniques.length} techniques provide complementary evidence. Raman and XRD independently confirm spinel structure. XPS provides surface oxidation-state information. FTIR supports metal-oxygen framework and detects surface species. No major contradictions observed across techniques.

## Limitations
- XRD provides bulk-averaged structure; surface may differ
- XPS is surface-sensitive (~5 nm); bulk composition may vary
- FTIR band assignments are empirical
- Raman selection rules may obscure certain modes
- Surface species (hydroxyl, carbonate) may be ambient artifacts

## Recommended Validation
- High-resolution TEM for direct lattice imaging
- Depth-profiling XPS for surface vs bulk oxidation states
- Temperature-programmed desorption for surface species quantification
- In situ characterization under controlled atmosphere

## Decision
Use spinel ferrite assignment as a working interpretation for ${projectName}; phase purity and surface-state claims remain validation-limited. Recommend validation experiments to confirm surface vs bulk consistency.
`;
}

function generateCrossTechConsistency(claim: CrossTechClaim, evidence: CrossTechEvidence[]): string {
  const techniques = [...new Set(evidence.map((e) => e.technique))];
  
  if (claim.id === 'spinel-ferrite') {
    return 'Raman vibrational symmetry and XRD long-range order independently converge on cubic spinel structure. FTIR metal-oxygen band provides additional support. No contradictions observed across techniques.';
  } else if (claim.id === 'oxidation-state') {
    return 'XPS surface analysis indicates Cu²⁺ and Fe³⁺ as dominant species. Complementary techniques provide structural context but do not directly probe oxidation states. Surface vs bulk consistency requires depth-profiling validation.';
  } else if (claim.id === 'metal-oxygen') {
    return 'FTIR metal-oxygen stretching and Raman vibrational modes provide complementary evidence for ferrite bonding framework. XPS oxidation states are consistent with expected metal-oxygen coordination. Evidence converges across techniques.';
  } else if (claim.id === 'surface-hydroxyl') {
    return 'FTIR is the primary technique for detecting surface hydroxyl/water species. XPS could provide complementary O 1s analysis but is not included in current dataset. Other techniques do not directly probe surface hydration.';
  } else if (claim.id === 'carbonate-surface') {
    return 'FTIR carbonate bands are observed, but corresponding XPS C 1s analysis is absent. Raman does not show clear carbonate features. Single-technique observation keeps assignment validation-limited.';
  } else if (claim.id === 'carbonaceous-residue') {
    return 'Raman shows no evidence of carbonaceous species. FTIR carbonate bands do not correspond to Raman-active carbon. XPS C 1s would provide stronger surface carbon speciation but is not included.';
  }
  
  return `${techniques.length} technique${techniques.length === 1 ? '' : 's'} provide${techniques.length === 1 ? 's' : ''} evidence for this interpretation. Cross-technique consistency supports the conclusion.`;
}

function generateDecision(claim: CrossTechClaim): string {
  if (claim.id === 'spinel-ferrite') {
    return 'Use spinel ferrite assignment as a working interpretation; phase purity and surface-state claims remain validation-limited.';
  } else if (claim.id === 'oxidation-state') {
    return 'Accept Cu²⁺/Fe³⁺ oxidation states as working model; recommend depth-profiling for bulk validation.';
  } else if (claim.id === 'metal-oxygen') {
    return 'Metal-oxygen bonding framework is consistent with ferrite structure; proceed with structural model.';
  } else if (claim.id === 'surface-hydroxyl') {
    return 'Document surface hydration as ambient condition; assess impact on functional properties if relevant.';
  } else if (claim.id === 'carbonate-surface') {
    return 'Flag surface carbonate as potential artifact; recommend XPS C 1s and thermal treatment for validation.';
  } else if (claim.id === 'carbonaceous-residue') {
    return 'No action required for carbonaceous contamination; proceed with current dataset.';
  }
  
  return 'Proceed with current interpretation; recommend validation experiments before stronger assignment.';
}

function parseLimitations(text: string): string[] {
  if (!text) return [];
  return text.split('.').filter((s) => s.trim().length > 0).map((s) => s.trim());
}

function parseValidation(text: string): string[] {
  if (!text) return [];
  return text.split('.').filter((s) => s.trim().length > 0).map((s) => s.trim());
}

// Matrix cell definitions
const matrixCells: MatrixCell[] = [
  { claimId: 'spinel-ferrite', technique: 'XRD', status: 'Supports', evidenceId: 'xrd-spinel' },
  { claimId: 'spinel-ferrite', technique: 'Raman', status: 'Supports', evidenceId: 'raman-a1g' },
  { claimId: 'spinel-ferrite', technique: 'XPS', status: 'Context' },
  { claimId: 'spinel-ferrite', technique: 'FTIR', status: 'Context', evidenceId: 'ftir-mo-band' },
  
  { claimId: 'oxidation-state', technique: 'XRD', status: 'Context' },
  { claimId: 'oxidation-state', technique: 'Raman', status: 'Context' },
  { claimId: 'oxidation-state', technique: 'XPS', status: 'Supports', evidenceId: 'xps-cu-fe' },
  { claimId: 'oxidation-state', technique: 'FTIR', status: 'Context' },
  
  { claimId: 'metal-oxygen', technique: 'XRD', status: 'Context' },
  { claimId: 'metal-oxygen', technique: 'Raman', status: 'Context', evidenceId: 'raman-a1g' },
  { claimId: 'metal-oxygen', technique: 'XPS', status: 'Context', evidenceId: 'xps-cu-fe' },
  { claimId: 'metal-oxygen', technique: 'FTIR', status: 'Supports', evidenceId: 'ftir-mo-band' },
  
  { claimId: 'surface-hydroxyl', technique: 'XRD', status: 'Not addressed' },
  { claimId: 'surface-hydroxyl', technique: 'Raman', status: 'Not addressed' },
  { claimId: 'surface-hydroxyl', technique: 'XPS', status: 'Context' },
  { claimId: 'surface-hydroxyl', technique: 'FTIR', status: 'Supports', evidenceId: 'ftir-hydroxyl' },
  
  { claimId: 'carbonate-surface', technique: 'XRD', status: 'Not addressed' },
  { claimId: 'carbonate-surface', technique: 'Raman', status: 'Ambiguous' },
  { claimId: 'carbonate-surface', technique: 'XPS', status: 'Not addressed' },
  { claimId: 'carbonate-surface', technique: 'FTIR', status: 'Supports', evidenceId: 'ftir-carbonate' },
  
  { claimId: 'carbonaceous-residue', technique: 'XRD', status: 'Not addressed' },
  { claimId: 'carbonaceous-residue', technique: 'Raman', status: 'Not addressed' },
  { claimId: 'carbonaceous-residue', technique: 'XPS', status: 'Potential limitation' },
  { claimId: 'carbonaceous-residue', technique: 'FTIR', status: 'Ambiguous' },
];

function getUploadedGraphType(technique: UploadedTechnique): 'xrd' | 'xps' | 'ftir' | 'raman' {
  if (technique === 'XPS') return 'xps';
  if (technique === 'FTIR') return 'ftir';
  if (technique === 'Raman') return 'raman';
  return 'xrd';
}

function formatUploadedRunTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getUploadedTechniqueLimitations(technique: UploadedTechnique): string[] {
  if (technique === 'XPS') {
    return [
      'Binding-energy calibration should be reviewed before oxidation-state interpretation.',
      'Surface-sensitive XPS evidence cannot establish bulk composition or phase identity alone.',
    ];
  }

  if (technique === 'FTIR') {
    return [
      'Band assignments are qualitative in this beta workflow.',
      'Support and bonding context cannot independently establish crystalline phase purity.',
    ];
  }

  if (technique === 'Raman') {
    return [
      'Fluorescence, baseline, and noise can mask or shift mode regions.',
      'Local vibrational consistency does not replace crystallographic assignment.',
    ];
  }

  if (technique === 'Unknown') {
    return [
      'Technique is unknown, so only generic signal feature inspection is available.',
      'No material-specific claim is generated from this upload.',
    ];
  }

  return [
    'Peak positions support phase-assignment review only within the selected reference scope.',
    'Phase purity remains validation-limited.',
  ];
}

export default function MultiTechWorkspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const project = getProject(searchParams.get('project') ?? DEFAULT_PROJECT_ID);
  
  // Cross-tech interaction state
  const [activeTechniques, setActiveTechniques] = useState<Set<Technique>>(new Set(['XRD', 'Raman', 'XPS', 'FTIR']));
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [hoveredEvidenceId, setHoveredEvidenceId] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'conclusion' | 'justification' | 'evidence' | 'interpretation'>('conclusion');
  const [reviewOutput, setReviewOutput] = useState<FusionResult | null>(null);
  const [isTechniqueDropdownOpen, setIsTechniqueDropdownOpen] = useState(false);
  const [workflowFeedback, setWorkflowFeedback] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedUpload, setParsedUpload] = useState<ParsedUploadedSignalSuccess | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadErrorQuality, setUploadErrorQuality] = useState<UploadedSignalRun['evidenceQuality'] | null>(null);
  const [selectedUploadTechnique, setSelectedUploadTechnique] = useState<UploadedTechnique>('Unknown');
  const [sampleIdentity, setSampleIdentity] = useState('');
  const [xAxisLabel, setXAxisLabel] = useState(AXIS_DEFAULTS_BY_TECHNIQUE.Unknown.xAxisLabel);
  const [yAxisLabel, setYAxisLabel] = useState(AXIS_DEFAULTS_BY_TECHNIQUE.Unknown.yAxisLabel);
  const [xColumn, setXColumn] = useState(1);
  const [yColumn, setYColumn] = useState(2);
  const [referenceScope, setReferenceScope] = useState('');
  const [latestUploadedRun, setLatestUploadedRun] = useState<UploadedSignalRun | null>(null);
  const [uploadedRuns, setUploadedRuns] = useState<UploadedSignalRun[]>(() => readUploadedSignalRuns());
  const [uploadStorageStatus, setUploadStorageStatus] = useState(() => getUploadedSignalStorageStatus());
  const [handoffPrepared, setHandoffPrepared] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState('');
  const [uploadPanelExpanded, setUploadPanelExpanded] = useState(false);
  const experimentConditionLock = useMemo(
    () => getLatestExperimentConditionLock(project.id),
    [project.id],
  );
  const conditionAvailableTechniques =
    latestUploadedRun && latestUploadedRun.technique !== 'Unknown'
      ? [latestUploadedRun.technique]
      : [];
  const conditionBoundaryNotes = getConditionBoundaryNotes(
    experimentConditionLock,
    conditionAvailableTechniques,
  );
  const conditionLockStatus = getConditionLockStatusLabel(experimentConditionLock);

  const claimBoundary = CLAIM_BOUNDARY_BY_TECHNIQUE[selectedUploadTechnique];
  const activeUploadQuality = latestUploadedRun?.evidenceQuality ?? uploadErrorQuality;
  const canAnalyzeUpload = Boolean(
    parsedUpload &&
    sampleIdentity.trim() &&
    xAxisLabel.trim() &&
    yAxisLabel.trim() &&
    xColumn !== yColumn,
  );
  const uploadGraphRun = latestUploadedRun ?? null;
  const uploadMatrixRows = BETA_TECHNIQUES.map((technique) => {
    const isUploaded = latestUploadedRun?.technique === technique;
    const isSelectedPending = !latestUploadedRun && parsedUpload && selectedUploadTechnique === technique;

    return {
      technique,
      evidenceRole: EVIDENCE_ROLE_BY_TECHNIQUE[technique],
      status: isUploaded ? 'Uploaded' : isSelectedPending ? 'Context required' : 'Not uploaded',
      boundary: CLAIM_BOUNDARY_BY_TECHNIQUE[technique],
    };
  });

  const showUploadFallback =
    latestUploadedRun &&
    (!latestUploadedRun.evidenceQuality.canInterpret || latestUploadedRun.technique === 'Unknown');
  const contextReady = Boolean(sampleIdentity.trim() && selectedUploadTechnique && xAxisLabel.trim() && yAxisLabel.trim());
  const mappingReady = Boolean(parsedUpload && xColumn !== yColumn);
  const uploadWorkflowStatuses = [
    { label: 'File selected', ready: Boolean(uploadedFileName), fallback: 'No file selected' },
    { label: 'Signal parsed', ready: Boolean(parsedUpload), fallback: uploadError ? 'Parse blocked' : 'Parse pending' },
    { label: `Technique: ${selectedUploadTechnique}`, ready: selectedUploadTechnique !== 'Unknown', fallback: 'Technique unknown' },
    { label: 'Columns mapped', ready: mappingReady, fallback: parsedUpload ? 'Mapping required' : 'Pending parse' },
    { label: 'Context locked', ready: Boolean(latestUploadedRun), fallback: contextReady ? 'Ready to lock' : 'Context required' },
    { label: 'Conditions explicitly tied', ready: false, fallback: 'Conditions not attached' },
    { label: 'Quality assessed', ready: Boolean(latestUploadedRun?.evidenceQuality), fallback: 'Gate pending' },
    { label: 'Handoff preview', ready: handoffPrepared, fallback: latestUploadedRun ? 'Preview available' : 'Pending analysis' },
  ];
  const compactUploadStatus = [
    uploadedFileName ? 'File selected' : 'No file selected',
    'Conditions not attached',
    latestUploadedRun?.evidenceQuality ? 'Gate assessed' : 'Gate pending',
  ].join(' · ');

  const setTemporaryUploadFeedback = (message: string) => {
    setUploadFeedback(message);
    window.setTimeout(() => setUploadFeedback(''), 2200);
  };

  const handleUploadedTechniqueChange = (technique: UploadedTechnique) => {
    setSelectedUploadTechnique(technique);
    setXAxisLabel(AXIS_DEFAULTS_BY_TECHNIQUE[technique].xAxisLabel);
    setYAxisLabel(AXIS_DEFAULTS_BY_TECHNIQUE[technique].yAxisLabel);
  };

  const handleUploadFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setLatestUploadedRun(null);
    setHandoffPrepared(false);
    setUploadError('');
    setUploadErrorQuality(null);
    setParsedUpload(null);
    setXColumn(1);
    setYColumn(2);

    if (!file) {
      setUploadedFileName('');
      return;
    }

    setUploadedFileName(file.name);
    setUploadPanelExpanded(true);

    try {
      const text = await file.text();
      const parsed = parseUploadedSignalText(file.name, text);

      if (!parsed.ok) {
        setUploadError(parsed.error);
        setUploadErrorQuality(parsed.evidenceQuality);
        return;
      }

      setParsedUpload(parsed);
      setXColumn(parsed.columnMapping.xColumn);
      setYColumn(parsed.columnMapping.yColumn);
      handleUploadedTechniqueChange(parsed.suggestedTechnique);

      if (!sampleIdentity.trim()) {
        setSampleIdentity(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
      }
    } catch {
      setUploadError('DIFARYX could not read the selected file in the browser.');
      setUploadErrorQuality({
        state: 'insufficient_numeric_data',
        label: QUALITY_LABELS.insufficient_numeric_data,
        canInterpret: false,
        messages: [
          'Interpretation is bounded by current evidence coverage.',
          'The selected file could not be read by the public-beta upload workflow.',
        ],
      });
    }
  };

  const handleConfirmContextAndAnalyze = () => {
    if (!parsedUpload || !canAnalyzeUpload) return;
    const mappedPoints = mapUploadedSignalColumns(parsedUpload, xColumn, yColumn);

    const run = createUploadedSignalRun({
      fileName: parsedUpload.fileName,
      technique: selectedUploadTechnique,
      sampleIdentity,
      xAxisLabel,
      yAxisLabel,
      referenceScope,
      points: mappedPoints,
    });

    setLatestUploadedRun(run);
    setUploadedRuns((current) => [
      run,
      ...current.filter((existingRun) => existingRun.id !== run.id),
    ].slice(0, 12));
    const saved = saveUploadedSignalRun(run);
    setUploadStorageStatus(getUploadedSignalStorageStatus());
    const feedbackMessage = saved
      ? (run.evidenceQuality.canInterpret
        ? 'Bounded feature extraction ready; beta run saved'
        : 'Evidence gate applied; beta run saved')
      : (run.evidenceQuality.canInterpret
        ? 'Bounded feature extraction ready in this session'
        : 'Evidence gate applied in this session');

    setHandoffPrepared(false);
    setTemporaryUploadFeedback(feedbackMessage);
  };

  const handleAddUploadedRunToEvidenceBundle = () => {
    if (!latestUploadedRun) return;

    setUploadedRuns((current) => [
      latestUploadedRun,
      ...current.filter((run) => run.id !== latestUploadedRun.id),
    ].slice(0, 12));

    const saved = saveUploadedSignalRun(latestUploadedRun);
    setUploadStorageStatus(getUploadedSignalStorageStatus());
    setTemporaryUploadFeedback(
      saved
        ? 'Uploaded signal added to evidence bundle'
        : 'Uploaded signal retained in this session; browser storage was unavailable',
    );
  };

  const handlePrepareNotebookEntry = () => {
    if (!latestUploadedRun) return;
    setHandoffPrepared(true);
    setTemporaryUploadFeedback('Notebook/Report handoff preview prepared');
  };

  // Compute graph highlights for a technique
  const getGraphHighlights = (technique: Technique): GraphHighlight[] => {
    const highlights: GraphHighlight[] = [];
    const activeEvidenceId = selectedEvidenceId ?? hoveredEvidenceId;
    
    if (!activeEvidenceId) return highlights;
    
    const selectedEvidence = demoEvidenceItems.find((e) => e.id === activeEvidenceId);
    if (!selectedEvidence) return highlights;
    
    // Add selected evidence highlight if it matches this technique
    if (selectedEvidence.technique === technique && selectedEvidence.xValue !== undefined) {
      const values = Array.isArray(selectedEvidence.xValue) ? selectedEvidence.xValue : [selectedEvidence.xValue];
      values.forEach((val) => {
        highlights.push({
          position: val,
          intensity: 100,
          label: selectedEvidence.highlightLabel,
          role: 'selected',
        });
      });
    }
    
    // Add linked evidence highlights
    const linkedIds = selectedEvidence.linkedEvidenceIds;
    linkedIds.forEach((linkedId) => {
      const linkedEvidence = demoEvidenceItems.find((e) => e.id === linkedId);
      if (linkedEvidence && linkedEvidence.technique === technique && linkedEvidence.xValue !== undefined) {
        const values = Array.isArray(linkedEvidence.xValue) ? linkedEvidence.xValue : [linkedEvidence.xValue];
        values.forEach((val) => {
          highlights.push({
            position: val,
            intensity: 80,
            label: linkedEvidence.highlightLabel,
            role: 'linked',
          });
        });
      }
    });
    
    // If claim is selected, add all evidence for that claim
    if (selectedClaimId) {
      const claimEvidence = demoEvidenceItems.filter((e) => e.claimId === selectedClaimId && e.technique === technique);
      claimEvidence.forEach((evidence) => {
        if (evidence.xValue !== undefined) {
          const values = Array.isArray(evidence.xValue) ? evidence.xValue : [evidence.xValue];
          values.forEach((val) => {
            // Check if already added
            const exists = highlights.some((h) => Math.abs(h.position - val) < 0.1);
            if (!exists) {
              highlights.push({
                position: val,
                intensity: 70,
                label: evidence.highlightLabel,
                role: 'linked',
              });
            }
          });
        }
      });
    }
    
    return highlights;
  };

  // Cross-tech interaction helpers
  const getLinkedEvidenceIds = (evidenceId: string): string[] => {
    const evidence = demoEvidenceItems.find((e) => e.id === evidenceId);
    return evidence?.linkedEvidenceIds ?? [];
  };

  const getEvidencesByClaimId = (claimId: string): string[] => {
    const claim = demoClaims.find((c) => c.id === claimId);
    return claim?.linkedEvidenceIds ?? [];
  };

  const isEvidenceHighlighted = (evidenceId: string): boolean => {
    // Check if evidence is highlighted by fusionEngine output
    if (reviewOutput && reviewOutput.highlightedEvidenceIds.includes(evidenceId)) {
      return true;
    }
    
    // Check if evidence is highlighted by user interaction (hover/click)
    const activeEvidenceId = selectedEvidenceId ?? hoveredEvidenceId;
    if (!activeEvidenceId) return false;
    if (evidenceId === activeEvidenceId) return true;
    
    // Check if this evidence is linked to the active evidence
    const linkedIds = getLinkedEvidenceIds(activeEvidenceId);
    return linkedIds.includes(evidenceId);
  };

  const isEvidenceRelatedToClaim = (evidenceId: string, claimId: string): boolean => {
    const claimEvidenceIds = getEvidencesByClaimId(claimId);
    return claimEvidenceIds.includes(evidenceId);
  };

  const handleEvidenceClick = (evidenceId: string) => {
    setSelectedEvidenceId(selectedEvidenceId === evidenceId ? null : evidenceId);
    setSelectedClaimId(null);
  };

  const handleEvidenceHover = (evidenceId: string | null) => {
    if (!selectedEvidenceId) {
      setHoveredEvidenceId(evidenceId);
    }
  };

  const handleClaimClick = (claimId: string) => {
    setSelectedClaimId(selectedClaimId === claimId ? null : claimId);
    setSelectedEvidenceId(null);
  };

  const handleMatrixCellClick = (claimId: string, technique: Technique, evidenceId?: string) => {
    setSelectedClaimId(claimId);
    if (evidenceId) {
      setSelectedEvidenceId(evidenceId);
    } else {
      setSelectedEvidenceId(null);
    }
  };

  const handleClaimRowClick = (claimId: string) => {
    setSelectedClaimId(selectedClaimId === claimId ? null : claimId);
    setSelectedEvidenceId(null);
  };

  const getMatrixCell = (claimId: string, technique: Technique): MatrixCell | undefined => {
    return matrixCells.find((cell) => cell.claimId === claimId && cell.technique === technique);
  };

  const toggleTechnique = (technique: Technique) => {
    setActiveTechniques((prev) => {
      const next = new Set(prev);
      if (next.has(technique)) {
        next.delete(technique);
      } else {
        next.add(technique);
      }
      return next;
    });
  };

  const handleRunReview = () => {
    // Convert demoEvidenceItems to PeakInput format and call fusionEngine
    const peakInputsByTechnique = new Map<Technique, PeakInput[]>();
    
    // Group evidence by technique
    demoEvidenceItems
      .filter((e) => activeTechniques.has(e.technique))
      .forEach((e) => {
        if (!peakInputsByTechnique.has(e.technique)) {
          peakInputsByTechnique.set(e.technique, []);
        }
        
        // Handle array xValue by creating multiple peaks
        const xValues = Array.isArray(e.xValue) ? e.xValue : [e.xValue];
        
        xValues.forEach((xVal, index) => {
          if (xVal && xVal > 0) {
            peakInputsByTechnique.get(e.technique)!.push({
              id: Array.isArray(e.xValue) ? `${e.id}-${index}` : e.id,
              position: xVal,
              intensity: 100, // Default intensity
              label: e.highlightLabel || e.description,
            });
          }
        });
      });
    
    // Create evidence nodes for each technique using central function
    const allEvidenceNodes: EvidenceNode[] = [];
    peakInputsByTechnique.forEach((peaks, technique) => {
      const nodes = createEvidenceNodes({ technique, peaks });
      allEvidenceNodes.push(...nodes);
    });
    
    // Call fusionEngine with evidence nodes - single source of truth
    const fusionResult: FusionResult = evaluateFusionEngine({ evidence: allEvidenceNodes });
    
    // Use FusionResult directly - no wrapper conversion
    setReviewOutput(fusionResult);
  };

  const handleSaveProcessingResult = () => {
    const processingResult = createProcessingResultFromXrdDemo(project.id);
    saveProcessingResult(processingResult);
    setWorkflowFeedback('Processing result saved');
    window.setTimeout(() => setWorkflowFeedback(''), 1800);
  };

  const handleRefineInterpretation = () => {
    const processingResult = createProcessingResultFromXrdDemo(project.id);
    saveProcessingResult(processingResult);
    navigate(`/demo/agent?project=${project.id}&scope=fusion&processing=${processingResult.id}&template=research`);
  };

  // Build notebook draft from FusionResult
  const buildNotebookDraftFromFusionResult = (result: FusionResult, projectName: string): string => {
    return `# Cross-Tech Review: ${projectName}

## Summary
${result.conclusion}

## Supporting Data
${result.basis.map((b) => `- ${b}`).join('\n')}

## Cross-Technique Consistency
${result.crossTech}

## Limitations
${result.limitations.map((l) => `- ${l}`).join('\n')}

## Decision
${result.decision}
`;
  };

  // Get selected evidence details for interpretation log
  const selectedEvidence = selectedEvidenceId ? demoEvidenceItems.find((e) => e.id === selectedEvidenceId) : null;
  const linkedEvidence = selectedEvidence ? demoEvidenceItems.filter((e) => selectedEvidence.linkedEvidenceIds.includes(e.id)) : [];
  const selectedClaim = selectedClaimId ? demoClaims.find((c) => c.id === selectedClaimId) : null;

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-background p-2">
        {/* Header */}
        <div className="mb-2 rounded-lg border border-border bg-surface px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-[220px]">
              <h1 className="text-base font-bold text-text-main">Cross-Tech Evidence Review</h1>
              <p className="mt-0.5 text-[10px] text-text-muted">
                Compare linked evidence across XRD, Raman, XPS, and FTIR
              </p>
            </div>
            <div className="flex max-w-full flex-wrap items-center justify-start gap-1.5 sm:justify-end">
              <select
                value={project.id}
                onChange={(event) => {
                  const newProjectId = event.target.value;
                  searchParams.set('project', newProjectId);
                  window.location.href = `/workspace/multi?${searchParams.toString()}`;
                }}
                className="h-8 max-w-full rounded border border-border bg-background px-3 text-sm font-semibold text-text-main outline-none hover:border-primary/40 focus:border-primary sm:max-w-[240px]"
              >
                {demoProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {formatChemicalFormula(proj.name)}
                  </option>
                ))}
              </select>
              <div className="relative">
                <details className="group">
                  <summary className="cursor-pointer list-none rounded border border-border bg-background px-3 py-1.5 text-sm font-semibold text-text-main hover:border-primary/40 inline-flex min-w-fit">
                    <span className="whitespace-nowrap">{Array.from(activeTechniques).join(', ')}</span>
                  </summary>
                  <div className="absolute right-0 z-10 mt-1 rounded border border-border bg-white shadow-lg">
                    <div className="p-2 flex gap-3 whitespace-nowrap">
                      {(['XRD', 'Raman', 'XPS', 'FTIR'] as Technique[]).map((technique) => (
                        <label key={technique} className="flex items-center gap-1.5 cursor-pointer px-2 py-1 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={activeTechniques.has(technique)}
                            onChange={() => toggleTechnique(technique)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            style={{ backgroundColor: 'white' }}
                          />
                          <span className="text-sm font-medium text-text-main">{technique}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
              <button 
                onClick={handleRunReview}
                className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-primary/90"
              >
                <Play size={14} /> Run Review
              </button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 whitespace-nowrap"
                onClick={handleSaveProcessingResult}
              >
                <CheckCircle2 size={14} /> Save Result
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 whitespace-nowrap"
                onClick={handleRefineInterpretation}
              >
                <FileText size={14} /> Refine
              </Button>
              <Link to={`/workspace/fusion?project=${project.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 whitespace-nowrap">
                  <BookOpen size={14} /> Report
                </Button>
              </Link>
              <Link to={`/notebook?project=${project.id}&source=fusion&template=research`}>
                <Button variant="outline" size="sm" className="gap-1.5 whitespace-nowrap">
                  <Save size={14} /> Notebook
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted">
              <span className="font-bold text-emerald-700">Processing Result Ready</span>
              <span>Detected peaks: 9</span>
              <span>Preliminary assignment: CuFe2O4 spinel ferrite</span>
              <span className="font-semibold text-text-main">Next: Refine Interpretation</span>
              {workflowFeedback && <span className="font-semibold text-primary">{workflowFeedback}</span>}
            </div>
          </div>
        </div>

        <Card id="beta-upload" className="mb-2 overflow-hidden">
          <div className={`${uploadPanelExpanded ? 'border-b' : ''} border-border bg-surface-hover/40 px-3 py-2`}>
            <div className="grid grid-cols-1 items-center gap-2 xl:grid-cols-[230px_minmax(0,1fr)_auto]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-text-main">Add supporting dataset</h2>
                  <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Public beta
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-text-muted">Attach another technique, replicate, or validation signal.</p>
              </div>
              {uploadPanelExpanded ? (
                <div className="flex flex-wrap gap-1.5">
                  {uploadWorkflowStatuses.map((item) => (
                    <span
                      key={item.label}
                      className={`rounded border px-2 py-1 text-[10px] font-semibold ${
                        item.ready
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                          : 'border-border bg-background text-text-muted'
                      }`}
                    >
                      {item.ready ? item.label : item.fallback}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="truncate rounded border border-border bg-background px-2 py-1.5 text-[11px] font-semibold text-text-muted">
                  {compactUploadStatus}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-primary/90">
                  <Upload size={14} /> Upload action
                  <input
                    type="file"
                    accept=".csv,.txt,.xy,.dat,text/csv,text/plain"
                    className="sr-only"
                    onChange={handleUploadFileChange}
                  />
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => setUploadPanelExpanded((expanded) => !expanded)}
                >
                  {uploadPanelExpanded ? 'Hide upload details' : 'Show upload details'}
                </Button>
              </div>
            </div>
            {(!uploadStorageStatus.available || uploadStorageStatus.corrupted) && (
              <p className="mt-2 text-[10px] text-amber-700">{uploadStorageStatus.message}</p>
            )}
            <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
              <span className="font-semibold text-text-main">Experiment condition lock: {conditionLockStatus}.</span>{' '}
              Supporting uploads do not inherit synthesis, measurement, processing, or validation conditions unless
              explicitly tied to the current experiment record.
            </p>
          </div>

          {uploadPanelExpanded && (
          <div className="grid grid-cols-1 gap-3 p-3 xl:grid-cols-[320px_1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <h3 className="text-xs font-bold text-text-main">Scientific context confirmation</h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      Technique
                    </label>
                    <select
                      value={selectedUploadTechnique}
                      onChange={(event) => handleUploadedTechniqueChange(event.target.value as UploadedTechnique)}
                      className="mt-1 h-9 w-full rounded border border-border bg-surface px-3 text-sm text-text-main outline-none focus:border-primary"
                    >
                      {BETA_TECHNIQUES.map((technique) => (
                        <option key={technique} value={technique}>
                          {technique}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      Sample identity
                    </label>
                    <input
                      value={sampleIdentity}
                      onChange={(event) => setSampleIdentity(event.target.value)}
                      placeholder="Required before analysis"
                      className="mt-1 h-9 w-full rounded border border-border bg-surface px-3 text-sm text-text-main outline-none placeholder:text-text-muted/60 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      Source dataset / file name
                    </label>
                    <div className="mt-1 rounded border border-border bg-surface px-3 py-2 text-xs text-text-main">
                      {uploadedFileName || 'No file selected'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        X-axis label
                      </label>
                      <input
                        value={xAxisLabel}
                        onChange={(event) => setXAxisLabel(event.target.value)}
                        className="mt-1 h-9 w-full rounded border border-border bg-surface px-3 text-sm text-text-main outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                        Y-axis label
                      </label>
                      <input
                        value={yAxisLabel}
                        onChange={(event) => setYAxisLabel(event.target.value)}
                        className="mt-1 h-9 w-full rounded border border-border bg-surface px-3 text-sm text-text-main outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      Reference scope, optional
                    </label>
                    <input
                      value={referenceScope}
                      onChange={(event) => setReferenceScope(event.target.value)}
                      placeholder="Example: internal screening, calibration review, support interaction"
                      className="mt-1 h-9 w-full rounded border border-border bg-surface px-3 text-sm text-text-main outline-none placeholder:text-text-muted/60 focus:border-primary"
                    />
                  </div>
                  <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                      Claim boundary
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-text-main">{claimBoundary}</p>
                  </div>
                  <Button
                    type="button"
                    className="w-full gap-2"
                    onClick={handleConfirmContextAndAnalyze}
                    disabled={!canAnalyzeUpload}
                  >
                    <LockKeyhole size={14} /> Confirm context and analyze
                  </Button>
                  {!canAnalyzeUpload && (
                    <p className="text-[10px] leading-relaxed text-text-muted">
                      Upload a supported numeric signal and confirm sample identity, technique, and axis labels before analysis.
                    </p>
                  )}
                </div>
              </div>

              <LockedScientificContext
                sampleIdentity={sampleIdentity || 'Pending user confirmation'}
                technique={selectedUploadTechnique}
                sourceDataset={uploadedFileName || 'Pending upload'}
                sourceProcessingPath={`Public beta upload / numeric columns X:${xColumn}, Y:${yColumn}`}
                referenceScope={referenceScope || 'User-provided beta upload context'}
                claimBoundary={claimBoundary}
                variant="compact"
              />
              <div className="rounded border border-border bg-background p-2 text-[10px] leading-relaxed text-text-muted">
                <p>User-confirmed context is treated as a locked scientific constraint.</p>
                <p>DIFARYX may test analytical paths, but source context remains unchanged.</p>
                <p>Suggested changes require explicit user action.</p>
              </div>
              <div className="rounded border border-border bg-background p-2 text-[10px] leading-relaxed text-text-muted">
                <div className="font-semibold text-text-main">Experiment condition awareness</div>
                <p className="mt-1">{conditionLockStatus}</p>
                <p className="mt-1">
                  Upload-derived signal evidence remains separate until the user explicitly ties it to the current
                  experiment condition record.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_320px]">
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-text-main">Column mapping summary</h3>
                      <p className="mt-1 text-[11px] text-text-muted">
                        Default mapping uses the first numeric column as X and second numeric column as Y.
                      </p>
                    </div>
                    {parsedUpload && (
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Parsed
                      </span>
                    )}
                  </div>
                  {parsedUpload && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          X column
                        </label>
                        <select
                          value={xColumn}
                          onChange={(event) => setXColumn(Number(event.target.value))}
                          className="mt-1 h-8 w-full rounded border border-border bg-surface px-2 text-xs text-text-main outline-none focus:border-primary"
                        >
                          {Array.from({ length: parsedUpload.numericColumnCount }, (_, index) => index + 1).map((column) => (
                            <option key={column} value={column}>
                              Numeric column {column}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          Y column
                        </label>
                        <select
                          value={yColumn}
                          onChange={(event) => setYColumn(Number(event.target.value))}
                          className="mt-1 h-8 w-full rounded border border-border bg-surface px-2 text-xs text-text-main outline-none focus:border-primary"
                        >
                          {Array.from({ length: parsedUpload.numericColumnCount }, (_, index) => index + 1).map((column) => (
                            <option key={column} value={column}>
                              Numeric column {column}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  {parsedUpload && xColumn === yColumn && (
                    <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] text-amber-800">
                      X and Y must use different numeric columns before analysis.
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded border border-border bg-surface p-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Rows</div>
                      <div className="mt-1 font-bold text-text-main">{parsedUpload?.numericRows ?? 0}</div>
                    </div>
                    <div className="rounded border border-border bg-surface p-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Mapping</div>
                      <div className="mt-1 font-bold text-text-main">
                        {parsedUpload ? `X: col ${xColumn}, Y: col ${yColumn}` : 'Pending'}
                      </div>
                    </div>
                    <div className="rounded border border-border bg-surface p-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Ignored</div>
                      <div className="mt-1 font-bold text-text-main">{parsedUpload?.ignoredRows ?? 0}</div>
                    </div>
                  </div>
                  {parsedUpload?.warnings.map((warning) => (
                    <p key={warning} className="mt-2 text-[10px] text-text-muted">{warning}</p>
                  ))}
                  {uploadError && (
                    <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-800">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle size={13} /> Controlled upload state
                      </div>
                      <p className="mt-1">{uploadError}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <h3 className="text-xs font-bold text-text-main">Evidence quality</h3>
                  <div className="mt-2 rounded border border-border bg-surface p-2">
                    <div className={`text-sm font-bold ${
                      activeUploadQuality?.state === 'ready' ? 'text-emerald-600' :
                      activeUploadQuality ? 'text-amber-600' : 'text-text-muted'
                    }`}>
                      {activeUploadQuality?.label ?? 'Context required'}
                    </div>
                    <div className="mt-1 text-[10px] text-text-muted">
                      Interpretation is bounded by current evidence coverage.
                    </div>
                  </div>
                  <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-text-muted">
                    {(activeUploadQuality?.messages ?? [
                      'Upload and confirm context before evidence-quality gating.',
                    ]).map((message) => (
                      <li key={message} className="flex gap-1.5">
                        <span className="text-primary">-</span>
                        <span>{message}</span>
                      </li>
                    ))}
                  </ul>
                  {uploadStorageStatus.corrupted && (
                    <div className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] leading-relaxed text-amber-800">
                      {uploadStorageStatus.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-text-main">Uploaded signal plot</h3>
                    <p className="mt-1 text-[11px] text-text-muted">
                      The plot uses the selected technique and locked axis labels.
                    </p>
                  </div>
                  {latestUploadedRun && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {latestUploadedRun.technique} uploaded
                    </span>
                  )}
                </div>
                <div className="mt-3 h-64 rounded-md border border-border bg-surface p-2">
                  {uploadGraphRun ? (
                    <Graph
                      type={getUploadedGraphType(uploadGraphRun.technique)}
                      height="100%"
                      externalData={uploadGraphRun.points}
                      showCalculated={false}
                      showResidual={false}
                      showLegend={false}
                      xAxisLabel={uploadGraphRun.xAxisLabel}
                      yAxisLabel={uploadGraphRun.yAxisLabel}
                      peakMarkers={uploadGraphRun.extractedFeatures.map((feature) => ({
                        position: feature.position,
                        intensity: feature.intensity,
                        label: feature.label,
                        role: 'selected',
                      }))}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-xs text-text-muted">
                      Upload a supported signal, confirm locked context, then analyze to plot the uploaded dataset.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-background p-3">
                  <h3 className="text-xs font-bold text-text-main">
                    {latestUploadedRun ? FEATURE_TABLE_TITLES[latestUploadedRun.technique] : 'Extracted features'}
                  </h3>
                  {latestUploadedRun && latestUploadedRun.extractedFeatures.length > 0 ? (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="border-b border-border text-left text-text-muted">
                            <th className="py-1.5 pr-2 font-semibold">Feature</th>
                            <th className="py-1.5 pr-2 font-semibold">Position</th>
                            <th className="py-1.5 pr-2 font-semibold">Relative</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {latestUploadedRun.extractedFeatures.slice(0, 10).map((feature) => (
                            <tr key={feature.id}>
                              <td className="py-2 pr-2 text-text-main">
                                <div className="font-semibold">{feature.label}</div>
                                <div className="mt-0.5 text-[9px] leading-relaxed text-text-muted">{feature.context}</div>
                              </td>
                              <td className="py-2 pr-2 font-mono text-text-main">{feature.position}</td>
                              <td className="py-2 pr-2 text-text-main">{feature.relativeIntensity}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs leading-relaxed text-text-muted">
                      {latestUploadedRun ? INSUFFICIENT_EVIDENCE_MESSAGE : 'No uploaded signal has been analyzed yet.'}
                    </p>
                  )}
                  {showUploadFallback && (
                    <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] leading-relaxed text-amber-800">
                      {latestUploadedRun.technique === 'Unknown'
                        ? CLAIM_BOUNDARY_BY_TECHNIQUE.Unknown
                        : INSUFFICIENT_EVIDENCE_MESSAGE}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-background p-3">
                  <h3 className="text-xs font-bold text-text-main">Claim boundary</h3>
                  <div className="mt-3 rounded border border-border bg-surface p-2 text-xs leading-relaxed text-text-main">
                    {latestUploadedRun?.claimBoundary[0] ?? claimBoundary}
                  </div>
                  <div className="mt-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Technique limitations</div>
                    <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-text-muted">
                      {getUploadedTechniqueLimitations(latestUploadedRun?.technique ?? selectedUploadTechnique).map((item) => (
                        <li key={item} className="flex gap-1.5">
                          <span className="text-primary">-</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Condition boundary</div>
                    <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-text-muted">
                      {conditionBoundaryNotes.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-1.5">
                          <span className="text-primary">-</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleAddUploadedRunToEvidenceBundle}
                      disabled={!latestUploadedRun}
                    >
                      <CheckCircle2 size={13} /> Add to evidence bundle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handlePrepareNotebookEntry}
                      disabled={!latestUploadedRun}
                    >
                      <Save size={13} /> Prepare Notebook entry
                    </Button>
                  </div>
                  {uploadFeedback && (
                    <p className="mt-2 text-[10px] font-semibold text-primary">{uploadFeedback}</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background p-3">
                <h3 className="text-xs font-bold text-text-main">Notebook/Report handoff preview</h3>
                {latestUploadedRun ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_280px]">
                    <div className="rounded border border-border bg-surface p-3">
                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                        {[
                          ['File name', latestUploadedRun.fileName],
                          ['Technique', latestUploadedRun.technique],
                          ['Sample identity', latestUploadedRun.sampleIdentity],
                          ['Evidence quality', latestUploadedRun.evidenceQuality.label],
                          ['Locked source context', 'Source context was preserved during analysis.'],
                          ['Experiment conditions', `${conditionLockStatus}; explicit attachment required for uploaded runs.`],
                          ['Beta limitation', 'Uploaded-data interpretation is beta-limited and bounded by current evidence coverage.'],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded border border-border bg-background p-2">
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
                            <div className="mt-1 text-text-main">{value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded border border-border bg-background p-2">
                        <div className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">Extracted features</div>
                        <div className="mt-1 text-xs text-text-main">
                          {latestUploadedRun.extractedFeatures.length > 0
                            ? latestUploadedRun.extractedFeatures.slice(0, 5).map((feature) => feature.label).join('; ')
                            : INSUFFICIENT_EVIDENCE_MESSAGE}
                        </div>
                      </div>
                      <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/5 p-2">
                        <div className="text-[9px] font-semibold uppercase tracking-wider text-amber-700">Claim boundary</div>
                        <div className="mt-1 text-xs leading-relaxed text-text-main">
                          {[...latestUploadedRun.claimBoundary, ...conditionBoundaryNotes.slice(0, 2)].join(' ')}
                        </div>
                      </div>
                    </div>
                    <div className="rounded border border-border bg-surface p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Handoff status</div>
                      <div className={`mt-2 text-sm font-bold ${handoffPrepared ? 'text-emerald-600' : 'text-text-main'}`}>
                        {handoffPrepared ? 'Notebook entry prepared' : 'Preview ready'}
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
                        This preview packages upload-derived signal evidence for the existing Notebook/Report flow without mixing in canonical demo evidence.
                      </p>
                      <ul className="mt-3 space-y-1 text-[10px] leading-relaxed text-text-muted">
                        <li>File name: {latestUploadedRun.fileName}</li>
                        <li>Locked context: {latestUploadedRun.lockedContext.referenceScope}</li>
                        <li>Features: {latestUploadedRun.extractedFeatures.length}</li>
                        <li>Evidence gate: {latestUploadedRun.evidenceQuality.label}</li>
                        <li>Experiment conditions: {conditionLockStatus}</li>
                        <li>Limitations retained for report/export review.</li>
                      </ul>
                      <Link to={`/notebook?project=${project.id}&source=uploaded-beta&template=analytical`}>
                        <Button variant="outline" size="sm" className="mt-3 w-full gap-1.5">
                          <BookOpen size={13} /> Continue to Notebook
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-text-muted">
                    Confirm context and analyze an uploaded signal to prepare a report-ready preview.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-background p-3">
                <h3 className="text-xs font-bold text-text-main">Multi-technique public-beta coverage</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-border text-left text-text-muted">
                        <th className="py-2 pr-3 font-semibold">Technique</th>
                        <th className="py-2 pr-3 font-semibold">Evidence role</th>
                        <th className="py-2 pr-3 font-semibold">Current status</th>
                        <th className="py-2 pr-3 font-semibold">Boundary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {uploadMatrixRows.map((row) => (
                        <tr key={row.technique}>
                          <td className="py-2 pr-3 font-bold text-text-main">{row.technique}</td>
                          <td className="py-2 pr-3 text-text-muted">{row.evidenceRole}</td>
                          <td className="py-2 pr-3">
                            <span className={`rounded px-2 py-0.5 font-semibold ${
                              row.status === 'Uploaded'
                                ? 'bg-emerald-500/10 text-emerald-700'
                                : row.status === 'Context required'
                                ? 'bg-amber-500/10 text-amber-700'
                                : 'bg-surface-hover text-text-muted'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 pr-3 leading-relaxed text-text-muted">{row.boundary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {uploadedRuns.length > 0 && (
                  <div className="mt-3 rounded border border-border bg-surface p-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Saved beta uploads</div>
                    <p className="mt-1 text-[10px] text-text-muted">{uploadStorageStatus.message}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {uploadedRuns.slice(0, 4).map((run) => (
                        <span key={run.id} className="rounded border border-border bg-background px-2 py-1 text-[10px] text-text-muted">
                          {run.technique} - {run.fileName} - {formatUploadedRunTime(run.createdAt)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </Card>

        {/* Main 2-column layout: Left (2x2 graphs) | Right (vertical sections) */}
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left Panel: 2x2 synchronized evidence grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(['XRD', 'Raman', 'XPS', 'FTIR'] as Technique[]).map((technique) => {
                const techniqueDatasets = getDatasetsByTechnique(project.id, technique);
                const dataset = techniqueDatasets[0];
                const techniqueEvidence = demoEvidenceItems.filter((e) => e.technique === technique);
                const isActive = activeTechniques.has(technique);

                return (
                  <Card key={technique} className={`overflow-hidden transition-opacity ${!isActive ? 'opacity-40' : ''}`}>
                    <div className="border-b border-border bg-surface-hover/40 px-2 py-1.5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold text-text-main">{technique}</h2>
                        <Link to={getWorkspaceRoute(project, technique, dataset?.id)}>
                          <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] px-2">
                            Open <ArrowRight size={10} />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    {isActive && (
                      <div className="p-1.5">
                        <div className="h-24 rounded-md border border-border bg-background p-1">
                          <Graph
                            type={technique.toLowerCase() as 'xrd' | 'xps' | 'ftir' | 'raman'}
                            height="100%"
                            externalData={dataset?.dataPoints}
                            showCalculated={false}
                            showResidual={false}
                            showLegend={false}
                            peakMarkers={getGraphHighlights(technique).map((h) => ({
                              position: h.position,
                              intensity: h.intensity,
                              label: h.role === 'selected' ? h.label : undefined,
                            }))}
                          />
                        </div>
                        
                        {/* Evidence items for this technique */}
                        <div className="mt-1 max-h-14 space-y-1 overflow-y-auto">
                          {techniqueEvidence.map((evidence) => {
                            const isHighlighted = isEvidenceHighlighted(evidence.id);
                            const isSelected = selectedEvidenceId === evidence.id;
                            const isLinkedToClaim = selectedClaimId && isEvidenceRelatedToClaim(evidence.id, selectedClaimId);
                            
                            return (
                              <div
                                key={evidence.id}
                                onClick={() => handleEvidenceClick(evidence.id)}
                                onMouseEnter={() => handleEvidenceHover(evidence.id)}
                                onMouseLeave={() => handleEvidenceHover(null)}
                                className={`cursor-pointer rounded-md border px-1.5 py-1 text-[9px] leading-snug transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary font-semibold shadow-md'
                                    : isLinkedToClaim
                                    ? 'border-cyan/60 bg-cyan/5 text-cyan'
                                    : isHighlighted
                                    ? 'border-primary/30 bg-primary/5 text-text-main'
                                    : 'border-border bg-background text-text-muted hover:border-primary/40'
                                }`}
                              >
                                {evidence.description}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Vertical sections */}
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {/* Scientific Interpretation */}
            <Card className="p-3">
              <h2 className="mb-2 text-xs font-bold text-text-main">Characterization Interpretation</h2>
              <div className="space-y-2">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-primary">Interpretation</div>
                  <p className="mt-1 text-[10px] leading-relaxed text-text-main">
                    {reviewOutput?.conclusion || 'Linked XRD, Raman, and FTIR evidence supports a spinel-ferrite working interpretation, while XPS surface-state validation remains under review.'}
                  </p>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-primary">Supporting Data</div>
                  <ul className="mt-1 space-y-0.5 text-[9px] text-text-muted">
                    {reviewOutput ? (
                      reviewOutput.basis.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex gap-1">
                          <span className="text-primary">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex gap-1">
                          <span className="text-primary">•</span>
                          <span>Raman: A₁g at 690 cm⁻¹</span>
                        </li>
                        <li className="flex gap-1">
                          <span className="text-primary">•</span>
                          <span>XRD: Spinel at 30.1° 2θ</span>
                        </li>
                        <li className="flex gap-1">
                          <span className="text-primary">•</span>
                          <span>FTIR: M-O at 580 cm⁻¹</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-primary">Limitation</div>
                  <ul className="mt-1 space-y-0.5 text-[9px] text-text-muted">
                    {reviewOutput ? (
                      reviewOutput.limitations.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="flex gap-1">
                          <span className="text-primary">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex gap-1">
                          <span className="text-primary">•</span>
                          <span>XRD bulk-averaged; surface may differ</span>
                        </li>
                        <li className="flex gap-1">
                          <span className="text-primary">•</span>
                          <span>Cation distribution not resolved</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-primary">Claim Boundary</div>
                  <p className="mt-1 text-[10px] font-semibold text-text-main">
                    {reviewOutput?.decision || 'Use spinel ferrite assignment as a working interpretation; phase purity and surface-state claims remain validation-limited.'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Interpretation Basis */}
            <Card className="p-3">
              <h2 className="mb-2 text-xs font-bold text-text-main">Interpretation Basis</h2>
              <div className="space-y-2">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-primary">Assignment</div>
                  <div className="mt-1 rounded-md border border-border bg-background p-1.5 text-[10px] text-text-main">
                    {selectedClaim?.title || selectedEvidence?.claimId === 'spinel-ferrite' 
                      ? 'Spinel ferrite structure supported by convergent evidence'
                      : 'The selected evidence set is consistent with ferrite spinel interpretation'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-primary">Observations</div>
                  <div className="mt-1 space-y-1">
                    {selectedEvidence ? (
                      <div className="rounded-md border border-border bg-background p-1.5 text-[9px]">
                        <div className="font-semibold text-primary">{selectedEvidence.technique}</div>
                        <div className="mt-0.5 text-text-muted">{selectedEvidence.description}</div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-md border border-border bg-background p-1.5 text-[9px] text-text-muted">
                          <span className="font-semibold text-text-main">XRD:</span> Phase-reflection context
                        </div>
                        <div className="rounded-md border border-border bg-background p-1.5 text-[9px] text-text-muted">
                          <span className="font-semibold text-text-main">Raman:</span> Lattice-vibration context
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {linkedEvidence.length > 0 && (
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-primary">Linked</div>
                    <div className="mt-1 space-y-1">
                      {linkedEvidence.slice(0, 2).map((evidence) => (
                        <div key={evidence.id} className="rounded-md border border-cyan/40 bg-cyan/5 p-1.5 text-[9px]">
                          <div className="font-semibold text-cyan">{evidence.technique}</div>
                          <div className="mt-0.5 text-text-muted">{evidence.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-primary">Cross-check</div>
                  <div className="mt-1 rounded-md border border-border bg-background p-1.5 text-[9px] text-text-muted">
                    {linkedEvidence.length > 0
                      ? `${linkedEvidence.length} technique${linkedEvidence.length === 1 ? '' : 's'} provide corroborating evidence`
                      : 'Complementary structural and vibrational information'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Cross-Technique Insights */}
            <Card className="p-3">
              <h2 className="mb-2 text-xs font-bold text-text-main">Cross-Technique Insights</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-1.5 text-left font-semibold text-text-main">Assignment</th>
                      {(['XRD', 'Raman', 'XPS', 'FTIR'] as Technique[]).map((technique) => (
                        <th key={technique} className="p-1.5 text-center font-semibold text-text-main">
                          {technique}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {demoClaims.slice(0, 3).map((claim) => {
                      const isClaimSelected = selectedClaimId === claim.id;
                      
                      return (
                        <tr
                          key={claim.id}
                          className={`transition-colors ${
                            isClaimSelected ? 'bg-primary/10' : 'hover:bg-surface-hover/40'
                          }`}
                        >
                          <td 
                            className="p-1.5 cursor-pointer"
                            onClick={() => handleClaimRowClick(claim.id)}
                          >
                            <div className="text-[9px] font-semibold text-text-main">{claim.title}</div>
                          </td>
                          {(['XRD', 'Raman', 'XPS', 'FTIR'] as Technique[]).map((technique) => {
                            const cell = getMatrixCell(claim.id, technique);
                            const isActiveTechnique = selectedClaimId === claim.id && cell?.evidenceId === selectedEvidenceId;

                            return (
                              <td key={technique} className="p-1.5 text-center">
                                {cell ? (
                                  <div
                                    onClick={() => handleMatrixCellClick(claim.id, technique, cell.evidenceId)}
                                    className={`cursor-pointer rounded border p-1 text-[8px] transition-all ${
                                      isActiveTechnique
                                        ? 'border-primary bg-primary/20 text-primary font-semibold'
                                        : isClaimSelected && cell.evidenceId
                                        ? 'border-cyan bg-cyan/10 text-cyan'
                                        : 'border-border bg-background text-text-muted hover:border-primary/40'
                                    }`}
                                  >
                                    {cell.status}
                                  </div>
                                ) : (
                                  <span className="text-text-muted/50">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Interpretation */}
            <Card className="p-3">
              <h2 className="mb-2 text-xs font-bold text-text-main">Interpretation</h2>
              <div className="space-y-2">
                {demoClaims.slice(0, 2).map((claim) => (
                  <div key={claim.id} className="rounded-lg border border-border p-2">
                    <h3 className="text-[10px] font-bold text-text-main">{claim.title}</h3>
                    {claim.interpretation && (
                      <p className="mt-1 text-[9px] leading-relaxed text-text-muted">{claim.interpretation.slice(0, 120)}...</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Report */}
            <Card className="p-3">
              <h2 className="mb-2 text-xs font-bold text-text-main">Report</h2>
              <div className="space-y-2">
                <div>
                  <h3 className="text-[10px] font-semibold text-primary">Summary</h3>
                  <p className="mt-1 text-[9px] leading-relaxed text-text-muted">
                    Multi-technique characterization of {formatChemicalFormula(project.name)} provides convergent evidence
                    for cubic spinel ferrite structure with mixed Cu/Fe oxidation states.
                  </p>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold text-primary">Evidence by Technique</h3>
                  <div className="mt-1 space-y-1.5">
                    <div>
                      <h4 className="text-[9px] font-semibold text-text-main">XRD</h4>
                      <p className="mt-0.5 text-[8px] text-text-muted">Spinel phase reflections at 2θ = 30.1°, 35.5°, 43.2°, 57.1°</p>
                    </div>
                    <div>
                      <h4 className="text-[9px] font-semibold text-text-main">Raman</h4>
                      <p className="mt-0.5 text-[8px] text-text-muted">A₁g mode at ~690 cm⁻¹ diagnostic of spinel lattice</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end border-t border-border pt-2">
                  <Link to={getNotebookPath(project)}>
                    <Button variant="primary" size="sm" className="gap-1 text-[10px] h-7 px-2">
                      <Save size={10} /> Add to Notebook
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
