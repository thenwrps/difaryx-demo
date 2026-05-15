/**
 * Single source of truth for project evidence & parameters.
 *
 * Used by:
 *   - Dashboard project cards
 *   - AgentDemo header, CenterColumn, RightPanel
 *   - Notebook / export payloads
 *
 * Dashboard technique chips and Agent evidenceLayers MUST be derived from
 * the same functions in this file so they never drift apart.
 */

import type {
  DemoProject,
  DemoDataset,
  DemoPeak,
  Technique,
  JobType,
} from '../data/demoProjects';
import { getProjectDatasets } from '../data/demoProjects';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GraphType = 'xrd' | 'xps' | 'ftir' | 'raman';
export type EvidenceMode = 'single-tech' | 'multi-tech';

export type ParameterProvenance =
  | 'demo-default'
  | 'user-adjusted'
  | 'missing'
  | 'locked'
  | 'inferred';

export interface Parameter {
  key: string;
  value: string;
  provenance: ParameterProvenance;
  editable: boolean;
}

export type ParameterGroupId = 'project' | 'XRD' | 'XPS' | 'FTIR' | 'Raman';

export interface ParameterGroup {
  id: ParameterGroupId;
  title: string;
  params: Parameter[];
}

export interface DataPoint {
  x: number;
  y: number;
}

export interface EvidenceLayer {
  technique: Technique;
  role: string;
  status: 'available' | 'pending' | 'required';
  summary: string;
  limitation: string;
  claimContribution: string;
  parameters: Record<string, string>;
  hasGraphData: boolean;
  graphData: DataPoint[];
  graphType: GraphType;
  baselineData?: DataPoint[];
  peakMarkers?: DemoPeak[];
}

export interface GraphSource {
  technique: Technique;
  datasetId: string;
  datasetLabel: string;
  graphType: GraphType;
  dataPoints: DataPoint[];
  peakMarkers?: DemoPeak[];
  available: boolean;
}

// ─── JobType Helpers ──────────────────────────────────────────────────────────

/**
 * Strict job-type resolver.
 * Always prefers explicit `project.jobType`; only infers when missing.
 */
export function getProjectJobType(project: DemoProject): JobType {
  if (project.jobType) return project.jobType;
  const obj = (project.objective || '').toLowerCase();
  if (
    obj.includes('catalyst') ||
    obj.includes('optimization') ||
    obj.includes('dispersion') ||
    obj.includes('correlate multi')
  ) {
    return 'rnd';
  }
  if (
    obj.includes('report') ||
    obj.includes('acceptance') ||
    obj.includes('confirmatory')
  ) {
    return 'analytical';
  }
  return 'research';
}

/**
 * Human-readable job-type label used on Dashboard cards.
 * Must match Agent workspace job type so they never drift.
 */
export function getProjectJobTypeLabel(project: DemoProject): string {
  const jt = getProjectJobType(project);
  switch (jt) {
    case 'rnd':
      return 'R&D PROJECT';
    case 'analytical':
      return 'ANALYTICAL JOB';
    case 'research':
    default:
      return 'RESEARCH PROJECT';
  }
}

export function getProjectJobTypeBadgeColor(project: DemoProject): string {
  const jt = getProjectJobType(project);
  if (jt === 'rnd') return 'border-cyan/40 bg-cyan/10 text-cyan';
  if (jt === 'analytical') return 'border-amber-500/40 bg-amber-500/10 text-amber-600';
  return 'border-primary/40 bg-primary/10 text-primary';
}

// ─── Technique Helpers ────────────────────────────────────────────────────────

const KNOWN_TECHNIQUES: Technique[] = ['XRD', 'XPS', 'FTIR', 'Raman'];

/**
 * Canonical technique list for a project.
 * Merges project.techniques, project.techniqueMetadata, project.evidenceSources,
 * and techniques mentioned in project.validationGaps. This is the list the
 * Dashboard, Agent popover, Evidence Layers, and notebook/export all share.
 */
