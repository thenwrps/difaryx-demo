import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { FilePlus2, LockKeyhole, Upload, X } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  DEFAULT_PROJECT_ID,
  DemoDataset,
  DemoExperiment,
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

const conditionTechniques = ['XRD', 'XPS', 'FTIR', 'Raman'];

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
        placeholder="user-provided"
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

function ModalStepHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="sm:col-span-2 flex items-center gap-2 border-b border-border pb-2">
      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
        {label}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-text-main">{title}</span>
    </div>
  );
}

export function ExperimentModal({ open, defaultProjectId = DEFAULT_PROJECT_ID, onClose, onCreated }: ExperimentModalProps) {
  const [projectId, setProjectId] = useState(defaultProjectId);
  const project = getProject(projectId);
  const [technique, setTechnique] = useState<Technique>(project.techniques[0] ?? 'XRD');
  const [parsedUpload, setParsedUpload] = useState<{ fileName: string; points: SpectrumPoint[] } | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [templateMode, setTemplateMode] = useState<'research' | 'rd' | 'analytical'>('research');
  const [conditionLock, setConditionLock] = useState<ExperimentConditionLock>(() => createDraftExperimentConditionLock());
  const [form, setForm] = useState({
    experimentTitle: `${project.name} follow-up`,
    sampleName: project.name,
    materialSystem: project.material,
    fileName: `${project.id}_${technique.toLowerCase()}_experiment.xy`,
    notes: 'Created in the DIFARYX frontend demo.',
  });

  useEffect(() => {
    if (!open) return;
    const nextProject = getProject(defaultProjectId);
    const nextTechnique = nextProject.techniques[0] ?? 'XRD';
    setProjectId(nextProject.id);
    setTechnique(nextTechnique);
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
    setConditionLock(createDraftExperimentConditionLock());
  }, [defaultProjectId, open]);

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
    setConditionLock(createDraftExperimentConditionLock());
  };

  const handleTechniqueChange = (value: string) => {
    const nextTechnique = normalizeTechnique(value);
    setTechnique(nextTechnique);
    setForm((current) => ({
      ...current,
      fileName: `${project.id}_${nextTechnique.toLowerCase()}_experiment.xy`,
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

    try {
      const points = parseTwoColumnText(await file.text());
      if (points.length < 8) throw new Error('not enough rows');
      setParsedUpload({ fileName: file.name, points });
      setForm((current) => ({ ...current, fileName: file.name }));
      setUploadMessage(`${points.length} numeric rows parsed from ${file.name}`);
    } catch {
      setParsedUpload(null);
      setForm((current) => ({ ...current, fileName: file.name }));
      setUploadMessage('Upload metadata captured. DIFARYX will use the selected built-in demo spectrum for this dataset.');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conditionLock.userConfirmed) return;
    const labels = getTechniqueLabels(technique);
    const dataPoints = parsedUpload?.points ?? makeTechniquePattern(project, technique);

    const dataset = saveDataset({
      projectId: project.id,
      technique,
      fileName: form.fileName,
      sampleName: form.sampleName,
      xLabel: labels.xLabel,
      yLabel: labels.yLabel,
      dataPoints,
      metadata: {
        experimentTitle: form.experimentTitle,
        sampleName: form.sampleName,
        materialSystem: form.materialSystem,
        operator: 'Demo scientist',
        date: new Date().toISOString().slice(0, 10),
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

    const experiment = saveExperiment({
      projectId: project.id,
      title: form.experimentTitle,
      sampleName: form.sampleName,
      materialSystem: form.materialSystem,
      technique,
      fileName: form.fileName,
      operator: 'Demo scientist',
      date: new Date().toISOString().slice(0, 10),
      notes: form.notes,
      datasetIds: [dataset.id],
      conditionLock,
    });

    onCreated(experiment, dataset);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">DIFARYX demo data</p>
            <h2 className="mt-1 text-lg font-bold text-text-main">New Experiment</h2>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-text-muted">
              {['1 Objective', '2 Mode', '3 Data', '4 Conditions', '5 Create'].map((step) => (
                <span key={step} className="rounded border border-border bg-surface px-2 py-0.5">
                  {step}
                </span>
              ))}
            </div>
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

        <div className="grid max-h-[78vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          <ModalStepHeader label="1 Objective" title="Experiment Setup" />
          <label className="text-xs font-semibold text-text-muted">
            Project
            <select
              aria-label="Project"
              value={projectId}
              onChange={(event) => handleProjectChange(event.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
            >
              {demoProjects.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-text-muted">
            Technique
            <select
              aria-label="Technique"
              value={technique}
              onChange={(event) => handleTechniqueChange(event.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
            >
              {project.techniques.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-text-muted sm:col-span-2">
            Experiment title
            <input
              aria-label="Experiment title"
              required
              value={form.experimentTitle}
              onChange={(event) => setForm((current) => ({ ...current, experimentTitle: event.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
            />
          </label>

          <label className="text-xs font-semibold text-text-muted">
            Sample name
            <input
              aria-label="Sample name"
              required
              value={form.sampleName}
              onChange={(event) => setForm((current) => ({ ...current, sampleName: event.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
            />
          </label>

          <label className="text-xs font-semibold text-text-muted">
            Material system
            <input
              aria-label="Material system"
              required
              value={form.materialSystem}
              onChange={(event) => setForm((current) => ({ ...current, materialSystem: event.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
            />
          </label>

          <ModalStepHeader label="2 Mode" title="Interpretation Mode" />
          <div className="sm:col-span-2">
            <div className="text-xs font-semibold text-text-muted mb-2">Workflow Template</div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'research' as const, label: 'Research Mode', desc: 'Publication-limited' },
                { id: 'rd' as const, label: 'R&D Mode', desc: 'Internal use' },
                { id: 'analytical' as const, label: 'Analytical-job Mode', desc: 'QC / screening' },
              ]).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTemplateMode(option.id)}
                  className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    templateMode === option.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-surface text-text-muted hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{option.label}</span>
                    {templateMode === option.id && (
                      <span className="rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide bg-primary/20 text-primary">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[10px] opacity-70">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <label className="text-xs font-semibold text-text-muted sm:col-span-2">
            Notes
            <textarea
              aria-label="Notes"
              required
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="mt-1 h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
            />
          </label>

          <ModalStepHeader label="3 Data" title="Dataset" />
          <label className="text-xs font-semibold text-text-muted">
            File name
            <input
              aria-label="File name"
              required
              value={form.fileName}
              onChange={(event) => setForm((current) => ({ ...current, fileName: event.target.value }))}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary"
            />
          </label>

          <label className="text-xs font-semibold text-text-muted">
            Add dataset
            <input
              aria-label="Add dataset"
              type="file"
              accept=".txt,.csv,.xy"
              onChange={handleUpload}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-primary"
            />
          </label>

          <ModalStepHeader label="4 Conditions" title="Experiment Conditions" />
          <section className="sm:col-span-2 rounded-lg border border-border bg-surface/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <LockKeyhole size={16} className="text-primary" />
                  <h3 className="text-sm font-bold text-text-main">Experiment Conditions</h3>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {getConditionLockStatusLabel(conditionLock)}
                  </span>
                  {conditionLock.userConfirmed && (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                      Locked by user
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-2xl text-xs text-text-muted">
                  Experiment conditions are locked for reproducibility. DIFARYX will not change synthesis,
                  measurement, processing, or validation assumptions during interpretation unless the user
                  explicitly updates the experiment record.
                </p>
              </div>
              <Button type="button" variant={conditionLock.userConfirmed ? 'secondary' : 'primary'} size="sm" onClick={handleLockConditions} className="gap-2">
                <LockKeyhole size={14} /> {conditionLock.userConfirmed ? 'Conditions locked' : 'Lock experiment conditions for this run'}
              </Button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ConditionGroup title="Sample preparation">
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
              </ConditionGroup>

              <ConditionGroup title="Measurement">
                <ConditionInput label="Instrument" value={conditionLock.measurementConditions?.instrument} onChange={(value) => updateConditionGroup('measurementConditions', 'instrument', value)} />
                <ConditionInput label="Radiation / source" value={conditionLock.measurementConditions?.radiationOrSource} onChange={(value) => updateConditionGroup('measurementConditions', 'radiationOrSource', value)} />
                <ConditionInput label="Scan range" value={conditionLock.measurementConditions?.scanRange} onChange={(value) => updateConditionGroup('measurementConditions', 'scanRange', value)} />
                <ConditionInput label="Step size" value={conditionLock.measurementConditions?.stepSize} onChange={(value) => updateConditionGroup('measurementConditions', 'stepSize', value)} />
                <ConditionInput label="Scan rate" value={conditionLock.measurementConditions?.scanRate} onChange={(value) => updateConditionGroup('measurementConditions', 'scanRate', value)} />
                <ConditionInput label="Calibration reference" value={conditionLock.measurementConditions?.calibrationReference} onChange={(value) => updateConditionGroup('measurementConditions', 'calibrationReference', value)} />
                <ConditionInput label="Acquisition mode" value={conditionLock.measurementConditions?.acquisitionMode} onChange={(value) => updateConditionGroup('measurementConditions', 'acquisitionMode', value)} />
              </ConditionGroup>

              <ConditionGroup title="Processing">
                <ConditionInput label="Baseline correction" value={conditionLock.processingConditions?.baselineCorrection} onChange={(value) => updateConditionGroup('processingConditions', 'baselineCorrection', value)} />
                <ConditionInput label="Smoothing" value={conditionLock.processingConditions?.smoothing} onChange={(value) => updateConditionGroup('processingConditions', 'smoothing', value)} />
                <ConditionInput label="Normalization" value={conditionLock.processingConditions?.normalization} onChange={(value) => updateConditionGroup('processingConditions', 'normalization', value)} />
                <ConditionInput label="Peak detection" value={conditionLock.processingConditions?.peakDetection} onChange={(value) => updateConditionGroup('processingConditions', 'peakDetection', value)} />
                <ConditionInput label="Fitting model" value={conditionLock.processingConditions?.fittingModel} onChange={(value) => updateConditionGroup('processingConditions', 'fittingModel', value)} />
                <ConditionInput label="Reference database" value={conditionLock.processingConditions?.referenceDatabase} onChange={(value) => updateConditionGroup('processingConditions', 'referenceDatabase', value)} />
              </ConditionGroup>

              <ConditionGroup title="Validation">
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
            </div>

            <div className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-text-muted">
              <div className="font-semibold text-amber-200">Condition-aware claim boundary</div>
              <ul className="mt-2 space-y-1">
                {getConditionBoundaryNotes(conditionLock, project.techniques).slice(0, 4).map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            </div>
          </section>

          <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-text-muted sm:col-span-2">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <Upload size={14} /> Built-in spectrum source
            </div>
            <p className="mt-1">
              {uploadMessage || `${technique} demo spectrum for ${project.name} will be used unless a two-column upload is parsed.`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border p-5">
          <div className="mr-auto max-w-md text-xs text-text-muted">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-primary">5 Create Run</div>
            <span>
              {conditionLock.userConfirmed
                ? 'Ready to create experiment run with locked conditions.'
                : 'Lock experiment conditions before creating the experiment record. Missing fields remain condition-limited.'}
            </span>
          </div>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="gap-2" disabled={!conditionLock.userConfirmed}>
            <FilePlus2 size={16} /> Create Experiment
          </Button>
        </div>
      </form>
    </div>
  );
}
