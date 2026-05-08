import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Database,
  Download,
  FilePlus2,
  FlaskConical,
  FolderKanban,
  Layers3,
  LockKeyhole,
  Play,
  RotateCcw,
  Save,
  Send,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import XRDWorkspace from './XRDWorkspace';
import {
  DEFAULT_PROJECT_ID,
  DemoDataset,
  DemoPeak,
  Evidence,
  ProcessingRun,
  SpectrumPoint,
  Technique,
  demoProjects,
  getAgentPath,
  getDataset,
  getDatasetsByTechnique,
  getDefaultTechnique,
  getLocalExperiments,
  getLatestProcessingRun,
  getMultiTechEntryTechnique,
  getNotebookPath,
  getProcessingRuns,
  getProject,
  getProjectInsight,
  getSavedEvidence,
  getTechniqueLabels,
  getWorkspaceRoute,
  makeBaselinePattern,
  makeTechniquePattern,
  normalizeTechnique,
  saveDataset,
  saveEvidence,
  saveExperiment,
  saveProcessingRun,
} from '../data/demoProjects';
import { DemoExportFormat, exportDemoArtifact } from '../utils/demoExport';
import { getRun, type AgentRun } from '../data/runModel';
import {
  ExperimentConditionLock,
  createDraftExperimentConditionLock,
  getConditionBoundaryNotes,
  getConditionLockStatusLabel,
  lockExperimentConditions,
} from '../data/experimentConditionLock';

type XpsRegion = 'Survey' | 'Cu 2p' | 'Fe 2p' | 'O 1s';

const TECHNIQUE_COPY: Record<Technique, { noun: string; importLabel: string; detectLabel: string; assignLabel: string }> = {
  XRD: {
    noun: 'XRD pattern',
    importLabel: 'Import Demo Dataset',
    detectLabel: 'Detect Peaks',
    assignLabel: 'Match Phase',
  },
  XPS: {
    noun: 'XPS spectrum',
    importLabel: 'Import spectrum',
    detectLabel: 'Peak Fit',
    assignLabel: 'Chemical State Assignment',
  },
  FTIR: {
    noun: 'FTIR spectrum',
    importLabel: 'Import spectrum',
    detectLabel: 'Peak Pick',
    assignLabel: 'Assign vibrational bands',
  },
  Raman: {
    noun: 'Raman spectrum',
    importLabel: 'Import spectrum',
    detectLabel: 'Detect bands',
    assignLabel: 'Mode Assignment',
  },
};

const FEATURE_TEMPLATES: Record<Exclude<Technique, 'XRD'>, DemoPeak[]> = {
  XPS: [
    { position: 933.2, intensity: 86, label: 'Cu 2p3/2 Cu2+' },
    { position: 953.1, intensity: 52, label: 'Cu 2p1/2' },
    { position: 710.8, intensity: 92, label: 'Fe 2p3/2 Fe3+' },
    { position: 531.4, intensity: 74, label: 'O 1s lattice oxygen' },
  ],
  FTIR: [
    { position: 1084, intensity: 78, label: 'Si-O-Si support band' },
    { position: 620, intensity: 64, label: 'Fe-O stretching' },
    { position: 565, intensity: 58, label: 'Metal-oxygen vibration' },
    { position: 3420, intensity: 42, label: 'Surface hydroxyl' },
  ],
  Raman: [
    { position: 585, intensity: 64, label: 'T2g spinel mode' },
    { position: 690, intensity: 96, label: 'A1g spinel mode' },
    { position: 960, intensity: 38, label: 'Ferrite shoulder' },
  ],
};

const emptyLog = ['Workspace loaded. Import or select a dataset to begin the demo run.'];

function getTechniqueFeatures(projectPeaks: DemoPeak[], technique: Technique): DemoPeak[] {
  return technique === 'XRD' ? projectPeaks : FEATURE_TEMPLATES[technique];
}

function dSpacing(twoTheta: number) {
  const wavelength = 1.5406;
  const thetaRadians = (twoTheta / 2) * (Math.PI / 180);
  return wavelength / (2 * Math.sin(thetaRadians));
}

function formatClaimStatus(status: string) {
  if (status === 'strongly_supported') return 'Supported';
  if (status === 'supported') return 'Requires validation';
  if (status === 'partial') return 'Validation-limited';
  if (status === 'inconclusive') return 'Publication-limited';
  return 'Claim boundary';
}

function smoothData(data: SpectrumPoint[]) {
  return data.map((point, index) => {
    const neighbors = data.slice(Math.max(0, index - 2), Math.min(data.length, index + 3));
    const average = neighbors.reduce((sum, item) => sum + item.y, 0) / neighbors.length;
    return { ...point, y: Number(average.toFixed(3)) };
  });
}

function normalizeData(data: SpectrumPoint[]) {
  const max = Math.max(...data.map((point) => point.y), 1);
  return data.map((point) => ({ ...point, y: Number(((point.y / max) * 100).toFixed(3)) }));
}

function applyXpsRegion(data: SpectrumPoint[], region: XpsRegion) {
  if (region === 'Cu 2p') return data.filter((point) => point.x >= 920 && point.x <= 970);
  if (region === 'Fe 2p') return data.filter((point) => point.x >= 700 && point.x <= 735);
  if (region === 'O 1s') return data.filter((point) => point.x >= 520 && point.x <= 542);
  return data;
}

function parseTwoColumnText(text: string): SpectrumPoint[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [xRaw, yRaw] = line.split(/[,\s;]+/);
      const x = Number(xRaw);
      const y = Number(yRaw);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      return { x, y };
    })
    .filter((point): point is SpectrumPoint => Boolean(point));
}

function localTimeStamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function makeEvidence(projectId: string, datasetId: string, technique: Technique, features: DemoPeak[], evidenceRole: 'primary' | 'supporting' | 'context'): Evidence[] {
  const mainFeature = features[0]?.label ?? 'selected spectrum feature';
  return [
    {
      id: `${datasetId}-${technique.toLowerCase()}-evidence-${Date.now()}`,
      technique,
      datasetId,
      claim:
        technique === 'XRD'
          ? `${features.length} diffraction peaks support the assigned ferrite phase.`
          : `${mainFeature} supports the ${technique} interpretation for ${projectId}.`,
      evidenceRole,
      support: features.map((feature) => `${feature.label} at ${feature.position}`).join('; '),
      limitations:
        technique === 'XRD'
          ? 'Traceable demo match uses a compact reference set.'
          : 'Technique-specific assignment is deterministic demo evidence.',
    },
  ];
}