export function getProjectTechniques(project: DemoProject): Technique[] {
  const set = new Set<Technique>();
  project.techniques.forEach((t) => set.add(t));
  if (project.techniqueMetadata) {
    project.techniqueMetadata.forEach((tm) => set.add(tm.key));
  }
  if (project.evidenceSources) {
    project.evidenceSources.forEach((es) => set.add(es.technique));
  }
  if (project.validationGaps) {
    project.validationGaps.forEach((gap) => {
      KNOWN_TECHNIQUES.forEach((t) => {
        if (gap.description.includes(t)) set.add(t);
      });
    });
  }
  // Stable order: XRD, XPS, FTIR, Raman
  return KNOWN_TECHNIQUES.filter((t) => set.has(t));
}

export function getGraphTypeForTechnique(technique: Technique): GraphType {
  const map: Record<Technique, GraphType> = {
    XRD: 'xrd',
    XPS: 'xps',
    FTIR: 'ftir',
    Raman: 'raman',
  };
  return map[technique] || 'xrd';
}

// ─── Graph Sources ────────────────────────────────────────────────────────────

/**
 * Graph sources available for a project, indexed by technique.
 * Both Dashboard preview graphs and AgentDemo center graph use this.
 */
export function getProjectGraphSources(project: DemoProject): GraphSource[] {
  const datasets = getProjectDatasets(project.id) || [];
  const techniques = getProjectTechniques(project);
  return techniques.map((technique): GraphSource => {
    const ds: DemoDataset | undefined = datasets.find(
      (d) => d.technique === technique && d.dataPoints && d.dataPoints.length > 0,
    );
    return {
      technique,
      datasetId: ds?.id || '',
      datasetLabel: ds?.sampleName || `${technique} dataset`,
      graphType: getGraphTypeForTechnique(technique),
      dataPoints: ds?.dataPoints || [],
      peakMarkers: ds?.detectedFeatures,
      available: !!ds,
    };
  });
}

// ─── Evidence Layers (canonical) ──────────────────────────────────────────────

function getTechniqueRole(technique: Technique, index: number): string {
  const map: Record<Technique, { primary: string; secondary: string }> = {
    XRD: { primary: 'Primary structural evidence', secondary: 'Structural evidence' },
    XPS: {
      primary: 'Primary surface chemistry evidence',
      secondary: 'Surface chemistry / oxidation-state validation',
    },
    FTIR: {
      primary: 'Primary bonding evidence',
      secondary: 'Bonding / surface functional context',
    },
    Raman: {
      primary: 'Primary vibrational evidence',
      secondary: 'Local structure / vibrational support',
    },
  };
  const entry = map[technique];
  if (!entry) return 'Supporting evidence';
  return index === 0 ? entry.primary : entry.secondary;
}

function getTechniqueLimitation(technique: Technique): string {
  const map: Record<Technique, string> = {
    XRD: 'Cannot confirm surface oxidation state or functional groups alone',
    XPS: 'Surface-sensitive; cannot alone confirm bulk phase assignment',
    FTIR: 'Bonding evidence does not replace structural phase assignment',
    Raman: 'Supports local structure but is not full phase refinement',
  };
  return map[technique] || 'Technique-specific limitations apply';
}

function getClaimContribution(technique: Technique, index: number): string {
  if (index === 0) return 'Anchors primary claim assignment';
  const map: Record<Technique, string> = {
    XRD: 'Provides structural cross-validation',
    XPS: 'Validates surface oxidation state',
    FTIR: 'Confirms bonding context',
    Raman: 'Supports local symmetry assignment',
  };
  return map[technique] || 'Provides supporting evidence';
}

