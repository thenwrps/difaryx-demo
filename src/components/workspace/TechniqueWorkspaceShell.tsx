import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Copy,
  Database,
  Download,
  FileText,
  FlaskConical,
  GitBranch,
  Layers,
  Lock,
  Maximize2,
  MousePointer2,
  Move,
  Play,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  ZoomIn,
} from 'lucide-react';
import { Graph } from '../ui/Graph';
import {
  getFocusedEvidenceSource,
  getRegistryProject,
  isKnownProjectId,
  type DemoFocusedEvidenceSource,
  type RegistryProject,
} from '../../data/demoProjectRegistry';
import { formatChemicalFormula } from '../../utils/chemicalFormula';
import {
  getTechniqueWorkspaceConfig,
  type TechniqueParameterControl,
  type TechniqueParameterValue,
  type TechniqueWorkspaceId,
  type TechniqueWorkspaceConfig,
} from '../../data/techniqueWorkspaceContent';
import {
  getAnalysisSession,
  getStatusLabel,
  type AnalysisSession,
  type PipelineStepStatus,
} from '../../data/analysisSessions';

const RIGHT_TABS = ['Evidence', 'Parameters', 'Graph', 'Boundary', 'Trace'] as const;
type RightTab = (typeof RIGHT_TABS)[number];
type PipelineStepState = 'done' | 'active' | 'pending' | 'optional';

const RIGHT_PANEL_MIN_WIDTH = 300;
const RIGHT_PANEL_MAX_WIDTH = 520;
const RIGHT_PANEL_DEFAULT_WIDTH = 320;
const CENTER_PANEL_MIN_WIDTH = 520;

type GraphToolId = 'pan' | 'zoom' | 'select' | 'reset' | 'fit';
type GraphActionId = 'save-view' | 'export-graph' | 'focus-graph' | 'copy-view-link' | 'reset-layout' | 'restore-saved-view';

const GRAPH_TOOLS: Array<{ id: GraphToolId; label: string; Icon: React.ElementType }> = [
  { id: 'pan', label: 'Pan', Icon: Move },
  { id: 'zoom', label: 'Zoom', Icon: ZoomIn },
  { id: 'select', label: 'Select', Icon: MousePointer2 },
  { id: 'reset', label: 'Reset', Icon: RotateCcw },
  { id: 'fit', label: 'Fit to data', Icon: Maximize2 },
];

const GRAPH_ACTIONS: Array<{ id: GraphActionId; label: string; Icon: React.ElementType }> = [
  { id: 'save-view', label: 'Save View', Icon: Save },
  { id: 'export-graph', label: 'Export Graph', Icon: Download },
  { id: 'focus-graph', label: 'Focus Graph', Icon: Maximize2 },
  { id: 'copy-view-link', label: 'Copy View Link', Icon: Copy },
  { id: 'reset-layout', label: 'Reset Layout', Icon: RotateCcw },
  { id: 'restore-saved-view', label: 'Restore Saved View', Icon: RotateCcw },
];

function getCompactCenterTabLabel(label: string) {
  const compactLabels: Record<string, string> = {
    Residual: 'Resid.',
    Rietveld: 'Rietv.',
    'Chemical States': 'Chem.',
    Assignment: 'Assign.',
    'Functional Groups': 'Func.',
    'Mode Assignments': 'Modes',
  };
  return compactLabels[label] ?? label;
}

interface TechniqueWorkspaceShellProps {
  technique: TechniqueWorkspaceId;
  mode?: 'project' | 'quick';
  fileName?: string;
  sessionId?: string;
}

interface ProcessingLogEntry {
  id: string;
  timeLabel: string;
  message: string;
}

interface WorkspaceSessionState {
  storageKey: string;
  parameters: Record<string, TechniqueParameterValue>;
  pipelineStates: Record<string, PipelineStepState>;
  processingLog: ProcessingLogEntry[];
  dirty: boolean;
  pendingRecalculation: boolean;
  autoMode: boolean;
  lastProcessedLabel: string;
  lastAffectedStepIds: string[];
  presetSavedLabel?: string;
}

interface PaneLayoutState {
  storageKey: string;
  rightPanelWidth: number;
  rightPanelCollapsed: boolean;
  graphFocusMode: boolean;
  lastUpdatedAt: string;
}

function statusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('available') || normalized.includes('supported') || normalized.includes('ready')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (normalized.includes('required') || normalized.includes('pending') || normalized.includes('limited')) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (normalized.includes('unsaved')) {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function pipelineStateClass(state: PipelineStepState) {
  if (state === 'done') return 'text-emerald-700';
  if (state === 'active') return 'text-blue-700';
  if (state === 'optional') return 'text-slate-500';
  return 'text-amber-700';
}

function pipelineStateIcon(state: PipelineStepState) {
  if (state === 'done') return <CheckCircle2 size={12} className="text-emerald-600" />;
  if (state === 'active') return <Play size={12} className="text-blue-600" />;
  if (state === 'optional') return <Circle size={12} className="text-slate-400" />;
  return <AlertTriangle size={12} className="text-amber-600" />;
}

function formatStateLabel(state: PipelineStepState) {
  if (state === 'done') return 'done';
  if (state === 'active') return 'active';
  if (state === 'optional') return 'optional';
  return 'pending';
}

function makeTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getProjectFromQuery(projectId: string | null): RegistryProject | null {
  if (!projectId || !isKnownProjectId(projectId)) return null;
  return getRegistryProject(projectId);
}

function getEvidenceSource(project: RegistryProject | null, technique: TechniqueWorkspaceId) {
  if (!project) return null;
  const techniqueLabel = technique.toUpperCase();
  return project._raw.evidenceSources.find((source) => source.technique === techniqueLabel) ?? null;
}

function getTechniqueProjectState(project: RegistryProject | null, technique: TechniqueWorkspaceId) {
  if (!project) return null;
  return project.techniques.find((item) => item.id === technique) ?? null;
}

function getComparisonRow(project: RegistryProject | null, technique: TechniqueWorkspaceId) {
  if (!project) return null;
  return project.crossTechniqueComparison.matrix.find((row) => row.techniqueId === technique) ?? null;
}

function getFeatureRows(project: RegistryProject | null, focusedEvidence: DemoFocusedEvidenceSource | null, technique: TechniqueWorkspaceId) {
  if (!project || !focusedEvidence) {
    return [
      {
        label: 'Dataset',
        value: 'No project-linked dataset',
        detail: 'Open from a project to load registry evidence.',
      },
    ];
  }

  const graphPeaks = focusedEvidence.graphData?.peaks ?? [];
  if (graphPeaks.length > 0) {
    return graphPeaks.slice(0, 6).map((peak) => ({
      label: peak.label || `${technique.toUpperCase()} feature`,
      value: `${peak.position.toFixed(2)}`,
      detail: `Intensity ${peak.intensity.toFixed(0)}`,
    }));
  }

  const row = getComparisonRow(project, technique);
  const evidence = project.evidenceResults.find((item) => item.techniqueId === technique);
  const findings = evidence?.findings?.length ? evidence.findings : focusedEvidence.structuredEvidence?.bulletEvidence ?? [];
  return findings.slice(0, 5).map((finding, index) => ({
    label: row?.techniqueLabel || evidence?.displayName || technique.toUpperCase(),
    value: `Evidence ${index + 1}`,
    detail: finding,
  }));
}

function getDatasetLabel(project: RegistryProject | null, technique: TechniqueWorkspaceId) {
  const source = getEvidenceSource(project, technique);
  if (source?.datasetLabel) return source.datasetLabel;
  const techniqueState = getTechniqueProjectState(project, technique);
  if (techniqueState?.datasetLabel) return techniqueState.datasetLabel;
  if (project) return `${technique.toUpperCase()} evidence required`;
  return 'Untitled analysis';
}

function getTraceId(project: RegistryProject | null, technique: TechniqueWorkspaceId) {
  if (!project) return `standalone-${technique}-session`;
  const source = getEvidenceSource(project, technique);
  return source?.datasetId || `${project.id}-${technique}-required`;
}

function getDefaultParameters(config: TechniqueWorkspaceConfig) {
  return config.parameters.reduce<Record<string, TechniqueParameterValue>>((acc, control) => {
    acc[control.id] = Array.isArray(control.defaultValue)
      ? [...control.defaultValue]
      : control.defaultValue;
    return acc;
  }, {});
}

function mapQuickPipelineStatus(status: PipelineStepStatus): PipelineStepState {
  if (status === 'completed') return 'done';
  if (status === 'active' || status === 'error') return 'active';
  if (status === 'skipped') return 'optional';
  return 'pending';
}

function getQuickSessionParameters(config: TechniqueWorkspaceConfig, quickSession: AnalysisSession | null) {
  const defaults = getDefaultParameters(config);
  if (!quickSession) return defaults;

  quickSession.processingParameters.forEach((parameter) => {
    const control = config.parameters.find(
      (candidate) =>
        candidate.id.toLowerCase() === parameter.id.toLowerCase() ||
        candidate.label.toLowerCase() === parameter.label.toLowerCase(),
    );
    if (!control) return;

    if (control.type === 'number' || control.type === 'range') {
      const numeric = Number.parseFloat(parameter.value);
      defaults[control.id] = Number.isFinite(numeric) ? numeric : control.defaultValue;
      return;
    }

    if (control.type === 'toggle') {
      defaults[control.id] = parameter.value.toLowerCase() === 'true';
      return;
    }

    defaults[control.id] = parameter.value;
  });

  return defaults;
}

function getDefaultPipelineStates(
  config: TechniqueWorkspaceConfig,
  hasProjectEvidence: boolean,
  hasProject: boolean,
  quickSession: AnalysisSession | null = null,
) {
  if (quickSession) {
    return config.pipeline.reduce<Record<string, PipelineStepState>>((acc, step, index) => {
      const sessionStep = quickSession.processingPipeline[index];
      acc[step.id] = sessionStep ? mapQuickPipelineStatus(sessionStep.status) : 'pending';
      return acc;
    }, {});
  }

  return config.pipeline.reduce<Record<string, PipelineStepState>>((acc, step, index) => {
    const isLast = index === config.pipeline.length - 1;
    if (isLast) {
      acc[step.id] = 'optional';
    } else if (hasProjectEvidence) {
      acc[step.id] = index < 3 ? 'done' : index === 3 ? 'active' : 'pending';
    } else {
      acc[step.id] = index === 0 && !hasProject ? 'active' : 'pending';
    }
    return acc;
  }, {});
}

function buildDefaultSession(
  storageKey: string,
  config: TechniqueWorkspaceConfig,
  hasProjectEvidence: boolean,
  hasProject: boolean,
  quickSession: AnalysisSession | null = null,
): WorkspaceSessionState {
  return {
    storageKey,
    parameters: getQuickSessionParameters(config, quickSession),
    pipelineStates: getDefaultPipelineStates(config, hasProjectEvidence, hasProject, quickSession),
    processingLog: [
      ...(quickSession?.processingLog.map((message, index) => ({
        id: `${storageKey}-quick-${index}`,
        timeLabel: makeTimeLabel(),
        message,
      })) ?? []),
      {
        id: `${storageKey}-init`,
        timeLabel: makeTimeLabel(),
        message: quickSession
          ? `${config.label} quick analysis session ${quickSession.analysisId} loaded.`
          : hasProject
          ? `${config.label} workspace loaded from project registry.`
          : `${config.label} standalone workspace initialized.`,
      },
    ].slice(0, 12),
    dirty: false,
    pendingRecalculation: quickSession?.status === 'draft' || quickSession?.status === 'processing',
    autoMode: true,
    lastProcessedLabel: quickSession ? quickSession.updatedLabel : 'Not processed in this session',
    lastAffectedStepIds: config.pipeline.slice(0, 3).map((step) => step.id),
  };
}

function loadSessionState(
  storageKey: string,
  config: TechniqueWorkspaceConfig,
  hasProjectEvidence: boolean,
  hasProject: boolean,
  quickSession: AnalysisSession | null = null,
) {
  if (typeof window === 'undefined') {
    return buildDefaultSession(storageKey, config, hasProjectEvidence, hasProject, quickSession);
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return buildDefaultSession(storageKey, config, hasProjectEvidence, hasProject, quickSession);
    const parsed = JSON.parse(raw) as WorkspaceSessionState;
    return {
      ...buildDefaultSession(storageKey, config, hasProjectEvidence, hasProject, quickSession),
      ...parsed,
      storageKey,
      parameters: {
        ...getQuickSessionParameters(config, quickSession),
        ...parsed.parameters,
      },
      pipelineStates: {
        ...getDefaultPipelineStates(config, hasProjectEvidence, hasProject, quickSession),
        ...parsed.pipelineStates,
      },
    };
  } catch {
    return buildDefaultSession(storageKey, config, hasProjectEvidence, hasProject, quickSession);
  }
}

function addLog(state: WorkspaceSessionState, message: string): WorkspaceSessionState {
  return {
    ...state,
    processingLog: [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timeLabel: makeTimeLabel(),
        message,
      },
      ...state.processingLog,
    ].slice(0, 12),
  };
}

function markAffectedSteps(
  pipelineStates: Record<string, PipelineStepState>,
  affectedStepIds: string[],
  firstState: PipelineStepState,
  restState: PipelineStepState,
) {
  return Object.fromEntries(
    Object.entries(pipelineStates).map(([stepId, state]) => {
      const index = affectedStepIds.indexOf(stepId);
      if (index === 0) return [stepId, firstState];
      if (index > 0) return [stepId, restState];
      return [stepId, state];
    }),
  ) as Record<string, PipelineStepState>;
}

function markStepsDone(pipelineStates: Record<string, PipelineStepState>, affectedStepIds: string[]) {
  return Object.fromEntries(
    Object.entries(pipelineStates).map(([stepId, state]) => [
      stepId,
      affectedStepIds.includes(stepId) && state !== 'optional' ? 'done' : state,
    ]),
  ) as Record<string, PipelineStepState>;
}

