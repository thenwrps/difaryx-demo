import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, FilePlus2, LockKeyhole, Upload, X } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  DEFAULT_PROJECT_ID,
  DemoDataset,
  DemoExperiment,
  DemoProject,
  SpectrumPoint,
  Technique,
  demoProjects,
  getProject,
  getTechniqueLabels,
  makeTechniquePattern,
  normalizeTechnique,
  saveDataset,
  saveExperiment,
} from '../../data/demoProjects';
import {
  ExperimentConditionLock,
  createDraftExperimentConditionLock,
  getConditionBoundaryNotes,
  getConditionLockStatusLabel,
  lockExperimentConditions,
} from '../../data/experimentConditionLock';

interface ExperimentModalProps {
  open: boolean;
  defaultProjectId?: string;
  onClose: () => void;
  onCreated: (experiment: DemoExperiment, dataset: DemoDataset) => void;
}

type StepId = 'project' | 'mode' | 'data' | 'conditions' | 'review';
type ProjectSource = 'existing' | 'new';
type DatasetSource = 'bundled' | 'upload' | 'later';
type DatasetRole = 'primary' | 'supporting' | 'replicate' | 'validation';
type ModeId = 'research' | 'rd' | 'analytical';

const STEPS: Array<{ id: StepId; number: number; label: string }> = [
  { id: 'project', number: 1, label: 'Project' },
  { id: 'mode', number: 2, label: 'Mode' },
  { id: 'data', number: 3, label: 'Data' },
  { id: 'conditions', number: 4, label: 'Conditions' },
  { id: 'review', number: 5, label: 'Review' },
];

const conditionTechniques: Technique[] = ['XRD', 'XPS', 'FTIR', 'Raman'];

const MODE_OPTIONS: Record<ModeId, { label: string; desc: string; expectedOutput: string }> = {
  research: {
    label: 'Research Mode',
    desc: 'Discussion-ready scientific interpretation with validation boundaries.',
    expectedOutput: 'Discussion-ready scientific interpretation',
  },
  rd: {
    label: 'R&D Mode',
    desc: 'Technical decision memo for development and next-action review.',
    expectedOutput: 'Technical decision memo',
  },
  analytical: {
    label: 'Analytical Mode',
    desc: 'Analytical report and QA/QC status for a bounded method scope.',
    expectedOutput: 'Analytical report / QA-QC status',
  },
};

const MODE_FIELDS: Record<ModeId, Array<{ key: string; label: string; placeholder: string }>> = {
  research: [
    { key: 'scientificQuestion', label: 'Scientific question', placeholder: 'What material claim should this evidence evaluate?' },
    { key: 'hypothesis', label: 'Hypothesis', placeholder: 'Working interpretation, pending validation' },
    { key: 'evidenceObjective', label: 'Evidence objective', placeholder: 'Signal evidence needed before discussion' },
    { key: 'publicationClaimScope', label: 'Publication claim scope', placeholder: 'Publication-level claims remain validation-limited' },
  ],
  rd: [
    { key: 'developmentGoal', label: 'Development goal', placeholder: 'Process, formulation, or performance target' },
    { key: 'decisionCriterion', label: 'Decision criterion', placeholder: 'What would move this run forward?' },
    { key: 'technicalRisk', label: 'Technical risk', placeholder: 'Known risk, uncertainty, or blocked claim' },
    { key: 'nextActionFormat', label: 'Next action format', placeholder: 'Memo, follow-up experiment, or design review' },
  ],
  analytical: [
    { key: 'sampleType', label: 'Sample type', placeholder: 'Batch, control, unknown, replicate, or support sample' },
    { key: 'methodSop', label: 'Method / SOP', placeholder: 'User-provided method or pending SOP reference' },
    { key: 'acceptanceCriteria', label: 'Acceptance criteria', placeholder: 'Bounded acceptance or review criteria' },
    { key: 'qaqcRequirement', label: 'QA/QC requirement', placeholder: 'Replicate, calibration, control, or reviewer check' },
  ],
};

const TECHNIQUE_PRESETS: Record<Technique, { measurement: string[]; processing: string[]; validation: string[]; boundary: string }> = {
  XRD: {
    measurement: ['radiation/source', 'scan range', 'step size'],
    processing: ['baseline correction', 'peak detection'],
    validation: ['reference validation', 'refinement required'],
    boundary: 'Phase evidence remains validation-limited until reference validation and refinement are reviewed.',
  },
  XPS: {
    measurement: ['calibration reference', 'charge correction', 'core levels'],
    processing: ['deconvolution required'],
    validation: ['surface-sensitive boundary'],
    boundary: 'XPS is surface-sensitive and does not establish bulk composition alone.',
  },
  FTIR: {
    measurement: ['acquisition mode', 'wavenumber range', 'ATR/transmission'],
    processing: ['baseline correction'],
    validation: ['band assignment scope'],
    boundary: 'FTIR provides qualitative bonding or functional-group context.',
  },
  Raman: {
    measurement: ['laser wavelength', 'power', 'integration time'],
    processing: ['fluorescence/noise note'],
    validation: ['mode assignment scope'],
    boundary: 'Raman supports local vibrational context and requires crystallographic validation for phase claims.',
  },
};

