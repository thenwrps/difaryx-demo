import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BarChart3, Download, FileText, FlaskConical, Plus, Save, Share2, Target } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AIInsightPanel } from '../components/ui/AIInsightPanel';
import { ExperimentModal } from '../components/workspace/ExperimentModal';
import {
  ProcessingRun,
  demoProjects,
  generateNotebookSections,
  getAgentPath,
  getDataset,
  getLocalExperiments,
  getNotebookPath,
  getProcessingRun,
  getProcessingRuns,
  getProject,
  getProjectInsight,
  getWorkspaceRoute,
  loadAgentRunResult,
} from '../data/demoProjects';
import { DemoExportFormat, exportDemoArtifact } from '../utils/demoExport';
import { getRun, type AgentRun } from '../data/runModel';
import {
  NOTEBOOK_TEMPLATES,
  createNotebookEntryFromRefinement,
  createProcessingResultFromXrdDemo,
  createReportSectionFromNotebookEntry,
  getLatestAgentDiscussionRefinement,
  getLatestNotebookEntry,
  getLatestProcessingResult,
  getNotebookEntry,
  normalizeNotebookTemplateMode,
  refineDiscussionFromProcessing,
  saveAgentDiscussionRefinement,
  saveNotebookEntry,
  saveProcessingResult,
  type NotebookTemplateMode,
} from '../data/workflowPipeline';
import {
  XRD_DEMO_DATASETS,
  getXrdProjectCompatibility,
  isDatasetCompatibleWithProject,
} from '../data/xrdDemoDatasets';
import { getLockedContext } from '../data/lockedContext';
import {
  formatConditionLockTimestamp,
  getConditionBoundaryNotes,
  getExperimentConditionLock,
  getConditionLockSectionLines,
  getConditionLockStatusLabel,
} from '../data/experimentConditionLock';

const NOTEBOOK_TEMPLATE_MODES: NotebookTemplateMode[] = ['research', 'rd', 'analytical'];

function formatClaimStatus(status: string): string {
  switch (status) {
    case 'strongly_supported': return 'Supported assignment with validation boundaries';
    case 'supported': return 'Requires validation';
    case 'partial': return 'Validation-limited';
    case 'inconclusive': return 'Publication-limited';
    case 'contradicted': return 'Claim boundary';
    default: return status;
  }
}

const NOTEBOOK_TEMPLATE_DETAILS: Record<
  NotebookTemplateMode,
  {
    description: string;
    output: string;
    status: string;
    primaryLabel: string;
    reportPreview: string;
    badges: string[];
  }
> = {
  research: {
    description:
      'For hypothesis-driven research, evidence fusion, claim boundaries, mechanism discussion, and manuscript-ready interpretation.',
    output: 'Report-ready for internal scientific review; publication-level claims remain validation-limited.',
    status: 'Publication-limited',
    primaryLabel: 'Refined Discussion',
    reportPreview: 'Manuscript discussion section generated from this notebook entry.',
    badges: ['Source workflow', 'Refined discussion', 'Evidence review', 'Claim boundary', 'Validation notes'],
  },
  rd: {
    description:
      'For prototype development, technical validation, optimization, feasibility review, and go/no-go decisions.',
    output: 'Technical report + development status + next action.',
    status: 'Review-ready',
    primaryLabel: 'Go/No-Go Rationale',
    reportPreview: 'Technical report section generated from prototype metrics, risk review, and decision rationale.',
    badges: ['Source workflow', 'Risk review', 'Go/No-Go rationale', 'Development status', 'Next development plan'],
  },
  analytical: {
    description:
      'For sample analysis, method execution, calibration, QA/QC, result validity, and analytical reporting.',
    output: 'Analytical report + QA/QC status + review or retest decision.',
    status: 'Report-ready',
    primaryLabel: 'Reviewed Result',
    reportPreview: 'Analytical report section generated from method, QA/QC, and result validity.',
    badges: ['Source workflow', 'QA/QC review', 'Result validity', 'Analytical result', 'Review / Retest'],
  },
};

type SupportingDataItem = {
  technique: string;
  evidence: string;
  strength: 'Ready' | 'Review' | 'In Progress';
  dataset: string;
  caveat: string;
};

const DETERMINISTIC_TRACE = [
  'load_xrd_dataset',
  'detect_xrd_peaks',
  'search_phase_database',
  'evaluate_phase_candidates',
  'analyze_peak_conflicts',
  'interpretation_refinement',
  'generate_xrd_discussion',
];

const SBA15_DETERMINISTIC_TRACE = [
  'load_primary_xrd_dataset',
  'detect_xrd_reflections',
  'compare_spinel_reference_scope',
  'attach_raman_ftir_context',
  'flag_xps_surface_state_gap',
  'validation_boundary_review',
  'generate_multitech_discussion',
];

function hasMatchedXrdDemoData(projectId: string): boolean {
  const compatibility = getXrdProjectCompatibility(projectId);
  if (!compatibility) return false;

  return compatibility.datasetIds.some((datasetId) => (
    isDatasetCompatibleWithProject(datasetId, projectId) &&
    XRD_DEMO_DATASETS.some((dataset) => dataset.id === datasetId)
  ));
}

