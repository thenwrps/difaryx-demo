import React, { useState } from 'react';
import { CheckCircle2, Send, XCircle } from 'lucide-react';
import { DataAvailabilityPanel } from '../../demo/DataAvailabilityPanel';
import { TechniqueCoveragePanel } from '../../demo/TechniqueCoveragePanel';
import { EvidenceRequirementsTable } from '../../demo/EvidenceRequirementsTable';
import { CharacterizationObjectiveCard } from '../../demo/CharacterizationObjectiveCard';
import { SampleContextCard } from '../../demo/SampleContextCard';
import { ExecutionStepItem } from '../CenterColumn/ExecutionStepItem';
import { LockedScientificContext } from '../../locked-context/LockedScientificContext';
import { getLockedContext } from '../../../data/lockedContext';
import {
  type ExperimentConditionLock,
  getConditionBoundaryNotes,
  getConditionLockStatusLabel,
  getLatestExperimentConditionLock,
} from '../../../data/experimentConditionLock';

// Inline chemical formula utility
function formatChemicalFormula(input: string): React.ReactNode {
  if (!input) return input;

  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < input.length) {
    const chargeMatch = input.slice(i).match(/^(\^?)(\d+)([+-])/);
    if (chargeMatch) {
      const [full, caret, number, sign] = chargeMatch;
      parts.push(<sup key={key++}>{number}{sign}</sup>);
      i += full.length;
      continue;
    }

    const parenMatch = input.slice(i).match(/^\(([^)]+)\)(\d+)/);
    if (parenMatch) {
      const [full, content, subscript] = parenMatch;
      parts.push('(');
      parts.push(formatChemicalFormula(content));
      parts.push(')');
      parts.push(<sub key={key++}>{subscript}</sub>);
      i += full.length;
      continue;
    }

    const phaseMatch = input.slice(i).match(/^\((s|l|g|aq)\)/);
    if (phaseMatch) {
      parts.push(phaseMatch[0]);
      i += phaseMatch[0].length;
      continue;
    }

    const subscriptMatch = input.slice(i).match(/^([A-Z][a-z]?)(\d+)/);
    if (subscriptMatch) {
      const [full, element, number] = subscriptMatch;
      parts.push(element);
      parts.push(<sub key={key++}>{number}</sub>);
      i += full.length;
      continue;
    }

    const elementMatch = input.slice(i).match(/^[A-Z][a-z]?/);
    if (elementMatch) {
      parts.push(elementMatch[0]);
      i += elementMatch[0].length;
      continue;
    }

    parts.push(input[i]);
    i++;
  }

  return <>{parts}</>;
}

type TabType = 'thinking' | 'evidence' | 'context' | 'parameters' | 'logs';

const RIGHT_PANEL_TABS: Array<{ key: TabType; label: string }> = [
  { key: 'thinking', label: 'Goal' },
  { key: 'evidence', label: 'Evidence Review' },
  { key: 'context', label: 'Claim Boundary' },
  { key: 'parameters', label: 'Parameters' },
  { key: 'logs', label: 'Reasoning Trace' },
];

interface CandidateData {
  phase: string;
  peakAlignment: string;
  structuralFit: string;
  completeness: string;
  evaluation: string;
  result: 'Match' | 'Rejected';
  reason?: string;
}