function createModeSetupState(): Record<ModeId, Record<string, string>> {
  return {
    research: Object.fromEntries(MODE_FIELDS.research.map((field) => [field.key, ''])),
    rd: Object.fromEntries(MODE_FIELDS.rd.map((field) => [field.key, ''])),
    analytical: Object.fromEntries(MODE_FIELDS.analytical.map((field) => [field.key, ''])),
  };
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

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'project';
}

function makeLocalProjectId(name = 'project') {
  return `local-${slugify(name)}-${Date.now().toString(36)}`;
}

function getTemplateProjectPeaks() {
  return [
    { position: 18.4, intensity: 34, label: '(111)' },
    { position: 30.2, intensity: 52, label: '(220)' },
    { position: 35.6, intensity: 92, label: '(311)' },
    { position: 43.3, intensity: 55, label: '(400)' },
    { position: 57.2, intensity: 42, label: '(511)' },
  ];
}

function ConditionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/70 p-3">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-text-main">{title}</div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function ConditionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-[11px] font-semibold text-text-muted">
      {label}
      <input
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder="user-provided or pending confirmation"
        className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text-main placeholder:text-text-muted/50 focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function ConditionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-[11px] font-semibold text-text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 accent-primary"
      />
      {label}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="text-xs font-semibold text-text-muted">
      {label}
      <input
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="text-xs font-semibold text-text-muted">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 h-20 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main placeholder:text-text-muted/50 focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-text-main">{value}</div>
    </div>
  );
}