function getProjectNotebookContent(projectId: string) {
  if (projectId === 'cufe2o4-sba15') {
    return {
      experimentTitle: 'Exp-044: CuFe₂O₄/SBA-15 Multi-Tech Correlation',
      summary:
        'XRD Phase Identification: CuFe₂O₄-related reflections observed in a CuFe₂O₄/SBA-15 supported sample. XRD supports structural assignment, while dispersion, loading uniformity, phase purity, and surface oxidation state remain validation-limited.',
      discussion:
        'The processed evidence supports CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample, consistent with dispersed copper ferrite on mesoporous SBA-15. Phase distribution, loading uniformity, surface oxidation state, and support interaction remain validation-limited.',
      reportPreview:
        'The processed evidence supports CuFe₂O₄ spinel ferrite reflections in the CuFe₂O₄/SBA-15 sample. Supporting Raman evidence is consistent with ferrite-like local symmetry, while FTIR contextualizes the silica support environment. The interpretation should remain framed as validation-limited because phase distribution, support interaction, loading uniformity, and surface oxidation-state assignment require additional validation.',
      keyEvidence: [
        'XRD reflections assigned to CuFe₂O₄ remain visible in the supported CuFe₂O₄/SBA-15 sample.',
        'Raman vibrational modes provide supporting evidence for ferrite-like local structure.',
        'FTIR silica/support features contextualize the SBA-15 matrix but do not independently establish ferrite phase purity.',
      ],
      supportingData: [
        {
          technique: 'XRD',
          evidence: 'CuFe₂O₄-assigned reflections remain visible in the supported sample',
          strength: 'Ready' as const,
          dataset: 'xrd-cufe2o4-sba15-demo',
          caveat: 'Reflection visibility supports assignment but not loading uniformity across SBA-15.',
        },
        {
          technique: 'Raman',
          evidence: 'Ferrite-like vibrational modes support local spinel symmetry',
          strength: 'Ready' as const,
          dataset: 'cu-fe2o4-sba15_raman.txt',
          caveat: 'Raman support remains contextual and does not establish phase purity alone.',
        },
        {
          technique: 'FTIR',
          evidence: 'Silica/support bands contextualize the SBA-15 matrix',
          strength: 'In Progress' as const,
          dataset: 'cu-fe2o4-sba15_ftir.csv',
          caveat: 'FTIR support features do not independently establish ferrite phase purity.',
        },
        {
          technique: 'XPS',
          evidence: 'Surface oxidation-state assignment remains under review',
          strength: 'Review' as const,
          dataset: 'cu-fe2o4-sba15_surface_xps.spe',
          caveat: 'Run Cu 2p / Fe 2p review before surface-state claims.',
        },
      ] satisfies SupportingDataItem[],
      validationNotes: [
        'Quantify CuFe₂O₄ loading and distribution across SBA-15.',
        'Review XPS Cu/Fe oxidation state and surface enrichment.',
        'Compare FTIR silica bands and metal-oxygen bands under the support matrix.',
        'Use microscopy or mapping evidence to validate dispersion and support interaction.',
      ],
      runLog: [
        ['Processing run', 'xrd-run-044'],
        ['Refinement', 'refine-044'],
        ['Dataset', 'xrd-cufe2o4-sba15-demo'],
        ['Workflow version', 'difaryx-analysis-v0.1'],
      ],
      phaseLabel: 'CuFe₂O₄ dispersed on mesoporous SBA-15',
      peakDetection: '5 ferrite-related reflections detected with broad SBA-15 support contribution.',
    };
  }

  return {
    experimentTitle: 'Exp-042: CuFe₂O₄ Spinel Phase Confirmation',
    summary:
      'XRD Phase Identification: Supported CuFe₂O₄ spinel ferrite phase assignment with validation boundaries.',
    discussion:
      'The processed XRD pattern supports CuFe₂O₄ spinel ferrite phase assignment, with validation still required before publication-level phase-purity claims.',
    reportPreview:
      'The processed XRD pattern supports CuFe₂O₄ spinel ferrite phase assignment. Publication-level phase-purity claims remain validation-limited until supporting cross-technique and replicate evidence are reviewed.',
    keyEvidence: [
      'XRD reflections near 30.1 deg, 35.5 deg, and 43.2 deg 2theta align with spinel ferrite reference peaks.',
      'Raman A1g/T2g vibrational features support local spinel symmetry.',
      'Peak width and unresolved weak reflections indicate validation is still required before phase-purity claims.',
    ],
    supportingData: [
      {
        technique: 'XRD',
        evidence: 'Spinel diffraction peaks align with reference positions',
        strength: 'Ready' as const,
        dataset: 'cufe2o4_clean_demo.xy',
        caveat: 'Reference comparison supports assignment but not publication-level phase purity.',
      },
      {
        technique: 'Raman',
        evidence: 'A1g/T2g vibrational features support local spinel symmetry',
        strength: 'Ready' as const,
        dataset: 'cu-fe2o4-spinel_raman.txt',
        caveat: 'Mode assignment supports phase but does not replace XRD.',
      },
      {
        technique: 'FTIR',
        evidence: 'Metal-oxygen/support bonding signatures provide context',
        strength: 'In Progress' as const,
        dataset: 'cu-fe2o4-support_ftir.csv',
        caveat: 'Bonding signatures are supportive, not standalone proof.',
      },
      {
        technique: 'XPS',
        evidence: 'Oxidation-state validation still required',
        strength: 'Review' as const,
        dataset: 'cu-fe2o4_surface_xps.spe',
        caveat: 'Run Fe 2p / Cu 2p deconvolution before activation claims.',
      },
    ] satisfies SupportingDataItem[],
    validationNotes: [
      'Run Rietveld refinement for quantitative phase assessment.',
      'Review XPS Cu 2p, Fe 2p, and O 1s core-level spectra.',
      'Use TEM to validate morphology and crystallite-size assumptions.',
      'Review replicate evidence before publication-level phase-purity claims.',
    ],
    runLog: [
      ['Processing run', 'xrd-run-042'],
      ['Refinement', 'refine-042'],
      ['Dataset', 'xrd-cufe2o4-clean'],
      ['Workflow version', 'difaryx-analysis-v0.1'],
    ],
    phaseLabel: 'CuFe₂O₄ copper ferrite phase',
    peakDetection: '9 diffraction peaks detected across 17.1-61.6 degrees 2theta after baseline correction.',
  };
}

function sanitizeTraceStep(step: string) {
  const legacyModelStep = 'gemini' + '_reasoner';
  const legacyModelLabel = 'Gemini' + ' reasoner';
  return step
    .replaceAll(legacyModelStep, 'interpretation_refinement')
    .replaceAll(legacyModelLabel, 'interpretation refinement');
}