interface ExecutionStep {
  number: number;
  title: string;
  description: string;
  tool: string;
  time: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

interface RightPanelProps {
  technique?: string;
  projectName?: string;
  projectId?: string;
  activeTab?: TabType;
  currentStep: number;
  totalSteps: number;
  reasoningStream?: any;
  candidates?: CandidateData[];
  executionSteps?: ExecutionStep[];
  progressPercent?: number;
  onTabChange?: (tab: TabType) => void;
  onPromptSubmit?: (prompt: string) => void;
  /** Processing result ID from URL query param, used to show source processing context */
  processingResultId?: string | null;
}

function getScientificSummary(technique: string) {
  switch (technique) {
    case 'XRD':
      return {
        title: 'STRUCTURAL IDENTITY',
        blocks: [
          {
            label: 'Crystal Structure',
            content: 'Cubic spinel structure (Fd-3m space group) is supported by characteristic (220), (311), (400), (511), and (440) reflections. Lattice parameter a ~ 8.38 A remains consistent with an inverse spinel interpretation.',
          },
          {
            label: 'Evidence',
            content: 'Primary reflections at 2theta = 30.1, 35.5, 43.2, 57.1, and 62.7 degrees match the ICDD reference within +/-0.15 degrees. Intensity ratios I(311)/I(220) = 2.8 and I(440)/I(511) = 0.6 support the working cation-distribution model.',
          },
          {
            label: 'Interpretation',
            content: 'Sharp, well-resolved peaks indicate crystalline structure, with crystallite size estimated near 35 nm from Scherrer analysis. No secondary oxide phase is assigned from this demo pattern; publication-level phase-purity claims require additional validation.',
          },
        ],
        claimStatus: 'strongly_supported',
      };
    case 'FTIR':
      return {
        title: 'BONDING ENVIRONMENT',
        blocks: [
          {
            label: 'Vibrational Features',
            content: 'Tetrahedral site ν₁(M-O) at 585 cm⁻¹ and octahedral site ν₂(M-O) at 420 cm⁻¹ characteristic of spinel ferrites. Weak shoulder at 1050 cm⁻¹ indicates Si-O-Si from support.',
          },
          {
            label: 'Evidence',
            content: 'Fe-O stretching frequency ratio ν₁/ν₂ = 1.39 is consistent with inverse spinel context. Cu²⁺-O band at 610 cm⁻¹ supports copper incorporation in octahedral sites. No dominant CuO signature is observed at 530 cm⁻¹.',
          },
          {
            label: 'Interpretation',
            content: 'Cation-distribution interpretation remains validation-limited. Surface hydroxyl groups (3400 cm⁻¹) suggest possible catalytic-site context. Support interaction requires review.',
          },
        ],
        claimStatus: 'supported',
      };
    case 'Raman':
      return {
        title: 'LATTICE DYNAMICS',
        blocks: [
          {
            label: 'Raman Modes',
            content: 'Five active modes observed: A₁g (690 cm⁻¹), Eg (340 cm⁻¹), and three T₂g modes (210, 475, 620 cm⁻¹). Mode positions consistent with Fd-3m symmetry and Cu-Fe cation ordering.',
          },
          {
            label: 'Evidence',
            content: 'A₁g symmetric breathing mode at 690 cm⁻¹ (vs. 670 cm⁻¹ for Fe₃O₄) indicates possible Cu substitution effect. T₂g mode splitting (Δν = 145 cm⁻¹) supports octahedral site distortion from Jahn-Teller Cu²⁺.',
          },
          {
            label: 'Interpretation',
            content: 'Sharp linewidths (FWHM < 25 cm⁻¹) indicate long-range structural order. Absence of D-band (1350 cm⁻¹) rules out carbon contamination. Lattice dynamics support inverse spinel assignment.',
          },
        ],
        claimStatus: 'strongly_supported',
      };
    case 'XPS':
      return {
        title: 'CHEMICAL STATE',
        blocks: [
          {
            label: 'Oxidation States',
            content: 'Cu 2p₃/₂ at 933.8 eV with satellite at 942 eV supports Cu²⁺ surface context. Fe 2p₃/₂ suggests mixed Fe³⁺ (711.2 eV) and Fe²⁺ (709.4 eV) with 3:1 ratio. O 1s deconvolution suggests lattice oxygen (530.1 eV) and surface hydroxyl (531.8 eV).',
          },
          {
            label: 'Evidence',
            content: 'Cu²⁺/Cu⁺ ratio from Auger parameter analysis. Fe³⁺/Fe²⁺ = 2.8 consistent with inverse spinel stoichiometry. Surface enrichment factor Cu(surface)/Cu(bulk) = 1.3 indicates preferential surface segregation.',
          },
          {
            label: 'Interpretation',
            content: 'Surface composition Cu₁.₃Fe₁.₇O₄ vs. bulk CuFe₂O₄ suggests possible reconstruction. Absence of metallic Cu (932.5 eV) supports oxide-stability context. Hydroxyl coverage θ_OH = 0.4 ML indicates hydrated surface context for catalysis.',
          },
        ],
        claimStatus: 'supported',
      };
    default:
      return {
        title: 'GENERAL MATERIAL SUMMARY',
        blocks: [
          {
            label: 'Observation',
            content: 'Multi-technique evidence indicates consistent material behavior',
          },
          {
            label: 'Interpretation',
            content: 'No major conflicting signals detected',
          },
        ],
        claimStatus: 'supported',
      };
  }
}

type TechniqueReasoning = {
  evidenceReview: Array<{ label: string; body: string }>;
  supportingBullets: Array<{ label: string; body: string }>;
  supportingInterpretation: string;
  interpretationParagraphs: Array<{ label: string; body: string }>;
  interpretationFooter: string;
  reportTitle: string;
  reportBullets: Array<{ label: string; body: string; key: string }>;
  reportValidation: string;
  timeline: Array<{ timestamp: string; level: 'info' | 'success' | 'warning'; message: string; details: string }>;
};

function getTechniqueReasoning(technique: string): TechniqueReasoning {
  switch (technique) {
    case 'Raman':
      return {
        evidenceReview: [
          { label: 'Mode position matching:', body: 'Compare observed Raman shift to reference mode positions. Structural relation requires Δν ≤ 4 cm⁻¹ (instrumental resolution limit). Current: A₁g, Eg, and three T₂g modes support local spinel symmetry.' },
          { label: 'Linewidth / FWHM review:', body: 'Sharp linewidths (FWHM < 25 cm⁻¹) indicate long-range vibrational order. Broadened modes flag structural disorder. Current: all modes within expected FWHM range.' },
          { label: 'Mode completeness check:', body: 'Verify presence of all expected vibrational bands for the candidate phase. Missing modes require validation. Current: 5/5 expected active modes observed.' },
        ],
        supportingBullets: [
          { label: 'Band position matching:', body: 'Major vibrational bands align within ±2 cm⁻¹ of reference, supports local spinel symmetry.' },
          { label: 'Symmetry coverage:', body: 'A₁g, Eg, and T₂g modes all observed, consistent with Fd-3m local symmetry.' },
          { label: 'Unassigned features:', body: 'No dominant carbon D-band (1350 cm⁻¹); weak shoulders remain below assignment threshold.' },
        ],
        supportingInterpretation: 'Vibrational fingerprint supports the structural assignment. Cross-technique context (XRD + XPS) reinforces the interpretation.',
        interpretationParagraphs: [
          { label: 'Vibrational consistency:', body: 'Observed mode positions (A₁g ~ 690 cm⁻¹; T₂g split Δν ≈ 145 cm⁻¹) align with reference spinel ferrite within instrumental resolution. T₂g splitting supports octahedral site distortion.' },
          { label: 'Structural fingerprint:', body: 'Mode linewidths remain below 25 cm⁻¹ FWHM, indicating long-range vibrational order. No D-band at 1350 cm⁻¹ rules out carbonaceous contamination.' },
          { label: 'Alternative hypotheses:', body: 'Fe₃O₄ magnetite rejected — A₁g at ~670 cm⁻¹ would shift the breathing mode. α-Fe₂O₃ hematite rejected — absent 225/245 cm⁻¹ A₁g doublet. CuO tenorite rejected — missing 295/340/620 cm⁻¹ signature.' },
        ],
        interpretationFooter: 'Compared mode positions against bundled reference context. Cross-technique convergence supports the assignment with validation requirements.',
        reportTitle: 'Local spinel symmetry supported by Raman fingerprint',
        reportBullets: [
          { key: 'mode-alignment', label: 'Vibrational match:', body: 'A₁g, Eg, and T₂g modes present with expected positions' },
          { key: 'symmetry', label: 'Symmetry coverage:', body: 'Fd-3m mode count satisfied (5/5 active modes observed)' },
          { key: 'cross-tech', label: 'Cross-technique convergence:', body: 'XRD reflections and XPS oxidation envelope provide supporting context' },
          { key: 'literature', label: 'Supporting literature:', body: 'Reference Raman studies (2021-2023) match observed mode positions within ±2 cm⁻¹' },
        ],
        reportValidation: 'Priority 1: Polarization-dependent Raman to confirm mode symmetry. Priority 2: Temperature-dependent Raman to probe cation ordering.',
        timeline: [
          { timestamp: '00:00.123', level: 'info', message: 'Initialized structural fingerprint workflow', details: 'Loaded Raman spectrum (1024 points) and cross-technique context.' },
          { timestamp: '00:00.456', level: 'info', message: 'Raman preprocessing prepared', details: 'Baseline correction (asymmetric least squares), Savitzky-Golay smoothing (window=9), cosmic-ray removal.' },
          { timestamp: '00:01.234', level: 'success', message: 'Detected 5 active vibrational bands', details: 'Band positions (cm⁻¹): 210, 340, 475, 620, 690. Average FWHM = 18 cm⁻¹.' },
          { timestamp: '00:01.567', level: 'info', message: 'Mode-assignment review initiated', details: 'Checking deterministic spinel-mode reference for A₁g, Eg, and T₂g assignments.' },
          { timestamp: '00:02.891', level: 'success', message: 'Retrieved candidate mode sets', details: 'Filtered by composition and expected active-mode count for Fd-3m symmetry.' },
          { timestamp: '00:03.234', level: 'info', message: 'Mode matching in progress', details: 'Evaluating CuFe₂O₄ (spinel), Fe₃O₄ (magnetite), α-Fe₂O₃ (hematite), CuO (tenorite).' },
          { timestamp: '00:04.567', level: 'success', message: 'Top candidate identified: CuFe₂O₄', details: 'Mode-position relation and symmetry completeness criterion met.' },
          { timestamp: '00:04.789', level: 'warning', message: 'Weak shoulder flagged', details: 'Low-intensity shoulder near 1050 cm⁻¹ remains below assignment threshold; flagged for validation.' },
          { timestamp: '00:05.123', level: 'info', message: 'Claim boundary prepared', details: 'Local symmetry supported; quantitative cation distribution remains validation-limited.' },
        ],
      };
    case 'FTIR':
      return {
        evidenceReview: [
          { label: 'Band position matching:', body: 'Compare observed wavenumber to reference absorption bands. Bonding relation requires Δν ≤ 10 cm⁻¹ (instrumental resolution limit). Current: tetrahedral ν₁(M-O) and octahedral ν₂(M-O) bands support spinel-type bonding.' },
          { label: 'Intensity ratio review:', body: 'ν₁/ν₂ ratio compared to reference inverse spinel context. Current: ν₁/ν₂ = 1.39 remains consistent with the working model.' },
          { label: 'Baseline integrity check:', body: 'Verify baseline correction preserves low-intensity features without introducing artifacts. Current: baseline residual ≤ 2% transmittance.' },
        ],
        supportingBullets: [
          { label: 'Band position matching:', body: 'ν₁ and ν₂ M-O absorption bands align within ±5 cm⁻¹ of reference, supports metal-oxygen bonding.' },
          { label: 'Functional-group context:', body: 'Surface hydroxyl band at ~3400 cm⁻¹ and Si-O-Si at ~1050 cm⁻¹ provide support/surface context.' },
          { label: 'Unassigned features:', body: 'No dominant CuO signature at 530 cm⁻¹; minor shoulders remain below assignment threshold.' },
        ],
        supportingInterpretation: 'Bonding environment supports the structural assignment. Cross-technique context (XRD + Raman) reinforces the interpretation.',
        interpretationParagraphs: [
          { label: 'Bonding consistency:', body: 'Tetrahedral ν₁(M-O) at ~585 cm⁻¹ and octahedral ν₂(M-O) at ~420 cm⁻¹ align with reference spinel ferrite within instrumental resolution (±4 cm⁻¹).' },
          { label: 'Functional-group screening:', body: 'Surface hydroxyl (3400 cm⁻¹) and Si-O-Si (1050 cm⁻¹) features contextualize support interaction; phase purity remains validation-limited.' },
          { label: 'Alternative hypotheses:', body: 'CuO tenorite rejected — absent dominant 530 cm⁻¹ signature. Fe₃O₄ magnetite rejected — expected 570/390 cm⁻¹ band positions do not match observed maxima. Cu₂O cuprite rejected — missing 620 cm⁻¹ mode.' },
        ],
        interpretationFooter: 'Compared band positions against bundled reference context. Cross-technique convergence supports the assignment with validation requirements.',
        reportTitle: 'Metal-oxygen bonding environment supported by FTIR',
        reportBullets: [
          { key: 'mode-alignment', label: 'Bonding match:', body: 'ν₁/ν₂ M-O absorption bands present at spinel-ferrite positions' },
          { key: 'symmetry', label: 'Functional-group context:', body: 'Surface hydroxyl and Si-O-Si support/surface bands observed' },
          { key: 'cross-tech', label: 'Cross-technique convergence:', body: 'XRD reflections and Raman A₁g mode provide supporting structural context' },
          { key: 'literature', label: 'Supporting literature:', body: 'Reference FTIR studies (2021-2023) match observed M-O band positions within ±5 cm⁻¹' },
        ],
        reportValidation: 'Priority 1: DRIFTS to separate surface vs. bulk bonding context. Priority 2: Temperature-programmed FTIR to probe surface hydroxyl thermodynamics.',
        timeline: [
          { timestamp: '00:00.123', level: 'info', message: 'Initialized bonding analysis workflow', details: 'Loaded FTIR spectrum (ATR mode, 400–4000 cm⁻¹) and cross-technique context.' },
          { timestamp: '00:00.456', level: 'info', message: 'FTIR preprocessing prepared', details: 'Rubber-band baseline correction (64 points), Savitzky-Golay smoothing (window=11), atmospheric compensation.' },
          { timestamp: '00:01.234', level: 'success', message: 'Detected 5 absorption bands above threshold', details: 'Band positions (cm⁻¹): 420, 585, 610, 1050, 3400. Average FWHM = 32 cm⁻¹.' },
          { timestamp: '00:01.567', level: 'info', message: 'Band-assignment review initiated', details: 'Checking deterministic metal-oxygen reference for ν₁/ν₂ and support-matrix assignments.' },
          { timestamp: '00:02.891', level: 'success', message: 'Retrieved candidate bonding contexts', details: 'Filtered by composition and expected M-O band window for tetrahedral/octahedral sites.' },
          { timestamp: '00:03.234', level: 'info', message: 'Bonding matching in progress', details: 'Evaluating CuFe₂O₄ (spinel), Fe₃O₄ (magnetite), CuO (tenorite), Cu₂O (cuprite).' },
          { timestamp: '00:04.567', level: 'success', message: 'Top candidate identified: CuFe₂O₄', details: 'Band-position relation and intensity-ratio criterion met.' },
          { timestamp: '00:04.789', level: 'warning', message: 'Weak shoulder flagged', details: 'Low-intensity shoulder near 530 cm⁻¹ remains below CuO assignment threshold; flagged for validation.' },
          { timestamp: '00:05.123', level: 'info', message: 'Claim boundary prepared', details: 'Bonding environment supported; quantitative phase purity remains validation-limited.' },
        ],
      };
    case 'XPS':
      return {
        evidenceReview: [
          { label: 'Binding-energy matching:', body: 'Compare observed core-level BE to reference values. Chemical-state relation requires ΔBE ≤ 0.2 eV (instrumental resolution limit). Current: Cu 2p₃/₂, Fe 2p₃/₂, and O 1s support the surface-chemistry context.' },
          { label: 'Spin-orbit / satellite review:', body: 'Verify Cu 2p₃/₂ shake-up satellite (~942 eV) for Cu²⁺; check Fe 2p spin-orbit splitting. Current: satellite present and Δ(2p₃/₂-2p₁/₂) ≈ 13.6 eV supports Fe³⁺/Fe²⁺ mixture.' },
          { label: 'Fit completeness check:', body: 'Verify residual of component fit across the sampled core levels. Current: fit residual within 3% of intensity; Cu 2p, Fe 2p, and O 1s components resolved.' },
        ],
        supportingBullets: [
          { label: 'Core-level matching:', body: 'Cu 2p₃/₂ at 933.8 eV and Fe 2p₃/₂ components match reference oxidation-state library within ±0.2 eV.' },
          { label: 'Surface chemistry context:', body: 'O 1s deconvolution separates lattice oxygen (530.1 eV) and surface hydroxyl (531.8 eV) components.' },
          { label: 'Fit quality:', body: 'Component fitting residual remains below 3% across Cu 2p, Fe 2p, and O 1s windows.' },
        ],
        supportingInterpretation: 'Surface oxidation-state envelope supports the phase assignment. Cross-technique context (XRD + Raman) reinforces the interpretation; surface vs. bulk disparity remains validation-limited.',
        interpretationParagraphs: [
          { label: 'Oxidation-state consistency:', body: 'Cu 2p₃/₂ at 933.8 eV with satellite at ~942 eV supports Cu²⁺. Fe 2p₃/₂ deconvolution shows Fe³⁺ (711.2 eV) and Fe²⁺ (709.4 eV) with ~3:1 ratio consistent with inverse spinel stoichiometry.' },
          { label: 'Surface vs. bulk boundary:', body: 'XPS samples ~5 nm depth; Cu/Fe surface ratio = 0.76 (vs. nominal bulk 0.50) indicates preferential surface segregation. Bulk composition remains validation-limited.' },
          { label: 'Alternative hypotheses:', body: 'Cu⁺ rejected — satellite feature at 942 eV incompatible with Cu⁺ (no shake-up). Pure Fe₃O₄ rejected — expected Fe²⁺/Fe³⁺ = 1:2 not matched. CuO-dominated surface rejected — Cu LMM Auger parameter inconsistent.' },
        ],
        interpretationFooter: 'Compared binding energies against bundled reference context. Cross-technique convergence supports the assignment with surface-sensitive validation requirements.',
        reportTitle: 'Surface chemistry supported by XPS oxidation envelope',
        reportBullets: [
          { key: 'mode-alignment', label: 'Oxidation-state match:', body: 'Cu 2p₃/₂ with shake-up satellite supports Cu²⁺; Fe 2p envelope supports Fe³⁺/Fe²⁺ mixture' },
          { key: 'symmetry', label: 'Surface chemistry context:', body: 'O 1s lattice vs. hydroxyl components resolved in fit' },
          { key: 'cross-tech', label: 'Cross-technique convergence:', body: 'XRD reflections and Raman A₁g mode provide supporting structural context' },
          { key: 'literature', label: 'Supporting literature:', body: 'Reference XPS studies (2021-2023) match observed Cu 2p / Fe 2p positions within ±0.2 eV' },
        ],
        reportValidation: 'Priority 1: Depth-profiling (Ar⁺ sputter + XPS) to resolve surface vs. bulk disparity. Priority 2: Auger parameter analysis to tighten Cu oxidation-state assignment.',
        timeline: [
          { timestamp: '00:00.123', level: 'info', message: 'Initialized surface chemistry workflow', details: 'Loaded XPS regions (survey + Cu 2p + Fe 2p + O 1s) and cross-technique context.' },
          { timestamp: '00:00.456', level: 'info', message: 'XPS preprocessing prepared', details: 'Shirley background subtraction, charge correction to adventitious C 1s (284.8 eV), Savitzky-Golay smoothing (window=5).' },
          { timestamp: '00:01.234', level: 'success', message: 'Fit 6 core-level components above threshold', details: 'Core-level positions (eV): Cu 2p₃/₂ 933.8, Cu satellite 942.0, Fe 2p₃/₂ 711.2 / 709.4, O 1s 530.1 / 531.8.' },
          { timestamp: '00:01.567', level: 'info', message: 'Oxidation-state review initiated', details: 'Checking deterministic Cu / Fe / O reference library for binding-energy assignments.' },
          { timestamp: '00:02.891', level: 'success', message: 'Retrieved candidate chemical states', details: 'Filtered by composition window and expected satellite features for Cu²⁺ and mixed-valence Fe.' },
          { timestamp: '00:03.234', level: 'info', message: 'Component matching in progress', details: 'Evaluating Cu²⁺/Fe³⁺ inverse spinel, Cu⁺ context, Fe₃O₄ surface, CuO-dominated surface.' },
          { timestamp: '00:04.567', level: 'success', message: 'Top candidate identified: CuFe₂O₄ surface', details: 'Core-level BE relation and satellite-feature criterion met.' },
          { timestamp: '00:04.789', level: 'warning', message: 'Surface vs. bulk disparity flagged', details: 'Cu/Fe surface ratio 0.76 vs. nominal bulk 0.50; flagged for depth-profile validation.' },
          { timestamp: '00:05.123', level: 'info', message: 'Claim boundary prepared', details: 'Surface chemistry supported; bulk composition remains validation-limited.' },
        ],
      };
    case 'XRD':
    default:
      return {
        evidenceReview: [
          { label: 'Position matching:', body: 'Calculate Δ2θ = |θ_obs - θ_ref| for each peak. Structural relation requires Δ2θ ≤ 0.2° (instrumental resolution limit). Current: 7/7 peaks support assignment.' },
          { label: 'Intensity correlation:', body: 'Compute Pearson r between I_obs and I_ref after Lorentz-polarization correction. Strong correlation (r ≥ 0.80) supports structural match. Current: r = 0.87 supports assignment.' },
          { label: 'Completeness check:', body: 'Verify presence of all expected reflections with I/I₀ ≥ 5% from reference. Missing peaks require validation. Current: 18/21 expected peaks observed (85.7% completeness).' },
        ],
        supportingBullets: [
          { label: 'Peak position matching:', body: 'All major reflections align within ±0.15° (2θ) of reference pattern, primary evidence supports structural assignment.' },
          { label: 'Intensity correlation:', body: 'Observed intensity ratios match expected values, supporting evidence reinforces phase identification.' },
          { label: 'Unindexed features:', body: '2 weak peaks (I/I₀ < 2%) at 62.3° and 64.1° require validation but do not contradict primary phase assignment.' },
        ],
        supportingInterpretation: 'Multiple independent evidence streams support the same structural assignment. Cross-technique evidence (XRD + Raman + XPS) provides contextual support for the phase identification.',
        interpretationParagraphs: [
          { label: 'Crystallographic consistency:', body: 'The observed d-spacings (d₃₁₁ = 2.53 Å, d₄₄₀ = 1.48 Å) align with cubic spinel lattice within instrumental resolution (±0.02 Å). Peak intensity ratios deviate <8% from powder diffraction file, suggesting minimal preferred orientation.' },
          { label: 'Phase-purity screening note:', body: 'Integrated intensity analysis across 2θ = 10-80° accounts for 97.3% of total scattering. Residual 2.7% is distributed as background noise rather than dominant secondary phase reflections; phase purity remains validation-limited.' },
          { label: 'Competing hypotheses:', body: 'Fe₃O₄ magnetite rejected due to absence of characteristic (111) reflection at 18.3° and incompatible lattice parameter (a_magnetite = 8.39 Å vs. a_observed = 8.38 Å). CuO tenorite ruled out by missing monoclinic signature at 38.7°.' },
        ],
        interpretationFooter: 'Compared peak positions against bundled reference context. Multi-technique convergence (XRD + Raman + XPS) supports the spinel assignment with validation requirements.',
        reportTitle: 'CuFe₂O₄ inverse spinel phase assignment',
        reportBullets: [
          { key: 'peak-alignment', label: 'Crystallographic match:', body: '7/7 major reflections support Fd-3m assignment, a = 8.38 Å' },
          { key: 'intensity-corr', label: 'Intensity correlation:', body: 'Pearson r = 0.87 vs. reference powder pattern' },
          { key: 'raman-validation', label: 'Spectroscopic convergence:', body: 'Raman A₁g at 690 cm⁻¹ and XPS Cu²⁺ satellite provide cation-ordering context' },
          { key: 'literature-consensus', label: 'Supporting literature:', body: 'Literature context (5 studies, 2021-2023) supports structural parameters' },
        ],
        reportValidation: 'Priority 1: High-resolution TEM to resolve 62.3° anomaly (superlattice vs. impurity). Priority 2: Temperature-dependent XPS to quantify surface reconstruction thermodynamics.',
        timeline: [
          { timestamp: '00:00.123', level: 'info', message: 'Initialized phase identification workflow', details: 'Loaded 3 technique datasets: XRD (3501 points), Raman (1024 points), XPS (2 regions).' },
          { timestamp: '00:00.456', level: 'info', message: 'XRD preprocessing prepared', details: 'Background subtraction (5th order polynomial, R² = 0.998), Kα₂ stripping, Savitzky-Golay smoothing (window=7).' },
          { timestamp: '00:01.234', level: 'success', message: 'Detected 9 peaks above threshold', details: 'Peak positions (2θ): 18.3°, 30.1°, 35.5°, 43.2°, 53.5°, 57.1°, 62.3°, 62.7°, 64.1°. Average FWHM = 0.32°.' },
          { timestamp: '00:01.567', level: 'info', message: 'Bundled reference context review initiated', details: 'Checking deterministic Cu-Fe-O reference context for peak-position relations and validation boundaries.' },
          { timestamp: '00:02.891', level: 'success', message: 'Retrieved 47 candidate phases', details: 'Filtered by composition (Cu:Fe ratio 0.3-0.7) and peak count (≥5 expected reflections in scan range).' },
          { timestamp: '00:03.234', level: 'info', message: 'Phase matching in progress', details: 'Evaluating CuFe₂O₄ (spinel), Fe₃O₄ (magnetite), CuO (tenorite), Cu₂O (cuprite), α-Fe₂O₃ (hematite).' },
          { timestamp: '00:04.567', level: 'success', message: 'Top candidate identified: CuFe₂O₄', details: 'Structural relation: position match, intensity correlation, completeness criterion met.' },
          { timestamp: '00:04.789', level: 'warning', message: 'Unindexed peaks detected', details: '2 weak reflections at 62.3° and 64.1° (I/I₀ < 2%) cannot be assigned to CuFe₂O₄ Fd-3m. Flagged for review.' },
          { timestamp: '00:05.123', level: 'info', message: 'Claim boundary prepared', details: 'Phase assignment supported; quantitative phase purity remains validation-limited.' },
        ],
      };
  }
}

type LiteratureProvider = 'google_scholar_proxy' | 'semantic_scholar' | 'crossref' | 'mock';

interface LiteraturePaper {
  title: string;
  authors: string;
  year: string;
  source: string;
  relevance: string;
  keyEvidence: string;
  consistencyCheck: string;
  impactOnDecision: string;
  externalLink?: string;
}

interface LiteratureEvidence {
  query: string;
  provider: LiteratureProvider;
  papers: LiteraturePaper[];
  agentSummary: string;
}

/** Source processing parameters derived from XRD Workspace processing pipeline */
function getSourceProcessingSections() {
  return [
    {
      subtitle: 'Baseline',
      params: [
        { label: 'Method:', value: 'Asymmetric Least Squares' },
        { label: 'Lambda:', value: '1.0e+6' },
        { label: 'Asymmetry:', value: '0.010' },
        { label: 'Iterations:', value: '10' },
      ],
    },
    {
      subtitle: 'Smooth',
      params: [
        { label: 'Method:', value: 'Savitzky-Golay' },
        { label: 'Window size:', value: '5' },
        { label: 'Polynomial order:', value: '2' },
      ],
    },
    {
      subtitle: 'Peaks',
      params: [
        { label: 'Prominence:', value: '0.100' },
        { label: 'Min distance:', value: '0.200' },
        { label: 'Height threshold:', value: 'Optional' },
      ],
    },
    {
      subtitle: 'Fit',
      params: [
        { label: 'Peak model:', value: 'Pseudo-Voigt' },
        { label: 'Tolerance:', value: '1.0e-4' },
        { label: 'Max iterations:', value: '100' },
      ],
    },
    {
      subtitle: 'Match',
      params: [
        { label: 'Database:', value: 'ICDD' },
        { label: 'Position tolerance:', value: '+/-0.2 deg' },
        { label: 'Min match score:', value: '0.700' },
        { label: 'Use intensity matching:', value: 'On' },
      ],
    },
  ];
}

function getTechniqueParameters(technique: string) {
  switch (technique) {
    case 'XRD':
      return {
        analysisConfig: {
          title: 'XRD Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '5% I/I₀' },
                { label: 'Peak width (FWHM) range:', value: '0.1° - 0.8° (2θ)' },
                { label: 'Background polynomial order:', value: '5th order Chebyshev' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay (window=7)' },
              ],
            },
            {
              subtitle: 'Phase Matching',
              params: [
                { label: 'Position tolerance (Δ2θ):', value: '±0.2°' },
                { label: 'Intensity correlation review:', value: 'Relation criterion applied' },
                { label: 'Completeness review:', value: 'Expected peaks criterion' },
                { label: 'Database search scope:', value: 'ICDD + COD + AMCSD' },
              ],
            },
            {
              subtitle: 'Evidence Relations',
              params: [
                { label: 'Peak position matching:', value: 'Primary evidence', highlight: true },
                { label: 'Intensity correlation:', value: 'Supporting evidence', highlight: true },
                { label: 'Peak completeness:', value: 'Contextual evidence', highlight: true },
              ],
              note: 'Evidence relations determine structural relation. Multiple converging evidence streams strengthen phase assignment.',
            },
          ],
        },
        instrumental: {
          title: 'XRD Instrumental Parameters',
          sections: [
            {
              subtitle: 'Diffractometer Configuration',
              params: [
                { label: 'Radiation source:', value: 'Cu Kα (λ = 1.5406 Å)' },
                { label: 'Scan range:', value: '10° - 80° (2θ)' },
                { label: 'Step size:', value: '0.02° (2θ)' },
                { label: 'Dwell time:', value: '1.0 s/step' },
                { label: 'Instrumental broadening:', value: '0.08° FWHM (LaB₆ std)' },
              ],
            },
            {
              subtitle: 'Data Processing',
              params: [
                { label: 'Kα₂ stripping:', value: 'Rachinger algorithm' },
                { label: 'Background subtraction:', value: 'Polynomial (order 5)' },
                { label: 'Peak fitting:', value: 'Pseudo-Voigt profile' },
                { label: 'Lattice refinement:', value: 'Nelson-Riley extrapolation' },
              ],
            },
          ],
        },
      };
    case 'Raman':
      return {
        analysisConfig: {
          title: 'Raman Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '3% of max intensity' },
                { label: 'Peak width (FWHM) range:', value: '5 - 50 cm⁻¹' },
                { label: 'Baseline correction:', value: 'Asymmetric least squares' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay (window=9)' },
              ],
            },
            {
              subtitle: 'Mode Assignment',
              params: [
                { label: 'Position tolerance:', value: '±5 cm⁻¹' },
                { label: 'Symmetry matching:', value: 'Factor group analysis' },
                { label: 'Minimum mode count:', value: '3 active modes' },
                { label: 'Database scope:', value: 'RRUFF + literature references' },
              ],
            },
            {
              subtitle: 'Evidence Relations',
              params: [
                { label: 'Mode position matching:', value: 'Primary evidence', highlight: true },
                { label: 'Relative intensity:', value: 'Supporting evidence', highlight: true },
                { label: 'Mode count completeness:', value: 'Contextual evidence', highlight: true },
              ],
              note: 'Evidence relations determine structural relation. Intensity ratios provide supporting context for oriented samples.',
            },
          ],
        },
        instrumental: {
          title: 'Raman Instrumental Parameters',
          sections: [
            {
              subtitle: 'Spectrometer Configuration',
              params: [
                { label: 'Laser wavelength:', value: '532 nm (green)' },
                { label: 'Laser power:', value: '10 mW at sample' },
                { label: 'Spectral range:', value: '100 - 4000 cm⁻¹' },
                { label: 'Spectral resolution:', value: '2 cm⁻¹' },
                { label: 'Acquisition time:', value: '30 s × 3 accumulations' },
              ],
            },
            {
              subtitle: 'Data Processing',
              params: [
                { label: 'Cosmic ray removal:', value: 'Median filter (3 spectra)' },
                { label: 'Fluorescence correction:', value: 'Polynomial baseline (order 3)' },
                { label: 'Peak fitting:', value: 'Lorentzian profile' },
                { label: 'Calibration standard:', value: 'Si (520.7 cm⁻¹)' },
              ],
            },
          ],
        },
      };
    case 'XPS':
      return {
        analysisConfig: {
          title: 'XPS Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '2% of max intensity' },
                { label: 'Peak width (FWHM) range:', value: '0.8 - 3.5 eV' },
                { label: 'Background model:', value: 'Shirley or Tougaard' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay (window=5)' },
              ],
            },
            {
              subtitle: 'Chemical State Assignment',
              params: [
                { label: 'Binding energy tolerance:', value: '±0.3 eV' },
                { label: 'Satellite identification:', value: 'Shake-up/off analysis' },
                { label: 'Auger parameter:', value: 'Modified Auger parameter (α)' },
                { label: 'Database scope:', value: 'NIST XPS + literature' },
              ],
            },
            {
              subtitle: 'Evidence Relations',
              params: [
                { label: 'Binding energy match:', value: 'Primary evidence', highlight: true },
                { label: 'Peak shape consistency:', value: 'Supporting evidence', highlight: true },
                { label: 'Satellite structure:', value: 'Contextual evidence', highlight: true },
              ],
              note: 'Relative sensitivity factors (RSF) applied for elemental quantification. Surface charging corrected to C 1s = 284.8 eV.',
            },
          ],
        },
        instrumental: {
          title: 'XPS Instrumental Parameters',
          sections: [
            {
              subtitle: 'Spectrometer Configuration',
              params: [
                { label: 'X-ray source:', value: 'Al Kα (1486.6 eV)' },
                { label: 'X-ray power:', value: '300 W (15 kV, 20 mA)' },
                { label: 'Analyzer mode:', value: 'Constant analyzer energy (CAE)' },
                { label: 'Pass energy:', value: '20 eV (high resolution)' },
                { label: 'Energy resolution:', value: '0.6 eV (Ag 3d₅/₂ FWHM)' },
              ],
            },
            {
              subtitle: 'Data Processing',
              params: [
                { label: 'Charge correction:', value: 'C 1s reference (284.8 eV)' },
                { label: 'Background subtraction:', value: 'Shirley method' },
                { label: 'Peak fitting:', value: 'Gaussian-Lorentzian mix (GL30)' },
                { label: 'Quantification:', value: 'Scofield RSF with λ correction' },
              ],
            },
          ],
        },
      };
    case 'FTIR':
      return {
        analysisConfig: {
          title: 'FTIR Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '5% transmittance change' },
                { label: 'Peak width (FWHM) range:', value: '10 - 100 cm⁻¹' },
                { label: 'Baseline correction:', value: 'Rubber band (64 points)' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay (window=11)' },
              ],
            },
            {
              subtitle: 'Band Assignment',
              params: [
                { label: 'Position tolerance:', value: '±10 cm⁻¹' },
                { label: 'Functional group matching:', value: 'Characteristic frequencies' },
                { label: 'Minimum band count:', value: '2 diagnostic bands' },
                { label: 'Database scope:', value: 'NIST Chemistry WebBook + IR tables' },
              ],
            },
            {
              subtitle: 'Evidence Relations',
              params: [
                { label: 'Band position matching:', value: 'Primary evidence', highlight: true },
                { label: 'Relative intensity:', value: 'Supporting evidence', highlight: true },
                { label: 'Band shape (sharp/broad):', value: 'Contextual evidence', highlight: true },
              ],
              note: 'Evidence relations determine bonding consistency. Multiple converging evidence streams strengthen functional group assignment.',
            },
          ],
        },
        instrumental: {
          title: 'FTIR Instrumental Parameters',
          sections: [
            {
              subtitle: 'Spectrometer Configuration',
              params: [
                { label: 'Measurement mode:', value: 'Attenuated total reflectance (ATR)' },
                { label: 'ATR crystal:', value: 'Diamond (single bounce)' },
                { label: 'Spectral range:', value: '400 - 4000 cm⁻¹' },
                { label: 'Spectral resolution:', value: '4 cm⁻¹' },
                { label: 'Number of scans:', value: '64 scans averaged' },
              ],
            },
            {
              subtitle: 'Data Processing',
              params: [
                { label: 'ATR correction:', value: 'Depth-dependent correction applied' },
                { label: 'Baseline correction:', value: 'Concave rubber band' },
                { label: 'Normalization:', value: 'Vector normalization' },
                { label: 'Peak fitting:', value: 'Gaussian-Lorentzian profile' },
              ],
            },
          ],
        },
      };
    default:
      return {
        analysisConfig: {
          title: 'General Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '5% of max' },
                { label: 'Background correction:', value: 'Polynomial baseline' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay' },
              ],
            },
          ],
        },
        instrumental: {
          title: 'Instrumental Parameters',
          sections: [
            {
              subtitle: 'Configuration',
              params: [
                { label: 'Technique:', value: 'Multi-technique analysis' },
              ],
            },
          ],
        },
      };
  }
}

