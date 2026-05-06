import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { FilePlus2, Upload, X } from 'lucide-react';
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

export function ExperimentModal({ open, defaultProjectId = DEFAULT_PROJECT_ID, onClose, onCreated }: ExperimentModalProps) {
  const [projectId, setProjectId] = useState(defaultProjectId);
  const project = getProject(projectId);
  const [technique, setTechnique] = useState<Technique>(project.techniques[0] ?? 'XRD');
  const [parsedUpload, setParsedUpload] = useState<{ fileName: string; points: SpectrumPoint[] } | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [templateMode, setTemplateMode] = useState<'research' | 'rd' | 'analytical'>('research');
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
  };

  const handleTechniqueChange = (value: string) => {
    const nextTechnique = normalizeTechnique(value);
    setTechnique(nextTechnique);
    setForm((current) => ({
      ...current,
      fileName: `${project.id}_${nextTechnique.toLowerCase()}_experiment.xy`,
    }));
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
    });

    onCreated(experiment, dataset);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">DIFARYX demo data</p>
            <h2 className="mt-1 text-lg font-bold text-text-main">New Experiment</h2>
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

        <div className="grid max-h-[72vh] grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
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
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="gap-2">
            <FilePlus2 size={16} /> Create Experiment
          </Button>
        </div>
      </form>
    </div>
  );
}