export default function NotebookLab() {
  const [searchParams] = useSearchParams();
  const project = getProject(searchParams.get('project'));
  const runId = searchParams.get('run');
  const entryId = searchParams.get('entry');
  const experimentId = searchParams.get('experiment');
  const agentRun = runId ? getRun(runId) : null;
  const [templateMode, setTemplateMode] = useState<NotebookTemplateMode>(
    () => normalizeNotebookTemplateMode(searchParams.get('template')),
  );
  const [feedback, setFeedback] = useState('');
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [localExperiments, setLocalExperiments] = useState(() => getLocalExperiments());
  const [observations, setObservations] = useState<string[]>([]);
  const [attachedRun, setAttachedRun] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [observationOpen, setObservationOpen] = useState(false);
  const [observationDraft, setObservationDraft] = useState('');
  const [attachRunOpen, setAttachRunOpen] = useState(false);
  const runResult = useMemo(() => loadAgentRunResult(project.id), [project.id]);
  const workspaceRun = useMemo(() => getProcessingRun(runId), [runId]);
  const workspaceDataset = useMemo(
    () => (workspaceRun ? getDataset(workspaceRun.datasetId) : null),
    [workspaceRun],
  );
  const availableRuns = useMemo(
    () => getProcessingRuns().filter((run) => run.projectId === project.id),
    [project.id, feedback],
  );
  const selectedExperiment = useMemo(() => {
    const projectExperiments = localExperiments.filter((experiment) => experiment.projectId === project.id);
    return (
      projectExperiments.find((experiment) => experiment.id === experimentId) ??
      [...projectExperiments].reverse().find((experiment) => experiment.conditionLock) ??
      null
    );
  }, [experimentId, localExperiments, project.id]);
  const experimentConditionLock = selectedExperiment?.conditionLock ?? getExperimentConditionLock(project.id, experimentId);
  const experimentConditionLines = getConditionLockSectionLines(experimentConditionLock);
  const experimentConditionBoundaryNotes = getConditionBoundaryNotes(experimentConditionLock, project.techniques);
  const experimentConditionStatus = getConditionLockStatusLabel(experimentConditionLock);
  const attachedRunRecord = useMemo(() => getProcessingRun(attachedRun), [attachedRun]);
  const hasMatchedNotebookData = hasMatchedXrdDemoData(project.id);
  const projectNotebookContent = getProjectNotebookContent(project.id);
  const notebookTemplate = NOTEBOOK_TEMPLATES[templateMode];
  const workflowProcessingResult = useMemo(
    () => getLatestProcessingResult(project.id) ?? createProcessingResultFromXrdDemo(project.id),
    [project.id, feedback],
  );
  const workflowRefinement = useMemo(
    () =>
      getLatestAgentDiscussionRefinement(project.id, templateMode) ??
      refineDiscussionFromProcessing(workflowProcessingResult, templateMode),
    [project.id, templateMode, workflowProcessingResult, feedback],
  );
  const workflowNotebookEntry = useMemo(() => {
    const entryFromRoute = getNotebookEntry(entryId);
    if (entryFromRoute?.templateMode === templateMode) return entryFromRoute;
    return (
      getLatestNotebookEntry(project.id, templateMode) ??
      createNotebookEntryFromRefinement(workflowRefinement, templateMode)
    );
  }, [entryId, project.id, templateMode, workflowRefinement, feedback]);
  const workflowReportSection = useMemo(
    () => createReportSectionFromNotebookEntry(workflowNotebookEntry),
    [workflowNotebookEntry],
  );
  const notebookTemplateDetails = NOTEBOOK_TEMPLATE_DETAILS[templateMode];
  const displayNotebookStatus = hasMatchedNotebookData ? notebookTemplateDetails.status : 'Requires dataset';
  const primaryNotebookSection = workflowNotebookEntry.sections[0];
  const supportingNotebookSections = workflowNotebookEntry.sections.slice(1);
  const notebook = useMemo(() => {
    // If we have an agent run, use that data
    if (agentRun) {
      return {
        title: `Characterization Run: ${project.name}`,
        summary: agentRun.outputs.interpretation,
        decision: agentRun.outputs.phase,
        claimStatus: agentRun.outputs.claimStatus || 'supported',
        validationState: agentRun.outputs.validationState || 'complete',
        evidence: agentRun.outputs.evidence,
        warnings: agentRun.outputs.caveats,
        recommendations: agentRun.outputs.recommendations,
        processingPipeline: [
          `Mission: ${agentRun.mission}`,
          `Selected datasets: ${agentRun.outputs.selectedDatasets.join(', ')}`,
          `Detected ${agentRun.outputs.detectedPeaks?.length ?? 0} peaks`,
          'Prepared evidence-linked interpretation with traceable decision context',
        ],
        peakDetection: `${agentRun.outputs.detectedPeaks?.length ?? 0} peaks detected in evidence review`,
        phaseInterpretation: `${agentRun.outputs.phase} - ${formatClaimStatus(agentRun.outputs.claimStatus || 'supported')}`,
      };
    }
    
    const base = generateNotebookSections(project, runResult);
    if (!workspaceRun) return base;

    const claimStatus = workspaceRun.matchResult?.claimStatus ?? project.claimStatus;

    return {
      ...base,
      summary: `${workspaceRun.technique} workspace run generated from ${workspaceDataset?.fileName ?? 'selected dataset'} with ${workspaceRun.detectedFeatures.length} detected features and traceable processing parameters.`,
      decision: workspaceRun.matchResult?.phase ?? `${workspaceRun.technique} evidence saved for ${project.name}`,
      claimStatus,
      validationState: project.validationState,
      evidence: workspaceRun.evidence.map((item) => item.claim),
      warnings: workspaceRun.matchResult?.missingPeaks.length
        ? [`Missing or weak references: ${workspaceRun.matchResult.missingPeaks.join(', ')}.`]
        : [],
      recommendations: project.recommendations,
      processingPipeline: [
        `Dataset: ${workspaceDataset?.fileName ?? workspaceRun.datasetId}.`,
        `Technique: ${workspaceRun.technique}.`,
        ...Object.entries(workspaceRun.parameters).map(([key, value]) => `${key}: ${String(value)}`),
        `Detected features: ${workspaceRun.detectedFeatures.length}.`,
        'Saved evidence and generated notebook section.',
      ],
      peakDetection: `${workspaceRun.detectedFeatures.length} ${workspaceRun.technique === 'XRD' ? 'peaks' : 'features'} detected in the workspace run.`,
      phaseInterpretation: workspaceRun.matchResult
        ? `${workspaceRun.matchResult.phase}. ${workspaceRun.matchResult.caveat}`
        : base.phaseInterpretation,
    };
  }, [project, runResult, workspaceDataset, workspaceRun]);
  const keyEvidenceItems = hasMatchedNotebookData
    ? projectNotebookContent.keyEvidence
    : [
        'No matched processing result is linked to this notebook entry.',
        'Evidence has not been generated for this project in the deterministic XRD demo workflow.',
        'Load a compatible dataset before creating report-ready discussion.',
      ];
  const technicalTrace = hasMatchedNotebookData
    ? (project.id === 'cufe2o4-sba15' ? SBA15_DETERMINISTIC_TRACE : DETERMINISTIC_TRACE)
    : ['No matched processing result', 'Requires compatible XRD dataset', 'Evidence not generated'];

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 1800);
  };

  const exportFeedbackMessage = (format: DemoExportFormat) => {
    if (format === 'md') {
      return 'Markdown report downloaded.';
    }
    if (format === 'png') {
      return 'PNG snapshot downloaded.';
    }
    return 'Available in the connected beta workflow.';
  };

  const copyShareLink = async () => {
    const url = `${window.location.origin}/notebook?project=${project.id}&template=${templateMode}&entry=${workflowNotebookEntry.id}${workspaceRun ? `&run=${workspaceRun.id}` : ''}`;
    try {
      await navigator.clipboard.writeText(url);
      showFeedback('Share link copied');
    } catch {
      showFeedback(`Share link ready: ${url}`);
    }
  };

  const exportMarkdown = () => {
    const lockedContext = getLockedContext(project.id);
    const evidenceMarkdown = keyEvidenceItems.map((item) => `- ${item}`).join('\n');
    const validationMarkdown = projectNotebookContent.validationNotes.map((item) => `- ${item}`).join('\n');
    const traceMarkdown = technicalTrace.map((step, index) => `${index + 1}. ${sanitizeTraceStep(step)}`).join('\n');
    const sourceRunLines = projectNotebookContent.runLog.map(([label, value]) => `${label}: ${value}`).join('\n');
    const claimBoundaryMarkdown = (
      workflowNotebookEntry.sections.find((section) => section.heading === 'Claim Boundary')?.lines ?? [
        'Requires validation: matched processing result is required before claim-boundary review.',
      ]
    ).map((line) => `- ${line}`).join('\n');
    const experimentConditionMarkdown = [
      ...experimentConditionLines,
      ...experimentConditionBoundaryNotes.map((note) => `Claim boundary: ${note}`),
    ].map((line) => `- ${line}`).join('\n');
    const lockedContextMarkdown = lockedContext
      ? `## Locked Scientific Context

Sample Identity: ${lockedContext.sampleIdentity}
Technique: ${lockedContext.technique}
Source Dataset: ${lockedContext.sourceDataset}
Source Processing Path: ${lockedContext.sourceProcessingPath}
Reference Scope: ${lockedContext.referenceScope}
Claim Boundary: ${lockedContext.claimBoundary}

`
      : '';
    const markdown = `# DIFARYX Notebook Report

## Experiment
${projectNotebookContent.experimentTitle}

${lockedContextMarkdown}## Source Workflow
XRD processing + interpretation refinement

## Pipeline
Processing Result → Interpretation Refinement → Notebook Entry → Report Section

## Mode
${notebookTemplate.label}

## Status
${displayNotebookStatus}

## Summary
${projectNotebookContent.summary}

## Refined Discussion
${projectNotebookContent.discussion}

## Report-ready Discussion
${projectNotebookContent.reportPreview}

## Key Evidence
${evidenceMarkdown}

## Claim Boundary
${claimBoundaryMarkdown}

## Experiment Conditions
${experimentConditionMarkdown}

## Validation Notes
${validationMarkdown}

## Technical Trace
${traceMarkdown}

## Provenance
${sourceRunLines}
`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DIFARYX_Exp-042_CuFe2O4_Notebook_Report.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showFeedback('Markdown report downloaded.');
  };

  const exportNotebook = (format: DemoExportFormat) => {
    if (!hasMatchedNotebookData) {
      setExportMenuOpen(false);
      showFeedback('Requires matched processing result before export.');
      return;
    }

    if (format === 'md') {
      exportMarkdown();
      setExportMenuOpen(false);
      return;
    }
    if (format === 'png') {
      exportDemoArtifact('png', {
        filenameBase: `DIFARYX_${project.id}_Notebook_Report`,
        title: 'DIFARYX Notebook Report',
        sections: [
          { heading: 'Experiment', lines: [projectNotebookContent.experimentTitle] },
          { heading: 'Summary', lines: [projectNotebookContent.summary] },
          { heading: 'Report-ready Discussion', lines: [projectNotebookContent.reportPreview] },
          { heading: 'Key Evidence', lines: keyEvidenceItems },
          { heading: 'Experiment Conditions', lines: experimentConditionLines },
          { heading: 'Status', lines: [displayNotebookStatus] },
          { heading: 'Provenance', lines: projectNotebookContent.runLog.map(([label, value]) => `${label}: ${value}`) },
        ],
      });
      setExportMenuOpen(false);
      showFeedback('PNG snapshot downloaded.');
      return;
    }
    setExportMenuOpen(false);
    showFeedback(exportFeedbackMessage(format));
  };

  const printReport = () => {
    window.print();
    showFeedback('Print dialog opened');
  };

  const addObservation = () => {
    const text = observationDraft.trim() || `${project.name} evidence reviewed in notebook.`;
    const nextObservation = `Added observation ${observations.length + 1}: ${text}`;
    setObservations((current) => [nextObservation, ...current]);
    setObservationDraft('');
    setObservationOpen(false);
    showFeedback('Added observation saved');
  };

  const attachRunToNotebook = (run: ProcessingRun) => {
    setAttachedRun(run.id);
    setAttachRunOpen(false);
    showFeedback(`${run.technique} data attached`);
  };

  const saveWorkflowNotebookEntry = () => {
    if (!hasMatchedNotebookData) {
      showFeedback('Requires matched processing result before saving.');
      return;
    }

    saveProcessingResult(workflowProcessingResult);
    const refinement = refineDiscussionFromProcessing(workflowProcessingResult, templateMode);
    saveAgentDiscussionRefinement(refinement);
    const entry = createNotebookEntryFromRefinement(refinement, templateMode);
    saveNotebookEntry(entry);
    showFeedback(`${NOTEBOOK_TEMPLATES[templateMode].label} entry saved`);
  };

  const copyAgentSummary = async () => {
    const summary = hasMatchedNotebookData
      ? projectNotebookContent.reportPreview
      : 'No matched processing result is linked to this project. Evidence and report discussion are not generated.';
    try {
      await navigator.clipboard.writeText(summary);
      showFeedback('Summary copied');
    } catch {
      showFeedback('Summary ready to copy');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden bg-background">
        <div className="w-60 border-r border-border bg-surface flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-sm font-semibold">Experiments</h2>
            <Button variant="ghost" size="sm" className="px-2 h-7" onClick={() => setExperimentModalOpen(true)}><Plus size={14} /></Button>
          </div>
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {demoProjects.map((item) => {
              const itemHasMatchedData = hasMatchedXrdDemoData(item.id);

              return (
                <Link
                  key={item.id}
                  to={getNotebookPath(item)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-xs font-medium leading-snug transition-colors border ${
                    item.id === project.id
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-text-muted hover:bg-surface-hover hover:text-text-main border-transparent'
                  }`}
                >
                  <span>{item.notebook.title}</span>
                  <span className={`mt-1 block text-[10px] font-semibold ${
                    itemHasMatchedData ? 'text-primary' : 'text-amber-600'
                  }`}>
                    {itemHasMatchedData ? 'Publication-limited' : 'Requires dataset'}
                  </span>
                </Link>
              );
            })}
            {localExperiments.map((experiment) => (
              <Link
                key={experiment.id}
                to={`/notebook?project=${experiment.projectId}&experiment=${experiment.id}`}
                className={`block w-full text-left px-3 py-2 rounded-md text-xs font-medium leading-snug transition-colors border ${
                  experiment.projectId === project.id && experiment.id === experimentId
                    ? 'bg-primary/5 text-primary border-primary/20'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text-main border-transparent'
                }`}
              >
                <span>{experiment.title}</span>
                <span className="mt-1 block text-xs text-text-muted">{experiment.technique} - {experiment.fileName}</span>
                <span className="mt-1 block text-[10px] font-semibold text-amber-600">
                  {getConditionLockStatusLabel(experiment.conditionLock)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto relative">
          <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-border px-3 py-2 flex flex-wrap justify-between items-center gap-2">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-text-muted mb-1">
                <span>Created: {project.createdDate}</span>
                <span>|</span>
                <span>Source: Processing Result -&gt; Refinement -&gt; Notebook</span>
              </div>
              <h1 className="text-base font-bold">{notebook.title}</h1>
              {(() => {
                const lockedContext = getLockedContext(project.id);
                return lockedContext ? (
                  <div className="mt-1 rounded border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5">
                    <p className="text-[10px] font-semibold text-amber-700">
                      Locked context preserved: sample identity, source dataset, processing path, and claim boundary were not modified.
                    </p>
                  </div>
                ) : null;
              })()}
              <div className="mt-2 flex max-w-4xl flex-wrap gap-1.5">
                {[
                  ['Mode', notebookTemplate.label],
                  ['Pipeline', 'Processing -> Refinement -> Notebook -> Report'],
                  ['Status', displayNotebookStatus],
                  ['Condition lock', experimentConditionStatus],
                ].map(([label, value]) => (
                  <span
                    key={label}
                    className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-muted"
                  >
                    <span className="text-text-dim">{label}: </span>
                    <span className="text-text-main">{value}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {feedback && (
                <span className="hidden sm:inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary">
                  {feedback}
                </span>
              )}
              <Button variant="outline" size="sm" className="gap-2" onClick={copyShareLink}><Share2 size={14} /> Share</Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMatchedNotebookData}
                title={!hasMatchedNotebookData ? 'Requires matched processing result before printing.' : undefined}
                className="gap-2"
                onClick={printReport}
              >
                <FileText size={14} /> Print Report
              </Button>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMatchedNotebookData}
                  title={!hasMatchedNotebookData ? 'Requires matched processing result before export.' : undefined}
                  className="gap-2"
                  onClick={() => setExportMenuOpen((open) => !open)}
                >
                  <Download size={14} /> Export
                </Button>
                {exportMenuOpen && (
                  <div className="absolute right-0 top-10 z-20 w-52 rounded-lg border border-border bg-white p-2 shadow-xl">
                    <button
                      type="button"
                      onClick={() => exportNotebook('md')}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover"
                    >
                      Export Markdown
                      <Download size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => exportNotebook('png')}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover"
                    >
                      Export PNG Snapshot
                      <Download size={13} />
                    </button>
                    {(['pdf', 'docx', 'csv'] as DemoExportFormat[]).map((format) => (
                      <button
                        key={format}
                        type="button"
                        disabled
                        title="Available in the connected beta workflow."
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-400 cursor-not-allowed"
                      >
                        {format.toUpperCase()} Export - Connected beta workflow
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setObservationOpen(true)}><Plus size={14} /> Add Observation</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setAttachRunOpen(true)}><FileText size={14} /> Attach Data</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!hasMatchedNotebookData}
                title={!hasMatchedNotebookData ? 'Requires matched processing result before saving.' : undefined}
                className="gap-2"
                onClick={saveWorkflowNotebookEntry}
              >
                <Save size={14} /> Save Entry
              </Button>
            </div>
          </div>

          {observationOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4">
              <div className="w-full max-w-lg rounded-xl border border-border bg-white p-5 shadow-2xl">
                <h2 className="text-base font-bold text-text-main">Add Observation</h2>
                <p className="mt-1 text-sm text-text-muted">Add a demo notebook note tied to the current project context.</p>
                <textarea
                  value={observationDraft}
                  onChange={(event) => setObservationDraft(event.target.value)}
                  placeholder="Example: Raman A1g mode remains consistent with the XRD phase assignment."
                  className="mt-4 h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-main outline-none focus:border-primary"
                />
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setObservationOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={addObservation}>Add Observation</Button>
                </div>
              </div>
            </div>
          )}

          {attachRunOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4">
              <div className="w-full max-w-2xl rounded-xl border border-border bg-white p-5 shadow-2xl">
                <h2 className="text-base font-bold text-text-main">Attach Data</h2>
                <p className="mt-1 text-sm text-text-muted">Select saved processing data to link into this notebook.</p>
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                  {availableRuns.length === 0 && (
                    <p className="rounded-md border border-border bg-background p-3 text-sm text-text-muted">
                      No upstream processing data attached yet. Save processed evidence in a workspace, then attach it here.
                    </p>
                  )}
                  {availableRuns.slice().reverse().map((run) => {
                    const dataset = getDataset(run.datasetId);
                    return (
                      <button
                        key={run.id}
                        type="button"
                        onClick={() => attachRunToNotebook(run)}
                        className="block w-full rounded-md border border-border bg-background p-3 text-left text-sm hover:border-primary/40 hover:bg-primary/5"
                      >
                        <span className="font-semibold text-text-main">{run.technique} run - {dataset?.fileName ?? run.datasetId}</span>
                        <span className="mt-1 block text-xs text-text-muted">
                          {new Date(run.timestamp).toLocaleString()} / {run.detectedFeatures.length} features / {formatClaimStatus(run.matchResult?.claimStatus || 'supported')}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setAttachRunOpen(false)}>Back to notebook</Button>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 max-w-6xl w-full mx-auto space-y-4">
            <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.85fr)_minmax(280px,0.95fr)]">
              <div className="min-w-0">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Characterization Overview</div>
                {hasMatchedNotebookData ? (
                  <div className="max-h-[300px] overflow-y-auto rounded-xl">
                    <AIInsightPanel result={getProjectInsight(project)} />
                  </div>
                ) : (
                  <Card className="p-4">
                    <div className="text-sm font-semibold text-text-main">Validation pending</div>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      No matched processing result is linked to this project. Evidence and report discussion are not generated.
                    </p>
                  </Card>
                )}
              </div>
              <div className="min-w-0 rounded-xl border border-border bg-surface p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Experiment Conditions</div>
                    <div className="mt-1 text-sm font-bold text-text-main">{experimentConditionStatus}</div>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      Locked conditions define reproducibility constraints before interpretation handoff.
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] text-text-muted">
                    Locked at: {formatConditionLockTimestamp(experimentConditionLock)}
                  </div>
                </div>
                <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {experimentConditionLines.map((line) => (
                    <div key={line} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] leading-relaxed text-text-muted">
                      {line}
                    </div>
                  ))}
                </div>
                <div className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Condition-aware claim boundary</div>
                  <ul className="mt-1 space-y-0.5 text-[11px] leading-relaxed text-text-muted">
                    {experimentConditionBoundaryNotes.slice(0, 3).map((note) => (
                      <li key={note}>- {note}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-primary/20 bg-surface p-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">Refined Discussion / Report Preview</div>
                <div className="mt-2 rounded-md border border-border bg-background p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    {notebookTemplateDetails.primaryLabel}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-text-main">
                    {hasMatchedNotebookData
                      ? projectNotebookContent.discussion
                      : 'No matched processing result is linked to this notebook entry.'}
                  </p>
                </div>
                <div className="mt-2 rounded-md border border-border bg-background p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Report section</div>
                  <p className="mt-2 text-xs leading-relaxed text-text-main">
                    {hasMatchedNotebookData
                      ? projectNotebookContent.reportPreview
                      : 'No report-oriented section is available until a matched processing result is linked to this project.'}
                  </p>
                </div>
                <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Discussion readiness</div>
                  <p className="mt-1 text-xs font-semibold text-text-main">
                    {displayNotebookStatus}: {hasMatchedNotebookData ? notebookTemplateDetails.output : 'Load compatible data before report-ready discussion.'}
                  </p>
                </div>
              </div>
            </section>

            {!hasMatchedNotebookData && (
              <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Notebook status</div>
                <h3 className="mt-1 text-base font-bold text-text-main">No matched processing result</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  This project does not yet have a matched deterministic XRD processing result. Notebook discussion, report preview, and export remain validation pending until compatible evidence is processed.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Requires dataset', 'No matched processing result', 'Evidence not generated'].map((badge) => (
                    <span key={badge} className="rounded-full border border-amber-500/30 bg-background px-3 py-1 text-xs font-semibold text-amber-700">
                      {badge}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <details className="rounded-xl border border-border bg-surface">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text-main">
                <span>Full template, refined discussion, and report section</span>
                <span className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] text-primary">
                  Secondary record details
                </span>
              </summary>
              <div className="space-y-4 border-t border-border p-4">
              <details className="rounded-xl border border-border bg-surface">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text-main">
                  <span>Template selector and workflow details</span>
                  <span className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] text-primary">
                    {notebookTemplate.label} · {notebookTemplateDetails.primaryLabel}
                  </span>
                </summary>
                <div className="border-t border-border p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-main">Notebook Template Selector</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      Choose the experiment mode for this notebook entry.
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Report template</div>
                    <div className="mt-1 text-sm font-bold capitalize text-text-main">
                      {notebookTemplate.reportTemplate.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {NOTEBOOK_TEMPLATE_MODES.map((mode) => {
                    const template = NOTEBOOK_TEMPLATES[mode];
                    const details = NOTEBOOK_TEMPLATE_DETAILS[mode];
                    const isSelected = templateMode === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setTemplateMode(mode)}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-background text-text-muted hover:border-primary/30 hover:text-text-main'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-bold text-text-main">{template.label}</div>
                          {isSelected && (
                            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-text-muted">{details.description}</p>
                        <div className="mt-3 rounded-md border border-border bg-surface px-2 py-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Output</div>
                          <div className="mt-0.5 text-xs font-semibold text-text-main">{details.output}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Template micro-flow</div>
                      <div className="mt-1 text-sm font-semibold text-text-main">{notebookTemplateDetails.primaryLabel}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
                      {workflowRefinement.microFlow.map((step, index) => (
                        <React.Fragment key={step}>
                          <span className="rounded-full border border-border bg-surface px-2.5 py-1">{step}</span>
                          {index < workflowRefinement.microFlow.length - 1 && <ArrowRight size={13} className="text-primary" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {notebookTemplate.stepperLabels.map((step) => (
                    <span key={step} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                      {step}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Tabs</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {notebookTemplate.tabs.map((tab) => (
                        <span key={tab} className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-main">
                          {tab}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Statuses</div>
                    <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {(hasMatchedNotebookData
                        ? workflowNotebookEntry.statusSummary
                        : [
                            { label: 'Notebook Status', value: 'Requires dataset' },
                            { label: 'Evidence Status', value: 'No matched processing result' },
                          ]).map((status) => (
                        <div key={status.label} className="rounded-md border border-border bg-surface px-2 py-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{status.label}</div>
                          <div className="text-xs font-bold text-text-main">{status.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              </details>

              <div className="rounded-xl border border-primary/20 bg-surface p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {notebookTemplateDetails.primaryLabel}
                    </div>
                    <p className="mt-1 text-sm font-medium text-text-muted">
                      Source workflow converted into a template-based scientific record
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-muted">
                    {workflowRefinement.microFlow.map((step, index) => (
                      <React.Fragment key={step}>
                        <span className="rounded-full border border-border bg-background px-2.5 py-1">{step}</span>
                        {index < workflowRefinement.microFlow.length - 1 && <ArrowRight size={13} className="text-primary" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-border bg-background p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    {hasMatchedNotebookData ? primaryNotebookSection?.heading ?? notebookTemplateDetails.primaryLabel : 'No matched processing result'}
                  </div>
                  <div className="mt-2 space-y-2">
                    {(hasMatchedNotebookData
                      ? [projectNotebookContent.discussion]
                      : ['This project does not have a matched processing result in the deterministic notebook workflow. Load compatible data before creating report-ready discussion.']).map((line) => (
                      <p key={line} className="text-sm leading-relaxed text-text-main">{line}</p>
                    ))}
                  </div>
                </div>

                <details className="mt-3 rounded-lg border border-border bg-background">
                  <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-text-main">
                    Additional notebook sections
                  </summary>
                  <div className="grid grid-cols-1 gap-3 border-t border-border p-3 lg:grid-cols-2">
                    {(hasMatchedNotebookData ? supportingNotebookSections : [
                      {
                        heading: 'Validation Pending',
                        lines: ['No matched processing result is available for this project.', 'Evidence and report sections remain unavailable until compatible data is processed.'],
                      },
                    ]).map((section) => (
                      <div key={section.heading} className="rounded-lg border border-border bg-surface p-3">
                        <div className="text-xs font-bold text-text-main">{section.heading}</div>
                        <div className="mt-2 space-y-2">
                          {section.lines.map((line) => (
                            <p key={line} className="text-xs leading-relaxed text-text-muted">{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Report Section Preview</div>
                    <h3 className="mt-1 text-base font-bold text-text-main">
                      {hasMatchedNotebookData ? workflowReportSection.heading : 'No report section available'}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">{notebookTemplateDetails.reportPreview}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Report route is not enabled in this demo. Export-ready sections are generated from notebook entries."
                    className="gap-2"
                  >
                    <Download size={14} /> Export Report Section
                  </Button>
                </div>
                <div className="mt-3 rounded-lg border border-border bg-background p-3">
                  <p className="text-sm leading-relaxed text-text-main">
                    {hasMatchedNotebookData
                      ? projectNotebookContent.reportPreview
                      : 'No report-oriented section is available until a matched processing result is linked to this project.'}
                  </p>
                </div>
                <p className="mt-2 text-xs text-text-muted">
                  Report route is not enabled in this demo. Export-ready sections are generated from notebook entries.
                </p>
              </div>
              </div>
            </details>

            <details className="rounded-xl border border-border bg-surface">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-text-main">
                <span>Supplementary notebook record</span>
                <span className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-text-muted">
                  Supporting data, run log, exports, trace, and validation notes
                </span>
              </summary>
              <div className="space-y-4 border-t border-border p-4">
            <section className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-surface p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-main">Source Workflow</h3>
                    <p className="mt-2 text-sm text-text-muted">Project: {project.name}</p>
                    <p className="mt-1 text-sm text-text-main">
                  Demo notebook entry generated from the current interpretation context.
                    </p>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Discussion readiness</div>
                    <div className="mt-1 text-sm font-bold text-text-main">{displayNotebookStatus}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    ['Mode', notebookTemplate.label],
                    ['Source workflow', 'XRD processing + interpretation refinement'],
                    ['Pipeline', 'Processing Result → Interpretation Refinement → Notebook Entry → Report Section'],
                    ['Discussion readiness', displayNotebookStatus],
                    ['Report section', hasMatchedNotebookData ? workflowReportSection.heading : 'No report section available'],
                    ['Evidence status', hasMatchedNotebookData ? 'Requires validation' : 'No matched processing result'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border bg-background p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
                      <div className="mt-1 text-sm font-semibold text-text-main">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {notebookTemplateDetails.badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Supporting Data</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(hasMatchedNotebookData ? projectNotebookContent.supportingData : [
                  {
                    technique: 'Notebook',
                    evidence: 'No matched processing result linked to this project',
                    strength: 'Review' as const,
                    dataset: 'No matched dataset',
                    caveat: 'Load compatible data before generating notebook evidence.',
                  },
                ]).map((item) => (
                  <div key={item.technique} className="rounded-lg border border-border bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-text-main">{item.technique}</span>
                      <span className={`text-xs font-semibold ${item.strength === 'Review' ? 'text-amber-600' : item.strength === 'Ready' ? 'text-primary' : 'text-cyan'}`}>
                        {item.strength}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-main">{item.evidence}</p>
                    <p className="mt-2 text-xs font-medium text-text-muted">Linked dataset: {item.dataset}</p>
                    <p className="mt-1 text-xs text-text-muted">{item.caveat}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">{notebookTemplateDetails.primaryLabel}</h3>
              <div className="rounded-lg border border-border bg-surface p-4">
                {(hasMatchedNotebookData
                  ? [projectNotebookContent.discussion]
                  : ['No matched processing result is linked to this notebook entry. Evidence has not been generated for this project in the deterministic XRD demo workflow.']).map((line) => (
                  <p key={line} className="text-sm leading-relaxed text-text-main">{line}</p>
                ))}
                <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Discussion readiness</div>
                  <p className="mt-1 text-sm font-semibold text-text-main">
                    {displayNotebookStatus}: {hasMatchedNotebookData ? notebookTemplateDetails.output : 'Load compatible data before report-ready discussion.'}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Notebook Run Log</h3>
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ...(hasMatchedNotebookData ? projectNotebookContent.runLog : [
                      ['Processing run', 'No matched processing result'],
                      ['Refinement', 'Not available'],
                      ['Dataset', 'No matched dataset'],
                      ['Workflow version', 'difaryx-analysis-v0.1'],
                    ]),
                    ['Template mode', notebookTemplate.label],
                    ['Discussion readiness', displayNotebookStatus],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border bg-background p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
                      <div className="mt-1 text-sm font-semibold text-text-main">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Limitations and Follow-up Validation</h3>
              <div className="space-y-2">
                {(hasMatchedNotebookData
                  ? projectNotebookContent.validationNotes
                  : ['Load a matched processing result before notebook export.', 'Evidence review is not generated for this project yet.']).map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {index + 1}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Report Exports</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Button
                  variant="outline"
                  disabled={!hasMatchedNotebookData}
                  title={!hasMatchedNotebookData ? 'Requires matched processing result before export.' : undefined}
                  className="gap-2"
                  onClick={() => exportNotebook('md')}
                >
                  <Download size={14} /> Export Markdown
                </Button>
                <Button
                  variant="outline"
                  disabled={!hasMatchedNotebookData}
                  title={!hasMatchedNotebookData ? 'Requires matched processing result before export.' : undefined}
                  className="gap-2"
                  onClick={() => exportNotebook('png')}
                >
                  <Download size={14} /> Export PNG Snapshot
                </Button>
                {(['pdf', 'docx', 'csv'] as DemoExportFormat[]).map((format) => (
                  <Button key={format} variant="outline" disabled title="Available in the connected beta workflow." className="gap-2 text-slate-400 cursor-not-allowed">
                    <Download size={14} /> {format.toUpperCase()} - Connected beta workflow
                  </Button>
                ))}
                <Button variant="outline" className="gap-2" onClick={copyAgentSummary}>
                  <Share2 size={14} /> Copy Summary
                </Button>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Summary</h3>
              <p className="text-sm text-text-main leading-relaxed">
                {hasMatchedNotebookData ? projectNotebookContent.summary : 'No matched processing result is linked to this notebook entry.'}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Report-ready Discussion</h3>
              <div className="bg-surface p-4 rounded-md border border-border">
                <div className="text-sm leading-relaxed text-text-main">
                  {hasMatchedNotebookData
                    ? projectNotebookContent.reportPreview
                    : 'Report-ready discussion is unavailable until a matched processing result is linked to this project.'}
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div className="text-xs text-text-muted">
                    Short conclusion: {hasMatchedNotebookData ? 'Supported assignment with validation boundaries.' : 'No matched processing result.'}
                  </div>
                  <div className={`text-sm font-bold ${
                    notebook.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                    notebook.claimStatus === 'supported' ? 'text-cyan' :
                    notebook.claimStatus === 'partial' ? 'text-amber-500' :
                    'text-text-muted'
                  }`}>{hasMatchedNotebookData ? formatClaimStatus(notebook.claimStatus) : 'Requires dataset'}</div>
                </div>
              </div>
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
                {hasMatchedNotebookData
                  ? 'XRD provides bulk-averaged structural evidence. Surface-sensitive and phase-purity claims remain validation-limited.'
                  : 'Notebook status: Requires dataset. Evidence not generated.'}
              </div>
            </section>

            {workspaceRun && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Workspace Data</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface p-4 rounded-md border border-border">
                    <div className="text-xs text-text-muted mb-1">Dataset</div>
                    <div className="text-sm font-semibold text-text-main">{workspaceDataset?.fileName ?? workspaceRun.datasetId}</div>
                    <div className="text-xs text-text-muted mt-1">{workspaceDataset?.metadata.sampleName}</div>
                  </div>
                  <div className="bg-surface p-4 rounded-md border border-border">
                    <div className="text-xs text-text-muted mb-1">Technique</div>
                    <div className="text-sm font-semibold text-text-main">{workspaceRun.technique}</div>
                    <div className="text-xs text-text-muted mt-1">{new Date(workspaceRun.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="bg-surface p-4 rounded-md border border-border sm:col-span-2">
                    <div className="text-xs text-text-muted mb-2">Processing Parameters</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(workspaceRun.parameters).map(([key, value]) => (
                        <span key={key} className="rounded-md border border-border bg-background px-2 py-1 text-xs text-text-muted">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {(observations.length > 0 || attachedRun) && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Notebook Additions</h3>
                {attachedRun && (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-text-muted">
                    <div className="font-semibold text-text-main">
                      Linked data: {attachedRunRecord?.technique ?? 'Workspace'} analysis
                    </div>
                    <div className="mt-1">
                      {attachedRunRecord
                        ? `${new Date(attachedRunRecord.timestamp).toLocaleString()} - ${attachedRunRecord.detectedFeatures.length} features - ${formatClaimStatus(attachedRunRecord.matchResult?.claimStatus || 'supported')}`
                        : attachedRun}
                    </div>
                  </div>
                )}
                {observations.map((observation) => (
                  <div key={observation} className="rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
                    {observation}
                  </div>
                ))}
              </section>
            )}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><FlaskConical size={14} /> Technical Trace</span>
              </h3>
              <p className="text-xs text-text-muted mb-2">Internal processing steps retained for reproducibility.</p>
              <div className="bg-surface p-4 rounded-md border border-border text-sm font-mono text-text-dim space-y-2">
                {technicalTrace.map((step, i) => (
                  <p key={step}>{i + 1}. {sanitizeTraceStep(step)}</p>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><BarChart3 size={14} /> Peak Detection Results</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-md border border-border">
                  <div className="text-xs text-text-muted mb-1">Peaks Detected</div>
                  <div className="text-2xl font-bold text-primary">
                    {hasMatchedNotebookData ? workspaceRun?.detectedFeatures.length ?? project.xrdPeaks.length : 0}
                  </div>
                </div>
                <div className="bg-surface p-4 rounded-md border border-border">
                  <div className="text-xs text-text-muted mb-1">Peak Positions</div>
                  <div className="text-sm font-mono text-text-main">
                    {hasMatchedNotebookData
                      ? (workspaceRun?.detectedFeatures ?? project.xrdPeaks).map((peak) => `${peak.position.toFixed(1)} ${workspaceRun && workspaceRun.technique !== 'XRD' ? '' : 'deg'}`).join(', ')
                      : 'No matched dataset'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-text-muted">
                {hasMatchedNotebookData ? projectNotebookContent.peakDetection : 'No peak detection display is available until compatible evidence is processed.'}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">
                <span className="flex items-center gap-2"><Target size={14} /> Phase Identification</span>
              </h3>
              <div className="bg-surface p-4 rounded-md border border-border flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold">{hasMatchedNotebookData ? projectNotebookContent.phaseLabel : project.name}</div>
                  <div className="text-xs text-text-muted mt-1">
                    {hasMatchedNotebookData
                      ? notebook.phaseInterpretation
                      : 'No matched processing result for this project.'}
                  </div>
                </div>
                <div className={`text-sm font-bold ${
                  notebook.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                  notebook.claimStatus === 'supported' ? 'text-cyan' :
                  notebook.claimStatus === 'partial' ? 'text-amber-500' :
                  'text-text-muted'
                }`}>{formatClaimStatus(notebook.claimStatus)}</div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-border pb-2">Key Evidence</h3>
              <div className="space-y-2">
                {keyEvidenceItems.map((item, i) => (
                  <div key={item} className="flex items-start gap-3 rounded-md border border-border bg-surface p-3 text-sm text-text-muted">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link to={workspaceRun ? getWorkspaceRoute(project, workspaceRun.technique, workspaceRun.datasetId) : getWorkspaceRoute(project)} className="rounded-md border border-border bg-surface p-3 text-sm font-semibold text-text-main hover:border-primary/40 transition-colors">
                {workspaceRun ? `Open ${workspaceRun.technique} Analysis` : 'Open Workspace'} <ArrowRight size={14} className="inline ml-1" />
              </Link>
              <Link
                to={hasMatchedNotebookData ? getAgentPath(project) : getWorkspaceRoute(project)}
                className="rounded-md border border-cyan/40 bg-surface p-3 text-sm font-semibold text-cyan hover:bg-cyan/10 transition-colors"
              >
                {hasMatchedNotebookData ? 'Open Refinement' : 'Open Workspace'} <ArrowRight size={14} className="inline ml-1" />
              </Link>
              <button
                onClick={() => exportNotebook('md')}
                disabled={!hasMatchedNotebookData}
                title={!hasMatchedNotebookData ? 'Requires matched processing result before export.' : undefined}
                className="rounded-md border border-border bg-surface p-3 text-left text-sm font-semibold text-text-main hover:bg-surface-hover transition-colors"
              >
                <FileText size={14} className="inline mr-1" /> Export Markdown
              </button>
            </section>
              </div>
            </details>
          </div>
        </div>

        <div className="hidden">
          <div className="p-6">
            <div className="mb-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Characterization Overview</div>
            {hasMatchedNotebookData ? (
              <AIInsightPanel result={getProjectInsight(project)} />
            ) : (
              <Card className="p-4">
                <div className="text-sm font-semibold text-text-main">Validation pending</div>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  No matched processing result is linked to this project. Evidence and report discussion are not generated.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
      <ExperimentModal
        open={experimentModalOpen}
        defaultProjectId={project.id}
        onClose={() => setExperimentModalOpen(false)}
        onCreated={() => {
          setLocalExperiments(getLocalExperiments());
          showFeedback('Experiment, dataset, and condition record added');
        }}
      />
    </DashboardLayout>
  );
}