function getLiteratureEvidence(technique: string, projectName?: string): LiteratureEvidence {
  // Generate search query based on material and technique
  let query = '';
  let papers: LiteraturePaper[] = [];
  
  if (projectName?.includes('CuFe2O4/SBA-15')) {
    query = 'CuFe2O4 SBA-15 supported spinel ferrite mesoporous silica catalysis XRD XPS';
    papers = [
      {
        title: 'Copper ferrite nanoparticles supported on mesoporous SBA-15: Synthesis and catalytic applications',
        authors: 'Zhang, L., Wang, Y., Chen, H.',
        year: '2023',
        source: 'Journal of Catalysis',
        relevance: 'Supporting literature relation',
        keyEvidence: 'XRD shows CuFe₂O₄ lattice parameter a = 8.37 Å on SBA-15 support (vs. 8.39 Å bulk). XPS Cu 2p₃/₂ at 933.9 eV with surface Cu/Fe = 0.78 (vs. bulk 0.50). FTIR Si-O-Si band at 1048 cm⁻¹ indicates support interaction. Spinel (311) peak preserved after loading.',
        consistencyCheck: 'Our a = 8.38 Å intermediate between their supported (8.37 Å) and bulk values, consistent with partial support interaction. Our Cu/Fe = 0.76 matches their surface enrichment trend. Our FTIR shoulder at 1050 cm⁻¹ supports Si-O-Si context.',
        impactOnDecision: 'Supports spinel structure retention on support. Cu surface segregation remains a surface-sensitive interpretation that requires review. Support interaction is observed but does not establish bulk crystal-structure change.',
        externalLink: '#',
      },
      {
        title: 'Structural and magnetic properties of copper ferrite on mesoporous silica supports',
        authors: 'Kumar, R., Singh, P.',
        year: '2022',
        source: 'Materials Chemistry and Physics',
        relevance: 'Review',
        keyEvidence: 'Reports I(311)/I(220) = 3.1 for CuFe₂O₄/SBA-15 from Rietveld refinement, indicating random powder orientation. Cation-distribution interpretation remains validation-limited. However, observes reduction in crystallite size (28-32 nm) vs. bulk (35-40 nm) due to confinement effects.',
        consistencyCheck: 'Our I(311)/I(220) = 2.8 differs from their 3.1, suggesting mild (111) preferred orientation (March-Dollase r = 1.15) not accounted for in their analysis. CONFLICT: Our crystallite size = 35 nm shows no confinement effect, possibly due to different synthesis temperature or loading method.',
        impactOnDecision: 'Supports inverse spinel cation distribution (+0.01). Texture difference flags potential sample preparation variation but does not affect phase assignment. Crystallite size discrepancy neutral impact (both in catalytically active range).',
        externalLink: '#',
      },
    ];
  } else if (projectName?.includes('CuFe2O4')) {
    query = 'CuFe2O4 spinel ferrite XRD Raman XPS catalytic activity';
    papers = [
      {
        title: 'Copper ferrite spinel nanostructures for catalytic and magnetic applications',
        authors: 'Liu, X., Zhang, M., Wang, Q.',
        year: '2023',
        source: 'Advanced Materials',
        relevance: 'Supporting literature relation',
        keyEvidence: 'Reports A₁g Raman mode at 688 cm⁻¹ for CuFe₂O₄ with Cu²⁺ octahedral occupancy. XRD lattice parameter a = 8.377 Å from Rietveld refinement. Crystallite size 32-38 nm from Scherrer analysis correlates with catalytic activity.',
        consistencyCheck: 'Our A₁g = 690 cm⁻¹ matches within ±2 cm⁻¹ (instrumental resolution). Our a = 8.38 Å agrees within error bars. Our crystallite size 35 nm falls in the reported screening range; Scherrer-derived size remains method-limited.',
        impactOnDecision: 'Supports inverse spinel assignment. Cu²⁺ octahedral site preference remains a Raman-structure interpretation that requires validation. Crystallite-size relevance remains contextual.',
        externalLink: '#',
      },
      {
        title: 'Phase identification and structural characterization of copper ferrite by XRD and Raman spectroscopy',
        authors: 'Chen, Y., Li, W.',
        year: '2022',
        source: 'Journal of Solid State Chemistry',
        relevance: 'Supporting literature relation',
        keyEvidence: 'Provides reference d-spacings: d₃₁₁ = 2.532 Å, d₄₄₀ = 1.481 Å, d₅₁₁ = 1.615 Å for CuFe₂O₄ reference context. Raman T₂g splitting Δν = 142 cm⁻¹ is attributed to Jahn-Teller Cu²⁺ distortion in octahedral sites. Absence of a CuO band at 530 cm⁻¹ is treated as screening context only.',
        consistencyCheck: 'Our d₃₁₁ = 2.53 Å matches the reference relation. Our T₂g splitting = 145 cm⁻¹ is within ±3 cm⁻¹. No dominant CuO signature is observed in this demo data, but phase purity remains validation-limited.',
        impactOnDecision: 'Effect on claim boundary: Supports crystallographic indexing. Provides contextual support for Jahn-Teller interpretation of Raman splitting. Consistent with no dominant secondary phase in this demo pattern; phase purity remains validation-limited.',
        externalLink: '#',
      },
      {
        title: 'Surface chemistry of CuFe₂O₄: XPS investigation of oxidation states',
        authors: 'Anderson, K., Brown, T.',
        year: '2021',
        source: 'Surface Science',
        relevance: 'Review',
        keyEvidence: 'Reports Cu 2p₃/₂ at 933.6 eV for bulk CuFe₂O₄ with satellite I_sat/I_main = 0.38-0.42. Surface enrichment Cu(surface)/Cu(bulk) = 1.2-1.4 observed after air exposure. However, reports Fe³⁺/Fe²⁺ ratio = 3.2 (vs. expected 2.0 for stoichiometric inverse spinel).',
        consistencyCheck: 'Our Cu 2p₃/₂ = 933.8 eV is +0.2 eV higher (within calibration uncertainty). Our Cu enrichment = 1.3 matches their range. CONFLICT: Our Fe³⁺/Fe²⁺ = 2.8 differs from their 3.2, suggesting different surface oxidation states or measurement conditions.',
        impactOnDecision: 'Supports Cu²⁺ assignment and surface reconstruction (+0.01). However, Fe oxidation state discrepancy introduces uncertainty (-0.01). Net impact: neutral. Flags need for controlled-atmosphere XPS to resolve Fe²⁺ quantification ambiguity.',
        externalLink: '#',
      },
    ];
  } else if (projectName?.includes('NiFe2O4')) {
    query = 'NiFe2O4 spinel ferrite XRD Raman magnetic catalytic properties';
    papers = [
      {
        title: 'Nickel ferrite spinel: Structural and magnetic characterization',
        authors: 'Patel, S., Kumar, A.',
        year: '2023',
        source: 'Journal of Magnetism and Magnetic Materials',
        relevance: 'High',
        whyItMatters: 'Supports NiFe₂O₄ spinel structure context with XRD patterns matching current evidence',
        externalLink: '#',
      },
      {
        title: 'Raman spectroscopy of nickel ferrite: Mode assignment and structural insights',
        authors: 'Wang, H., Liu, J.',
        year: '2022',
        source: 'Vibrational Spectroscopy',
        relevance: 'High',
        whyItMatters: 'Provides Raman mode assignments consistent with observed spectrum',
        externalLink: '#',
      },
    ];
  } else if (projectName?.includes('CoFe2O4')) {
    query = 'CoFe2O4 spinel ferrite XRD Raman magnetic anisotropy catalysis';
    papers = [
      {
        title: 'Cobalt ferrite nanoparticles: Synthesis, characterization and magnetic properties',
        authors: 'Lee, S., Park, J.',
        year: '2023',
        source: 'Journal of Alloys and Compounds',
        relevance: 'High',
        whyItMatters: 'Supports CoFe₂O₄ spinel identification with similar XRD and magnetic characteristics',
        externalLink: '#',
      },
      {
        title: 'Structural and vibrational properties of cobalt ferrite studied by XRD and Raman',
        authors: 'Garcia, M., Rodriguez, A.',
        year: '2022',
        source: 'Materials Research Bulletin',
        relevance: 'High',
        whyItMatters: 'Supports spinel structure context and provides reference for peak positions',
        externalLink: '#',
      },
    ];
  } else if (projectName?.includes('Fe3O4')) {
    query = 'Fe3O4 magnetite XRD Raman XPS Fe2+ Fe3+ oxidation';
    papers = [
      {
        title: 'Magnetite nanoparticles: Structural characterization and oxidation state analysis',
        authors: 'Thompson, R., Davis, M.',
        year: '2023',
        source: 'Chemistry of Materials',
        relevance: 'High',
        whyItMatters: 'Provides Fe₃O₄ structure and mixed Fe²⁺/Fe³⁺ oxidation-state context',
        externalLink: '#',
      },
      {
        title: 'XPS and Raman investigation of iron oxide phases',
        authors: 'Wilson, K., Martinez, L.',
        year: '2022',
        source: 'Applied Surface Science',
        relevance: 'High',
        whyItMatters: 'Distinguishes magnetite from other iron oxides using spectroscopic signatures',
        externalLink: '#',
      },
    ];
  } else {
    query = 'spinel ferrite XRD Raman XPS structural characterization';
    papers = [
      {
        title: 'Spinel ferrites: Structural characterization and applications',
        authors: 'Smith, J., Johnson, A.',
        year: '2023',
        source: 'Materials Today',
        relevance: 'Moderate',
        whyItMatters: 'General overview of spinel ferrite characterization techniques',
        externalLink: '#',
      },
    ];
  }

  return {
    query,
    provider: 'mock',
    papers,
    agentSummary: `**Cross-study comparison:** Three independent groups (Liu 2023, Chen 2022, Anderson 2021) report CuFe₂O₄ lattice parameters spanning 8.37-8.39 Å, with our 8.38 Å falling at the distribution center. This tight clustering (σ = 0.01 Å) across different synthesis methods supports the crystallographic assignment while preparation artifacts remain a review item.

**Convergent evidence:** Raman A₁g mode position shows remarkable consistency: Liu (688 cm⁻¹), our data (690 cm⁻¹), literature range (685-695 cm⁻¹). This 1% variation despite different instruments and sample histories indicates robust structure-property correlation, strengthening inverse spinel interpretation.

**Resolved discrepancy:** Anderson's Fe³⁺/Fe²⁺ = 3.2 conflicts with our 2.8 and stoichiometric expectation (2.0). Analysis: Their ex-situ XPS after air exposure likely oxidized surface Fe²⁺ → Fe³⁺. Our value closer to ideal suggests fresher surface or inert transfer. This frames the discrepancy as surface-sensitive context rather than a bulk-composition conclusion.

**Decision impact:** Supporting papers (Liu, Chen, Zhang) provide contextual support for lattice parameters, Raman modes, and XPS binding energies. Partial conflicts (Anderson Fe ratio, Kumar crystallite size) are condition-sensitive and keep the primary structural assignment validation-limited.

**Critical insight:** Multi-laboratory convergence on Cu surface enrichment (1.2-1.4×) across three studies suggests a possible thermodynamic trend rather than a single measurement artifact. Surface reconstruction remains a validation-limited interpretation that requires reviewed XPS context before inclusion in a stronger structural model.`,
  };
}

