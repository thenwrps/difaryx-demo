/**
 * Canonical Demo Scenario
 *
 * Single source of truth for the DIFARYX autonomous agent demo.
 * All demo UI surfaces must consume this object directly.
 * Do not duplicate or hardcode these values elsewhere.
 */

export type DataAvailabilityStatus = 'available' | 'context' | 'required' | 'pending';

export type EvidenceRequirementStatus = 'Complete' | 'Ready' | 'In Progress' | 'Pending' | 'Review';

export interface EvidenceRequirementEntry {
  /** Assignment or finding being evaluated */
  assignment: string;
  /** What evidence is required to support this assignment */
  requiredEvidence: string;
  /** What evidence is currently available */
  availableEvidence: string;
  /** Current status of the evidence for this assignment */
  status: EvidenceRequirementStatus;
  /** Recommended follow-up validation step */
  followUpValidation: string;
}

export interface DataAvailabilityEntry {
  /** Technique identifier (e.g. XRD, Raman, XPS, FTIR) */
  technique: string;
  /** Availability status for this technique in the current demo scenario */
  status: DataAvailabilityStatus;
  /** Short description of how this technique contributes to interpretation */
  useInInterpretation: string;
}

export interface TechniqueMetadata {
  /** What the technique measures or reveals */
  role: string;
  /** Known limitation in the context of this demo */
  limitation: string;
}

export interface CanonicalDemoScenario {
  /** Short project name for display */
  projectName: string;
  /** Unique sample identifier used in the demo run */
  sampleId: string;
  /** Chemical system under investigation */
  materialSystem: string;
  /** Broad material family classification */
  materialClass: string;
  /** Primary characterization technique driving the decision */
  primaryTechnique: string;
  /** Supporting techniques providing corroborating evidence */
  supportingTechniques: string[];
  /** One-sentence characterization goal */
  objective: string;
  /** Expanded context describing why this characterization is performed */
  characterizationPurpose: string;
  /** Ordered list of expected output sections in the generated report */
  expectedOutputSections: string[];
  /** Per-technique role and limitation metadata */
  techniqueMetadata: Record<string, TechniqueMetadata>;
  /** Per-technique data availability for the current demo run */
  dataAvailability: DataAvailabilityEntry[];
  /** Evidence requirements for each assignment or finding */
  evidenceRequirements: EvidenceRequirementEntry[];
}

export const canonicalDemoScenario: CanonicalDemoScenario = {
  projectName: 'CuFe\u2082O\u2084 Spinel Ferrite Characterization',
  sampleId: 'sample_spinel_01',
  materialSystem: 'CuFe\u2082O\u2084-based spinel ferrite catalyst candidate',
  materialClass: 'Spinel ferrite catalyst candidate',
  primaryTechnique: 'XRD',
  supportingTechniques: ['Raman', 'XPS', 'FTIR'],
  objective:
    'Determine whether the available XRD-centered characterization data are consistent '
    + 'with a cubic spinel ferrite assignment for the CuFe\u2082O\u2084-based catalyst candidate.',
  characterizationPurpose:
    'Structured phase and evidence review for spinel ferrite characterization.',
  expectedOutputSections: [
    'Characterization Overview',
    'Supporting Data',
    'Cross-Technique Insights',
    'Interpretation',
    'Conclusion',
    'Limitations and Follow-up Validation',
  ],
  techniqueMetadata: {
    XRD: {
      role: 'Long-range crystal structure and phase assignment.',
      limitation: 'Cannot confirm surface oxidation state.',
    },
    Raman: {
      role: 'Local symmetry and vibrational fingerprint.',
      limitation: 'Does not replace full phase refinement.',
    },
    XPS: {
      role: 'Surface oxidation state and chemical environment.',
      limitation: 'Surface-sensitive and not sufficient alone for bulk stoichiometry.',
    },
    FTIR: {
      role: 'Bonding and surface functional context.',
      limitation: 'Contextual rather than definitive for spinel assignment.',
    },
  },
  dataAvailability: [
    {
      technique: 'XRD',
      status: 'available',
      useInInterpretation: 'Primary structural assignment',
    },
    {
      technique: 'Raman',
      status: 'context',
      useInInterpretation: 'Local symmetry and vibrational fingerprint',
    },
    {
      technique: 'XPS',
      status: 'required',
      useInInterpretation: 'Oxidation-state validation',
    },
    {
      technique: 'FTIR',
      status: 'context',
      useInInterpretation: 'Bonding and surface functional context',
    },
  ],
  evidenceRequirements: [
    {
      assignment: 'Cubic spinel ferrite structure',
      requiredEvidence: 'XRD peak positions consistent with spinel reflections',
      availableEvidence: 'XRD peak set available',
      status: 'Complete',
      followUpValidation: 'Rietveld refinement or reference-pattern matching',
    },
    {
      assignment: 'Phase purity',
      requiredEvidence: 'Absence of major secondary phase peaks',
      availableEvidence: 'No major secondary peaks observed in the demo XRD pattern',
      status: 'Ready',
      followUpValidation: 'Higher-resolution XRD or TEM inspection',
    },
    {
      assignment: 'Local spinel symmetry',
      requiredEvidence: 'Raman active modes consistent with spinel ferrite',
      availableEvidence: 'Raman context available',
      status: 'Ready',
      followUpValidation: 'Raman peak fitting',
    },
    {
      assignment: 'Surface oxidation state',
      requiredEvidence: 'Fe/Cu oxidation states from XPS',
      availableEvidence: 'XPS required',
      status: 'Pending',
      followUpValidation: 'XPS Fe 2p / Cu 2p deconvolution',
    },
    {
      assignment: 'Bulk-surface consistency',
      requiredEvidence: 'Agreement between bulk XRD assignment and surface XPS chemistry',
      availableEvidence: 'XRD-centered assignment available; XPS still required',
      status: 'In Progress',
      followUpValidation: 'Cross-check XRD phase assignment with XPS oxidation-state analysis',
    },
    {
      assignment: 'Bonding / surface context',
      requiredEvidence: 'FTIR signatures for bonding or surface groups',
      availableEvidence: 'FTIR context available',
      status: 'Ready',
      followUpValidation: 'Compare before/after synthesis or treatment',
    },
    {
      assignment: 'Final structural assignment',
      requiredEvidence: 'Convergent XRD + Raman + XPS support',
      availableEvidence: 'XRD-centered support with pending surface validation',
      status: 'In Progress',
      followUpValidation: 'Add XPS validation before final assignment',
    },
  ],
};