function getTechniqueSummary(technique: Technique, project: DemoProject): string {
  if (project.evidenceSources) {
    const src = project.evidenceSources.find((s) => s.technique === technique);
    if (src) return src.description;
  }
  if (project.evidence && project.evidence.length > 0) {
    const match = project.evidence.find((e) =>
      e.toLowerCase().includes(technique.toLowerCase()),
    );
    if (match) return match;
  }
  const fallback: Record<Technique, string> = {
    XRD: 'Diffraction pattern available for phase assignment review.',
    XPS: 'Surface chemistry data available for oxidation-state validation.',
    FTIR: 'IR spectrum available for bonding / functional group analysis.',
    Raman: 'Raman spectrum available for vibrational / local symmetry review.',
  };
  return fallback[technique] || 'Evidence data available for review.';
}

/**
 * Canonical evidence layers for a project, in stable technique order.
 * AgentDemo and notebook/export all use this exact list; Dashboard card
 * chips derive from the same techniques.
 */
export function getProjectEvidenceLayers(project: DemoProject): EvidenceLayer[] {
  const techniques = getProjectTechniques(project);
  const sources = getProjectGraphSources(project);
  return techniques.map((technique, i) => {
    const src = sources.find((s) => s.technique === technique);
    const hasData = !!src && src.available && src.dataPoints.length > 0;
    let status: 'available' | 'pending' | 'required' = hasData ? 'available' : 'pending';
    if (!hasData && project.validationGaps) {
      const gapRequires = project.validationGaps.some((gap) =>
        gap.description.toLowerCase().includes(technique.toLowerCase()),
      );
      if (gapRequires) status = 'required';
    }
    return {
      technique,
      role: getTechniqueRole(technique, i),
      status,
      summary: getTechniqueSummary(technique, project),
      limitation: getTechniqueLimitation(technique),
      claimContribution: getClaimContribution(technique, i),
      parameters: getTechniqueParameterMap(technique),
      hasGraphData: hasData,
      graphData: hasData ? src!.dataPoints : [],
      graphType: getGraphTypeForTechnique(technique),
      baselineData: undefined,
      peakMarkers: hasData ? src!.peakMarkers : undefined,
    };
  });
}

// ─── Parameter Groups (canonical, with provenance) ────────────────────────────

/**
 * Demo-default technique parameters.
 * Parameters that are not present in the demo datasets are explicitly flagged
 * with `provenance: 'missing'` so the UI never pretends data exists.
 */
function getTechniqueDefaultParams(technique: Technique): Parameter[] {
  switch (technique) {
    case 'XRD':
      return [
        { key: '2θ range', value: '10° – 80°', provenance: 'demo-default', editable: true },
        { key: 'Radiation source', value: 'Cu Kα', provenance: 'demo-default', editable: true },
        { key: 'Step size', value: '0.02°', provenance: 'demo-default', editable: true },
        { key: 'Peak threshold', value: 'Auto', provenance: 'demo-default', editable: true },
        { key: 'Phase candidates', value: 'Spinel ferrite', provenance: 'demo-default', editable: true },
        { key: 'Refinement', value: 'Pending', provenance: 'missing', editable: false },
      ];
    case 'XPS':
      return [
        { key: 'Core levels', value: 'Survey + high-res', provenance: 'demo-default', editable: true },
        { key: 'Calibration', value: 'C 1s 284.8 eV', provenance: 'demo-default', editable: true },
        { key: 'Surface sensitivity', value: '~10 nm', provenance: 'demo-default', editable: true },
        { key: 'Oxidation targets', value: 'Cu²⁺, Fe³⁺', provenance: 'demo-default', editable: true },
        { key: 'Charge correction', value: 'Applied', provenance: 'demo-default', editable: true },
      ];
    case 'FTIR':
      return [
        { key: 'Wavenumber range', value: '400 – 4000 cm⁻¹', provenance: 'demo-default', editable: true },
        { key: 'Functional groups', value: 'M–O, Si–O–Si, O–H', provenance: 'demo-default', editable: true },
        { key: 'Baseline correction', value: 'Applied', provenance: 'demo-default', editable: true },
        { key: 'Bonding focus', value: 'Metal–oxygen bands', provenance: 'demo-default', editable: true },
      ];
    case 'Raman':
      return [
        { key: 'Shift range', value: '100 – 1200 cm⁻¹', provenance: 'demo-default', editable: true },
        { key: 'Excitation', value: 'Not provided in demo dataset', provenance: 'missing', editable: false },
        { key: 'Symmetry focus', value: 'A1g / T2g modes', provenance: 'demo-default', editable: true },
        { key: 'Mode assignment', value: 'Spinel lattice', provenance: 'demo-default', editable: true },
      ];
    default:
      return [];
  }
}