function ExperimentConditionAgentCard({
  status,
  notes,
  conditionLock,
}: {
  status: string;
  notes: string[];
  conditionLock?: ExperimentConditionLock | null;
}) {
  const measurement = conditionLock?.measurementConditions;
  const processing = conditionLock?.processingConditions;
  const validation = conditionLock?.validationConditions;
  const blockedClaims = [
    'phase purity',
    'publication-level phase claim',
    ...(validation?.crossTechniqueRequired?.some((technique) => technique.toUpperCase() === 'XPS')
      ? ['surface oxidation-state assignment without reviewed XPS validation']
      : []),
  ];

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Experiment Condition Lock
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-100">{status}</p>
          {conditionLock?.userConfirmed && (
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
              Status: Locked by user
            </p>
          )}
        </div>
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
          condition-aware
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Agent interpretation keeps synthesis, measurement, processing, and validation assumptions tied to the user-provided experiment record.
      </p>
      {conditionLock?.userConfirmed && (
        <div className="mt-3 grid gap-2 text-xs leading-relaxed text-slate-400">
          <div>
            <span className="font-semibold text-slate-200">Measurement:</span>{' '}
            {measurement?.instrument ?? 'pending confirmation'}, {measurement?.radiationOrSource ?? 'pending confirmation'}, {measurement?.scanRange ?? 'pending confirmation'}
          </div>
          <div>
            <span className="font-semibold text-slate-200">Processing:</span>{' '}
            baseline correction {processing?.baselineCorrection ?? 'pending confirmation'}; peak detection by {processing?.peakDetection ?? 'pending confirmation'}
          </div>
          <div>
            <span className="font-semibold text-slate-200">Validation:</span>{' '}
            refinement, reference validation, and replicate evidence {validation?.refinementRequired || validation?.referenceValidationRequired || validation?.replicateRequired ? 'required' : 'pending confirmation'}
          </div>
          <div>
            <span className="font-semibold text-slate-200">Blocked claims:</span>{' '}
            {blockedClaims.join('; ')}
          </div>
        </div>
      )}
      <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-slate-400">
        {notes.slice(0, 4).map((note) => (
          <li key={note} className="flex gap-2">
            <span className="text-amber-300">-</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RightPanel({
  technique = 'XRD',
  projectName,
  projectId,
  activeTab: controlledActiveTab,
  currentStep,
  totalSteps,
  reasoningStream,
  candidates,
  executionSteps = [],
  progressPercent = 0,
  onTabChange,
  onPromptSubmit,
  processingResultId,
}: RightPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('thinking');
  const [userPrompt, setUserPrompt] = useState('');
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [parameterMode, setParameterMode] = useState<'hybrid' | 'agent'>('hybrid');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const activeTab = controlledActiveTab ?? internalActiveTab;

  // Get locked context for this project
  const lockedContext = projectId ? getLockedContext(projectId) : null;
  const experimentConditionLock = projectId ? getLatestExperimentConditionLock(projectId) : null;
  const experimentConditionStatus = getConditionLockStatusLabel(experimentConditionLock);
  const experimentConditionNotes = getConditionBoundaryNotes(
    experimentConditionLock,
    technique ? [technique] : [],
  );

  // Evidence relations for structural reasoning
  const evidenceRelations = [
    {
      id: 'peak-alignment',
      label: 'Peak Position Alignment',
      source: 'XRD',
      relation: 'supports',
      impact: 'positive',
      explanation: 'All 7 major reflections (220, 311, 400, 422, 511, 440, 533) match CuFe₂O₄ reference within Δ2θ ≤ 0.15°. Lattice parameter a = 8.38 Å from Nelson-Riley extrapolation supports an Fd-3m assignment. Primary evidence supports structural assignment with validation requirements.',
    },
    {
      id: 'intensity-corr',
      label: 'Intensity Correlation',
      source: 'XRD',
      relation: 'supports',
      impact: 'positive',
      explanation: 'Pearson correlation r = 0.87 between observed and reference intensities after Lorentz-polarization correction. Mild (111) preferred orientation (March-Dollase r = 1.15) accounts for I(311)/I(220) deviation. Supporting evidence reinforces structural relation.',
    },
    {
      id: 'completeness',
      label: 'Peak Completeness',
      source: 'XRD',
      relation: 'contextualizes',
      impact: 'positive',
      explanation: '18 out of 21 expected reflections observed (85.7% completeness). Missing peaks have I/I₀ < 5% in reference, below detection threshold. Contextual evidence provides additional structural support.',
    },
    {
      id: 'anomalous-peak',
      label: 'Unindexed Peak',
      source: 'XRD',
      relation: 'requires_validation',
      impact: 'neutral',
      explanation: 'Weak reflection at 2θ = 62.3° (I/I₀ = 1.8%) cannot be indexed to Fd-3m spinel. Possible CuO trace impurity or superlattice ordering. Requires validation but does not contradict primary assignment.',
    },
    {
      id: 'raman-validation',
      label: 'Raman Mode Context',
      source: 'Raman',
      relation: 'supports',
      impact: 'positive',
      explanation: 'A₁g symmetric breathing mode at 690 cm⁻¹ matches CuFe₂O₄ reference context (685-695 cm⁻¹ range). T₂g mode splitting Δν = 145 cm⁻¹ supports Jahn-Teller Cu²⁺ distortion in octahedral sites. Independent structural context supports assignment.',
    },
    {
      id: 'xps-validation',
      label: 'XPS Oxidation-State Context',
      source: 'XPS',
      relation: 'supports',
      impact: 'positive',
      explanation: 'Cu 2p₃/₂ at 933.8 eV with satellite supports Cu²⁺ surface context. Fe 2p₃/₂ shows Fe³⁺/Fe²⁺ = 2.8 consistent with inverse spinel surface context. Chemical-state evidence supports, but does not establish, the structural model.',
    },
    {
      id: 'literature-consensus',
      label: 'Reference Context Review',
    source: 'Agent + Literature',
      relation: 'supports',
      impact: 'positive',
      explanation: 'Multi-laboratory convergence: Liu 2023 (a = 8.377 Å), Chen 2022 (A₁g = 688 cm⁻¹), Zhang 2023 (Cu surface enrichment 1.2-1.4×) provides contextual support for the measurements. Reference evidence supports structural assignment with validation requirements.',
    },
  ];

  const handleEditSection = (sectionKey: string) => {
    if (editingSection === sectionKey) {
      // Save and close
      setEditingSection(null);
    } else {
      // Open for editing
      setEditingSection(sectionKey);
    }
  };

  const handleValueChange = (paramKey: string, newValue: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [paramKey]: newValue,
    }));
  };

  const getParamValue = (sectionIdx: number, paramIdx: number, originalValue: string) => {
    const key = `${sectionIdx}-${paramIdx}`;
    return editedValues[key] ?? originalValue;
  };

  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const handlePromptSubmit = () => {
    if (userPrompt.trim() && onPromptSubmit) {
      onPromptSubmit(userPrompt.trim());
      setUserPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  // Default candidates if none provided
  const displayCandidates: CandidateData[] = candidates ?? [
    {
      phase: 'CuFe₂O₄ (Spinel)',
      peakAlignment: 'Consistent',
      structuralFit: 'Supported',
      completeness: '18/21',
      evaluation: 'Requires validation',
      result: 'Match',
    },
    {
      phase: 'Fe₃O₄ (Magnetite)',
      peakAlignment: 'In Progress',
      structuralFit: 'Inconsistent',
      completeness: '14/19',
      evaluation: 'Review',
      result: 'Rejected',
      reason: 'Missing Cu signature peaks',
    },
    {
      phase: 'CuO (Tenorite)',
      peakAlignment: 'Inconsistent',
      structuralFit: 'Review',
      completeness: '9/15',
      evaluation: 'Review',
      result: 'Rejected',
      reason: 'Incompatible peak pattern',
    },
  ];

  return (
    <aside className="w-[400px] shrink-0 border-l border-white/[0.08] bg-[#0F172A] flex flex-col">
      {/* Tab Navigation */}
      <div className="shrink-0 border-b border-white/[0.08] px-4">
        <div className="grid grid-cols-3 gap-1 py-3">
          {RIGHT_PANEL_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={`relative min-h-[34px] rounded-md px-2 text-[11px] font-semibold leading-tight transition-colors ${
                activeTab === key
                  ? 'bg-cyan-400/10 text-cyan-300'
                  : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
            >
              {label}
              {activeTab === key && (
                <div className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-cyan-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'thinking' && (
          <>
            {/* User Prompt Input Box */}
            <div className="rounded-lg border border-slate-700 bg-[#070B12] p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Goal
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-300 text-[9px] font-bold">
                  User Control
                </span>
              </div>
              <div className="space-y-3">
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Provide a goal or constraint for the deterministic workflow (e.g., 'Focus on Cu oxidation states', 'Check for secondary phases', 'Prioritize peak intensity analysis')..."
                  className="w-full h-24 px-3 py-2 rounded-md bg-slate-800/50 border border-slate-700 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Press Enter to send, Shift+Enter for new line
                  </span>
                  <button
                    type="button"
                    onClick={handlePromptSubmit}
                    disabled={!userPrompt.trim()}
                    title={!userPrompt.trim() ? 'Enter a goal or constraint before sending.' : undefined}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <Send size={12} />
                    Send Instructions
                  </button>
                </div>
              </div>
            </div>

            {/* Section 1: Interpretation */}
            <Section title="Interpretation">
              <div className="text-xs text-slate-400 mb-3">
                Step {currentStep >= 0 ? currentStep + 1 : 1} of {totalSteps} - Evidence Review
              </div>
              <div className="space-y-3">
                {(() => {
                  const observedConfig: Record<string, { label: string; values: string[] }> = {
                    XRD: {
                      label: 'Observed peaks (2θ):',
                      values: ['18.3°', '30.1°', '35.5°', '43.2°', '53.5°', '57.1°', '62.7°'],
                    },
                    Raman: {
                      label: 'Observed bands (cm⁻¹):',
                      values: ['210 cm⁻¹', '340 cm⁻¹', '475 cm⁻¹', '620 cm⁻¹', '690 cm⁻¹'],
                    },
                    FTIR: {
                      label: 'Observed absorption bands (cm⁻¹):',
                      values: ['420 cm⁻¹', '585 cm⁻¹', '610 cm⁻¹', '1050 cm⁻¹', '3400 cm⁻¹'],
                    },
                    XPS: {
                      label: 'Observed core levels (eV):',
                      values: ['530.1 eV', '531.8 eV', '709.4 eV', '711.2 eV', '933.8 eV', '942.0 eV'],
                    },
                  };
                  const observed = observedConfig[technique] ?? observedConfig.XRD;
                  return (
                    <div>
                      <div className="text-xs font-semibold text-slate-300 mb-2">
                        {observed.label}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {observed.values.map((peak) => (
                          <span
                            key={peak}
                            className="px-2 py-1 rounded bg-slate-800/50 border border-slate-700 text-[10px] font-mono text-slate-300"
                          >
                            {peak}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Evidence Review:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    {getTechniqueReasoning(technique).evidenceReview.map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                        <span><span className="text-slate-300">{item.label}</span> {item.body}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            {/* Section 2: Evidence Review */}
            <Section title="Evidence Review">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 pr-2 text-slate-500 font-semibold">Phase</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-semibold">Align</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-semibold">Fit</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-semibold">Comp</th>
                      <th className="text-right py-2 pl-2 text-slate-500 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayCandidates.map((candidate, index) => (
                      <tr key={index} className="border-b border-slate-800/50">
                        <td className="py-3 pr-2">
                          <div className="text-slate-200 font-medium mb-1">{formatChemicalFormula(candidate.phase)}</div>
                          <div className="flex items-center gap-1.5">
                            {candidate.result === 'Match' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[9px] font-bold">
                                Reference match
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-red-400/10 border border-red-400/30 text-red-300 text-[9px] font-bold">
                                Rejected
                              </span>
                            )}
                          </div>
                          {candidate.reason && (
                            <div className="text-[10px] text-slate-500 mt-1">{candidate.reason}</div>
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300 font-mono text-xs">
                          {candidate.peakAlignment}
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300 font-mono text-xs">
                          {candidate.structuralFit}
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300 font-mono text-xs">
                          {candidate.completeness}
                        </td>
                        <td className="text-right py-3 pl-2 text-slate-300 font-mono font-semibold text-xs">
                          {candidate.evaluation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Characterization Overview */}
            <Section title="Characterization Overview" badge="Source: Workflow" badgeColor="violet">
              <div className="text-xs text-slate-400 mb-3">
                {getScientificSummary(technique).title}
              </div>
              {getScientificSummary(technique).blocks.map((block, index) => (
                <div key={index} className="mb-3">
                  <div className="text-xs font-semibold text-slate-300 mb-1">{block.label}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{block.content}</div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Evidence status:</span>
                  <span className="text-xs text-emerald-400 font-semibold">
                    {getScientificSummary(technique).claimStatus === 'strongly_supported' ? 'Supported' :
                     getScientificSummary(technique).claimStatus === 'supported' ? 'Requires validation' :
                     getScientificSummary(technique).claimStatus === 'partial' ? 'Validation-limited' :
                     'Claim boundary'}
                  </span>
                </div>
              </div>
            </Section>

            {/* Section 3: Supporting Data */}
            <Section title="Supporting Data">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Evidence relations:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                    Ready
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">Supporting Data:</div>
                  <ul className="space-y-1 text-xs text-slate-500">
                    {getTechniqueReasoning(technique).supportingBullets.map((bullet) => (
                      <li key={bullet.label} className="flex items-start gap-2">
                        <span className="text-slate-600">•</span>
                        <span><span className="text-slate-400">{bullet.label}</span> {bullet.body}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">Interpretation:</div>
                  <div className="text-xs text-emerald-400">
                  {getTechniqueReasoning(technique).supportingInterpretation}
                  </div>
                </div>
              </div>
            </Section>

            {/* Section 4: Interpretation */}
            <Section title="Interpretation" badge="Source: Interpretation Run" badgeColor="violet">
              <div className="text-xs text-slate-400 space-y-2">
                {getTechniqueReasoning(technique).interpretationParagraphs.map((para) => (
                  <p key={para.label}>
                    <span className="text-slate-300 font-medium">{para.label}</span> {para.body}
                  </p>
                ))}
                <p className="text-slate-500 text-[10px] pt-2 border-t border-slate-800">
                  <span className="text-violet-400">Interpretation:</span> {getTechniqueReasoning(technique).interpretationFooter}
                </p>
              </div>
            </Section>

            {/* Section 5: Report-ready Discussion */}
            <Section title="Report-ready Discussion" badge="Source: Workflow" badgeColor="cyan">
              <div className="space-y-3">
                <div className="text-xs">
                  <span className="text-slate-200 font-semibold">{getTechniqueReasoning(technique).reportTitle}</span>
                </div>

                <div className="rounded-lg bg-emerald-400/5 border border-emerald-400/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-300">Status:</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                      Ready
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 text-center mb-2">
                    Derived from evidence relationship summary
                  </div>
                  <div className="text-[10px] text-cyan-400 text-center pt-2 border-t border-emerald-400/20">
                    Supporting Data: <span className="font-semibold">Evidence tab {'->'} Supporting Data</span>
                    <br />
                    <span className="text-slate-500">Review evidence items for detailed reasoning trace</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">Supporting Data:</div>
                  <ul className="space-y-1 text-xs text-slate-400">
                    {getTechniqueReasoning(technique).reportBullets.map((bullet, idx) => {
                      const isLiterature = bullet.key === 'literature' || bullet.key === 'literature-consensus';
                      return (
                        <li
                          key={bullet.key}
                          className={`flex items-start gap-2 p-2 rounded transition-all ${
                            activeEvidenceId === bullet.key ? 'bg-blue-400/10 border border-blue-400/30' : ''
                          }`}
                        >
                          {isLiterature ? (
                            <span className="text-violet-400 shrink-0">◆</span>
                          ) : (
                            <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                          )}
                          <span><span className="text-slate-300">{bullet.label}</span> {bullet.body}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">Recommended validation:</div>
                  <div className="text-xs text-cyan-400">
                    {getTechniqueReasoning(technique).reportValidation}
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'evidence' && (
          <>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100">
              Condition lock keeps interpretation validation-limited until refinement, replicate, and required cross-technique evidence are reviewed.
            </div>
            {/* Conflict Analysis */}
            <Section title="Conflict Analysis">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-2">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold">Anomalous reflection at 2θ = 62.3°</span>
                  <span className="text-slate-500"> (I/I₀ = 1.8%, FWHM = 0.4°)</span>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="text-slate-300">Analysis:</span> Peak position inconsistent with CuFe₂O₄ spinel (no allowed reflection at d = 1.489 Å for Fd-3m). Possible origins: (1) trace CuO impurity (2-11) plane, (2) surface reconstruction superlattice, or (3) instrumental artifact from Kα₂ stripping error.
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-400 font-semibold">Effect on claim boundary:</span>
                  <span className="text-amber-300">Local inconsistency observed</span>
                  <span className="text-slate-500">(minor unresolved reflection)</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700">
                  <span className="text-slate-400">Assessment:</span> Insufficient intensity to support secondary phase hypothesis. Flagged for follow-up XPS or TEM analysis if critical for application.
                </div>
              </div>
            </Section>

            {/* Evidence Relationship Summary */}
            <Section title="Cross-Technique Insights">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Peak-position relation:</span>
                  <span className="text-slate-200 font-mono font-semibold">Consistent with reference pattern</span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-2 ml-4">
                  Peak positions align with reference relation set
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-400">Validation gap:</span>
                  <span className="text-amber-300 font-mono">1 unindexed peak</span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-2 ml-4">
                  Anomalous peak at 62.3° requires validation but no blocking contradiction
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400">Multi-technique relation:</span>
                  <span className="text-emerald-300 font-mono">Convergence observed</span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-2 ml-4">
                  XRD + Raman + XPS provide supportive context for an inverse spinel interpretation
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <div className="text-[11px] text-slate-400 mb-2">
                    Multiple independent evidence streams support the same structural interpretation
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">Status:</span>
                    <span className="text-lg text-amber-300 font-bold">Ready with validation requirements</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Evidence Relationship Summary */}
            <Section title="Cross-Technique Insights">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Peak-position relation:</span>
                  <span className="text-emerald-300 font-mono font-semibold">Consistent with reference pattern</span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-2 ml-4">
                  Peak positions align with reference relation set
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-400">Validation gap:</span>
                  <span className="text-amber-300 font-mono">1 unindexed peak</span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-2 ml-4">
                  Anomalous peak at 62.3° requires validation but no blocking contradiction
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400">Multi-technique relation:</span>
                  <span className="text-emerald-300 font-mono">Convergence observed</span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-2 ml-4">
                  XRD, Raman, and XPS provide supportive context for the spinel assignment; validation remains required
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <div className="text-[11px] text-slate-400 mb-2">
                    Multiple evidence streams support the working structural interpretation within validation boundaries
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">Status:</span>
                    <span className="text-lg text-amber-300 font-bold">Requires validation</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Evidence Sources */}
            <Section title="Evidence Sources">
              <div className="space-y-2">
                <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-300">Crystallographic Alignment</span>
                  </div>
                  <div className="text-xs text-slate-400 ml-6">
                    All 7 major reflections (220, 311, 400, 422, 511, 440, 533) match bundled CuFe₂O₄ reference context within Δ2θ ≤ 0.15°. Lattice parameter a = 8.38 ± 0.01 Å from Nelson-Riley extrapolation supports cubic Fd-3m assignment. Solid-solution exclusion requires additional validation.
                  </div>
                </div>
                
                <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-300">Intensity Correlation</span>
                  </div>
                  <div className="text-xs text-slate-400 ml-6">
                    Observed intensity ratios match reference pattern after texture correction. Pearson correlation after correction supports structural relation.
                  </div>
                </div>
                
                <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-300">Multi-Technique Convergence</span>
                  </div>
                  <div className="text-xs text-slate-400 ml-6">
                    XRD (bulk structure), Raman (cation ordering), and XPS (surface oxidation states) provide independent support for inverse spinel context. Systematic measurement errors remain review items.
                  </div>
                </div>
              </div>
            </Section>

            {/* Limitations */}
            <Section title="Limitations">
              <div className="rounded-lg bg-amber-400/5 border border-amber-400/20 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Unresolved weak reflections:</span> Two peaks at 2θ = 62.3° and 64.1° cannot be indexed to Fd-3m spinel. Possible origins include CuO trace impurity, Cu-Fe ordering superlattice (P4₃32 symmetry), or instrumental artifacts. Below XRD detection limit for stronger assignment.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Surface vs. bulk discrepancy:</span> XPS indicates Cu surface enrichment (Cu/Fe = 0.76 vs. bulk 0.50), but penetration depth (~5 nm) samples only surface region. Bulk composition may deviate from nominal CuFe₂O₄ stoichiometry. Neutron diffraction or bulk ICP-OES recommended for validation.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Crystallite size uncertainty:</span> Scherrer analysis assumes spherical crystallites and zero strain. Actual morphology (TEM required) may be faceted or anisotropic, affecting catalytic site distribution. Williamson-Hall plot needed to deconvolve size and strain contributions.
                  </div>
                </div>
              </div>
            </Section>

            {/* Validation Context */}
            <Section title="Validation Context">
              <div className="space-y-3">
                {/* Provider and Query */}
                <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Source:</span>
                    <span className="text-xs text-slate-300">Bundled literature context</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-1">Validation query:</div>
                    <div className="text-xs text-slate-300 font-mono bg-slate-900/50 p-2 rounded border border-slate-700">
                      {getLiteratureEvidence(technique, projectName).query}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700">
                    Demo dataset only. Live publication search is available in the connected beta workflow.
                  </div>
                </div>

                {/* Papers */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Publication-limited validation:</div>
                  {getLiteratureEvidence(technique, projectName).papers.map((paper, index) => (
                    <div key={index} className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-200 mb-1">{paper.title}</div>
                        <div className="text-xs text-slate-400">
                          {paper.authors} ({paper.year})
                        </div>
                        <div className="text-xs text-slate-500">{paper.source}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          paper.relevance.includes('Supporting')
                            ? 'bg-emerald-400/10 border border-emerald-400/30 text-emerald-300'
                            : paper.relevance.includes('Conflict')
                            ? 'bg-amber-400/10 border border-amber-400/30 text-amber-300'
                            : 'bg-slate-400/10 border border-slate-400/30 text-slate-300'
                        }`}>
                          {paper.relevance}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-[11px] font-semibold text-slate-300 mb-1">Key Evidence:</div>
                          <div className="text-[11px] text-slate-400 leading-relaxed">{paper.keyEvidence}</div>
                        </div>
                        
                        <div className="pt-1 border-t border-slate-700/50">
                          <div className="text-[11px] font-semibold text-slate-300 mb-1">Consistency Check:</div>
                          <div className="text-[11px] text-slate-400 leading-relaxed">{paper.consistencyCheck}</div>
                        </div>
                        
                        <div className="pt-1 border-t border-slate-700/50">
                          <div className="text-[11px] font-semibold text-slate-300 mb-1">Effect on claim boundary:</div>
                          <div className="text-[11px] text-slate-400 leading-relaxed">{paper.impactOnDecision}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Supporting Literature */}
                <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-300">Supporting Literature</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                      Source: Interpretation Run
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed space-y-2 whitespace-pre-line">
                    {getLiteratureEvidence(technique, projectName).agentSummary}
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'context' && (
          <div className="space-y-4">
            <CharacterizationObjectiveCard />
            <SampleContextCard />
            <DataAvailabilityPanel />
            <TechniqueCoveragePanel />
            <ExperimentConditionAgentCard
              status={experimentConditionStatus}
              notes={experimentConditionNotes}
              conditionLock={experimentConditionLock}
            />
            <EvidenceRequirementsTable compact />
          </div>
        )}

        {activeTab === 'parameters' && (
          <>
            {/* Parameter Control Mode Selector */}
            <div className="rounded-lg border border-slate-700 bg-[#070B12] p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Parameter Control Mode
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setParameterMode('hybrid')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    parameterMode === 'hybrid'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Hybrid</span>
                    <span className="text-[9px] opacity-80">Manual + Assisted</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setParameterMode('agent')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    parameterMode === 'agent'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Autonomous</span>
                    <span className="text-[9px] opacity-80">Fully Autonomous</span>
                  </div>
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="text-[10px] text-slate-500">
                  {parameterMode === 'hybrid' ? (
                    <>
                      <span className="text-blue-400 font-semibold">Hybrid Mode:</span> You can manually adjust parameters below. The system provides recommendations and flags changes for review.
                    </>
                  ) : (
                    <>
                      <span className="text-purple-400 font-semibold">Autonomous Mode:</span> The system automatically optimizes all parameters based on data characteristics and analysis goals.
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Source Processing Parameters — connected to XRD Workspace */}
            {processingResultId && (
              <Section title="Source Processing Parameters" badge="XRD Workspace" badgeColor="cyan">
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 mb-4">
                  <div className="text-[10px] text-cyan-300 font-medium">
                    Agent interpretation is based on the processed XRD evidence generated with these settings.
                  </div>
                  <div className="mt-1 text-[9px] text-slate-500">
                    Source: {processingResultId} - Editing here updates the agent interpretation context only. Source XRD processing remains unchanged.
                  </div>
                </div>
                <div className="space-y-3">
                  {getSourceProcessingSections().map((section, sectionIdx) => {
                    const sectionKey = `source-${sectionIdx}`;
                    const isEditing = editingSection === sectionKey;

                    return (
                      <div key={sectionIdx} className={`rounded-lg border p-3 transition-all ${
                        isEditing
                          ? 'bg-cyan-400/5 border-cyan-400/30'
                          : 'bg-slate-800/30 border-slate-700'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold text-slate-300">{section.subtitle}</div>
                          {parameterMode === 'hybrid' && (
                            <button
                              type="button"
                              onClick={() => handleEditSection(sectionKey)}
                              className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                                isEditing
                                  ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/30'
                                  : 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20'
                              }`}
                            >
                              {isEditing ? 'Save' : 'Edit'}
                            </button>
                          )}
                          {parameterMode === 'agent' && (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-purple-400/10 border border-purple-400/30 text-purple-300">
                              Auto-optimized
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {section.params.map((param, paramIdx) => {
                            const paramKey = `source-${sectionIdx}-${paramIdx}`;
                            const currentValue = editedValues[paramKey] ?? param.value;

                            return (
                              <div key={paramIdx} className="flex items-center justify-between text-xs gap-3">
                                <span className="text-slate-400 flex-shrink-0">{param.label}</span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => handleValueChange(paramKey, e.target.value)}
                                    className="px-2 py-1 rounded bg-slate-900/50 border border-cyan-400/30 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 min-w-[120px]"
                                  />
                                ) : (
                                  <span className="text-slate-200 font-mono">{currentValue}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {isEditing && (
                          <div className="mt-2 pt-2 border-t border-cyan-400/20">
                            <div className="text-[10px] text-cyan-300">
                              💡 Editing here updates the agent interpretation context only. Source XRD processing remains unchanged.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Locked Scientific Context */}
            {lockedContext && (
              <div className="border-b border-border px-3 py-3">
                <LockedScientificContext
                  sampleIdentity={lockedContext.sampleIdentity}
                  technique={lockedContext.technique}
                  sourceDataset={lockedContext.sourceDataset}
                  sourceProcessingPath={lockedContext.sourceProcessingPath}
                  referenceScope={lockedContext.referenceScope}
                  claimBoundary={lockedContext.claimBoundary}
                  variant="full"
                />
              </div>
            )}
            <div className="mb-6">
              <ExperimentConditionAgentCard
                status={experimentConditionStatus}
                notes={experimentConditionNotes}
                conditionLock={experimentConditionLock}
              />
            </div>

            {/* Analysis Configuration */}
            <Section title={getTechniqueParameters(technique).analysisConfig.title}>
              <div className="space-y-3">
                {getTechniqueParameters(technique).analysisConfig.sections.map((section, sectionIdx) => {
                  const sectionKey = `analysis-${sectionIdx}`;
                  const isEditing = editingSection === sectionKey;
                  
                  return (
                    <div key={sectionIdx} className={`rounded-lg border p-3 transition-all ${
                      isEditing 
                        ? 'bg-blue-400/5 border-blue-400/30' 
                        : 'bg-slate-800/30 border-slate-700'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-300">{section.subtitle}</div>
                        {parameterMode === 'hybrid' && (
                          <button
                            type="button"
                            onClick={() => handleEditSection(sectionKey)}
                            className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                              isEditing
                                ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/30'
                                : 'bg-blue-400/10 border-blue-400/30 text-blue-300 hover:bg-blue-400/20'
                            }`}
                          >
                            {isEditing ? 'Save' : 'Edit'}
                          </button>
                        )}
                        {parameterMode === 'agent' && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-purple-400/10 border border-purple-400/30 text-purple-300">
                            Auto-optimized
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {section.params.map((param, paramIdx) => {
                          const paramKey = `${sectionIdx}-${paramIdx}`;
                          const currentValue = getParamValue(sectionIdx, paramIdx, param.value);
                          
                          return (
                            <div key={paramIdx} className="flex items-center justify-between text-xs gap-3">
                              <span className="text-slate-400 flex-shrink-0">{param.label}</span>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) => handleValueChange(paramKey, e.target.value)}
                                  className="px-2 py-1 rounded bg-slate-900/50 border border-blue-400/30 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 min-w-[120px]"
                                />
                              ) : (
                                <span className={`font-mono ${param.highlight ? 'text-emerald-300' : 'text-slate-200'}`}>
                                  {currentValue}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {section.note && (
                        <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700">
                          {section.note}
                        </div>
                      )}
                      {isEditing && (
                        <div className="mt-2 pt-2 border-t border-blue-400/20">
                          <div className="text-[10px] text-blue-300">
                            💡 Editing mode active. Click "Save" to apply changes.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Instrumental Parameters */}
            <Section title={getTechniqueParameters(technique).instrumental.title}>
              <div className="space-y-3">
                {getTechniqueParameters(technique).instrumental.sections.map((section, sectionIdx) => {
                  const sectionKey = `instrumental-${sectionIdx}`;
                  const isEditing = editingSection === sectionKey;
                  
                  return (
                    <div key={sectionIdx} className={`rounded-lg border p-3 transition-all ${
                      isEditing 
                        ? 'bg-blue-400/5 border-blue-400/30' 
                        : 'bg-slate-800/30 border-slate-700'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-300">{section.subtitle}</div>
                        {parameterMode === 'hybrid' && (
                          <button
                            type="button"
                            onClick={() => handleEditSection(sectionKey)}
                            className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                              isEditing
                                ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/30'
                                : 'bg-blue-400/10 border-blue-400/30 text-blue-300 hover:bg-blue-400/20'
                            }`}
                          >
                            {isEditing ? 'Save' : 'Edit'}
                          </button>
                        )}
                        {parameterMode === 'agent' && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-purple-400/10 border border-purple-400/30 text-purple-300">
                            Auto-optimized
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {section.params.map((param, paramIdx) => {
                          const paramKey = `instrumental-${sectionIdx}-${paramIdx}`;
                          const currentValue = editedValues[paramKey] ?? param.value;
                          
                          return (
                            <div key={paramIdx} className="flex items-center justify-between text-xs gap-3">
                              <span className="text-slate-400 flex-shrink-0">{param.label}</span>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) => handleValueChange(paramKey, e.target.value)}
                                  className="px-2 py-1 rounded bg-slate-900/50 border border-blue-400/30 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 min-w-[120px]"
                                />
                              ) : (
                                <span className="text-slate-200 font-mono">{currentValue}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {isEditing && (
                        <div className="mt-2 pt-2 border-t border-blue-400/20">
                          <div className="text-[10px] text-blue-300">
                            💡 Editing mode active. Click "Save" to apply changes.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Interpretation */}
            <Section title="Interpretation" badge="Source: Interpretation Run" badgeColor="violet">
              <div className="space-y-3">
                <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
                  <div className="text-xs font-semibold text-slate-300 mb-2">Interpretation Settings</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Mode:</span>
                      <span className="text-slate-200 font-mono">Interpretation</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Temperature:</span>
                      <span className="text-slate-200 font-mono">0.3</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Summary length:</span>
                      <span className="text-slate-200 font-mono">2048</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Variation control:</span>
                      <span className="text-slate-200 font-mono">0.95</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
                  <div className="text-xs font-semibold text-slate-300 mb-2">Review Tasks</div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-purple-400 mt-0.5 shrink-0" />
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-300">Interpretation:</span> Review peak assignments against bundled crystallographic context
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-purple-400 mt-0.5 shrink-0" />
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-300">Literature synthesis:</span> Compare results with published studies and explain discrepancies
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-purple-400 mt-0.5 shrink-0" />
                      <div className="text-xs text-slate-400">
                  <span className="text-slate-300">Cross-Technique Insights:</span> Evaluate multi-technique convergence and assess review status
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 bg-slate-800/30 border border-slate-700 rounded p-2">
                  <span className="text-slate-400">Note:</span> Interpretation provides literature context and conflict review. Deterministic algorithms handle peak detection, phase matching, and evidence relation evaluation.
                </div>
              </div>
            </Section>

            {/* Review Criteria */}
            <Section title="Review Criteria">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ready with boundaries:</span>
                    <span className="text-emerald-300 font-mono font-semibold">Primary + Supporting reviewed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">In Progress:</span>
                    <span className="text-cyan-300 font-mono font-semibold">Primary evidence only</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Review:</span>
                    <span className="text-amber-300 font-mono font-semibold">Validation gap</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Review:</span>
                    <span className="text-red-300 font-mono font-semibold">Blocking contradiction</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="text-[10px] text-slate-500">
                    Status is based on supporting data and multi-technique convergence. Multiple independent evidence streams support structural assignments.
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'logs' && (
          <>
            <Section title="Reasoning Trace">
              <div className="space-y-3">
                {executionSteps.length > 0 ? (
                  executionSteps.map((step) => (
                    <ExecutionStepItem key={step.number} {...step} />
                  ))
                ) : (
                  <div className="rounded-lg border border-slate-800 bg-[#070B12] p-4 text-xs text-slate-500">
                    Reasoning trace appears when a run is prepared.
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Reasoning Progress
                  </span>
                  <span className="text-[10px] font-bold text-cyan-300">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </Section>

            {/* Reasoning Timeline */}
            <Section title="Reasoning Timeline">
              <div className="space-y-2">
                {getTechniqueReasoning(technique).timeline.map((entry) => (
                  <LogEntry
                    key={`${entry.timestamp}-${entry.message}`}
                    timestamp={entry.timestamp}
                    level={entry.level}
                    message={entry.message}
                    details={entry.details}
                  />
                ))}
                <LogEntry
                  timestamp="00:05.123"
                  level="info"
                  message="Cross-technique evidence review started"
                  details="Comparing XRD phase assignment with Raman modes and XPS oxidation-state context; validation remains required"
                />
                <LogEntry
                  timestamp="00:05.789"
                  level="info"
                  message="Check Experiment Conditions"
                  details="Confirm locked measurement, processing, and validation constraints before interpretation."
                />
                <LogEntry
                  timestamp="00:06.456"
                  level="info"
                  message="Raman evidence reviewed: supportive local-symmetry context"
                  details="A₁g mode at 690 cm⁻¹ aligns with CuFe₂O₄ reference context (expected: 685-695 cm⁻¹). T₂g splitting supports, but does not establish, Cu²⁺ Jahn-Teller interpretation."
                />
                <LogEntry
                  timestamp="00:07.234"
                  level="info"
                  message="XPS evidence reviewed: supportive context, review required"
                  details="Cu 2p₃/₂ at 933.8 eV with satellite supports Cu²⁺ surface context. Fe 2p₃/₂ context remains surface-sensitive and does not establish bulk composition."
                />
                <LogEntry
                  timestamp="00:07.567"
                  level="info"
                  message="Interpretation requested"
                  details="Request: analyze phase assignment with XRD, Raman, and XPS supporting data, then explain crystallographic consistency."
                />
                <LogEntry
                  timestamp="00:09.891"
                  level="success"
                  message="Interpretation received"
                  details="Key points: Fd-3m assignment is supported by observed reflections, cation-distribution interpretation remains validation-limited, and multi-technique convergence supports assignment."
                />
                <LogEntry
                  timestamp="00:10.234"
                  level="info"
                  message="Validation context review started"
                  details="Query: 'CuFe2O4 spinel ferrite XRD Raman XPS catalytic activity'. Reviewing bundled publication-style context."
                />
                <LogEntry
                  timestamp="00:12.567"
                  level="success"
                  message="Loaded 5 bundled reference notes"
                  details="Liu 2023 (Advanced Materials), Chen 2022 (J. Solid State Chem), Anderson 2021 (Surface Science), Zhang 2023 (J. Catalysis), Kumar 2022 (Mater. Chem. Phys)"
                />
                <LogEntry
                  timestamp="00:13.123"
                  level="info"
                  message="Supporting validation review requested"
                  details="Comparing current results with 5 literature sources. Analyzing consistency and conflicts."
                />
                <LogEntry
                  timestamp="00:15.456"
                  level="info"
                  message="Reference context prepared"
                  details="Cross-study context: lattice parameter range (8.37-8.39 Å), Raman mode agreement (688-690 cm⁻¹). Fe³⁺/Fe²⁺ discrepancy remains surface-sensitive and validation-limited."
                />
                <LogEntry
                  timestamp="00:15.789"
                  level="info"
                  message="Evidence relation assessment"
                  details="Primary evidence: structural support. Validation gap: unindexed peaks require follow-up. Cross-technique convergence: multi-technique support observed"
                />
                <LogEntry
                  timestamp="00:16.012"
                  level="success"
                  message="Interpretation ready with validation requirements"
                  details="Working assignment: CuFe2O4 inverse spinel context (Fd-3m, a=8.38 A). Status: Requires validation. Recommended validation: HR-TEM for 62.3 degree anomaly."
                />
              </div>
            </Section>

            {/* System Information */}
            <Section title="System Information">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total execution time:</span>
                  <span className="text-slate-200 font-mono">16.012 seconds</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Peak detection time:</span>
                  <span className="text-slate-200 font-mono">1.111 s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Database search time:</span>
                  <span className="text-slate-200 font-mono">2.343 s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Interpretation time:</span>
                  <span className="text-slate-200 font-mono">5.657 s (2 calls)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Validation context time:</span>
                  <span className="text-slate-200 font-mono">4.901 s</span>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Memory usage:</span>
                    <span className="text-slate-200 font-mono">342 MB peak</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Database queries:</span>
                    <span className="text-slate-200 font-mono">3 (ICDD, COD, AMCSD)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">External API calls:</span>
                    <span className="text-slate-200 font-mono">0 (deterministic demo)</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Performance Metrics */}
            <Section title="Performance Review">
              <div className="space-y-2">
                <div className="rounded-lg bg-emerald-400/5 border border-emerald-400/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">Deterministic Processing</span>
                    <span className="text-emerald-300 font-mono text-xs">3.454 s (21.6%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Peak detection, background subtraction, database matching, relation assessment
                  </div>
                </div>
                
                <div className="rounded-lg bg-purple-400/5 border border-purple-400/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">Interpretation</span>
                    <span className="text-purple-300 font-mono text-xs">5.657 s (35.3%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Interpretation (2.324s), publication-context preparation (3.333s)
                  </div>
                </div>
                
                <div className="rounded-lg bg-cyan-400/5 border border-cyan-400/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">Validation Context</span>
                    <span className="text-cyan-300 font-mono text-xs">6.901 s (43.1%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Bundled reference matching (2.000s), validation context review (4.901s)
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}

interface SectionProps {
  title: string;
  badge?: string;
  badgeColor?: 'violet' | 'cyan' | 'emerald';
  children: React.ReactNode;
}

function Section({ title, badge, badgeColor = 'violet', children }: SectionProps) {
  const badgeColors = {
    violet: 'bg-violet-400/10 border-violet-400/30 text-violet-300',
    cyan: 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300',
    emerald: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </h3>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

interface LogEntryProps {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

function LogEntry({ timestamp, level, message, details }: LogEntryProps) {
  const levelStyles = {
    info: {
      icon: '●',
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-400/5',
      borderColor: 'border-cyan-400/20',
    },
    success: {
      icon: '✓',
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-400/5',
      borderColor: 'border-emerald-400/20',
    },
    warning: {
      icon: '⚠',
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-400/5',
      borderColor: 'border-amber-400/20',
    },
    error: {
      icon: '✕',
      iconColor: 'text-red-400',
      bgColor: 'bg-red-400/5',
      borderColor: 'border-red-400/20',
    },
  };

  const style = levelStyles[level];

  return (
    <div className={`rounded-lg border ${style.borderColor} ${style.bgColor} p-3`}>
      <div className="flex items-start gap-2">
        <span className={`${style.iconColor} text-xs font-bold mt-0.5`}>{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500 font-mono text-[10px]">{timestamp}</span>
            <span className="text-slate-300 text-xs font-medium">{message}</span>
          </div>
          {details && (
            <div className="text-[10px] text-slate-400 leading-relaxed">{details}</div>
          )}
        </div>
      </div>
    </div>
  );
}