function clampPaneWidth(width: number) {
  return Math.min(RIGHT_PANEL_MAX_WIDTH, Math.max(RIGHT_PANEL_MIN_WIDTH, width));
}

function buildDefaultPaneLayout(storageKey: string): PaneLayoutState {
  return {
    storageKey,
    rightPanelWidth: RIGHT_PANEL_DEFAULT_WIDTH,
    rightPanelCollapsed: false,
    graphFocusMode: false,
    lastUpdatedAt: new Date().toISOString(),
  };
}

function loadPaneLayout(storageKey: string) {
  if (typeof window === 'undefined') return buildDefaultPaneLayout(storageKey);

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return buildDefaultPaneLayout(storageKey);
    const parsed = JSON.parse(raw) as PaneLayoutState;
    return {
      ...buildDefaultPaneLayout(storageKey),
      ...parsed,
      storageKey,
      rightPanelWidth: clampPaneWidth(parsed.rightPanelWidth ?? RIGHT_PANEL_DEFAULT_WIDTH),
    };
  } catch {
    return buildDefaultPaneLayout(storageKey);
  }
}

function buildQuickGraphData(session: AnalysisSession | null) {
  if (!session) return null;

  const markers = session.graphData.markers;
  const markerPositions = markers.map((marker) => marker.position);
  const min = Math.min(...markerPositions, session.technique === 'xps' ? 0 : session.technique === 'ftir' ? 400 : 10);
  const max = Math.max(...markerPositions, session.technique === 'xps' ? 1000 : session.technique === 'ftir' ? 4000 : session.technique === 'raman' ? 3200 : 80);
  const span = Math.max(1, max - min);
  const points = Array.from({ length: 240 }, (_, index) => {
    const x = min + (span * index) / 239;
    const baseline = 18 + Math.sin(index / 12) * 2;
    const peakSignal = markers.reduce((sum, marker) => {
      const width = span / 90;
      const distance = (x - marker.position) / width;
      return sum + marker.intensity * Math.exp(-0.5 * distance * distance);
    }, 0);
    return { x, y: baseline + peakSignal };
  });

  return {
    data: points,
    peaks: markers.map((marker) => ({
      position: marker.position,
      intensity: marker.intensity,
      label: marker.label,
      role: 'selected' as const,
    })),
    xLabel: session.graphData.axisLabel,
    yLabel: session.graphData.yLabel,
  };
}

function getQuickFeatureRows(session: AnalysisSession | null, fallbackRows: Array<{ label: string; value: string; detail: string }>) {
  if (!session) return fallbackRows;
  if (!session.extractedFeatures.length) {
    return [
      {
        label: session.fileName,
        value: 'Raw upload',
        detail: session.processingState,
      },
    ];
  }

  return session.extractedFeatures.map((feature) => {
    const values = Object.entries(feature.values);
    const [firstKey, firstValue] = values[0] ?? ['Result', feature.label];
    return {
      label: feature.label,
      value: firstValue,
      detail: values.map(([key, value]) => `${key}: ${value}`).join(' | ') || firstKey,
    };
  });
}