export function ExperimentModal({ open, defaultProjectId = DEFAULT_PROJECT_ID, onClose, onCreated }: ExperimentModalProps) {
  const [activeStep, setActiveStep] = useState<StepId>('project');
  const [projectSource, setProjectSource] = useState<ProjectSource>('existing');
  const [projectId, setProjectId] = useState(defaultProjectId);
  const selectedProject = getProject(projectId);
  const [localProjectId, setLocalProjectId] = useState(() => makeLocalProjectId());
  const [newProject, setNewProject] = useState({
    projectName: '',
    materialSystem: '',
    researchDomain: '',
    projectObjective: '',
    techniqueScope: ['XRD'] as Technique[],
  });
  const [technique, setTechnique] = useState<Technique>(selectedProject.techniques[0] ?? 'XRD');
  const [datasetSource, setDatasetSource] = useState<DatasetSource>('bundled');
  const [datasetRole, setDatasetRole] = useState<DatasetRole>('primary');
  const [parsedUpload, setParsedUpload] = useState<{ fileName: string; points: SpectrumPoint[] } | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [templateMode, setTemplateMode] = useState<ModeId>('research');
  const [modeSetup, setModeSetup] = useState<Record<ModeId, Record<string, string>>>(() => createModeSetupState());
  const [conditionLock, setConditionLock] = useState<ExperimentConditionLock>(() => createDraftExperimentConditionLock());
  const [form, setForm] = useState({
    experimentTitle: `${selectedProject.name} follow-up`,
    sampleName: selectedProject.name,
    materialSystem: selectedProject.material,
    fileName: `${selectedProject.id}_${technique.toLowerCase()}_experiment.xy`,
    notes: 'Created in the DIFARYX frontend demo.',
  });

  useEffect(() => {
    if (!open) return;
    const nextProject = getProject(defaultProjectId);
    const nextTechnique = nextProject.techniques[0] ?? 'XRD';
    setActiveStep('project');
    setProjectSource('existing');
    setProjectId(nextProject.id);
    setLocalProjectId(makeLocalProjectId());
    setNewProject({
      projectName: '',
      materialSystem: '',
      researchDomain: '',
      projectObjective: '',
      techniqueScope: ['XRD'],
    });
    setTechnique(nextTechnique);
    setDatasetSource('bundled');
    setDatasetRole('primary');
    setForm({
      experimentTitle: `${nextProject.name} follow-up`,
      sampleName: nextProject.name,
      materialSystem: nextProject.material,
      fileName: `${nextProject.id}_${nextTechnique.toLowerCase()}_experiment.xy`,
      notes: 'Created in the DIFARYX frontend demo.',
    });
    setParsedUpload(null);
    setUploadMessage('');
    setTemplateMode('research');
    setModeSetup(createModeSetupState());
    setConditionLock(createDraftExperimentConditionLock());
  }, [defaultProjectId, open]);

  const activeTechniqueScope = projectSource === 'new'
    ? newProject.techniqueScope
    : selectedProject.techniques;

  const activeProject: DemoProject = useMemo(() => {
    if (projectSource === 'existing') return selectedProject;

    const projectName = newProject.projectName.trim() || 'New local project';
    const materialSystem = newProject.materialSystem.trim() || 'User-provided material system';
    const techniqueScope = newProject.techniqueScope.length ? newProject.techniqueScope : [technique];

    return {
      id: localProjectId,
      name: projectName,
      material: materialSystem,
      techniques: techniqueScope,
      status: 'Demo dataset ready',
      claimStatus: 'partial',
      validationState: 'requires_validation',
      phase: materialSystem,
      lastUpdated: 'local draft',
      createdDate: new Date().toISOString().slice(0, 10),
      summary: newProject.projectObjective || 'Local project created from the New Experiment workflow.',
      xrdPeaks: getTemplateProjectPeaks(),
      evidence: ['Dataset is ready for processing; interpretation requires validation.'],
      recommendations: ['Process the selected signal before review or export.'],
      notebook: {
        title: `${projectName} experiment record`,
        pipeline: ['Project created locally.', 'Dataset source selected.', 'Experiment conditions locked by user.'],
        peakDetection: 'Feature detection is pending workspace processing.',
        phaseIdentification: 'No material-specific claim is generated before processing evidence is reviewed.',
      },
      history: [],
      workspace: techniqueScope.length > 1 ? 'multi' : 'xrd',
    };
  }, [localProjectId, newProject.materialSystem, newProject.projectName, newProject.projectObjective, newProject.techniqueScope, projectSource, selectedProject, technique]);

  const effectiveProjectName = projectSource === 'new'
    ? newProject.projectName.trim() || 'New local project'
    : selectedProject.name;
  const effectiveMaterialSystem = projectSource === 'new'
    ? newProject.materialSystem.trim()
    : form.materialSystem.trim();
  const effectiveSampleName = projectSource === 'new'
    ? newProject.projectName.trim() || form.sampleName.trim()
    : form.sampleName.trim();
  const effectiveExperimentTitle = projectSource === 'new'
    ? form.experimentTitle.trim() || `${effectiveProjectName} initial run`
    : form.experimentTitle.trim();

  const selectedPreset = TECHNIQUE_PRESETS[technique];
  const stepIndex = STEPS.findIndex((step) => step.id === activeStep);

  const handleProjectChange = (nextProjectId: string) => {
    const nextProject = getProject(nextProjectId);
    const nextTechnique = nextProject.techniques[0] ?? 'XRD';
    setProjectId(nextProject.id);
    setTechnique(nextTechnique);
    setForm((current) => ({
      ...current,
      experimentTitle: `${nextProject.name} follow-up`,
      sampleName: nextProject.name,
      materialSystem: nextProject.material,
      fileName: `${nextProject.id}_${nextTechnique.toLowerCase()}_experiment.xy`,
    }));
    // Auto-fill project objective from demo project summary if available
    if (nextProject.summary && projectSource === 'existing') {
      setNewProject((current) => ({
        ...current,
        projectObjective: nextProject.summary,
      }));
    }
    setParsedUpload(null);
    setUploadMessage('');
    setConditionLock(createDraftExperimentConditionLock());
  };

  const handleProjectSourceChange = (source: ProjectSource) => {
    setProjectSource(source);
    setConditionLock(createDraftExperimentConditionLock());
    if (source === 'existing') {
      handleProjectChange(projectId);
      return;
    }

    const nextTechnique = newProject.techniqueScope[0] ?? 'XRD';
    setTechnique(nextTechnique);
    setForm((current) => ({
      ...current,
      experimentTitle: newProject.projectName ? `${newProject.projectName} initial run` : 'New project initial run',
      sampleName: newProject.projectName,
      materialSystem: newProject.materialSystem,
      fileName: `${localProjectId}_${nextTechnique.toLowerCase()}_experiment.xy`,
    }));
  };

  const handleTechniqueChange = (value: string) => {
    const nextTechnique = normalizeTechnique(value);
    setTechnique(nextTechnique);
    setForm((current) => ({
      ...current,
      fileName: `${activeProject.id}_${nextTechnique.toLowerCase()}_experiment.xy`,
    }));
    setConditionLock((current) => ({
      ...current,
      userConfirmed: false,
      lockedAt: undefined,
      completenessStatus: 'draft',
    }));
  };

  const updateNewProjectField = (field: keyof Omit<typeof newProject, 'techniqueScope'>, value: string) => {
    setNewProject((current) => ({ ...current, [field]: value }));
    if (field === 'projectName') {
      setForm((current) => ({
        ...current,
        experimentTitle: current.experimentTitle === 'New project initial run' || !current.experimentTitle
          ? `${value || 'New project'} initial run`
          : current.experimentTitle,
        sampleName: value,
      }));
    }
    if (field === 'materialSystem') {
      setForm((current) => ({ ...current, materialSystem: value }));
    }
  };

  const useDemoStarter = () => {
    const starterTechnique = technique || 'FTIR';
    const starterValues = {
      projectName: 'Fe3O4 Nanoparticles',
      materialSystem: 'iron oxide nanoparticles',
      researchDomain: 'materials characterization',
      projectObjective: `Evaluate ${starterTechnique} demo signals for bonding-context and vibrational-evidence review.`,
      techniqueScope: [starterTechnique] as Technique[],
    };
    setNewProject(starterValues);
    setTechnique(starterTechnique);
    setForm((current) => ({
      ...current,
      experimentTitle: `${starterValues.projectName} initial run`,
      sampleName: starterValues.projectName,
      materialSystem: starterValues.materialSystem,
      fileName: `${localProjectId}_${starterTechnique.toLowerCase()}_experiment.xy`,
    }));
  };

  const toggleNewProjectTechnique = (item: Technique) => {
    setNewProject((current) => {
      const exists = current.techniqueScope.includes(item);
      const nextScope = exists
        ? current.techniqueScope.filter((tech) => tech !== item)
        : [...current.techniqueScope, item];
      const safeScope = nextScope.length ? nextScope : [item];

      if (!safeScope.includes(technique)) {
        setTechnique(safeScope[0]);
        setForm((formState) => ({
          ...formState,
          fileName: `${localProjectId}_${safeScope[0].toLowerCase()}_experiment.xy`,
        }));
      }

      return { ...current, techniqueScope: safeScope };
    });
    setConditionLock(createDraftExperimentConditionLock());
  };

  const updateModeSetup = (mode: ModeId, field: string, value: string) => {
    setModeSetup((current) => ({
      ...current,
      [mode]: {
        ...current[mode],
        [field]: value,
      },
    }));
  };

  const updateConditionGroup = <
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

  const updateValidationCondition = (
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

  const toggleCrossTechniqueRequirement = (nextTechnique: string) => {
    setConditionLock((current) => {
      const currentRequired = current.validationConditions?.crossTechniqueRequired ?? [];
      const nextRequired = currentRequired.includes(nextTechnique)
        ? currentRequired.filter((item) => item !== nextTechnique)
        : [...currentRequired, nextTechnique];

      return {
        ...current,
        validationConditions: {
          ...(current.validationConditions ?? {}),
          crossTechniqueRequired: nextRequired,
        },
        userConfirmed: false,
        lockedAt: undefined,
        completenessStatus: 'draft',
      };
    });
  };

  const handleLockConditions = () => {
    setConditionLock((current) => lockExperimentConditions(current));
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setDatasetSource('upload');
    try {
      const points = parseTwoColumnText(await file.text());
      if (points.length < 8) throw new Error('not enough rows');
      setParsedUpload({ fileName: file.name, points });
      setForm((current) => ({ ...current, fileName: file.name }));
      setUploadMessage(`${points.length} numeric rows parsed from ${file.name}. Workspace processing remains required before review or export.`);
    } catch {
      setParsedUpload(null);
      setForm((current) => ({ ...current, fileName: file.name }));
      setUploadMessage('Upload metadata captured. The workspace will handle full analysis after the experiment run is created.');
    }
  };

  const projectReady = projectSource === 'existing'
    ? Boolean(projectId && effectiveExperimentTitle && effectiveSampleName && effectiveMaterialSystem)
    : Boolean(
      newProject.projectName.trim() &&
      newProject.materialSystem.trim() &&
      newProject.researchDomain.trim() &&
      newProject.projectObjective.trim() &&
      newProject.techniqueScope.length > 0,
    );
  const modeReady = Boolean(templateMode);
  const dataReady = Boolean(datasetSource && form.fileName.trim() && datasetRole);
  const conditionsReady = conditionLock.userConfirmed;
  const readyToCreate = projectReady && modeReady && dataReady && conditionsReady;

  // Build specific missing field checklist
  const missingItems: string[] = [];
  if (!projectReady) {
    if (projectSource === 'existing') {
      if (!effectiveExperimentTitle) missingItems.push('Add experiment title');
      if (!effectiveSampleName) missingItems.push('Add sample name');
      if (!effectiveMaterialSystem) missingItems.push('Add material system');
    } else {
      if (!newProject.projectName.trim()) missingItems.push('Add project name');
      if (!newProject.materialSystem.trim()) missingItems.push('Add material system');
      if (!newProject.researchDomain.trim()) missingItems.push('Add research domain');
      if (!newProject.projectObjective.trim()) missingItems.push('Add project objective');
      if (newProject.techniqueScope.length === 0) missingItems.push('Select at least one technique');
    }
  }
  if (!modeReady) missingItems.push('Select a workflow mode');
  if (!dataReady) {
    if (!datasetSource) missingItems.push('Select a data source');
    if (!form.fileName.trim()) missingItems.push('Add dataset/file name');
    if (!datasetRole) missingItems.push('Select dataset role');
  }
  if (!conditionsReady) missingItems.push('Lock experiment conditions');

  const goToNextStep = () => {
    const nextStep = STEPS[Math.min(STEPS.length - 1, stepIndex + 1)];
    setActiveStep(nextStep.id);
  };

  const goToPreviousStep = () => {
    const previousStep = STEPS[Math.max(0, stepIndex - 1)];
    setActiveStep(previousStep.id);
  };

  const buildNotes = () => {
    const setupLines = MODE_FIELDS[templateMode]
      .map((field) => {
        const value = modeSetup[templateMode][field.key]?.trim();
        return value ? `${field.label}: ${value}` : '';
      })
      .filter(Boolean);

    return [
      form.notes.trim(),
      `Mode: ${MODE_OPTIONS[templateMode].label}.`,
      `Dataset source: ${datasetSource}; role: ${datasetRole}.`,
      projectSource === 'new' ? `New project domain: ${newProject.researchDomain}. Objective: ${newProject.projectObjective}.` : '',
      setupLines.length ? `Mode setup: ${setupLines.join(' | ')}` : 'Mode setup fields pending user detail.',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!readyToCreate) return;

    const labels = getTechniqueLabels(technique);
    const dataPoints = parsedUpload?.points ?? makeTechniquePattern(activeProject, technique);
    const savedProjectId = activeProject.id;
    const savedFileName = form.fileName.trim() || `${savedProjectId}_${technique.toLowerCase()}_experiment.xy`;
    const savedSampleName = effectiveSampleName || effectiveProjectName;
    const savedMaterialSystem = effectiveMaterialSystem || activeProject.material;
    const savedTitle = effectiveExperimentTitle || `${effectiveProjectName} experiment run`;

    const dataset = saveDataset({
      projectId: savedProjectId,
      technique,
      fileName: savedFileName,
      sampleName: savedSampleName,
      xLabel: labels.xLabel,
      yLabel: labels.yLabel,
      dataPoints,
      metadata: {
        experimentTitle: savedTitle,
        sampleName: savedSampleName,
        materialSystem: savedMaterialSystem,
        operator: 'Demo scientist',
        date: new Date().toISOString().slice(0, 10),
        notes: buildNotes(),
      },
      processingState: {
        imported: Boolean(parsedUpload),
        baseline: false,
        smoothing: false,
        normalize: false,
      },
      detectedFeatures: [],
    });

    const experiment = saveExperiment({
      projectId: savedProjectId,
      projectSource,
      projectName: effectiveProjectName,
      researchDomain: projectSource === 'new' ? newProject.researchDomain : undefined,
      projectObjective: projectSource === 'new' ? newProject.projectObjective : undefined,
      techniqueScope: activeTechniqueScope,
      templateMode,
      modeSetup: modeSetup[templateMode],
      datasetSource,
      datasetRole,
      expectedOutput: MODE_OPTIONS[templateMode].expectedOutput,
      title: savedTitle,
      sampleName: savedSampleName,
      materialSystem: savedMaterialSystem,
      technique,
      fileName: savedFileName,
      operator: 'Demo scientist',
      date: new Date().toISOString().slice(0, 10),
      notes: buildNotes(),
      datasetIds: [dataset.id],
      conditionLock,
    });

    onCreated(experiment, dataset);
    onClose();
  };

  if (!open) return null;

  const renderProjectStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {(['existing', 'new'] as ProjectSource[]).map((source) => (
          <button
            key={source}
            type="button"
            onClick={() => handleProjectSourceChange(source)}
            className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
              projectSource === source
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text-main'
            }`}
          >
            {source === 'existing' ? 'Existing project' : 'New project'}
            <div className="mt-1 text-[11px] font-medium opacity-75">
              {source === 'existing' ? 'Use curated demo project context' : 'Create a local project record'}
            </div>
          </button>
        ))}
      </div>

      {projectSource === 'existing' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-text-muted md:col-span-2">
            Project
            <select
              aria-label="Project"
              value={projectId}
              onChange={(event) => handleProjectChange(event.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none"
            >
              {demoProjects.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <TextInput label="Experiment title" required value={form.experimentTitle} onChange={(value) => setForm((current) => ({ ...current, experimentTitle: value }))} />
          <TextInput label="Sample name" required value={form.sampleName} onChange={(value) => setForm((current) => ({ ...current, sampleName: value }))} />
          <TextInput label="Material system" required value={form.materialSystem} onChange={(value) => setForm((current) => ({ ...current, materialSystem: value }))} />
          <SummaryRow label="Default technique" value={selectedProject.techniques[0] ?? 'XRD'} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2 flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-xs text-text-muted">Start with demo values for quick setup</p>
            <Button type="button" variant="outline" size="sm" onClick={useDemoStarter}>
              Use Fe3O4 demo starter
            </Button>
          </div>
          <TextInput label="Project name" required value={newProject.projectName} onChange={(value) => updateNewProjectField('projectName', value)} placeholder="e.g. Ferrite catalyst screen" />
          <TextInput label="Material system" required value={newProject.materialSystem} onChange={(value) => updateNewProjectField('materialSystem', value)} placeholder="user-provided material system" />
          <TextInput label="Research domain" required value={newProject.researchDomain} onChange={(value) => updateNewProjectField('researchDomain', value)} placeholder="materials, catalysis, QC, battery, etc." />
          <TextInput label="Project objective" required value={newProject.projectObjective} onChange={(value) => updateNewProjectField('projectObjective', value)} placeholder="bounded objective for this run" />
          <div className="md:col-span-2 rounded-lg border border-border bg-surface p-3">
            <div className="text-xs font-semibold text-text-muted">Default technique scope</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {conditionTechniques.map((item) => (
                <label key={item} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-text-muted">
                  <input
                    type="checkbox"
                    checked={newProject.techniqueScope.includes(item)}
                    onChange={() => toggleNewProjectTechnique(item)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderModeStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {(Object.entries(MODE_OPTIONS) as Array<[ModeId, typeof MODE_OPTIONS[ModeId]]>).map(([id, option]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTemplateMode(id)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              templateMode === id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text-main'
            }`}
          >
            <div className="flex items-center gap-1.5 text-sm font-bold">
              {templateMode === id && <CheckCircle2 size={14} />}
              {option.label}
            </div>
            <p className="mt-2 text-xs leading-relaxed">{option.desc}</p>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-text-main">
          {MODE_OPTIONS[templateMode].label} setup
        </div>
        <p className="mt-1 text-xs text-text-muted">
          These user-provided setup notes are preserved for handoff. Blank fields remain pending confirmation.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {MODE_FIELDS[templateMode].map((field) => (
            <TextInput
              key={field.key}
              label={field.label}
              value={modeSetup[templateMode][field.key] ?? ''}
              onChange={(value) => updateModeSetup(templateMode, field.key, value)}
              placeholder={field.placeholder}
            />
          ))}
        </div>
      </div>

      <TextAreaInput
        label="Run notes"
        value={form.notes}
        onChange={(value) => setForm((current) => ({ ...current, notes: value }))}
        placeholder="User-confirmed context, limitation, or handoff notes"
      />
    </div>
  );

  const renderDataStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {([
          ['bundled', 'Use bundled demo dataset', 'Ready for processing in the local demo.'],
          ['upload', 'Upload new dataset', 'Capture file metadata now; process in workspace.'],
          ['later', 'Add supporting dataset later', 'Create the run and attach support evidence later.'],
        ] as Array<[DatasetSource, string, string]>).map(([id, title, desc]) => (
          <button
            key={id}
            type="button"
            onClick={() => setDatasetSource(id)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              datasetSource === id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text-main'
            }`}
          >
            <div className="text-sm font-bold">{title}</div>
            <p className="mt-1 text-xs leading-relaxed">{desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold text-text-muted">
          Technique
          <select
            aria-label="Technique"
            value={technique}
            onChange={(event) => handleTechniqueChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none"
          >
            {activeTechniqueScope.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-text-muted">
          Dataset role
          <select
            value={datasetRole}
            onChange={(event) => setDatasetRole(event.target.value as DatasetRole)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:border-primary focus:outline-none"
          >
            <option value="primary">primary</option>
            <option value="supporting">supporting</option>
            <option value="replicate">replicate</option>
            <option value="validation">validation</option>
          </select>
        </label>

        <TextInput label="Dataset / file name" required value={form.fileName} onChange={(value) => setForm((current) => ({ ...current, fileName: value }))} />

        <label className="text-xs font-semibold text-text-muted">
          Upload input
          <input
            aria-label="Add dataset"
            type="file"
            accept=".txt,.csv,.xy,.dat"
            onChange={handleUpload}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-primary"
          />
        </label>
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-text-muted">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Upload size={14} /> Dataset source
        </div>
        <p className="mt-1">
          {uploadMessage || (datasetSource === 'bundled'
            ? `${technique} bundled demo signal will be used for a ready-for-processing run.`
            : datasetSource === 'upload'
              ? 'Select a CSV/TXT/XY/DAT file to capture upload metadata. Workspace analysis remains bounded.'
              : 'Supporting datasets can be attached after this run is created.')}
        </p>
      </div>
    </div>
  );

  const renderConditionsStep = () => (
    <section className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <LockKeyhole size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-text-main">Experiment Condition Lock</h3>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {getConditionLockStatusLabel(conditionLock)}
              </span>
              {conditionLock.userConfirmed && (
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                  Locked by user
                </span>
              )}
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-text-muted">
              Experiment conditions are locked for reproducibility. DIFARYX will not change synthesis,
              measurement, processing, or validation assumptions during interpretation unless the user
              explicitly updates the experiment record.
            </p>
          </div>
          <Button type="button" variant={conditionLock.userConfirmed ? 'secondary' : 'primary'} size="sm" onClick={handleLockConditions} className="gap-2 shrink-0">
            <LockKeyhole size={14} /> {conditionLock.userConfirmed ? 'Conditions locked' : 'Lock experiment conditions for this run'}
          </Button>
        </div>
        {conditionLock.userConfirmed && (
          <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={14} />
              Conditions locked
            </div>
            <div className="mt-1 text-xs text-emerald-600">
              Locked by user • Ready for review
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-primary">{technique} condition preset</div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-text-muted md:grid-cols-3">
          <SummaryRow label="Measurement" value={selectedPreset.measurement.join(', ')} />
          <SummaryRow label="Processing" value={selectedPreset.processing.join(', ')} />
          <SummaryRow label="Validation" value={selectedPreset.validation.join(', ')} />
        </div>
        <p className="mt-2 text-xs text-text-muted">{selectedPreset.boundary}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ConditionGroup title="Measurement (required for this run)">
          <ConditionInput label="Instrument" value={conditionLock.measurementConditions?.instrument} onChange={(value) => updateConditionGroup('measurementConditions', 'instrument', value)} />
          <ConditionInput label="Radiation / source" value={conditionLock.measurementConditions?.radiationOrSource} onChange={(value) => updateConditionGroup('measurementConditions', 'radiationOrSource', value)} />
          <ConditionInput label={technique === 'FTIR' ? 'Wavenumber range' : technique === 'Raman' ? 'Raman shift range' : technique === 'XPS' ? 'Core levels / scan range' : 'Scan range'} value={conditionLock.measurementConditions?.scanRange} onChange={(value) => updateConditionGroup('measurementConditions', 'scanRange', value)} />
          <ConditionInput label={technique === 'Raman' ? 'Laser power / step size' : 'Step size'} value={conditionLock.measurementConditions?.stepSize} onChange={(value) => updateConditionGroup('measurementConditions', 'stepSize', value)} />
          <ConditionInput label={technique === 'Raman' ? 'Integration time / scan rate' : 'Scan rate'} value={conditionLock.measurementConditions?.scanRate} onChange={(value) => updateConditionGroup('measurementConditions', 'scanRate', value)} />
          <ConditionInput label={technique === 'XPS' ? 'Calibration reference / charge correction' : 'Calibration reference'} value={conditionLock.measurementConditions?.calibrationReference} onChange={(value) => updateConditionGroup('measurementConditions', 'calibrationReference', value)} />
          <ConditionInput label={technique === 'FTIR' ? 'ATR / transmission mode' : 'Acquisition mode'} value={conditionLock.measurementConditions?.acquisitionMode} onChange={(value) => updateConditionGroup('measurementConditions', 'acquisitionMode', value)} />
        </ConditionGroup>

        <ConditionGroup title="Processing (required for this run)">
          <ConditionInput label="Baseline correction" value={conditionLock.processingConditions?.baselineCorrection} onChange={(value) => updateConditionGroup('processingConditions', 'baselineCorrection', value)} />
          <ConditionInput label="Smoothing" value={conditionLock.processingConditions?.smoothing} onChange={(value) => updateConditionGroup('processingConditions', 'smoothing', value)} />
          <ConditionInput label="Normalization" value={conditionLock.processingConditions?.normalization} onChange={(value) => updateConditionGroup('processingConditions', 'normalization', value)} />
          <ConditionInput label={technique === 'FTIR' ? 'Band detection / assignment' : technique === 'Raman' ? 'Mode detection / assignment' : 'Peak detection'} value={conditionLock.processingConditions?.peakDetection} onChange={(value) => updateConditionGroup('processingConditions', 'peakDetection', value)} />
          <ConditionInput label={technique === 'XPS' ? 'Deconvolution / fitting model' : 'Fitting model'} value={conditionLock.processingConditions?.fittingModel} onChange={(value) => updateConditionGroup('processingConditions', 'fittingModel', value)} />
          <ConditionInput label="Reference database" value={conditionLock.processingConditions?.referenceDatabase} onChange={(value) => updateConditionGroup('processingConditions', 'referenceDatabase', value)} />
        </ConditionGroup>

        <ConditionGroup title="Validation requirements">
          <ConditionCheckbox label="Replicate required" checked={Boolean(conditionLock.validationConditions?.replicateRequired)} onChange={(checked) => updateValidationCondition('replicateRequired', checked)} />
          <ConditionCheckbox label="Reference validation required" checked={Boolean(conditionLock.validationConditions?.referenceValidationRequired)} onChange={(checked) => updateValidationCondition('referenceValidationRequired', checked)} />
          <ConditionCheckbox label="Refinement required" checked={Boolean(conditionLock.validationConditions?.refinementRequired)} onChange={(checked) => updateValidationCondition('refinementRequired', checked)} />
          <ConditionCheckbox label="Publication-level claim allowed after validation" checked={Boolean(conditionLock.validationConditions?.publicationClaimAllowed)} onChange={(checked) => updateValidationCondition('publicationClaimAllowed', checked)} />
          <div className="pt-1">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Cross-technique validation required</div>
            <div className="flex flex-wrap gap-2">
              {conditionTechniques.map((item) => (
                <label key={item} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-text-muted">
                  <input
                    type="checkbox"
                    checked={Boolean(conditionLock.validationConditions?.crossTechniqueRequired?.includes(item))}
                    onChange={() => toggleCrossTechniqueRequirement(item)}
                    className="h-3 w-3 accent-primary"
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </ConditionGroup>

        <details className="rounded-md border border-border bg-background/70 p-3">
          <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wide text-text-main">Optional sample preparation details</summary>
          <div className="mt-3 grid gap-2">
            <ConditionInput label="Synthesis method" value={conditionLock.synthesisConditions?.method} onChange={(value) => updateConditionGroup('synthesisConditions', 'method', value)} />
            <ConditionInput label="Precursor ratio" value={conditionLock.synthesisConditions?.precursorRatio} onChange={(value) => updateConditionGroup('synthesisConditions', 'precursorRatio', value)} />
            <ConditionInput label="Solvent" value={conditionLock.synthesisConditions?.solvent} onChange={(value) => updateConditionGroup('synthesisConditions', 'solvent', value)} />
            <ConditionInput label="pH" value={conditionLock.synthesisConditions?.pH} onChange={(value) => updateConditionGroup('synthesisConditions', 'pH', value)} />
            <ConditionInput label="Temperature" value={conditionLock.synthesisConditions?.temperature} onChange={(value) => updateConditionGroup('synthesisConditions', 'temperature', value)} />
            <ConditionInput label="Time" value={conditionLock.synthesisConditions?.time} onChange={(value) => updateConditionGroup('synthesisConditions', 'time', value)} />
            <ConditionInput label="Calcination temperature" value={conditionLock.synthesisConditions?.calcinationTemperature} onChange={(value) => updateConditionGroup('synthesisConditions', 'calcinationTemperature', value)} />
            <ConditionInput label="Calcination time" value={conditionLock.synthesisConditions?.calcinationTime} onChange={(value) => updateConditionGroup('synthesisConditions', 'calcinationTime', value)} />
            <ConditionInput label="Atmosphere" value={conditionLock.synthesisConditions?.atmosphere} onChange={(value) => updateConditionGroup('synthesisConditions', 'atmosphere', value)} />
            <ConditionInput label="Post-treatment" value={conditionLock.synthesisConditions?.postTreatment} onChange={(value) => updateConditionGroup('synthesisConditions', 'postTreatment', value)} />
          </div>
        </details>
      </div>

      <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-text-muted">
        <div className="font-semibold text-amber-700">Condition-aware claim boundary</div>
        <ul className="mt-2 space-y-1">
          {getConditionBoundaryNotes(conditionLock, activeTechniqueScope).slice(0, 4).map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      </div>
    </section>
  );

  const renderReviewStep = () => {
    // Determine scientific context display
    const scientificContext = projectSource === 'new'
      ? newProject.projectObjective || 'Project objective pending'
      : selectedProject.summary || 'Demo context';

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SummaryRow label="Project" value={effectiveProjectName} />
          <SummaryRow label="Project type" value={projectSource === 'new' ? 'New local project' : 'Existing demo project'} />
          <SummaryRow label="Mode" value={MODE_OPTIONS[templateMode].label} />
          <SummaryRow label="Technique" value={technique} />
          <SummaryRow label="Dataset source" value={`${datasetSource} / ${datasetRole}`} />
          <SummaryRow label="Condition lock" value={conditionLock.userConfirmed ? 'Locked by user' : 'Condition lock required'} />
          <SummaryRow label="Scientific context" value={scientificContext} />
          <SummaryRow label="Expected output" value={MODE_OPTIONS[templateMode].expectedOutput} />
        </div>

        {conditionLock.userConfirmed && (
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Claim boundary</div>
            <div className="mt-2 space-y-1 text-xs text-text-muted">
              <div><span className="font-semibold">Claim boundary:</span> validation-limited</div>
              <div><span className="font-semibold">Blocked claims:</span> publication-level phase claim unless validation requirements are satisfied</div>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-text-muted">
              {getConditionBoundaryNotes(conditionLock, activeTechniqueScope).slice(0, 3).map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          </div>
        )}

        {missingItems.length > 0 ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-600/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
              Create blocked
            </div>
            <ul className="space-y-1 text-xs text-amber-800">
              {missingItems.map((item) => <li key={item}>- {item}</li>)}
            </ul>
          </div>
        ) : (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
            <div className="mb-2 text-sm font-bold text-emerald-700">Ready to create experiment run</div>
            <p className="text-xs text-emerald-600">
              Project, mode, data source, condition lock, expected output, and claim boundary are ready.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">DIFARYX experiment setup</p>
            <h2 className="mt-1 text-lg font-bold text-text-main">New Experiment</h2>
            <p className="mt-1 text-xs text-text-muted">Project - Mode - Data - Conditions - Review & Create</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-muted hover:bg-surface-hover hover:text-text-main"
            aria-label="Close new experiment form"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-border px-5 py-3">
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((step, index) => {
              const active = activeStep === step.id;
              const completed = index < stepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-[11px] font-bold transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : completed
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                        : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text-main'
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                    {completed ? <CheckCircle2 size={12} /> : step.number}
                  </span>
                  <span className="truncate">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {activeStep === 'project' && renderProjectStep()}
          {activeStep === 'mode' && renderModeStep()}
          {activeStep === 'data' && renderDataStep()}
          {activeStep === 'conditions' && renderConditionsStep()}
          {activeStep === 'review' && renderReviewStep()}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border p-5">
          <div className="max-w-md text-xs text-text-muted">
            {readyToCreate ? (
              'Ready to create experiment run with locked conditions.'
            ) : activeStep === 'project' ? (
              'Define project context or select an existing demo project.'
            ) : activeStep === 'mode' ? (
              'Choose how DIFARYX should structure interpretation and output.'
            ) : activeStep === 'data' ? (
              'Select bundled data, upload a file, or attach support later.'
            ) : activeStep === 'conditions' ? (
              'Lock conditions before creating the experiment run.'
            ) : activeStep === 'review' ? (
              'Review project, mode, data, condition lock, and claim boundary before creating the run.'
            ) : (
              missingItems[0] ?? 'Complete each setup step before creating the run.'
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={stepIndex === 0}>Back</Button>
            {activeStep === 'review' ? (
              <Button type="submit" className="gap-2" disabled={!readyToCreate}>
                <FilePlus2 size={16} /> Create Experiment Run
              </Button>
            ) : (
              <Button type="button" className="gap-2" onClick={goToNextStep}>
                Next <ChevronRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