export default function TechniqueWorkspace() {
  const { technique: techniqueParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const project = getProject(searchParams.get('project') ?? DEFAULT_PROJECT_ID);
  const runId = searchParams.get('run');
  const agentRun = runId ? getRun(runId) : null;
  const normalizedTechnique = normalizeTechnique(techniqueParam);
  const isMultiCompat = techniqueParam?.toLowerCase() === 'multi';
  const activeTechnique = project.techniques.includes(normalizedTechnique)
    ? normalizedTechnique
    : getDefaultTechnique(project);

  const [refreshKey, setRefreshKey] = useState(0);
  const datasets = useMemo(
    () => getDatasetsByTechnique(project.id, activeTechnique),
    [project.id, activeTechnique, refreshKey],
  );
  const queryDataset = getDataset(searchParams.get('dataset'));
  const selectedDataset =
    queryDataset?.projectId === project.id && queryDataset.technique === activeTechnique
      ? queryDataset
      : datasets[0];
  const selectedDatasetRuns = selectedDataset ? getProcessingRuns(selectedDataset.id) : [];
  const latestSavedRun = getLatestProcessingRun(selectedDataset?.id);

  const [imported, setImported] = useState(false);
  const [baseline, setBaseline] = useState(false);
  const [smoothing, setSmoothing] = useState(false);
  const [normalize, setNormalize] = useState(false);
  const [xpsBackground, setXpsBackground] = useState(false);
  const [ftirOffset, setFtirOffset] = useState(0);
  const [ftirSlope, setFtirSlope] = useState(0);
  const [cropMin, setCropMin] = useState(activeTechnique === 'XRD' ? 10 : undefined);
  const [cropMax, setCropMax] = useState(activeTechnique === 'XRD' ? 80 : undefined);
  const [xpsRegion, setXpsRegion] = useState<XpsRegion>('Survey');
  const [detectedFeatures, setDetectedFeatures] = useState<DemoPeak[]>([]);
  const [matched, setMatched] = useState(false);
  const [log, setLog] = useState<string[]>(emptyLog);
  const [toast, setToast] = useState('');
  const [experimentOpen, setExperimentOpen] = useState(false);
  const [parsedUpload, setParsedUpload] = useState<{ fileName: string; points: SpectrumPoint[] } | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    experimentTitle: `${project.name} ${activeTechnique} follow-up`,
    sampleName: project.name,
    materialSystem: project.material,
    technique: activeTechnique,
    fileName: `${project.id}_${activeTechnique.toLowerCase()}_new.xy`,
    operator: 'Demo scientist',
    date: new Date().toISOString().slice(0, 10),
    notes: 'Frontend demo dataset prepared inside DIFARYX.',
  });
  const [conditionLock, setConditionLock] = useState<ExperimentConditionLock>(() => createDraftExperimentConditionLock());

  useEffect(() => {
    setImported(false);
    setBaseline(false);
    setSmoothing(false);
    setNormalize(false);
    setXpsBackground(false);
    setFtirOffset(0);
    setFtirSlope(0);
    setCropMin(activeTechnique === 'XRD' ? 10 : undefined);
    setCropMax(activeTechnique === 'XRD' ? 80 : undefined);
    setXpsRegion('Survey');
    setDetectedFeatures(latestSavedRun?.detectedFeatures ?? []);
    setMatched(Boolean(latestSavedRun?.matchResult));
    setLog(latestSavedRun ? [`${localTimeStamp()} - saved processing run loaded`, ...latestSavedRun.log] : emptyLog);
    setForm((current) => ({
      ...current,
      experimentTitle: `${project.name} ${activeTechnique} follow-up`,
      sampleName: project.name,
      materialSystem: project.material,
      technique: activeTechnique,
      fileName: `${project.id}_${activeTechnique.toLowerCase()}_new.xy`,
    }));
    setConditionLock(createDraftExperimentConditionLock());
  }, [project.id, project.name, project.material, activeTechnique, selectedDataset?.id, latestSavedRun?.id]);

  if (isMultiCompat) {
    return <Navigate to={getWorkspaceRoute(project, getMultiTechEntryTechnique(project))} replace />;
  }

  if (normalizedTechnique !== activeTechnique) {
    return <Navigate to={getWorkspaceRoute(project, activeTechnique)} replace />;
  }

  const savedRuns = selectedDatasetRuns;
  const rawData = latestSavedRun?.outputData ?? selectedDataset?.dataPoints ?? makeTechniquePattern(project, activeTechnique);
  const labels = selectedDataset
    ? { xLabel: selectedDataset.xLabel, yLabel: selectedDataset.yLabel }
    : getTechniqueLabels(activeTechnique);
  const localExperiments = getLocalExperiments(project.id);
  const savedEvidence = getSavedEvidence(project.id, activeTechnique);
  const conditionBoundaryNotes = getConditionBoundaryNotes(conditionLock, project.techniques);
  const featuresAvailable = detectedFeatures.length > 0;
  const processingCount = [baseline, xpsBackground, smoothing, normalize, ftirOffset !== 0, ftirSlope !== 0].filter(Boolean).length;
  
  // Determine evidence role based on technique
  const evidenceRole: 'primary' | 'supporting' | 'context' = activeTechnique === 'XRD' ? 'primary' : 'supporting';
  
  const workspaceStatus = matched
    ? activeTechnique === 'XRD' ? 'Phase matched' : 'Assignments saved'
    : featuresAvailable
      ? activeTechnique === 'XRD' ? 'Peaks detected' : 'Features detected'
      : imported
        ? 'Dataset imported'
        : processingCount > 0
          ? 'Processed trace'
          : latestSavedRun
            ? 'Saved run loaded'
            : 'Raw preview';

  const processedData = useMemo(() => {
    let nextData = rawData.map((point) => ({ ...point }));

    if (activeTechnique === 'XPS') {
      nextData = applyXpsRegion(nextData, xpsRegion);
    }

    if (activeTechnique === 'XRD' && cropMin !== undefined && cropMax !== undefined) {
      nextData = nextData.filter((point) => point.x >= cropMin && point.x <= cropMax);
    }

    if (baseline || xpsBackground) {
      const minY = Math.min(...nextData.map((point) => point.y));
      nextData = nextData.map((point, index) => {
        const ftirAdjustment = activeTechnique === 'FTIR' ? ftirOffset + (index / Math.max(nextData.length - 1, 1)) * ftirSlope : 0;
        return { ...point, y: Number(Math.max(0, point.y - minY * 0.72 + ftirAdjustment).toFixed(3)) };
      });
    }

    if (smoothing) {
      nextData = smoothData(nextData);
    }

    if (normalize) {
      nextData = normalizeData(nextData);
    }

    return nextData;
  }, [activeTechnique, baseline, cropMax, cropMin, ftirOffset, ftirSlope, normalize, rawData, smoothing, xpsBackground, xpsRegion]);

  if (normalizedTechnique === 'XRD') {
    return <XRDWorkspace />;
  }

  const insight = {
    ...getProjectInsight(project),
    primaryResult: matched ? project.phase : `${activeTechnique} evidence workspace`,
    claimStatus: project.claimStatus,
    validationState: project.validationState,
    interpretation: `${TECHNIQUE_COPY[activeTechnique].noun} is active for ${project.name}. Dataset, processing state, detected features, and saved evidence are preserved in the shared demo workspace.`,
    keyEvidence: [
      ...(featuresAvailable
        ? detectedFeatures.slice(0, 3).map((feature) => `${activeTechnique}: ${feature.label} at ${feature.position}`)
        : [`${selectedDataset?.fileName ?? 'Demo dataset'} ready for ${activeTechnique} processing.`]),
      ...savedEvidence.slice(0, 2).map((item) => item.claim),
    ],
    warnings: matched || !featuresAvailable ? [] : ['Detect features before saving evidence or sending this run to the notebook.'],
    recommendedNextStep: matched
      ? ['Send this run to Notebook.', 'Run Agent with the saved evidence.']
      : ['Import data, detect features, then save evidence.'],
  };
  const evidenceOutputRows = activeTechnique === 'XRD'
    ? [
        ['Detected peaks', '9 diffraction peaks'],
        ['Candidate phase', 'CuFe2O4 spinel'],
        ['Evidence role', 'Primary'],
        ['Caveat', 'Requires surface validation (XPS)'],
      ]
    : [
        ['Tool output', `${activeTechnique} evidence packet`],
        ['Agent status', 'Ready for fusion'],
        ['Evidence role', featuresAvailable ? 'Supporting' : 'Pending'],
        ['Caveat', 'Review alongside XRD and multi-tech context'],
      ];

  const appendLog = (message: string) => {
    setLog((current) => [`${localTimeStamp()} - ${message}`, ...current]);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1800);
  };

  const workspaceExportMessage = (format: DemoExportFormat) => {
    if (format === 'pdf') return 'Workspace evidence export prepared for Agent Report.';
    if (format === 'docx') return 'DOCX workspace evidence packet prepared for Agent Report.';
    if (format === 'csv') return 'CSV workspace evidence table prepared for Agent Report.';
    if (format === 'txt') return 'TXT workspace processing summary prepared for Agent Report.';
    return 'PNG workspace chart snapshot prepared for Agent Report.';
  };

  const handleImport = () => {
    setImported(true);
    appendLog(`dataset imported: ${selectedDataset?.fileName ?? 'built-in demo dataset'}`);
    showToast('Demo dataset imported');
  };

  const handleDetect = () => {
    const features = getTechniqueFeatures(project.xrdPeaks, activeTechnique);
    setDetectedFeatures(features);
    setMatched(false);
    appendLog(`${activeTechnique === 'XRD' ? 'peaks' : 'bands'} detected: ${features.length}`);
    showToast(`${features.length} features detected`);
  };

  const handleClearPeaks = () => {
    setDetectedFeatures([]);
    setMatched(false);
    appendLog('detected features cleared');
    showToast('Detected features cleared');
  };

  const handleMatch = () => {
    const features = detectedFeatures.length > 0 ? detectedFeatures : getTechniqueFeatures(project.xrdPeaks, activeTechnique);
    setDetectedFeatures(features);
    setMatched(true);
    appendLog(activeTechnique === 'XRD' ? 'phase matched against ferrite reference' : `${activeTechnique} assignments saved to evidence panel`);
    showToast(activeTechnique === 'XRD' ? 'Phase match generated' : 'Technique assignments generated');
  };

  const handleToggle = (label: string, current: boolean, setter: (value: boolean) => void) => {
    const next = !current;
    setter(next);
    appendLog(`${label} ${next ? 'applied' : 'removed'}`);
    showToast(`${label} ${next ? 'applied' : 'removed'}`);
  };

  const handleApplyCrop = () => {
    appendLog(`crop range applied: ${cropMin ?? 10}-${cropMax ?? 80} 2theta`);
    showToast('Crop range applied');
  };

  const handleSaveEvidence = () => {
    const datasetId = selectedDataset?.id ?? `${project.id}-${activeTechnique.toLowerCase()}-demo`;
    const features = detectedFeatures.length > 0 ? detectedFeatures : getTechniqueFeatures(project.xrdPeaks, activeTechnique);
    makeEvidence(project.id, datasetId, activeTechnique, features, evidenceRole).forEach((item) => saveEvidence(item));
    setRefreshKey((key) => key + 1);
    appendLog('evidence saved');
    showToast('Evidence saved');
  };

  const handleExportReport = (format: DemoExportFormat) => {
    exportDemoArtifact(format, {
      filenameBase: `${project.id}-${activeTechnique.toLowerCase()}-${selectedDataset?.id ?? 'demo'}-workspace`,
      title: `${project.name} ${activeTechnique} Workspace Export`,
      sections: [
        {
          heading: 'Dataset',
          lines: [
            selectedDataset?.fileName ?? `${activeTechnique} demo dataset`,
            selectedDataset?.sampleName,
            `${labels.xLabel} / ${labels.yLabel}`,
          ],
        },
        {
          heading: 'Processing state',
          lines: [
            `Status: ${workspaceStatus}`,
            `Baseline: ${baseline}`,
            `Background/subtract: ${xpsBackground}`,
            `Smoothing: ${smoothing}`,
            `Normalize: ${normalize}`,
            activeTechnique === 'XPS' ? `Region: ${xpsRegion}` : undefined,
            activeTechnique === 'FTIR' ? `Baseline offset: ${ftirOffset}, slope: ${ftirSlope}` : undefined,
          ],
        },
        {
          heading: 'Detected features',
          lines: (detectedFeatures.length > 0 ? detectedFeatures : getTechniqueFeatures(project.xrdPeaks, activeTechnique)).map(
            (feature) => `${feature.label}: ${feature.position} (${feature.intensity})`,
          ),
        },
        { heading: 'Processing log', lines: log },
      ],
      csvRows: processedData.slice(0, 240).map((point) => ({ x: point.x, y: point.y, technique: activeTechnique })),
    });
    const message = workspaceExportMessage(format);
    appendLog(`${message} Project: ${project.name}; technique: ${activeTechnique}; dataset: ${selectedDataset?.fileName ?? 'demo dataset'}; status: ${formatClaimStatus(project.claimStatus)}; source: ${selectedDataset?.id ?? project.id}.`);
    showToast(message);
  };

  const createRun = (extraLog?: string): ProcessingRun => {
    const datasetId = selectedDataset?.id ?? `${project.id}-${activeTechnique.toLowerCase()}-demo`;
    const features = detectedFeatures.length > 0 ? detectedFeatures : getTechniqueFeatures(project.xrdPeaks, activeTechnique);
    const evidence = makeEvidence(project.id, datasetId, activeTechnique, features, evidenceRole);
    evidence.forEach((item) => saveEvidence(item));

    const run = saveProcessingRun({
      datasetId,
      projectId: project.id,
      technique: activeTechnique,
      parameters: {
        imported,
        baseline,
        backgroundSubtract: xpsBackground,
        smoothing,
        normalize,
        ftirOffset,
        ftirSlope,
        cropMin: cropMin ?? '',
        cropMax: cropMax ?? '',
        region: activeTechnique === 'XPS' ? xpsRegion : '',
      },
      outputData: processedData,
      detectedFeatures: features,
      evidence,
      matchResult: {
        phase: project.phase,
        claimStatus: project.claimStatus,
        matchedPeaks: features.length,
        missingPeaks: activeTechnique === 'XRD' && project.claimStatus !== 'strongly_supported' ? ['weak high-angle shoulder'] : [],
        unexplainedPeaks: activeTechnique === 'XRD' ? ['minor baseline ripple near 40 deg'] : [],
        caveat:
          activeTechnique === 'XRD'
            ? 'Demo reference matching uses project peaks and a compact phase library.'
            : `${activeTechnique} assignment is saved as supporting evidence, not a standalone phase call.`,
      },
      log: extraLog ? [`${localTimeStamp()} - ${extraLog}`, ...log] : log,
    });

    setRefreshKey((key) => key + 1);
    return run;
  };

  const handleSaveRun = () => {
    createRun('run saved');
    appendLog('run saved');
    showToast('Processing run saved');
  };

  const handleSendToNotebook = () => {
    const run = createRun('sent to notebook');
    appendLog('sent to notebook');
    navigate(`/notebook?project=${project.id}&run=${run.id}`);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const points = parseTwoColumnText(text);
      if (points.length < 8) {
        throw new Error('The selected file did not contain enough two-column numeric rows.');
      }
      setParsedUpload({ fileName: file.name, points });
      setForm((current) => ({ ...current, fileName: file.name }));
      setFormError('');
      showToast(`${points.length} rows parsed`);
    } catch {
      setParsedUpload(null);
      setFormError('Could not parse that file. You can still save this experiment with the built-in demo spectrum.');
    }
  };

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      technique: field === 'technique' ? normalizeTechnique(value) : current.technique,
    }));
  };

  const updateInlineConditionGroup = <
    Group extends 'synthesisConditions' | 'measurementConditions' | 'processingConditions',
    Field extends keyof NonNullable<ExperimentConditionLock[Group]>,
  >(
    group: Group,
    field: Field,
    value: string,
  ) => {
    setConditionLock((current) => ({
      ...current,
      [group]: {
        ...(current[group] ?? {}),
        [field]: value,
      },
      userConfirmed: false,
      lockedAt: undefined,
      completenessStatus: 'draft',
    }));
  };

  const updateInlineValidationCondition = (
    field: 'replicateRequired' | 'referenceValidationRequired' | 'refinementRequired' | 'publicationClaimAllowed',
    value: boolean,
  ) => {
    setConditionLock((current) => ({
      ...current,
      validationConditions: {
        ...(current.validationConditions ?? { crossTechniqueRequired: [] }),
        [field]: value,
      },
      userConfirmed: false,
      lockedAt: undefined,
      completenessStatus: 'draft',
    }));
  };

  const handleLockInlineConditions = () => {
    setConditionLock((current) => lockExperimentConditions(current));
  };

  const handleCreateExperiment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conditionLock.userConfirmed) {
      setFormError('Lock experiment conditions before adding the dataset. Missing condition fields remain condition-limited.');
      return;
    }
    const technique = normalizeTechnique(form.technique);
    const labelsForDataset = getTechniqueLabels(technique);
    const dataset = saveDataset({
      projectId: project.id,
      technique,
      fileName: form.fileName,
      sampleName: form.sampleName,
      xLabel: labelsForDataset.xLabel,
      yLabel: labelsForDataset.yLabel,
      dataPoints: parsedUpload?.points ?? makeTechniquePattern(project, technique),
      metadata: {
        experimentTitle: form.experimentTitle,
        sampleName: form.sampleName,
        materialSystem: form.materialSystem,
        operator: form.operator,
        date: form.date,
        notes: form.notes,
      },
      processingState: {
        imported: Boolean(parsedUpload),
        baseline: false,
        smoothing: false,
        normalize: false,
      },
      detectedFeatures: [],
    });

    saveExperiment({
      projectId: project.id,
      title: form.experimentTitle,
      sampleName: form.sampleName,
      materialSystem: form.materialSystem,
      technique,
      fileName: form.fileName,
      operator: form.operator,
      date: form.date,
      notes: form.notes,
      datasetIds: [dataset.id],
      conditionLock,
    });

    setRefreshKey((key) => key + 1);
    setExperimentOpen(false);
    setConditionLock(createDraftExperimentConditionLock());
    appendLog(`new experiment added: ${form.experimentTitle}`);
    showToast('Experiment, dataset, and condition record added');
    navigate(getWorkspaceRoute(project, technique, dataset.id));
  };

  return (
    <DashboardLayout>
      <div className="flex-1 h-full flex overflow-hidden bg-background">
        <aside className="hidden xl:flex w-80 border-r border-border bg-surface flex-col shrink-0">
          <div className="p-5 border-b border-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Selected project</p>
            <h1 className="mt-2 text-lg font-bold text-text-main">{project.name}</h1>
            <p className="mt-1 text-xs text-text-muted">{project.material}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-5">
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Projects</h2>
              </div>
              <div className="space-y-1">
                {demoProjects.map((item) => {
                  const targetTechnique = item.techniques.includes(activeTechnique)
                    ? activeTechnique
                    : getDefaultTechnique(item);
                  return (
                    <Link
                      key={item.id}
                      to={getWorkspaceRoute(item, targetTechnique)}
                      className={`block rounded-md border px-3 py-2 text-xs transition-colors ${
                        item.id === project.id
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-transparent text-text-muted hover:bg-surface-hover hover:text-text-main'
                      }`}
                    >
                      <span className="font-semibold">{item.name}</span>
                      <span className="block mt-0.5">{item.status}</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Experiments</h2>
                <button
                  onClick={() => setExperimentOpen((open) => !open)}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] font-semibold text-primary hover:bg-primary/10"
                >
                  <FilePlus2 size={13} /> New
                </button>
              </div>
              <div className="space-y-1">
                <div className="rounded-md border border-border bg-background/60 px-3 py-2 text-xs">
                  <span className="font-semibold text-text-main">{project.notebook.title}</span>
                  <span className="block mt-0.5 text-text-muted">Built-in demo experiment</span>
                </div>
                {localExperiments.map((experiment) => (
                  <div key={experiment.id} className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                    <span className="font-semibold text-text-main">{experiment.title}</span>
                    <span className="block mt-0.5 text-text-muted">{experiment.technique} - {experiment.fileName}</span>
                    <span className="block mt-0.5 text-[10px] font-semibold text-amber-600">
                      {getConditionLockStatusLabel(experiment.conditionLock)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {experimentOpen && (
              <form onSubmit={handleCreateExperiment} className="rounded-lg border border-border bg-background p-3 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-main">
                  <Upload size={14} className="text-primary" /> Add dataset metadata
                </div>
                {[
                  ['experimentTitle', 'Experiment title'],
                  ['sampleName', 'Sample name'],
                  ['materialSystem', 'Material system'],
                  ['fileName', 'File name'],
                  ['operator', 'Operator'],
                  ['date', 'Date'],
                ].map(([field, label]) => (
                  <label key={field} className="block text-[11px] font-medium text-text-muted">
                    {label}
                    <input
                      type={field === 'date' ? 'date' : 'text'}
                      value={String(form[field as keyof typeof form])}
                      onChange={(event) => handleFormChange(field as keyof typeof form, event.target.value)}
                      className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary"
                    />
                  </label>
                ))}
                <label className="block text-[11px] font-medium text-text-muted">
                  Technique
                  <select
                    value={form.technique}
                    onChange={(event) => handleFormChange('technique', event.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary"
                  >
                    {project.techniques.map((technique) => (
                      <option key={technique} value={technique}>{technique}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-[11px] font-medium text-text-muted">
                  Notes
                  <textarea
                    value={form.notes}
                    onChange={(event) => handleFormChange('notes', event.target.value)}
                    className="mt-1 h-16 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary"
                  />
                </label>
                <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-main">
                        <LockKeyhole size={13} className="text-amber-600" /> Experiment Conditions
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
                        Lock user-provided conditions before interpretation handoff. Missing fields remain condition-limited.
                      </p>
                    </div>
                    <span className="rounded border border-border bg-background px-2 py-0.5 text-[9px] font-semibold text-text-muted">
                      {getConditionLockStatusLabel(conditionLock)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    {[
                      {
                        label: 'Synthesis method',
                        value: conditionLock.synthesisConditions?.method,
                        onChange: (value: string) => updateInlineConditionGroup('synthesisConditions', 'method', value),
                      },
                      {
                        label: 'Instrument / source',
                        value: conditionLock.measurementConditions?.instrument ?? conditionLock.measurementConditions?.radiationOrSource,
                        onChange: (value: string) => setConditionLock((current) => ({
                          ...current,
                          measurementConditions: {
                            ...(current.measurementConditions ?? {}),
                            instrument: value,
                            radiationOrSource: value,
                          },
                          userConfirmed: false,
                          lockedAt: undefined,
                          completenessStatus: 'draft',
                        })),
                      },
                      {
                        label: 'Scan range / calibration',
                        value: conditionLock.measurementConditions?.scanRange ?? conditionLock.measurementConditions?.calibrationReference,
                        onChange: (value: string) => setConditionLock((current) => ({
                          ...current,
                          measurementConditions: {
                            ...(current.measurementConditions ?? {}),
                            scanRange: value,
                            calibrationReference: value,
                          },
                          userConfirmed: false,
                          lockedAt: undefined,
                          completenessStatus: 'draft',
                        })),
                      },
                      {
                        label: 'Processing method',
                        value: conditionLock.processingConditions?.baselineCorrection ?? conditionLock.processingConditions?.normalization ?? conditionLock.processingConditions?.peakDetection,
                        onChange: (value: string) => setConditionLock((current) => ({
                          ...current,
                          processingConditions: {
                            ...(current.processingConditions ?? {}),
                            baselineCorrection: value,
                            normalization: value,
                            peakDetection: value,
                          },
                          userConfirmed: false,
                          lockedAt: undefined,
                          completenessStatus: 'draft',
                        })),
                      },
                    ].map((item) => (
                      <label key={item.label} className="block text-[10px] font-semibold text-text-muted">
                        {item.label}
                        <input
                          value={item.value ?? ''}
                          onChange={(event) => item.onChange(event.target.value)}
                          placeholder="user-provided"
                          className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-[11px] text-text-main placeholder:text-text-muted/60 focus:outline-none focus:border-primary"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-1.5">
                    {[
                      ['Replicate required', 'replicateRequired'],
                      ['Reference validation required', 'referenceValidationRequired'],
                      ['Refinement required', 'refinementRequired'],
                      ['Publication-level claim allowed after validation', 'publicationClaimAllowed'],
                    ].map(([label, field]) => (
                      <label key={field} className="inline-flex items-center gap-2 text-[10px] font-semibold text-text-muted">
                        <input
                          type="checkbox"
                          checked={Boolean(conditionLock.validationConditions?.[field as keyof NonNullable<ExperimentConditionLock['validationConditions']>])}
                          onChange={(event) => updateInlineValidationCondition(field as 'replicateRequired' | 'referenceValidationRequired' | 'refinementRequired' | 'publicationClaimAllowed', event.target.checked)}
                          className="h-3 w-3 accent-primary"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <ul className="mt-3 space-y-1 text-[10px] leading-relaxed text-text-muted">
                    {conditionBoundaryNotes.slice(0, 3).map((note) => (
                      <li key={note}>- {note}</li>
                    ))}
                  </ul>
                  <Button type="button" variant="outline" size="sm" onClick={handleLockInlineConditions} className="mt-3 w-full gap-1.5">
                    <LockKeyhole size={13} /> Lock experiment conditions
                  </Button>
                </div>
                <label className="block text-[11px] font-medium text-text-muted">
                  Fake upload (.txt, .csv, .xy)
                  <input
                    type="file"
                    accept=".txt,.csv,.xy"
                    onChange={handleFileUpload}
                    className="mt-1 w-full text-[11px] text-text-muted file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-primary"
                  />
                </label>
                {parsedUpload && <p className="text-[11px] text-primary">{parsedUpload.points.length} numeric rows ready from {parsedUpload.fileName}</p>}
                {formError && <p className="text-[11px] text-amber-600">{formError}</p>}
                <Button type="submit" size="sm" className="w-full gap-2" disabled={!conditionLock.userConfirmed}>
                  <FilePlus2 size={14} /> Add Dataset
                </Button>
              </form>
            )}

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Technique rail</h2>
              <div className="grid grid-cols-2 gap-2">
                {project.techniques.map((technique) => (
                  <Link
                    key={technique}
                    to={getWorkspaceRoute(project, technique)}
                    className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                      activeTechnique === technique
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-background text-text-muted hover:bg-surface-hover hover:text-text-main'
                    }`}
                  >
                    {technique}
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Datasets</h2>
              <div className="space-y-2">
                {datasets.map((dataset) => (
                  <Link
                    key={dataset.id}
                    to={getWorkspaceRoute(project, activeTechnique, dataset.id)}
                    className={`block rounded-md border px-3 py-2 text-xs transition-colors ${
                      selectedDataset?.id === dataset.id
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-background text-text-muted hover:bg-surface-hover hover:text-text-main'
                    }`}
                  >
                    <span className="font-semibold">{dataset.fileName}</span>
                    <span className="block mt-0.5">{dataset.sampleName}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="p-4 border-t border-border space-y-2">
            <Link
              to={getNotebookPath(project)}
              className="flex h-9 items-center justify-between rounded-md border border-border px-3 text-sm font-medium text-text-main hover:bg-surface-hover transition-colors"
            >
              Open Notebook <ArrowRight size={14} />
            </Link>
            <Link
              to={getAgentPath(project)}
              className="flex h-9 items-center justify-between rounded-md bg-primary text-white px-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Run Agent <ArrowRight size={14} />
            </Link>
          </div>
        </aside>

        <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="border-b border-border bg-surface/60 px-3 py-2 md:px-4">
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    {activeTechnique} Workspace
                  </span>
                  <h2 className="text-base font-bold leading-tight text-text-main">{project.name}</h2>
                </div>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="max-w-[420px] truncate text-[11px] text-text-muted">
                    {selectedDataset?.fileName ?? `${activeTechnique} demo dataset`} - {labels.xLabel} / {labels.yLabel}
                  </span>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {workspaceStatus}
                  </span>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Used by DIFARYX Agent
                  </span>
                  <span className="rounded-full border border-cyan/25 bg-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-cyan">
                    Agent Ready
                  </span>
                  {latestSavedRun && (
                    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-text-muted">
                      latest run: {new Date(latestSavedRun.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-start gap-1.5 lg:justify-end">
                {toast && (
                  <span className="inline-flex h-8 items-center rounded-md border border-primary/20 bg-primary/10 px-2 text-[11px] font-semibold text-primary">
                    {toast}
                  </span>
                )}
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSaveRun}>
                  <Save size={14} /> Save Run
                </Button>
                <Button size="sm" className="gap-1.5" onClick={handleSendToNotebook}>
                  <Send size={14} /> Send to Notebook
                </Button>
                <button
                  type="button"
                  onClick={() => navigate('/demo/agent?project=cu-fe2o4-spinel')}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-3 text-xs font-semibold text-white shadow-md shadow-blue-600/10 transition-all hover:-translate-y-0.5 hover:shadow-indigo-600/20"
                >
                  <Sparkles size={14} /> Run in Agent Mode
                </button>
              </div>
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto xl:hidden">
              {project.techniques.map((technique) => (
                <Link
                  key={technique}
                  to={getWorkspaceRoute(project, technique)}
                  className={`shrink-0 rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
                    activeTechnique === technique
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-background text-text-muted hover:bg-surface-hover hover:text-text-main'
                  }`}
                >
                  {technique}
                </Link>
              ))}
              <button
                onClick={() => setExperimentOpen((open) => !open)}
                className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                New Experiment
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {agentRun && (
              <Card className="border-cyan/30 bg-cyan/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-cyan shrink-0" />
                      <h3 className="text-sm font-bold text-text-main">Characterization Result</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        agentRun.outputs.claimStatus === 'strongly_supported' ? 'border-emerald-600/30 bg-emerald-600/10 text-emerald-600' :
                        agentRun.outputs.claimStatus === 'supported' ? 'border-cyan/30 bg-cyan/10 text-cyan' :
                        agentRun.outputs.claimStatus === 'partial' ? 'border-amber-500/30 bg-amber-500/10 text-amber-500' :
                        'border-text-muted/30 bg-text-muted/10 text-text-muted'
                      }`}>
                        {formatClaimStatus(agentRun.outputs.claimStatus)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Phase</p>
                        <p className="text-sm font-semibold text-text-main">{agentRun.outputs.phase}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Status</p>
                        <p className={`text-lg font-bold ${
                          agentRun.outputs.claimStatus === 'strongly_supported' ? 'text-emerald-600' :
                          agentRun.outputs.claimStatus === 'supported' ? 'text-cyan' :
                          agentRun.outputs.claimStatus === 'partial' ? 'text-amber-500' :
                          'text-text-muted'
                        }`}>
                          {formatClaimStatus(agentRun.outputs.claimStatus)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Evidence Summary</p>
                        <ul className="mt-1 space-y-1">
                          {agentRun.outputs.evidence.slice(0, 3).map((item, i) => (
                            <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                              <CheckCircle2 size={12} className="text-cyan shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="gap-1.5 whitespace-nowrap"
                      onClick={() => navigate(`/notebook?project=${project.id}&run=${agentRun.id}`)}
                    >
                      <Send size={14} /> Save to Notebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 whitespace-nowrap"
                      onClick={() => navigate(`/demo/agent?project=${project.id}`)}
                    >
                      <RotateCcw size={14} /> Re-run Agent
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            <div className="grid grid-cols-1 2xl:grid-cols-[1fr_360px] gap-6">
              <div className="space-y-4">
                <Card className="p-4 min-h-[430px]">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text-main">{TECHNIQUE_COPY[activeTechnique].noun}</h3>
                      <p className="text-xs text-text-muted mt-1">
                        {imported ? 'Imported trace with active processing state' : 'Raw built-in trace preview'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Agent-compatible output
                        </span>
                        <span className="rounded-full border border-cyan/20 bg-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-cyan">
                          Ready for fusion
                        </span>
                      </div>
                    </div>
                    {activeTechnique === 'XPS' && (
                      <select
                        value={xpsRegion}
                        onChange={(event) => {
                          setXpsRegion(event.target.value as XpsRegion);
                          appendLog(`XPS region selected: ${event.target.value}`);
                        }}
                        className="rounded-md border border-border bg-background px-3 py-2 text-xs text-text-main focus:outline-none focus:border-primary"
                      >
                        {(['Survey', 'Cu 2p', 'Fe 2p', 'O 1s'] as XpsRegion[]).map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <Graph
                    type={activeTechnique.toLowerCase() as 'xrd' | 'xps' | 'ftir' | 'raman'}
                    height={360}
                    externalData={processedData}
                    baselineData={activeTechnique === 'XRD' && baseline ? makeBaselinePattern(project) : undefined}
                    peakMarkers={detectedFeatures.map((feature) => ({
                      position: feature.position,
                      intensity: feature.intensity,
                      label: feature.label,
                    }))}
                    showBackground={baseline || xpsBackground}
                    showCalculated={false}
                    showResidual={false}
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      baseline && 'baseline corrected',
                      xpsBackground && 'background subtracted',
                      smoothing && 'smoothed',
                      normalize && 'normalized',
                      matched && (activeTechnique === 'XRD' ? 'phase matched' : 'assignment saved'),
                    ]
                      .filter(Boolean)
                      .map((label) => (
                        <span key={String(label)} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {String(label)}
                        </span>
                      ))}
                    {!baseline && !xpsBackground && !smoothing && !normalize && !matched && (
                      <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-text-muted">
                        raw trace
                      </span>
                    )}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold">Processing controls</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleImport}>
                      <Upload size={14} /> {TECHNIQUE_COPY[activeTechnique].importLabel}
                    </Button>
                    {activeTechnique === 'XRD' && (
                      <>
                        <Button variant={baseline ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('baseline correction', baseline, setBaseline)}>
                          Baseline Correct
                        </Button>
                        <Button variant={smoothing ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('smoothing', smoothing, setSmoothing)}>
                          Smooth
                        </Button>
                        <Button variant={normalize ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('normalize', normalize, setNormalize)}>
                          Normalize
                        </Button>
                      </>
                    )}
                    {activeTechnique === 'XPS' && (
                      <>
                        <Button variant={baseline ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('baseline', baseline, setBaseline)}>
                          Baseline
                        </Button>
                        <Button variant={xpsBackground ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('background/subtract', xpsBackground, setXpsBackground)}>
                          Background/Subtract
                        </Button>
                        <Button variant={featuresAvailable ? 'primary' : 'outline'} size="sm" onClick={handleDetect}>
                          Peak Fit
                        </Button>
                      </>
                    )}
                    {activeTechnique === 'FTIR' && (
                      <>
                        <Button variant={baseline ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('baseline adjust', baseline, setBaseline)}>
                          Baseline Adjust
                        </Button>
                        <Button variant={smoothing ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('smoothing', smoothing, setSmoothing)}>
                          Smooth
                        </Button>
                        <Button variant={normalize ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('normalize', normalize, setNormalize)}>
                          Normalize
                        </Button>
                      </>
                    )}
                    {activeTechnique === 'Raman' && (
                      <>
                        <Button variant={baseline ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('baseline', baseline, setBaseline)}>
                          Baseline
                        </Button>
                        <Button variant={smoothing ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('smoothing', smoothing, setSmoothing)}>
                          Smooth
                        </Button>
                        <Button variant={normalize ? 'primary' : 'outline'} size="sm" onClick={() => handleToggle('normalize', normalize, setNormalize)}>
                          Normalize
                        </Button>
                      </>
                    )}
                    {activeTechnique !== 'XPS' && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleDetect}>
                        <Activity size={14} /> {TECHNIQUE_COPY[activeTechnique].detectLabel}
                      </Button>
                    )}
                    {activeTechnique === 'XRD' && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleClearPeaks}>
                        <RotateCcw size={14} /> Clear peaks
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" className="gap-2 border border-primary/20 text-primary" onClick={handleMatch}>
                      <CheckCircle2 size={14} /> {TECHNIQUE_COPY[activeTechnique].assignLabel}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveEvidence}>
                      <Save size={14} /> Save Evidence
                    </Button>
                    <Link
                      to={getAgentPath(project)}
                      className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-cyan/40 px-3 text-xs font-semibold text-cyan hover:bg-cyan/10 transition-colors"
                    >
                      <Sparkles size={14} /> Run Agent
                    </Link>
                  </div>

                  {activeTechnique === 'XRD' && (
                    <div className="mt-4 flex flex-wrap items-end gap-3">
                      <label className="text-xs font-medium text-text-muted">
                        Crop min 2theta
                        <input
                          type="number"
                          value={cropMin ?? 10}
                          onChange={(event) => {
                            setCropMin(Number(event.target.value));
                            appendLog('crop range updated');
                          }}
                          className="mt-1 w-28 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary"
                        />
                      </label>
                      <label className="text-xs font-medium text-text-muted">
                        Crop max 2theta
                        <input
                          type="number"
                          value={cropMax ?? 80}
                          onChange={(event) => {
                            setCropMax(Number(event.target.value));
                            appendLog('crop range updated');
                          }}
                          className="mt-1 w-28 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-text-main focus:outline-none focus:border-primary"
                        />
                      </label>
                      <Button variant="outline" size="sm" onClick={handleApplyCrop}>
                        Crop Range
                      </Button>
                    </div>
                  )}
                  {activeTechnique === 'FTIR' && (
                    <div className="mt-4 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-xs font-medium text-text-muted">
                        Baseline offset ({ftirOffset})
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          value={ftirOffset}
                          onChange={(event) => {
                            setFtirOffset(Number(event.target.value));
                            setBaseline(true);
                            appendLog(`FTIR baseline offset set to ${event.target.value}`);
                          }}
                          className="mt-2 w-full"
                        />
                      </label>
                      <label className="text-xs font-medium text-text-muted">
                        Baseline slope ({ftirSlope})
                        <input
                          type="range"
                          min="-8"
                          max="8"
                          value={ftirSlope}
                          onChange={(event) => {
                            setFtirSlope(Number(event.target.value));
                            setBaseline(true);
                            appendLog(`FTIR baseline slope set to ${event.target.value}`);
                          }}
                          className="mt-2 w-full"
                        />
                      </label>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    {(['pdf', 'docx', 'csv', 'txt', 'png'] as DemoExportFormat[]).map((format) => (
                      <Button key={format} variant="outline" size="sm" className="gap-1" onClick={() => handleExportReport(format)}>
                        <Download size={13} /> Export {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </Card>

                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <Database size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold">Detected features</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs uppercase tracking-wider text-text-muted bg-surface-hover/40">
                        <tr>
                          <th className="text-left px-4 py-3">Feature</th>
                          <th className="text-left px-4 py-3">Position</th>
                          <th className="text-left px-4 py-3">Intensity</th>
                          {activeTechnique === 'XRD' && <th className="text-left px-4 py-3">d-spacing</th>}
                          <th className="text-left px-4 py-3">Assignment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detectedFeatures.length === 0 && (
                          <tr className="border-t border-border">
                            <td colSpan={activeTechnique === 'XRD' ? 5 : 4} className="px-4 py-6 text-center text-text-muted">
                              Run feature detection to populate this table.
                            </td>
                          </tr>
                        )}
                        {detectedFeatures.map((feature, index) => (
                          <tr key={`${feature.position}-${feature.label}`} className="border-t border-border">
                            <td className="px-4 py-3 text-text-muted">{index + 1}</td>
                            <td className="px-4 py-3 font-mono">{feature.position.toFixed(activeTechnique === 'XRD' ? 1 : 0)}</td>
                            <td className="px-4 py-3">{feature.intensity}</td>
                            {activeTechnique === 'XRD' && <td className="px-4 py-3 font-mono">{dSpacing(feature.position).toFixed(3)} A</td>}
                            <td className="px-4 py-3 text-primary">{matched ? feature.label : 'Unassigned'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <aside className="space-y-6">
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" />
                      <h3 className="text-sm font-semibold">Evidence & Insight</h3>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      project.claimStatus === 'strongly_supported' ? 'border-emerald-600/20 bg-emerald-600/10 text-emerald-600' :
                      project.claimStatus === 'supported' ? 'border-primary/20 bg-primary/10 text-primary' :
                      project.claimStatus === 'partial' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' :
                      'border-text-muted/20 bg-text-muted/10 text-text-muted'
                    }`}>
                      {formatClaimStatus(project.claimStatus)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    Agent-ready contribution from this {activeTechnique} workspace after graph review, controls, and feature detection.
                  </p>

                  <div className="mt-4 space-y-2">
                    {evidenceOutputRows.map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-4 rounded-md border border-border bg-background px-3 py-2 text-sm">
                        <span className="text-text-muted">{label}</span>
                        <span className="max-w-[180px] text-right font-semibold text-text-main">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-md border border-border bg-background p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Layers3 size={14} className="text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                        {activeTechnique === 'XRD' ? 'Phase / match interpretation' : 'Evidence assignment'}
                      </span>
                    </div>
                    {matched ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-text-main">{project.phase}</p>
                          <p className="mt-1 text-xs text-text-muted">{insight.interpretation}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-md border border-border bg-surface p-2">
                            <div className="font-bold text-text-main">{detectedFeatures.length}</div>
                            <div className="text-text-muted">matched</div>
                          </div>
                          <div className="rounded-md border border-border bg-surface p-2">
                            <div className="font-bold text-text-main">{project.claimStatus !== 'strongly_supported' ? 1 : 0}</div>
                            <div className="text-text-muted">missing</div>
                          </div>
                          <div className="rounded-md border border-border bg-surface p-2">
                            <div className="font-bold text-text-main">{activeTechnique === 'XRD' ? 1 : 0}</div>
                            <div className="text-text-muted">unexplained</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">
                    Run {TECHNIQUE_COPY[activeTechnique].assignLabel.toLowerCase()} to populate status, matched features, limitations, and supporting data.
                      </p>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Key evidence</p>
                    {insight.keyEvidence.slice(0, 3).map((item) => (
                      <div key={item} className="rounded-md border border-border bg-background px-3 py-2 text-xs text-text-main">
                        {item}
                      </div>
                    ))}
                  </div>

                  {matched ? (
                    <p className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                      Caveat: {activeTechnique === 'XRD'
                        ? 'compact frontend reference matching is used for this demo.'
                        : 'saved evidence supports the project decision but does not replace full fitting.'}
                    </p>
                  ) : (
                    insight.warnings.map((warning) => (
                      <p key={warning} className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                        Caveat: {warning}
                      </p>
                    ))
                  )}

                  <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">Next recommended action</p>
                    <p className="mt-1 text-sm text-text-main">{insight.recommendedNextStep[0]}</p>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold">Dataset metadata</h3>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-4"><span className="text-text-muted">File</span><span className="text-right font-medium">{selectedDataset?.fileName}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-text-muted">Sample</span><span className="text-right font-medium">{selectedDataset?.sampleName}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-text-muted">Operator</span><span className="text-right font-medium">{selectedDataset?.metadata.operator}</span></div>
                    <div className="flex justify-between gap-4"><span className="text-text-muted">Date</span><span className="text-right font-medium">{selectedDataset?.metadata.date}</span></div>
                  </div>
                </Card>
              </aside>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FlaskConical size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Processing log</h3>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto text-sm">
                  {log.map((entry) => (
                    <div key={entry} className="rounded-md border border-border bg-background px-3 py-2 text-text-muted">
                      {entry}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Play size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold">Saved runs</h3>
                </div>
                <div className="space-y-2">
                  {savedRuns.length === 0 && <p className="text-sm text-text-muted">No saved run yet. Save or send this analysis to create one.</p>}
                  {savedRuns.slice(-4).reverse().map((run) => (
                    <Link
                      key={run.id}
                      to={`/notebook?project=${project.id}&run=${run.id}`}
                      className="block rounded-md border border-border bg-background px-3 py-2 text-xs hover:border-primary/40 transition-colors"
                    >
                      <span className="font-semibold text-text-main">{run.technique} run</span>
                      <span className="block mt-0.5 text-text-muted">{new Date(run.timestamp).toLocaleString()}</span>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