export function TechniqueWorkspaceShell({ technique, mode = 'project', fileName, sessionId }: TechniqueWorkspaceShellProps) {
  const isQuickMode = mode === 'quick';
  const config = useMemo(() => getTechniqueWorkspaceConfig(technique), [technique]);
  const [searchParams] = useSearchParams();
  const querySessionId = searchParams.get('sessionId') ?? sessionId;
  const quickAnalysisSession = useMemo(
    () => (isQuickMode && querySessionId ? getAnalysisSession(querySessionId) : null),
    [isQuickMode, querySessionId],
  );
  const requestedProjectId = searchParams.get('project');
  const project = useMemo(() => getProjectFromQuery(requestedProjectId), [requestedProjectId]);
  const projectId = project?.id ?? null;
  const focusedEvidence = useMemo(
    () => (project ? getFocusedEvidenceSource(project, technique) : null),
    [project, technique],
  );
  const techniqueState = getTechniqueProjectState(project, technique);
  const comparisonRow = getComparisonRow(project, technique);
  const evidenceSource = getEvidenceSource(project, technique);
  const datasetLabel = isQuickMode
    ? quickAnalysisSession?.fileName || fileName || 'Uploaded dataset'
    : getDatasetLabel(project, technique);
  const datasetStatus = isQuickMode
    ? quickAnalysisSession ? getStatusLabel(quickAnalysisSession.status) : 'Processing'
    : focusedEvidence?.status || (project ? 'Required' : 'Standalone');
  const quickGraphData = useMemo(() => buildQuickGraphData(quickAnalysisSession), [quickAnalysisSession]);
  const graphData = quickGraphData ?? focusedEvidence?.graphData;
  const hasProjectEvidence = Boolean(techniqueState?.available);
  const [quickSessionKey] = useState(() => isQuickMode ? (querySessionId ?? `quick-${Date.now()}`) : '');
  const sessionStorageKey = useMemo(() => isQuickMode
    ? `difaryx-technique-session:${technique}:quick:${quickSessionKey}`
    : `difaryx-technique-session:${technique}:${projectId ?? 'standalone'}:${getTraceId(project, technique)}`,
    [isQuickMode, technique, quickSessionKey, projectId, project],
  );
  const paneLayoutStorageKey = useMemo(() => isQuickMode
    ? `difaryx-technique-pane-layout:${technique}:quick:${quickSessionKey}`
    : `difaryx-technique-pane-layout:${technique}:${projectId ?? 'standalone'}:${getTraceId(project, technique)}`,
    [isQuickMode, technique, quickSessionKey, projectId, project],
  );
  const [activeCenterTab, setActiveCenterTab] = useState(config.centerTabs[0].id);
  const [activeRightTab, setActiveRightTab] = useState<RightTab>('Evidence');
  const [activeGraphTool, setActiveGraphTool] = useState<GraphToolId>('pan');
  const [isGraphActionsOpen, setIsGraphActionsOpen] = useState(false);
  const [sessionState, setSessionState] = useState(() =>
    buildDefaultSession(sessionStorageKey, config, hasProjectEvidence, Boolean(project), quickAnalysisSession),
  );
  const [paneLayout, setPaneLayout] = useState(() => buildDefaultPaneLayout(paneLayoutStorageKey));

  useEffect(() => {
    setActiveCenterTab(config.centerTabs[0].id);
    setActiveRightTab('Evidence');
    setIsGraphActionsOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technique]);

  useEffect(() => {
    setSessionState(loadSessionState(sessionStorageKey, config, hasProjectEvidence, Boolean(project), quickAnalysisSession));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStorageKey, quickAnalysisSession?.analysisId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionState.storageKey !== sessionStorageKey) return;
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(sessionState));
  }, [sessionState, sessionStorageKey]);

  useEffect(() => {
    setPaneLayout(loadPaneLayout(paneLayoutStorageKey));
  }, [paneLayoutStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (paneLayout.storageKey !== paneLayoutStorageKey) return;
    window.localStorage.setItem(paneLayoutStorageKey, JSON.stringify(paneLayout));
  }, [paneLayout, paneLayoutStorageKey]);

  const projectFeatureRows = getFeatureRows(project, focusedEvidence, technique);
  const featureRows = isQuickMode ? getQuickFeatureRows(quickAnalysisSession, projectFeatureRows) : projectFeatureRows;
  const notebookPath = project ? `/notebook?project=${project.id}` : '/notebook';
  const agentPath = project ? `/demo/agent?project=${project.id}` : '/demo/agent';
  const workspacePath = project ? `/workspace?project=${project.id}` : '/workspace';
  const quickStatusLabel = isQuickMode ? (sessionState.dirty ? 'Draft · Unsaved' : 'Draft') : '';
  const processingStateLabel = sessionState.pendingRecalculation
    ? 'Pending recalculation'
    : sessionState.dirty
      ? 'Unsaved changes'
      : Object.values(sessionState.pipelineStates).some((state) => state === 'active')
        ? 'In progress'
        : 'Completed';
  const saveStateLabel = sessionState.dirty
    ? 'Unsaved'
    : sessionState.pendingRecalculation
      ? 'Reprocess needed'
      : 'Autosaved';
  const previewAffectedSteps = sessionState.lastAffectedStepIds.length > 0
    ? sessionState.lastAffectedStepIds
    : config.pipeline.slice(0, 3).map((step) => step.id);
  const rightPanelVisible = !paneLayout.rightPanelCollapsed && !paneLayout.graphFocusMode;

  const updateParameter = (control: TechniqueParameterControl, value: TechniqueParameterValue) => {
    setSessionState((prev) => {
      const next = addLog(
        {
          ...prev,
          parameters: {
            ...prev.parameters,
            [control.id]: value,
          },
          dirty: true,
          pendingRecalculation: true,
          autoMode: false,
          lastAffectedStepIds: control.affectedStepIds,
          pipelineStates: markAffectedSteps(prev.pipelineStates, control.affectedStepIds, 'active', 'pending'),
        },
        `${control.label} changed; recalculation pending.`,
      );
      return next;
    });
  };

  const toggleCheckboxValue = (control: TechniqueParameterControl, option: string) => {
    const current = sessionState.parameters[control.id];
    const values = Array.isArray(current) ? current : [];
    const next = values.includes(option)
      ? values.filter((item) => item !== option)
      : [...values, option];
    updateParameter(control, next);
  };

  const toggleAutoMode = () => {
    setSessionState((prev) => {
      const nextAuto = !prev.autoMode;
      return addLog(
        {
          ...prev,
          autoMode: nextAuto,
          dirty: true,
          pendingRecalculation: true,
          lastAffectedStepIds: config.pipeline.slice(0, 3).map((step) => step.id),
          pipelineStates: markAffectedSteps(
            prev.pipelineStates,
            config.pipeline.slice(0, 3).map((step) => step.id),
            'active',
            'pending',
          ),
        },
        nextAuto ? 'Auto processing mode enabled; defaults pending recalculation.' : 'Manual processing mode enabled.',
      );
    });
  };

  const applyParameters = () => {
    setSessionState((prev) =>
      addLog(
        {
          ...prev,
          dirty: false,
          pendingRecalculation: true,
          pipelineStates: markAffectedSteps(prev.pipelineStates, previewAffectedSteps, 'active', 'pending'),
        },
        'Parameters applied to processing session.',
      ),
    );
  };

  const reprocess = () => {
    setSessionState((prev) =>
      addLog(
        {
          ...prev,
          dirty: false,
          pendingRecalculation: false,
          pipelineStates: markStepsDone(prev.pipelineStates, previewAffectedSteps),
          lastProcessedLabel: makeTimeLabel(),
        },
        `${config.reprocessLabel} completed with current parameters.`,
      ),
    );
  };

  const resetParameters = () => {
    setSessionState((prev) =>
      addLog(
        {
          ...prev,
          parameters: getDefaultParameters(config),
          dirty: true,
          pendingRecalculation: true,
          autoMode: true,
          lastAffectedStepIds: config.pipeline.slice(0, 5).map((step) => step.id),
          pipelineStates: markAffectedSteps(
            prev.pipelineStates,
            config.pipeline.slice(0, 5).map((step) => step.id),
            'active',
            'pending',
          ),
        },
        'Parameters reset to technique defaults.',
      ),
    );
  };

  const savePreset = () => {
    setSessionState((prev) =>
      addLog(
        {
          ...prev,
          presetSavedLabel: makeTimeLabel(),
        },
        'Processing preset saved locally.',
      ),
    );
  };

  const saveSession = () => {
    setSessionState((prev) =>
      addLog(
        {
          ...prev,
          dirty: false,
          pendingRecalculation: false,
        },
        'Processing result saved to local session state.',
      ),
    );
  };

  const updatePaneLayout = (patch: Partial<Omit<PaneLayoutState, 'storageKey'>>) => {
    setPaneLayout((prev) => ({
      ...prev,
      ...patch,
      rightPanelWidth: clampPaneWidth(patch.rightPanelWidth ?? prev.rightPanelWidth),
      lastUpdatedAt: new Date().toISOString(),
    }));
  };

  const setPanePreset = (preset: 'balanced' | 'wideGraph' | 'wideControls' | 'focusGraph') => {
    if (preset === 'balanced') {
      updatePaneLayout({
        rightPanelWidth: RIGHT_PANEL_DEFAULT_WIDTH,
        rightPanelCollapsed: false,
        graphFocusMode: false,
      });
      return;
    }

    if (preset === 'wideGraph') {
      updatePaneLayout({
        rightPanelWidth: RIGHT_PANEL_MIN_WIDTH,
        rightPanelCollapsed: false,
        graphFocusMode: false,
      });
      return;
    }

    if (preset === 'wideControls') {
      updatePaneLayout({
        rightPanelWidth: RIGHT_PANEL_MAX_WIDTH,
        rightPanelCollapsed: false,
        graphFocusMode: false,
      });
      return;
    }

    updatePaneLayout({
      rightPanelCollapsed: true,
      graphFocusMode: true,
    });
  };

  const restorePaneLayout = () => {
    updatePaneLayout({
      rightPanelCollapsed: false,
      graphFocusMode: false,
    });
  };

  const runGraphAction = (actionId: GraphActionId) => {
    setIsGraphActionsOpen(false);

    if (actionId === 'save-view') {
      updatePaneLayout({
        rightPanelWidth: paneLayout.rightPanelWidth,
        rightPanelCollapsed: paneLayout.rightPanelCollapsed,
        graphFocusMode: paneLayout.graphFocusMode,
      });
      return;
    }

    if (actionId === 'focus-graph') {
      setPanePreset('focusGraph');
      return;
    }

    if (actionId === 'copy-view-link') {
      if (typeof window !== 'undefined' && navigator.clipboard) {
        void navigator.clipboard.writeText(window.location.href);
      }
      return;
    }

    if (actionId === 'reset-layout') {
      setPanePreset('balanced');
      return;
    }

    if (actionId === 'restore-saved-view') {
      setPaneLayout(loadPaneLayout(paneLayoutStorageKey));
    }
  };

  const startRightPanelResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = paneLayout.rightPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      updatePaneLayout({
        rightPanelWidth: startWidth + deltaX,
        rightPanelCollapsed: false,
        graphFocusMode: false,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4">
         <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap">
          <Link
            to={isQuickMode ? '/analysis' : workspacePath}
            className="shrink-0 text-sm font-bold tracking-tight text-text-main hover:text-primary"
            title={config.title}
          >
            {config.title}
          </Link>
          <span className="shrink-0 text-xs text-text-muted">&middot;</span>
          {isQuickMode ? (
            <span className="min-w-0 truncate text-xs font-semibold text-amber-700">
              Quick Analysis
            </span>
          ) : (
            <span
              className="min-w-0 truncate text-xs font-semibold text-text-main"
              title={project?.title ?? 'No project linked'}
            >
              {project ? formatChemicalFormula(project.title) : 'No project linked'}
            </span>
          )}
          <span className="shrink-0 text-xs text-text-muted">&middot;</span>
          <span
            className="min-w-0 max-w-[360px] truncate text-xs text-text-muted"
            title={datasetLabel}
          >
            {formatChemicalFormula(datasetLabel)}
          </span>
          <span className="ml-1 shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
            {config.fullName}
          </span>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(datasetStatus)}`}>
            {datasetStatus}
          </span>
          {isQuickMode && (
            <>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                Session ID: {quickAnalysisSession?.analysisId ?? querySessionId ?? quickSessionKey}
              </span>
              <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                Project: Not attached
              </span>
              <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {quickStatusLabel}
              </span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={isQuickMode ? '/workspace' : '/workspace'}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-border bg-white px-3 text-[11px] font-semibold text-text-main transition-colors hover:bg-surface-hover"
          >
            <Layers size={13} />
            {isQuickMode ? 'Attach Project' : project ? 'Switch Project' : 'Attach Project'}
          </Link>
          <Link
            to={workspacePath}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-border bg-white px-3 text-[11px] font-semibold text-text-main transition-colors hover:bg-surface-hover"
          >
            <RotateCcw size={13} />
            Change Technique
          </Link>
          <button
            type="button"
            onClick={saveSession}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-[11px] font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <Save size={13} />
            Save
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-border bg-surface">
          <div className="space-y-2 border-b border-border px-3 py-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Dataset</label>
              <div className="mt-1 rounded border border-border bg-background px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-text-main">
                  <Database size={13} className="shrink-0 text-primary" />
                  <span className="truncate">{formatChemicalFormula(datasetLabel)}</span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-text-muted">
                  {quickAnalysisSession?.analysisId || evidenceSource?.datasetId || getTraceId(project, technique)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(datasetStatus)}`}>
                Evidence {datasetStatus}
              </span>
              {isQuickMode && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  Project: Not attached
                </span>
              )}
              {!isQuickMode && !project && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  No project linked
                </span>
              )}
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(processingStateLabel)}`}>
                {processingStateLabel}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(saveStateLabel)}`}>
                {saveStateLabel}
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Processing Pipeline</p>
              <button
                type="button"
                role="switch"
                aria-checked={sessionState.autoMode}
                onClick={toggleAutoMode}
                className={`inline-flex h-5 items-center rounded-full px-1 text-[9px] font-bold transition-colors ${
                  sessionState.autoMode ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {sessionState.autoMode ? 'Auto' : 'Manual'}
              </button>
            </div>

            <div className="rounded border border-border bg-background">
              {config.pipeline.map((step, index) => {
                const state = sessionState.pipelineStates[step.id] ?? 'pending';
                return (
                  <div key={step.id} className="flex items-center gap-2 border-b border-border/60 px-2 py-1.5 last:border-b-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-text-main">{step.label}</span>
                    <span className={`shrink-0 text-[9px] font-bold uppercase ${pipelineStateClass(state)}`}>
                      {formatStateLabel(state)}
                    </span>
                    {pipelineStateIcon(state)}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded border border-blue-100 bg-blue-50/70 p-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                <Lock size={12} />
                Processing State
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-blue-900">
                {project
                  ? formatChemicalFormula(`${project.title}: ${project.context.sampleDescription}`)
                  : 'No project linked. Parameters and processing log are preserved locally for this session.'}
              </p>
              <p className="mt-1 text-[10px] text-blue-800">
                Last processed: {sessionState.lastProcessedLabel}
              </p>
            </div>
          </div>

          <div className="shrink-0 space-y-1.5 border-t border-border bg-surface px-3 py-3">
            <button
              type="button"
              onClick={saveSession}
              className="flex h-8 w-full items-center justify-between rounded border border-border px-2.5 text-[11px] font-semibold text-text-main transition-colors hover:bg-surface-hover"
            >
              {isQuickMode ? 'Save Quick Session' : 'Save Processing Result'} <Save size={13} />
            </button>
            {isQuickMode && (
              <Link
                to="/workspace"
                className="flex h-8 w-full items-center justify-between rounded border border-amber-300 bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                Attach to Project <Layers size={13} />
              </Link>
            )}
            <Link
              to={notebookPath}
              className="flex h-8 w-full items-center justify-between rounded border border-border px-2.5 text-[11px] font-semibold text-text-main transition-colors hover:bg-surface-hover"
            >
              Notebook <FileText size={13} />
            </Link>
            <Link
              to={agentPath}
              className="flex h-8 w-full items-center justify-between rounded bg-primary px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Run Agent <Sparkles size={13} />
            </Link>
            <Link
              to={`/analysis`}
              className="flex h-8 w-full items-center justify-between rounded border border-border px-2.5 text-[11px] font-semibold text-text-main transition-colors hover:bg-surface-hover"
            >
              Export <Download size={13} />
            </Link>
          </div>
        </aside>

        <main
          className="min-w-0 flex-1 overflow-hidden bg-background p-2 transition-[width] duration-150"
          style={{ minWidth: CENTER_PANEL_MIN_WIDTH }}
        >
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded border border-border bg-surface">
            <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface-hover/40 px-2">
              <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap pr-1">
                {config.centerTabs.map((tab) => {
                  const tabLabel = getCompactCenterTabLabel(tab.label);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      title={tab.label}
                      onClick={() => setActiveCenterTab(tab.id)}
                      className={`shrink-0 rounded px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                        activeCenterTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-text-muted hover:bg-white hover:text-text-main'
                      }`}
                    >
                      {tabLabel}
                    </button>
                  );
                })}
              </div>

              <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                {GRAPH_TOOLS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    aria-label={label}
                    onClick={() => setActiveGraphTool(id)}
                    className={`inline-flex h-6 w-6 items-center justify-center rounded border transition-colors ${
                      activeGraphTool === id
                        ? 'border-primary bg-blue-50 text-primary'
                        : 'border-border bg-white text-text-muted hover:border-primary/40 hover:text-primary'
                    }`}
                  >
                    <Icon size={13} />
                  </button>
                ))}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsGraphActionsOpen((open) => !open)}
                    className="inline-flex h-6 items-center gap-1 rounded border border-border bg-white px-2 text-[9px] font-bold text-text-main transition-colors hover:border-primary/40 hover:text-primary"
                    aria-haspopup="menu"
                    aria-expanded={isGraphActionsOpen}
                  >
                    Actions <ChevronDown size={11} />
                  </button>

                  {isGraphActionsOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-7 z-30 w-44 overflow-hidden rounded-md border border-border bg-white py-1 shadow-lg shadow-slate-900/10"
                    >
                      {GRAPH_ACTIONS.map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          role="menuitem"
                          onClick={() => runGraphAction(id)}
                          className="flex h-8 w-full items-center gap-2 px-2.5 text-left text-[11px] font-semibold text-text-main transition-colors hover:bg-surface-hover hover:text-primary"
                        >
                          <Icon size={13} className="shrink-0" />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {activeCenterTab === config.centerTabs[0].id && graphData ? (
              <div className="min-h-[420px] flex-1 p-2">
                <Graph
                  type={technique}
                  height="100%"
                  externalData={graphData.data}
                  peakMarkers={graphData.peaks ?? []}
                  xAxisLabel={graphData.xLabel}
                  yAxisLabel={graphData.yLabel}
                  showBackground={false}
                  showCalculated={false}
                  showResidual={false}
                />
              </div>
            ) : activeCenterTab === config.centerTabs[0].id ? (
              <div className="flex min-h-[420px] flex-1 items-center justify-center px-6 py-8 text-center">
                <div className="max-w-md">
                  <AlertTriangle size={28} className="mx-auto text-amber-500" />
                  <h2 className="mt-3 text-sm font-bold text-text-main">No project-linked {config.label} dataset</h2>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">
                    {project
                      ? `${config.label} evidence is not available for the selected project. The route remains project-linked and records the evidence gap instead of loading an unrelated dataset.`
                      : `Open this workspace from a project or attach a dataset to begin ${config.label} processing.`}
                  </p>
                  <Link
                    to={workspacePath}
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-[11px] font-semibold text-white hover:bg-primary/90"
                  >
                    Open Workspace Hub <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto p-2">
                <div className="overflow-hidden rounded border border-border bg-background">
                  <table className="w-full text-left">
                    <thead className="bg-surface-hover text-[10px] uppercase tracking-wide text-text-muted">
                      <tr>
                        <th className="px-3 py-2 font-bold">{config.featureLabel}</th>
                        <th className="px-3 py-2 font-bold">{config.unitLabel}</th>
                        <th className="px-3 py-2 font-bold">Evidence Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {featureRows.map((row, index) => (
                        <tr key={`${row.label}-${index}`} className="border-t border-border/60 text-xs">
                          <td className="px-3 py-2 font-semibold text-text-main">{row.label}</td>
                          <td className="px-3 py-2 font-mono text-text-main">{row.value}</td>
                          <td className="px-3 py-2 text-text-muted">{formatChemicalFormula(row.detail)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 rounded border border-border bg-surface-hover/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-main">Interpretation Notice</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">
                    {formatChemicalFormula(comparisonRow?.keyFinding || focusedEvidence?.limitation || 'Interpretation is held until project-linked evidence is available.')}
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>

        {rightPanelVisible && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize graph and controls"
            onMouseDown={startRightPanelResize}
            className="group flex w-2 shrink-0 cursor-col-resize items-center justify-center border-x border-border bg-slate-50 transition-colors hover:bg-blue-50"
          >
            <div className="h-12 w-1 rounded-full bg-slate-300 transition-colors group-hover:bg-primary" />
          </div>
        )}

        {!rightPanelVisible && (
          <aside className="flex w-11 shrink-0 flex-col items-center border-l border-border bg-surface py-3">
            <button
              type="button"
              onClick={restorePaneLayout}
              className="mb-2 flex h-8 w-8 items-center justify-center rounded bg-primary text-[10px] font-bold text-white"
              title="Expand panel"
            >
              +
            </button>
            <button
              type="button"
              onClick={restorePaneLayout}
              className="[writing-mode:vertical-rl] rounded border border-border bg-background px-1.5 py-2 text-[10px] font-bold text-text-muted hover:text-primary"
            >
              Expand panel
            </button>
          </aside>
        )}

        {rightPanelVisible && (
        <aside
          className="flex shrink-0 flex-col overflow-hidden border-l border-border bg-surface transition-[width] duration-150"
          style={{ width: paneLayout.rightPanelWidth, minWidth: RIGHT_PANEL_MIN_WIDTH, maxWidth: RIGHT_PANEL_MAX_WIDTH }}
        >
          <div className="border-b border-border px-3 py-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-main">Controls</p>
                <p className="text-[9px] text-text-muted">{paneLayout.rightPanelWidth}px panel</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updatePaneLayout({ rightPanelCollapsed: true, graphFocusMode: false })}
                  className="h-6 rounded border border-border bg-background px-2 text-[9px] font-bold text-text-muted hover:text-primary"
                  title="Collapse panel"
                >
                  Collapse
                </button>
                <button
                  type="button"
                  onClick={() => setPanePreset('focusGraph')}
                  className="h-6 rounded border border-border bg-background px-2 text-[9px] font-bold text-text-muted hover:text-primary"
                  title="Focus graph"
                >
                  Focus Graph
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {RIGHT_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveRightTab(tab)}
                  className={`rounded px-1.5 py-1.5 text-[9px] font-bold transition-colors ${
                    activeRightTab === tab
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:bg-surface-hover hover:text-text-main'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {activeRightTab === 'Evidence' && (
              <EvidencePanel
                config={config}
                focusedEvidence={focusedEvidence}
                featureRows={featureRows}
                graphData={graphData}
                datasetStatus={datasetStatus}
                project={project}
                quickSession={quickAnalysisSession}
              />
            )}

            {activeRightTab === 'Parameters' && (
              <ParametersPanel
                config={config}
                sessionState={sessionState}
                affectedStepLabels={previewAffectedSteps.map((stepId) => config.pipeline.find((step) => step.id === stepId)?.label || stepId)}
                onChange={updateParameter}
                onToggleCheckbox={toggleCheckboxValue}
                onApply={applyParameters}
                onReprocess={reprocess}
                onReset={resetParameters}
                onSavePreset={savePreset}
                processingStateLabel={processingStateLabel}
              />
            )}

            {activeRightTab === 'Graph' && (
              <GraphLayoutPanel
                paneLayout={paneLayout}
                onPreset={setPanePreset}
                onRestore={restorePaneLayout}
                onWidthChange={(width) => updatePaneLayout({ rightPanelWidth: width, rightPanelCollapsed: false, graphFocusMode: false })}
              />
            )}

            {activeRightTab === 'Boundary' && (
              <BoundaryPanel
                config={config}
                comparisonRow={comparisonRow}
                focusedEvidence={focusedEvidence}
                project={project}
              />
            )}

            {activeRightTab === 'Trace' && (
              <TracePanel
                config={config}
                project={project}
                datasetLabel={datasetLabel}
                evidenceSourceId={evidenceSource?.datasetId}
                traceId={getTraceId(project, technique)}
                datasetStatus={datasetStatus}
                sessionState={sessionState}
              />
            )}
          </div>
        </aside>
        )}
      </div>
    </div>
  );
}

