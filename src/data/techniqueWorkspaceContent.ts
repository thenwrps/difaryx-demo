import type { TechniqueId } from './demoProjectRegistry';

export type TechniqueWorkspaceId = Exclude<TechniqueId, 'multi'>;

export interface TechniqueWorkspaceTab {
  id: string;
  label: string;
}

export interface TechniquePipelineStep {
  id: string;
  label: string;
  summary: string;
}

export type TechniqueParameterValue = string | number | boolean | string[];
export type TechniqueParameterControlType = 'select' | 'number' | 'range' | 'text' | 'toggle' | 'checkbox-group';

export interface TechniqueParameterControl {
  id: string;
  label: string;
  type: TechniqueParameterControlType;
  defaultValue: TechniqueParameterValue;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  affectedStepIds: string[];
}

export interface TechniqueWorkspaceConfig {
  id: TechniqueWorkspaceId;
  label: string;
  title: string;
  fullName: string;
  purpose: string;
  graphLabel: string;
  featureLabel: string;
  unitLabel: string;
  centerTabs: TechniqueWorkspaceTab[];
  pipeline: TechniquePipelineStep[];
  parameters: TechniqueParameterControl[];
  reprocessLabel: string;
}

export const TECHNIQUE_WORKSPACE_CONFIG: Record<TechniqueWorkspaceId, TechniqueWorkspaceConfig> = {
  xrd: {
    id: 'xrd',
    label: 'XRD',
    title: 'XRD Workspace',
    fullName: 'X-ray Diffraction',
    purpose: 'Bulk phase and long-range structure evidence review.',
    graphLabel: 'Pattern',
    featureLabel: 'Peaks',
    unitLabel: '2theta',
    centerTabs: [
      { id: 'pattern', label: 'Pattern' },
      { id: 'peaks', label: 'Peaks' },
      { id: 'match', label: 'Match' },
      { id: 'residual', label: 'Residual' },
      { id: 'rietveld', label: 'Rietveld' },
    ],
    pipeline: [
      { id: 'baseline', label: 'Baseline', summary: 'Baseline correction reviewed for phase assignment.' },
      { id: 'smooth', label: 'Smooth', summary: 'Smoothing applied before peak detection.' },
      { id: 'peaks', label: 'Peaks', summary: 'Diffraction peaks detected and indexed where possible.' },
      { id: 'fit', label: 'Fit', summary: 'Peak fit state preserved for evidence review.' },
      { id: 'match', label: 'Match', summary: 'Reference matching contributes to the claim boundary.' },
      { id: 'refinement', label: 'Refinement', summary: 'Optional refinement remains available for publication-level claims.' },
    ],
    parameters: [
      {
        id: 'baselineMethod',
        label: 'Baseline method',
        type: 'select',
        defaultValue: 'Asymmetric LS',
        options: ['Asymmetric LS', 'Polynomial', 'Rolling Ball', 'None'],
        affectedStepIds: ['baseline'],
      },
      {
        id: 'smoothingMethod',
        label: 'Smoothing method',
        type: 'select',
        defaultValue: 'Savitzky-Golay',
        options: ['Savitzky-Golay', 'Moving Average', 'None'],
        affectedStepIds: ['smooth'],
      },
      {
        id: 'smoothingWindow',
        label: 'Smoothing window',
        type: 'number',
        defaultValue: 7,
        min: 1,
        max: 51,
        step: 2,
        affectedStepIds: ['smooth'],
      },
      {
        id: 'peakThreshold',
        label: 'Peak threshold',
        type: 'range',
        defaultValue: 0.12,
        min: 0.01,
        max: 1,
        step: 0.01,
        affectedStepIds: ['peaks'],
      },
      {
        id: 'minimumProminence',
        label: 'Minimum prominence',
        type: 'number',
        defaultValue: 0.08,
        min: 0,
        max: 1,
        step: 0.01,
        affectedStepIds: ['peaks'],
      },
      {
        id: 'fitModel',
        label: 'Fit model',
        type: 'select',
        defaultValue: 'Pseudo-Voigt',
        options: ['Pseudo-Voigt', 'Gaussian', 'Lorentzian'],
        affectedStepIds: ['fit'],
      },
      {
        id: 'referenceDatabase',
        label: 'Reference database',
        type: 'select',
        defaultValue: 'ICSD',
        options: ['ICSD', 'PDF-4+', 'Local Reference'],
        affectedStepIds: ['match'],
      },
      {
        id: 'twoThetaMin',
        label: '2theta min',
        type: 'number',
        defaultValue: 10,
        min: 0,
        max: 180,
        step: 0.1,
        unit: 'deg',
        affectedStepIds: ['baseline', 'peaks', 'match'],
      },
      {
        id: 'twoThetaMax',
        label: '2theta max',
        type: 'number',
        defaultValue: 80,
        min: 0,
        max: 180,
        step: 0.1,
        unit: 'deg',
        affectedStepIds: ['baseline', 'peaks', 'match'],
      },
      {
        id: 'wavelength',
        label: 'Wavelength',
        type: 'text',
        defaultValue: 'Cu Kα 1.5406 Å',
        affectedStepIds: ['match', 'refinement'],
      },
    ],
    reprocessLabel: 'Reprocess Peaks',
  },
  xps: {
    id: 'xps',
    label: 'XPS',
    title: 'XPS Workspace',
    fullName: 'X-ray Photoelectron Spectroscopy',
    purpose: 'Surface chemistry and oxidation-state evidence review.',
    graphLabel: 'Spectrum',
    featureLabel: 'Core-level evidence',
    unitLabel: 'Binding energy',
    centerTabs: [
      { id: 'spectrum', label: 'Spectrum' },
      { id: 'peak-list', label: 'Peak List' },
      { id: 'chemical-states', label: 'Chemical States' },
      { id: 'fit', label: 'Fit' },
      { id: 'assignment', label: 'Assignment' },
    ],
    pipeline: [
      { id: 'background-subtraction', label: 'Background Subtraction', summary: 'Background model prepared for core-level regions.' },
      { id: 'smoothing', label: 'Smoothing', summary: 'Signal smoothing applied before component review.' },
      { id: 'peak-detection', label: 'Peak Detection', summary: 'Candidate photoelectron peaks detected.' },
      { id: 'peak-fitting', label: 'Peak Fitting', summary: 'Component fit state recorded for review.' },
      { id: 'chemical-state-assignment', label: 'Chemical State Assignment', summary: 'Oxidation-state assignment remains boundary-aware.' },
      { id: 'review', label: 'Review', summary: 'Surface-state interpretation is reviewed against validation limits.' },
    ],
    parameters: [
      {
        id: 'energyCalibrationReference',
        label: 'Energy calibration reference',
        type: 'select',
        defaultValue: 'C 1s 284.8 eV',
        options: ['C 1s 284.8 eV', 'Au 4f7/2', 'Custom'],
        affectedStepIds: ['background-subtraction', 'peak-fitting'],
      },
      {
        id: 'backgroundMethod',
        label: 'Background method',
        type: 'select',
        defaultValue: 'Shirley',
        options: ['Shirley', 'Tougaard', 'Linear', 'None'],
        affectedStepIds: ['background-subtraction'],
      },
      {
        id: 'smoothingMethod',
        label: 'Smoothing method',
        type: 'select',
        defaultValue: 'Savitzky-Golay',
        options: ['Savitzky-Golay', 'Moving Average', 'None'],
        affectedStepIds: ['smoothing'],
      },
      {
        id: 'regionSelection',
        label: 'Region selection',
        type: 'select',
        defaultValue: 'Survey',
        options: ['Survey', 'Cu 2p', 'Fe 2p', 'O 1s', 'Custom'],
        affectedStepIds: ['peak-detection', 'peak-fitting'],
      },
      {
        id: 'peakModel',
        label: 'Peak model',
        type: 'select',
        defaultValue: 'Gaussian-Lorentzian',
        options: ['Gaussian-Lorentzian', 'Voigt', 'Gaussian'],
        affectedStepIds: ['peak-fitting'],
      },
      {
        id: 'fittingConstraint',
        label: 'Fitting constraint',
        type: 'checkbox-group',
        defaultValue: ['FWHM linked', 'spin-orbit split'],
        options: ['FWHM linked', 'spin-orbit split', 'area ratio lock'],
        affectedStepIds: ['peak-fitting', 'chemical-state-assignment'],
      },
      {
        id: 'chargeCorrection',
        label: 'Charge correction',
        type: 'toggle',
        defaultValue: true,
        affectedStepIds: ['background-subtraction', 'chemical-state-assignment'],
      },
    ],
    reprocessLabel: 'Fit Region',
  },
  ftir: {
    id: 'ftir',
    label: 'FTIR',
    title: 'FTIR Workspace',
    fullName: 'Fourier Transform Infrared',
    purpose: 'Bonding and functional-group evidence review.',
    graphLabel: 'Spectrum',
    featureLabel: 'Bands',
    unitLabel: 'Wavenumber',
    centerTabs: [
      { id: 'spectrum', label: 'Spectrum' },
      { id: 'band-list', label: 'Band List' },
      { id: 'functional-groups', label: 'Functional Groups' },
      { id: 'baseline', label: 'Baseline' },
      { id: 'assignment', label: 'Assignment' },
    ],
    pipeline: [
      { id: 'baseline-correction', label: 'Baseline Correction', summary: 'Baseline correction prepared for band review.' },
      { id: 'smoothing', label: 'Smoothing', summary: 'Spectrum smoothing applied before band detection.' },
      { id: 'band-detection', label: 'Band Detection', summary: 'Bands detected for functional evidence.' },
      { id: 'band-assignment', label: 'Band Assignment', summary: 'Band assignments linked to project evidence.' },
      { id: 'functional-group-analysis', label: 'Functional Group Analysis', summary: 'Functional-group context contributes to validation.' },
      { id: 'review', label: 'Review', summary: 'Functional-group interpretation is reviewed against project limits.' },
    ],
    parameters: [
      {
        id: 'baselineMethod',
        label: 'Baseline method',
        type: 'select',
        defaultValue: 'Rubberband',
        options: ['Rubberband', 'ALS', 'Polynomial', 'None'],
        affectedStepIds: ['baseline-correction'],
      },
      {
        id: 'smoothingMethod',
        label: 'Smoothing method',
        type: 'select',
        defaultValue: 'Savitzky-Golay',
        options: ['Savitzky-Golay', 'Moving Average', 'None'],
        affectedStepIds: ['smoothing'],
      },
      {
        id: 'bandThreshold',
        label: 'Band threshold',
        type: 'range',
        defaultValue: 0.18,
        min: 0.01,
        max: 1,
        step: 0.01,
        affectedStepIds: ['band-detection'],
      },
      {
        id: 'wavenumberMax',
        label: 'Wavenumber max',
        type: 'number',
        defaultValue: 4000,
        min: 400,
        max: 4500,
        step: 10,
        unit: 'cm⁻¹',
        affectedStepIds: ['baseline-correction', 'band-detection'],
      },
      {
        id: 'wavenumberMin',
        label: 'Wavenumber min',
        type: 'number',
        defaultValue: 400,
        min: 100,
        max: 4000,
        step: 10,
        unit: 'cm⁻¹',
        affectedStepIds: ['baseline-correction', 'band-detection'],
      },
      {
        id: 'assignmentLibrary',
        label: 'Assignment library',
        type: 'select',
        defaultValue: 'Functional groups',
        options: ['Functional groups', 'Surface hydroxyl', 'Metal-oxygen', 'Custom'],
        affectedStepIds: ['band-assignment', 'functional-group-analysis'],
      },
      {
        id: 'normalization',
        label: 'Normalization',
        type: 'select',
        defaultValue: 'None',
        options: ['None', 'Min-max', 'Area', 'Vector'],
        affectedStepIds: ['smoothing', 'band-detection'],
      },
    ],
    reprocessLabel: 'Detect Bands',
  },
  raman: {
    id: 'raman',
    label: 'Raman',
    title: 'Raman Workspace',
    fullName: 'Raman Spectroscopy',
    purpose: 'Vibrational mode and local symmetry evidence review.',
    graphLabel: 'Spectrum',
    featureLabel: 'Modes',
    unitLabel: 'Raman shift',
    centerTabs: [
      { id: 'spectrum', label: 'Spectrum' },
      { id: 'peak-list', label: 'Peak List' },
      { id: 'mode-assignments', label: 'Mode Assignments' },
      { id: 'baseline', label: 'Baseline' },
      { id: 'assignment', label: 'Assignment' },
    ],
    pipeline: [
      { id: 'baseline-correction', label: 'Baseline Correction', summary: 'Baseline correction prepared for mode review.' },
      { id: 'smoothing', label: 'Smoothing', summary: 'Signal smoothing applied before peak detection.' },
      { id: 'peak-detection', label: 'Peak Detection', summary: 'Raman peaks detected for mode assignment.' },
      { id: 'mode-assignment', label: 'Mode Assignment', summary: 'Vibrational modes linked to project interpretation.' },
      { id: 'phase-defect-interpretation', label: 'Phase / Defect Interpretation', summary: 'Local structure limits are recorded in the boundary.' },
      { id: 'review', label: 'Review', summary: 'Mode interpretation is reviewed against claim boundaries.' },
    ],
    parameters: [
      {
        id: 'baselineMethod',
        label: 'Baseline method',
        type: 'select',
        defaultValue: 'Polynomial',
        options: ['Polynomial', 'ALS', 'Rolling Ball', 'None'],
        affectedStepIds: ['baseline-correction'],
      },
      {
        id: 'polynomialOrder',
        label: 'Polynomial order',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
        affectedStepIds: ['baseline-correction'],
      },
      {
        id: 'smoothingMethod',
        label: 'Smoothing method',
        type: 'select',
        defaultValue: 'Moving Average',
        options: ['Moving Average', 'Savitzky-Golay', 'None'],
        affectedStepIds: ['smoothing'],
      },
      {
        id: 'peakThreshold',
        label: 'Peak threshold',
        type: 'range',
        defaultValue: 0.14,
        min: 0.01,
        max: 1,
        step: 0.01,
        affectedStepIds: ['peak-detection'],
      },
      {
        id: 'ramanShiftMin',
        label: 'Raman shift min',
        type: 'number',
        defaultValue: 100,
        min: 0,
        max: 3200,
        step: 10,
        unit: 'cm⁻¹',
        affectedStepIds: ['baseline-correction', 'peak-detection'],
      },
      {
        id: 'ramanShiftMax',
        label: 'Raman shift max',
        type: 'number',
        defaultValue: 3200,
        min: 100,
        max: 4000,
        step: 10,
        unit: 'cm⁻¹',
        affectedStepIds: ['baseline-correction', 'peak-detection'],
      },
      {
        id: 'modeLibrary',
        label: 'Mode library',
        type: 'select',
        defaultValue: 'Ferrite modes',
        options: ['Ferrite modes', 'Carbon bands', 'Oxide modes', 'Custom'],
        affectedStepIds: ['mode-assignment', 'phase-defect-interpretation'],
      },
      {
        id: 'cosmicRayRemoval',
        label: 'Cosmic ray removal',
        type: 'toggle',
        defaultValue: true,
        affectedStepIds: ['smoothing', 'peak-detection'],
      },
    ],
    reprocessLabel: 'Detect Modes',
  },
};

export function getTechniqueWorkspaceConfig(technique: TechniqueWorkspaceId): TechniqueWorkspaceConfig {
  return TECHNIQUE_WORKSPACE_CONFIG[technique];
}