function getTechniqueParameterMap(technique: Technique): Record<string, string> {
  const map: Record<string, string> = {};
  getTechniqueDefaultParams(technique).forEach((p) => {
    map[p.key] = p.value;
  });
  return map;
}

/**
 * Project-level parameters. jobType-aware: R&D emphasises formulation/process,
 * Analytical emphasises sample/method/acceptance, Research emphasises objective.
 */
function getProjectLevelParams(project: DemoProject): Parameter[] {
  const jobType = getProjectJobType(project);
  const base: Parameter[] = [
    { key: 'Material system', value: project.material, provenance: 'demo-default', editable: false },
    { key: 'Objective', value: project.objective || 'Evidence review', provenance: 'demo-default', editable: true },
    { key: 'Job type', value: jobType, provenance: project.jobType ? 'demo-default' : 'inferred', editable: false },
    { key: 'Evidence readiness', value: project.reportReadiness?.label || 'Pending', provenance: 'demo-default', editable: false },
  ];
  if (jobType === 'rnd') {
    base.push(
      { key: 'Process variable', value: 'Not provided in demo dataset', provenance: 'missing', editable: true },
      { key: 'Optimization target', value: 'Not provided in demo dataset', provenance: 'missing', editable: true },
      { key: 'Risk level', value: 'Moderate (demo default)', provenance: 'demo-default', editable: true },
    );
  } else if (jobType === 'analytical') {
    base.push(
      { key: 'Sample ID', value: project.id, provenance: 'demo-default', editable: false },
      { key: 'Method', value: 'Not provided in demo dataset', provenance: 'missing', editable: true },
      { key: 'Acceptance criteria', value: 'Not provided in demo dataset', provenance: 'missing', editable: true },
      { key: 'Report status', value: project.reportReadiness?.label || 'Pending', provenance: 'demo-default', editable: false },
      { key: 'Confirmatory test', value: 'Required pending review', provenance: 'demo-default', editable: true },
    );
  } else {
    base.push(
      { key: 'Expected claim type', value: 'Phase identity / evidence-linked claim', provenance: 'demo-default', editable: true },
      { key: 'Publication readiness', value: project.reportReadiness?.label || 'Pending', provenance: 'demo-default', editable: false },
    );
  }
  return base;
}

/**
 * Canonical parameter groups: project + one group per included technique.
 * This is the baseline used by the Agent RightPanel parameter editor.
 */
export function getProjectParameterGroups(project: DemoProject): ParameterGroup[] {
  const groups: ParameterGroup[] = [
    { id: 'project', title: 'Project Parameters', params: getProjectLevelParams(project) },
  ];
  const techniques = getProjectTechniques(project);
  techniques.forEach((t) => {
    groups.push({ id: t, title: `${t} Parameters`, params: getTechniqueDefaultParams(t) });
  });
  return groups;
}

// ─── Provenance helpers ───────────────────────────────────────────────────────

export function getProvenanceLabel(p: ParameterProvenance): string {
  switch (p) {
    case 'demo-default':
      return 'Demo default';
    case 'user-adjusted':
      return 'User adjusted';
    case 'missing':
      return 'Missing in demo dataset';
    case 'locked':
      return 'Locked context';
    case 'inferred':
      return 'Inferred from dataset';
    default:
      return p;
  }
}

export function getProvenanceStyle(p: ParameterProvenance): string {
  switch (p) {
    case 'demo-default':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'user-adjusted':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'missing':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'locked':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'inferred':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