function EvidencePanel({
  config,
  focusedEvidence,
  featureRows,
  graphData,
  datasetStatus,
  project,
  quickSession,
}: {
  config: TechniqueWorkspaceConfig;
  focusedEvidence: DemoFocusedEvidenceSource | null;
  featureRows: Array<{ label: string; value: string; detail: string }>;
  graphData: DemoFocusedEvidenceSource['graphData'] | undefined;
  datasetStatus: string;
  project: RegistryProject | null;
  quickSession: AnalysisSession | null;
}) {
  return (
    <div className="space-y-2">
      <Panel title="Evidence Summary" icon={<Layers size={13} />}>
        <p className="text-xs font-bold text-text-main">
          {formatChemicalFormula(focusedEvidence?.title || `${config.label} evidence not linked`)}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
          {formatChemicalFormula(focusedEvidence?.role || config.purpose)}
        </p>
      </Panel>
      <Panel title="Top Evidence / Features" icon={<Search size={13} />}>
        <div className="space-y-1.5">
          {featureRows.slice(0, 4).map((row, index) => (
            <div key={`${row.value}-${index}`} className="rounded bg-background px-2 py-1.5 text-[10px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-text-main">{row.label}</span>
                <span className="font-mono text-primary">{row.value}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-text-muted">{formatChemicalFormula(row.detail)}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Reliability / Validation" icon={<CheckCircle2 size={13} />}>
        <div className="space-y-1 text-[11px] text-text-muted">
          <Metric label="Evidence status" value={datasetStatus} />
          <Metric label="Matched count" value={graphData?.peaks?.length ? `${graphData.peaks.length} markers` : focusedEvidence?.status || 'Not available'} />
          <Metric label="Validation need" value={project?.crossTechniqueComparison.validationGap || 'Attach to project for validation tracking'} />
          {quickSession?.qualityChecks.slice(0, 3).map((metric) => (
            <Metric key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ParametersPanel({
  config,
  sessionState,
  affectedStepLabels,
  onChange,
  onToggleCheckbox,
  onApply,
  onReprocess,
  onReset,
  onSavePreset,
  processingStateLabel,
}: {
  config: TechniqueWorkspaceConfig;
  sessionState: WorkspaceSessionState;
  affectedStepLabels: string[];
  onChange: (control: TechniqueParameterControl, value: TechniqueParameterValue) => void;
  onToggleCheckbox: (control: TechniqueParameterControl, option: string) => void;
  onApply: () => void;
  onReprocess: () => void;
  onReset: () => void;
  onSavePreset: () => void;
  processingStateLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Panel title="Processing Controls" icon={<FlaskConical size={13} />}>
        <div className="grid grid-cols-1 gap-2">
          {config.parameters.map((control) => (
            <ParameterControlField
              key={control.id}
              control={control}
              value={sessionState.parameters[control.id] ?? control.defaultValue}
              onChange={onChange}
              onToggleCheckbox={onToggleCheckbox}
            />
          ))}
        </div>
      </Panel>

      <Panel title="Preview Impact" icon={<GitBranch size={13} />}>
        <div className="space-y-1.5 text-[11px]">
          <Metric label="Affected step" value={affectedStepLabels.join(', ')} />
          <Metric label="Status" value={processingStateLabel} />
          <Metric
            label="Recalculated"
            value={sessionState.pendingRecalculation || sessionState.dirty
              ? `${config.graphLabel}, ${config.featureLabel}, evidence boundary`
              : 'No pending recalculation'}
          />
          <Metric label="Preset" value={sessionState.presetSavedLabel ? `Saved ${sessionState.presetSavedLabel}` : 'No preset saved'} />
        </div>
      </Panel>

      <Panel title="Actions" icon={<Play size={13} />}>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onApply}
            className="h-8 rounded bg-primary px-2 text-[11px] font-bold text-white hover:bg-primary/90"
          >
            Apply Parameters
          </button>
          <button
            type="button"
            onClick={onReprocess}
            className="h-8 rounded border border-blue-200 bg-blue-50 px-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
          >
            {config.reprocessLabel}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-8 rounded border border-border bg-background px-2 text-[11px] font-bold text-text-main hover:bg-surface-hover"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSavePreset}
            className="h-8 rounded border border-border bg-background px-2 text-[11px] font-bold text-text-main hover:bg-surface-hover"
          >
            Save Preset
          </button>
        </div>
      </Panel>
    </div>
  );
}

function ParameterControlField({
  control,
  value,
  onChange,
  onToggleCheckbox,
}: {
  control: TechniqueParameterControl;
  value: TechniqueParameterValue;
  onChange: (control: TechniqueParameterControl, value: TechniqueParameterValue) => void;
  onToggleCheckbox: (control: TechniqueParameterControl, option: string) => void;
}) {
  const baseInputClass = 'mt-1 h-8 w-full rounded border border-border bg-white px-2 text-xs font-semibold text-text-main focus:border-primary focus:outline-none';

  return (
    <label className="block rounded border border-border bg-background px-2 py-1.5">
      <span className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-text-muted">
        {control.label}
        {control.unit && <span className="normal-case tracking-normal">{control.unit}</span>}
      </span>

      {control.type === 'select' && (
        <select
          value={String(value)}
          onChange={(event) => onChange(control, event.target.value)}
          className={baseInputClass}
        >
          {(control.options ?? []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      )}

      {control.type === 'number' && (
        <input
          type="number"
          value={Number(value)}
          min={control.min}
          max={control.max}
          step={control.step}
          onChange={(event) => onChange(control, Number(event.target.value))}
          className={baseInputClass}
        />
      )}

      {control.type === 'range' && (
        <div className="mt-1 flex items-center gap-2">
          <input
            type="range"
            value={Number(value)}
            min={control.min}
            max={control.max}
            step={control.step}
            onChange={(event) => onChange(control, Number(event.target.value))}
            className="min-w-0 flex-1 accent-blue-600"
          />
          <input
            type="number"
            value={Number(value)}
            min={control.min}
            max={control.max}
            step={control.step}
            onChange={(event) => onChange(control, Number(event.target.value))}
            className="h-8 w-20 rounded border border-border bg-white px-2 text-xs font-semibold text-text-main focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {control.type === 'text' && (
        <input
          type="text"
          value={String(value)}
          onChange={(event) => onChange(control, event.target.value)}
          className={baseInputClass}
        />
      )}

      {control.type === 'toggle' && (
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(value)}
          onClick={() => onChange(control, !Boolean(value))}
          className={`mt-1 inline-flex h-7 w-full items-center justify-between rounded border px-2 text-xs font-bold ${
            value ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        >
          <span>{value ? 'Enabled' : 'Disabled'}</span>
          <span className={`h-4 w-8 rounded-full p-0.5 ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`block h-3 w-3 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
          </span>
        </button>
      )}

      {control.type === 'checkbox-group' && (
        <div className="mt-1 space-y-1">
          {(control.options ?? []).map((option) => {
            const values = Array.isArray(value) ? value : [];
            return (
              <label key={option} className="flex items-center gap-2 text-[11px] font-semibold text-text-main">
                <input
                  type="checkbox"
                  checked={values.includes(option)}
                  onChange={() => onToggleCheckbox(control, option)}
                  className="h-3.5 w-3.5 accent-blue-600"
                />
                {option}
              </label>
            );
          })}
        </div>
      )}
    </label>
  );
}

function GraphLayoutPanel({
  paneLayout,
  onPreset,
  onRestore,
  onWidthChange,
}: {
  paneLayout: PaneLayoutState;
  onPreset: (preset: 'balanced' | 'wideGraph' | 'wideControls' | 'focusGraph') => void;
  onRestore: () => void;
  onWidthChange: (width: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Panel title="Pane Layout" icon={<Layers size={13} />}>
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-text-muted">
              <span>Right panel width</span>
              <span>{paneLayout.rightPanelWidth}px</span>
            </div>
            <input
              type="range"
              min={RIGHT_PANEL_MIN_WIDTH}
              max={RIGHT_PANEL_MAX_WIDTH}
              step={10}
              value={paneLayout.rightPanelWidth}
              onChange={(event) => onWidthChange(Number(event.target.value))}
              className="mt-1 w-full accent-blue-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onPreset('balanced')}
              className="h-8 rounded border border-border bg-background px-2 text-[11px] font-bold text-text-main hover:bg-surface-hover"
            >
              Balanced
            </button>
            <button
              type="button"
              onClick={() => onPreset('wideGraph')}
              className="h-8 rounded border border-border bg-background px-2 text-[11px] font-bold text-text-main hover:bg-surface-hover"
            >
              Wide Graph
            </button>
            <button
              type="button"
              onClick={() => onPreset('wideControls')}
              className="h-8 rounded border border-border bg-background px-2 text-[11px] font-bold text-text-main hover:bg-surface-hover"
            >
              Wide Controls
            </button>
            <button
              type="button"
              onClick={() => onPreset('focusGraph')}
              className="h-8 rounded bg-primary px-2 text-[11px] font-bold text-white hover:bg-primary/90"
            >
              Focus Graph
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="Saved Layout State" icon={<Save size={13} />}>
        <div className="space-y-1 text-[11px]">
          <Metric label="Collapsed" value={paneLayout.rightPanelCollapsed ? 'Yes' : 'No'} />
          <Metric label="Focus mode" value={paneLayout.graphFocusMode ? 'Enabled' : 'Disabled'} />
          <Metric label="Last saved" value={new Date(paneLayout.lastUpdatedAt).toLocaleString()} />
        </div>
        <button
          type="button"
          onClick={onRestore}
          className="mt-2 h-8 w-full rounded border border-border bg-background px-2 text-[11px] font-bold text-text-main hover:bg-surface-hover"
        >
          Restore layout
        </button>
      </Panel>

      <Panel title="Graph Toolbar" icon={<Search size={13} />}>
        <p className="text-[11px] leading-relaxed text-text-muted">
          Pan, Zoom, Select, Reset, and Fit to data stay visible as compact graph controls. Save View, Export Graph, Focus Graph, link, and layout commands are grouped under Actions.
        </p>
      </Panel>
    </div>
  );
}

function BoundaryPanel({
  config,
  comparisonRow,
  focusedEvidence,
  project,
}: {
  config: TechniqueWorkspaceConfig;
  comparisonRow: ReturnType<typeof getComparisonRow>;
  focusedEvidence: DemoFocusedEvidenceSource | null;
  project: RegistryProject | null;
}) {
  return (
    <div className="space-y-2">
      <Panel title="Claim Boundary Contribution" icon={<GitBranch size={13} />}>
        <p className="text-[11px] leading-relaxed text-text-muted">
          {formatChemicalFormula(comparisonRow?.limitation || focusedEvidence?.limitation || project?.notebook.validationBoundary || `${config.label} cannot update a project claim until evidence is linked.`)}
        </p>
      </Panel>
      <Panel title="What This Technique Supports" icon={<CheckCircle2 size={13} />}>
        <p className="text-[11px] leading-relaxed text-text-muted">
          {formatChemicalFormula(comparisonRow?.keyFinding || focusedEvidence?.role || config.purpose)}
        </p>
      </Panel>
      <Panel title="What It Cannot Prove Alone" icon={<AlertTriangle size={13} />}>
        <p className="text-[11px] leading-relaxed text-text-muted">
          {formatChemicalFormula(project?.agentWorkflow.claimBoundary.cannotConclude[0] || 'Standalone evidence cannot close the full claim boundary without project context and complementary validation.')}
        </p>
      </Panel>
    </div>
  );
}

function TracePanel({
  config,
  project,
  datasetLabel,
  evidenceSourceId,
  traceId,
  datasetStatus,
  sessionState,
}: {
  config: TechniqueWorkspaceConfig;
  project: RegistryProject | null;
  datasetLabel: string;
  evidenceSourceId?: string;
  traceId: string;
  datasetStatus: string;
  sessionState: WorkspaceSessionState;
}) {
  return (
    <div className="space-y-2">
      <Panel title="Source Dataset" icon={<Database size={13} />}>
        <Metric label="Dataset" value={datasetLabel} />
        <Metric label="Registry ID" value={traceId} />
        <Metric label="Project" value={project?.title || 'No project linked'} />
      </Panel>
      <Panel title="Processing Pipeline Trace" icon={<GitBranch size={13} />}>
        <div className="space-y-1.5">
          {config.pipeline.map((step, index) => (
            <div key={step.id} className="flex items-start gap-2 text-[10px]">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">{index + 1}</span>
              <div>
                <p className="font-bold text-text-main">{step.label}</p>
                <p className="text-text-muted">
                  {formatStateLabel(sessionState.pipelineStates[step.id] ?? 'pending')} · {step.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Processing Log" icon={<FileText size={13} />}>
        <div className="space-y-1.5">
          {sessionState.processingLog.map((entry) => (
            <div key={entry.id} className="rounded bg-background px-2 py-1.5 text-[10px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-text-main">{entry.timeLabel}</span>
                <span className="text-text-muted">{config.label}</span>
              </div>
              <p className="mt-0.5 text-text-muted">{entry.message}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Registry References" icon={<FileText size={13} />}>
        <Metric label="Evidence source" value={evidenceSourceId || 'Evidence required'} />
        <Metric label="Saved session" value={`${traceId}-session`} />
        <Metric label="Evidence status" value={datasetStatus} />
      </Panel>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded border border-border bg-background p-2">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-text-main">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 text-[10px]">
      <span className="shrink-0 font-bold uppercase tracking-wide text-text-muted">{label}</span>
      <span className={`${typeof value === 'string' && value.length > 32 ? 'text-left' : 'text-right'} font-semibold text-text-main`}>
        {typeof value === 'string' ? formatChemicalFormula(value) : value}
      </span>
    </div>
  );
}
