import React from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Download,
  FilePlus2,
  FileText,
  FlaskConical,
  FolderKanban,
  History,
  Layers,
  Play,
  RotateCcw,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Graph } from '../components/ui/Graph';
import {
  AnalysisFeature,
  AnalysisSession,
  AnalysisStatus,
  AnalysisTechnique,
  PROJECT_OPTIONS,
  PipelineStepStatus,
  ProcessingParameter,
  TECHNIQUE_DEFINITIONS,
  createAnalysisSession,
  getAnalysisSession,
  getAnalysisSessions,
  getOriginLabel,
  getProjectEvidenceEntries,
  getStatusLabel,
  inferTechniqueFromFile,
  restoreAnalysisVersion,
  saveAnalysisSession,
  saveCurrentAnalysisVersion,
  updateSessionProject,
} from '../data/analysisSessions';
import { getRegistryProject, normalizeRegistryProjectId } from '../data/demoProjectRegistry';
import { cn } from '../components/ui/Button';

const TECHNIQUES = ['xrd', 'xps', 'ftir', 'raman'] as const;

function isAnalysisTechnique(value: string | null): value is AnalysisTechnique {
  return Boolean(value && TECHNIQUES.some((technique) => technique === value));
}

const ROUTE_FLOW = [
  { label: 'Home', path: '/analysis' },
  { label: 'New Analysis', path: '/analysis/new' },
  { label: 'Quick XRD Workspace', path: '/workspace/xrd?mode=quick&sessionId=ANL-2024-000123' },
  { label: 'Quick XPS Workspace', path: '/workspace/xps?mode=quick&sessionId=ANL-2024-000126' },
  { label: 'Quick FTIR Workspace', path: '/workspace/ftir?mode=quick&sessionId=ANL-2024-000124' },
  { label: 'Quick Raman Workspace', path: '/workspace/raman?mode=quick&sessionId=ANL-2024-000125' },
  { label: 'Evidence Registry', path: '/project/cufe2o4-sba15/evidence' },
  { label: 'History Continue', path: '/workspace/xrd?mode=quick&sessionId=ANL-2024-000123' },
];

function quickWorkspacePath(session: AnalysisSession) {
  return `/workspace/${session.technique}?mode=quick&sessionId=${encodeURIComponent(session.analysisId)}&source=quick_analysis&project_id=`;
}

function techniqueLabel(technique: AnalysisTechnique) {
  return TECHNIQUE_DEFINITIONS[technique].label;
}

function statusClass(status: AnalysisStatus) {
  if (status === 'saved' || status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'processing') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'needs-review') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'error') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function techniqueClass(technique: AnalysisTechnique) {
  if (technique === 'xps') return 'border-indigo-200 bg-indigo-50 text-indigo-700';
  if (technique === 'ftir') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (technique === 'raman') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function qualityClass(state: string) {
  if (state === 'good') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (state === 'warning') return 'text-amber-700 bg-amber-50 border-amber-200';
  if (state === 'error') return 'text-red-700 bg-red-50 border-red-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
}

function stepClass(status: PipelineStepStatus) {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'active') return 'border-blue-300 bg-blue-50 text-blue-700';
  if (status === 'error') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'skipped') return 'border-slate-200 bg-slate-100 text-slate-500';
  return 'border-slate-200 bg-white text-slate-500';
}

function StepIcon({ status }: { status: PipelineStepStatus }) {
  if (status === 'completed') return <CheckCircle2 size={14} />;
  if (status === 'active') return <Play size={14} />;
  if (status === 'error') return <AlertTriangle size={14} />;
  return <Clock size={14} />;
}

function formatProject(session: AnalysisSession) {
  return session.projectName || 'No project';
}

function formatProjectStatus(session: AnalysisSession) {
  return session.projectName ? `Attached: ${session.projectName}` : 'No project';
}

function getAcceptedFiles(technique: AnalysisTechnique | null) {
  if (technique === 'xrd') return '.xy, .csv, .txt, .dat, .asc, .raw';
  if (technique === 'xps') return '.xps, .csv, .txt, .dat, .asc';
  if (technique === 'ftir') return '.csv, .txt, .dat, .asc';
  if (technique === 'raman') return '.txt, .csv, .dat, .asc';
  return '.xy, .csv, .txt, .dat, .asc, .xps, .raw';
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'size unavailable';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(fileName: string) {
  return fileName.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() ?? 'unknown';
}

function getFeatureColumns(features: AnalysisFeature[]) {
  const columns = new Set<string>();
  features.forEach((feature) => Object.keys(feature.values).forEach((key) => columns.add(key)));
  return Array.from(columns);
}

type QuickSessionCsvRow = Record<string, string | number | null | undefined>;

const QUICK_SESSION_CSV_COLUMNS = [
  'quick_analysis_session_id',
  'project_id',
  'project_name',
  'technique',
  'source_file',
  'x_value',
  'y_value',
  'x_unit',
  'y_unit',
  'processed_signal',
  'peak_position',
  'peak_intensity',
  'assignment',
  'quality_flag',
  'validation_status',
  'processing_method',
  'exported_at',
];

function csvEscape(value: string | number | null | undefined) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadQuickSessionCsv(session: AnalysisSession, type: 'raw' | 'features' | 'summary') {
  const exportedAt = new Date().toISOString();
  const technique = techniqueLabel(session.technique);
  const projectName = session.projectName || 'No project';
  const base = {
    quick_analysis_session_id: session.analysisId,
    project_id: session.projectId ?? '',
    project_name: projectName,
    technique,
    source_file: session.fileName,
    x_value: '',
    y_value: '',
    x_unit: session.graphData.axisLabel,
    y_unit: session.graphData.yLabel,
    processed_signal: '',
    peak_position: '',
    peak_intensity: '',
    assignment: session.projectId ? 'tentative_assignment' : 'insufficient_evidence',
    quality_flag: session.status === 'needs-review' ? 'validation_limited' : session.status === 'error' ? 'insufficient_evidence' : 'tentative_assignment',
    validation_status: session.projectId ? 'validation_limited' : 'insufficient_evidence',
    processing_method: session.processingParameters.map((item) => `${item.label}: ${item.value}`).join(' | '),
    exported_at: exportedAt,
  } satisfies QuickSessionCsvRow;

  let rows: QuickSessionCsvRow[];
  if (type === 'raw') {
    rows = makeGraphPoints(session.technique).map((point) => ({
      ...base,
      x_value: point.x,
      y_value: point.y,
      processed_signal: point.y,
    }));
  } else if (type === 'features') {
    rows = session.extractedFeatures.map((feature) => ({
      ...base,
      peak_position:
        feature.values['2theta'] ||
        feature.values['binding energy'] ||
        feature.values.wavenumber ||
        feature.values['Raman shift'] ||
        '',
      peak_intensity: feature.values.intensity || '',
      assignment:
        feature.values.assignment ||
        feature.values['oxidation-state assignment'] ||
        feature.values['mode assignment'] ||
        feature.label,
    }));
  } else {
    rows = [{
      ...base,
      assignment: session.interpretation.evidenceContribution,
      quality_flag: session.interpretation.confidence.includes('limited') ? 'validation_limited' : 'tentative_assignment',
      validation_status: session.interpretation.confidence.includes('supported') ? 'tentative_assignment' : 'insufficient_evidence',
      processing_method: session.processingState,
      summary: session.interpretation.quick.join(' '),
    }];
  }

  if (type === 'raw' && rows.length === 0) {
    rows = session.extractedFeatures.map((feature) => ({
      ...base,
      assignment: feature.values.assignment || feature.label,
      peak_intensity: feature.values.intensity || '',
    }));
  }

  const extraColumns = rows.flatMap((row) => Object.keys(row)).filter((key) => !QUICK_SESSION_CSV_COLUMNS.includes(key));
  const headers = [...QUICK_SESSION_CSV_COLUMNS, ...Array.from(new Set(extraColumns))];
  const content = [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const projectSlug = session.projectId ? session.projectId : 'no-project';
  const suffix = type === 'raw' ? 'raw-data' : type === 'features' ? 'features' : 'session-summary';
  anchor.href = url;
  anchor.download = `difaryx_${projectSlug}_${session.technique}_${suffix}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function makeGraphPoints(technique: AnalysisTechnique) {
  const settings: Record<AnalysisTechnique, { min: number; max: number; peaks: Array<[number, number, number]> }> = {
    xrd: {
      min: 10,
      max: 80,
      peaks: [
        [20.9, 26, 1.2],
        [35.5, 92, 0.35],
        [43.2, 52, 0.4],
        [57.1, 38, 0.5],
      ],
    },
    xps: {
      min: 0,
      max: 1200,
      peaks: [
        [284.8, 40, 16],
        [531.4, 72, 20],
        [710.8, 84, 18],
        [933.4, 78, 22],
      ],
    },
    ftir: {
      min: 400,
      max: 4000,
      peaks: [
        [620, 58, 45],
        [1084, 80, 85],
        [1625, 38, 75],
        [3420, 42, 170],
      ],
    },
    raman: {
      min: 100,
      max: 3200,
      peaks: [
        [382, 22, 28],
        [585, 64, 28],
        [690, 94, 34],
        [1348, 42, 62],
      ],
    },
  };
  const config = settings[technique];
  const count = 260;
  return Array.from({ length: count }, (_, index) => {
    const x = config.min + ((config.max - config.min) * index) / (count - 1);
    const base = technique === 'ftir' ? 92 : 8 + 3 * Math.sin(index / 12);
    const y = config.peaks.reduce((sum, [center, height, width]) => {
      const scaled = (x - center) / width;
      const peak = height * Math.exp(-0.5 * scaled * scaled);
      return technique === 'ftir' ? sum - peak * 0.45 : sum + peak;
    }, base);
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(3)) };
  });
}

function RouteMap() {
  return (
    <Card className="rounded-lg bg-white p-3">
      <div className="mb-2 flex items-center gap-2">
        <Layers size={15} className="text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">Route map / ecosystem flow</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ROUTE_FLOW.map((item, index) => (
          <React.Fragment key={item.label}>
            <Link
              to={item.path}
              className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-text-main hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              {item.label}
            </Link>
            {index < ROUTE_FLOW.length - 1 && (
              <span className="flex shrink-0 items-center text-primary/60">-&gt;</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}

function MiniSpectrum({ technique }: { technique: AnalysisTechnique }) {
  const w = 96;
  const h = 34;
  const stroke =
    technique === 'xps' ? '#6366f1' : technique === 'ftir' ? '#e11d48' : technique === 'raman' ? '#059669' : '#2563eb';

  const buildPath = (): string => {
    const pts: string[] = [];
    const n = 80;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = t * w;
      let y: number;
      if (technique === 'xrd') {
        const base = h * 0.85;
        const p1 = Math.exp(-0.5 * ((t - 0.28) / 0.018) ** 2) * h * 0.35;
        const p2 = Math.exp(-0.5 * ((t - 0.45) / 0.012) ** 2) * h * 0.72;
        const p3 = Math.exp(-0.5 * ((t - 0.56) / 0.015) ** 2) * h * 0.42;
        const p4 = Math.exp(-0.5 * ((t - 0.72) / 0.02) ** 2) * h * 0.28;
        y = base - p1 - p2 - p3 - p4;
      } else if (technique === 'xps') {
        const base = h * 0.82;
        const p1 = Math.exp(-0.5 * ((t - 0.24) / 0.06) ** 2) * h * 0.32;
        const p2 = Math.exp(-0.5 * ((t - 0.44) / 0.055) ** 2) * h * 0.58;
        const p3 = Math.exp(-0.5 * ((t - 0.60) / 0.05) ** 2) * h * 0.68;
        const p4 = Math.exp(-0.5 * ((t - 0.78) / 0.06) ** 2) * h * 0.52;
        y = base - p1 - p2 - p3 - p4;
      } else if (technique === 'ftir') {
        const base = h * 0.18;
        const b1 = Math.exp(-0.5 * ((t - 0.18) / 0.04) ** 2) * h * 0.48;
        const b2 = Math.exp(-0.5 * ((t - 0.35) / 0.06) ** 2) * h * 0.62;
        const b3 = Math.exp(-0.5 * ((t - 0.55) / 0.05) ** 2) * h * 0.3;
        const b4 = Math.exp(-0.5 * ((t - 0.85) / 0.08) ** 2) * h * 0.35;
        y = base + b1 + b2 + b3 + b4;
      } else {
        const base = h * 0.82;
        const p1 = Math.exp(-0.5 * ((t - 0.22) / 0.022) ** 2) * h * 0.2;
        const p2 = Math.exp(-0.5 * ((t - 0.38) / 0.02) ** 2) * h * 0.5;
        const p3 = Math.exp(-0.5 * ((t - 0.48) / 0.025) ** 2) * h * 0.72;
        const p4 = Math.exp(-0.5 * ((t - 0.72) / 0.03) ** 2) * h * 0.32;
        y = base - p1 - p2 - p3 - p4;
      }
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${Math.max(2, Math.min(h - 2, y)).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const xLabel =
    technique === 'xrd' ? '2theta' : technique === 'xps' ? 'Binding energy' : technique === 'ftir' ? 'cm-1' : 'Raman shift';

  return (
    <div className="rounded-md border border-border bg-white px-1.5 py-1">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
        <path d={buildPath()} fill="none" stroke={stroke} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="mt-0.5 text-center text-[8px] font-semibold text-text-muted">{xLabel}</p>
    </div>
  );
}

function TechniqueCard({
  technique,
  selected,
  to,
  onClick,
}: {
  technique: AnalysisTechnique;
  selected?: boolean;
  to?: string;
  onClick?: () => void;
}) {
  const body = (
    <div
      className={cn(
        'h-full rounded-lg border bg-white p-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5',
        selected ? 'border-primary/50 bg-primary/5' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold uppercase', techniqueClass(technique))}>
            {techniqueLabel(technique)}
          </span>
          <h3 className="mt-1.5 truncate text-xs font-bold text-text-main">{TECHNIQUE_DEFINITIONS[technique].fullName}</h3>
        </div>
        <MiniSpectrum technique={technique} />
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-text-muted">{TECHNIQUE_DEFINITIONS[technique].useCase}</p>
      {selected && <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">Selected</p>}
    </div>
  );

  if (to) return <Link to={to}>{body}</Link>;
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {body}
    </button>
  );
}

function FileDropZone({
  selectedTechnique,
  className,
  compact = false,
}: {
  selectedTechnique?: AnalysisTechnique | null;
  className?: string;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [unknownFile, setUnknownFile] = React.useState('');

  const startFromFile = (fileName: string) => {
    const inferred = selectedTechnique || inferTechniqueFromFile(fileName);
    if (!inferred) {
      setUnknownFile(fileName);
      navigate(`/analysis/new?file=${encodeURIComponent(fileName)}`);
      return;
    }
    const session = createAnalysisSession(inferred, fileName);
    navigate(quickWorkspacePath(session));
  };

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) startFromFile(file.name);
  };

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onFiles(event.dataTransfer.files);
      }}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-primary/35 bg-blue-50/40 text-center',
        compact ? 'min-h-[150px] p-4' : 'min-h-[210px] p-6',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".xy,.csv,.txt,.dat,.asc,.xps,.raw"
        onChange={(event) => onFiles(event.target.files)}
      />
      <Upload size={compact ? 24 : 30} className="text-primary" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 text-sm font-bold text-text-main hover:text-primary"
      >
        Drop file here or click to browse
      </button>
      <p className="mt-1 text-xs text-text-muted">Supported: .xy, .csv, .txt, .dat, .asc, .xps, etc.</p>
      {selectedTechnique && (
        <p className="mt-2 rounded-full border border-primary/20 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
          Technique selected: {techniqueLabel(selectedTechnique)}
        </p>
      )}
      {unknownFile && (
        <p className="mt-2 text-[11px] font-semibold text-amber-700">
          Technique needed for {unknownFile}. Choose XRD, XPS, FTIR, or Raman.
        </p>
      )}
    </div>
  );
}

function HistoryActionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-7 items-center rounded-md border border-border bg-white px-2 text-[10px] font-semibold text-text-main hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      {children}
    </Link>
  );
}

export function AnalysisWorkspaceHome() {
  const navigate = useNavigate();
  const [selectedTechnique, setSelectedTechnique] = React.useState<AnalysisTechnique | null>(null);
  const [sessions, setSessions] = React.useState<AnalysisSession[]>(() => getAnalysisSessions());
  const [uploadedFile, setUploadedFile] = React.useState<{ name: string; sizeLabel: string; extension: string } | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const recentSessions = React.useMemo(
    () => [...sessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6),
    [sessions],
  );

  const createQuickSession = (technique: AnalysisTechnique, file: { name: string; sizeLabel?: string }) => {
    const created = createAnalysisSession(technique, file.name);
    const session = saveAnalysisSession({
      ...created,
      fileSizeLabel: file.sizeLabel,
      source: 'quick_analysis',
      origin: 'quick-analysis',
      projectId: undefined,
      projectName: undefined,
      status: 'processing',
      processingLog: [
        `Quick analysis session ${created.analysisId} created from ${file.name}`,
        'Source: quick_analysis',
        'Project: No project',
        ...created.processingLog,
      ],
    });
    setSessions(getAnalysisSessions());
    navigate(quickWorkspacePath(session));
  };

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !selectedTechnique) return;
    setUploadedFile({ name: file.name, sizeLabel: formatBytes(file.size), extension: fileExtension(file.name) });
  };

  const handleStartProcessing = () => {
    if (!selectedTechnique || !uploadedFile) return;
    createQuickSession(selectedTechnique, uploadedFile);
  };

  const handleSaveSession = (session: AnalysisSession) => {
    saveAnalysisSession({
      ...session,
      status: 'saved',
      processingLog: ['Saved quick analysis session', ...session.processingLog],
    });
    setSessions(getAnalysisSessions());
  };

  return (
    <DashboardLayout>
      <div className="h-full overflow-y-auto bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-main">Quick Analysis</h1>
              <p className="mt-1 text-xs text-text-muted">
                Select technique, upload a file, start processing, then save, export, or attach to a project later.
              </p>
            </div>
            <div className="hidden items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[10px] font-semibold text-text-muted lg:flex">
              <span>Quick Analysis</span>
              <ArrowRight size={11} />
              <span>Select technique</span>
              <ArrowRight size={11} />
              <span>Upload file</span>
              <ArrowRight size={11} />
              <span>Technique Workspace</span>
            </div>
          </div>

          <div className="grid gap-2 lg:grid-cols-4">
            {TECHNIQUES.map((technique) => (
              <TechniqueCard
                key={technique}
                technique={technique}
                selected={selectedTechnique === technique}
                onClick={() => {
                  setSelectedTechnique(technique);
                  setUploadedFile(null);
                }}
              />
            ))}
          </div>

          <Card className="rounded-lg bg-white p-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-stretch">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onFiles(e.dataTransfer.files);
                }}
                className={cn(
                  'flex min-h-[116px] items-center gap-4 rounded-lg border border-dashed p-4',
                  selectedTechnique ? 'border-primary/35 bg-blue-50/40' : 'border-slate-200 bg-slate-50',
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept={getAcceptedFiles(selectedTechnique)}
                  disabled={!selectedTechnique}
                  onChange={(e) => onFiles(e.target.files)}
                />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary ring-1 ring-border">
                  <Upload size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={!selectedTechnique}
                    onClick={() => inputRef.current?.click()}
                    className="text-left text-sm font-bold text-text-main hover:text-primary disabled:cursor-not-allowed disabled:text-text-muted"
                  >
                    Drop file here or click to browse
                  </button>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {selectedTechnique
                      ? `${techniqueLabel(selectedTechnique)} accepted files: ${getAcceptedFiles(selectedTechnique)}`
                      : 'Select a technique to configure file requirements.'}
                  </p>
                  {uploadedFile && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="max-w-[260px] truncate rounded-md border border-border bg-white px-2 py-1 font-semibold text-text-main">
                        {uploadedFile.name}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-text-muted">{uploadedFile.sizeLabel}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 uppercase text-text-muted">{uploadedFile.extension}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex min-w-[220px] flex-col justify-between rounded-lg border border-border bg-slate-50 p-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Processing target</p>
                  <p className="mt-1 text-sm font-bold text-text-main">
                    {selectedTechnique ? `${techniqueLabel(selectedTechnique)} Workspace` : 'No technique selected'}
                  </p>
                  <p className="mt-1 text-[11px] text-text-muted">Project: No project</p>
                  <p className="mt-1 text-[11px] text-text-muted">Source: quick_analysis</p>
                </div>
                <button
                  type="button"
                  disabled={!selectedTechnique || !uploadedFile}
                  onClick={handleStartProcessing}
                  className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play size={14} />
                  {uploadedFile && selectedTechnique ? `Start ${techniqueLabel(selectedTechnique)} Processing` : 'Upload file to continue'}
                </button>
              </div>
            </div>
          </Card>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">Recent Sessions</h2>
              <span className="text-[11px] text-text-muted">Quick and attached sessions stay visible here.</span>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-white">
              <div className="grid grid-cols-[86px_minmax(180px,1.2fr)_minmax(150px,0.9fr)_120px_92px_minmax(260px,1fr)] border-b border-border bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                <span>Technique</span>
                <span>File name</span>
                <span>Project status</span>
                <span>Processing</span>
                <span>Updated</span>
                <span>Actions</span>
              </div>
              {recentSessions.map((session) => (
                <div
                  key={session.analysisId}
                  className="grid grid-cols-[86px_minmax(180px,1.2fr)_minmax(150px,0.9fr)_120px_92px_minmax(260px,1fr)] items-center gap-2 border-b border-border px-3 py-2 last:border-b-0"
                >
                  <span className={cn('w-fit rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase', techniqueClass(session.technique))}>
                    {techniqueLabel(session.technique)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-text-main">{session.fileName}</p>
                    <p className="truncate text-[10px] text-text-muted">{session.analysisId}</p>
                  </div>
                  <p className="truncate text-[11px] font-semibold text-text-muted">{formatProjectStatus(session)}</p>
                  <span className={cn('w-fit rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase', statusClass(session.status))}>
                    {getStatusLabel(session.status)}
                  </span>
                  <p className="text-[11px] text-text-muted">{session.updatedLabel}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <HistoryActionLink to={quickWorkspacePath(session)}>Open Workspace</HistoryActionLink>
                    <HistoryActionLink to={`${quickWorkspacePath(session)}&action=attach`}>Attach</HistoryActionLink>
                    <button
                      type="button"
                      onClick={() => downloadQuickSessionCsv(session, 'raw')}
                      className="inline-flex h-7 items-center rounded-md border border-border bg-white px-2 text-[10px] font-semibold text-text-main hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      Raw CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadQuickSessionCsv(session, 'features')}
                      className="inline-flex h-7 items-center rounded-md border border-border bg-white px-2 text-[10px] font-semibold text-text-main hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      Features
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadQuickSessionCsv(session, 'summary')}
                      className="inline-flex h-7 items-center rounded-md border border-border bg-white px-2 text-[10px] font-semibold text-text-main hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      Summary CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveSession(session)}
                      className="inline-flex h-7 items-center rounded-md border border-border bg-white px-2 text-[10px] font-semibold text-text-main hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      Save
                    </button>
                    <HistoryActionLink to={session.projectId ? `/notebook?project=${session.projectId}` : quickWorkspacePath(session)}>Notebook</HistoryActionLink>
                    <HistoryActionLink to={session.projectId ? `/reports?project=${session.projectId}` : quickWorkspacePath(session)}>
                      Report Draft
                    </HistoryActionLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function AnalysisNew() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const techniqueParam = searchParams.get('technique');
  const selectedTechnique = isAnalysisTechnique(techniqueParam) ? techniqueParam : null;
  const pendingFile = searchParams.get('file');
  const recentFiles: Array<{ name: string; technique: AnalysisTechnique }> = [
    { name: 'sample_001.xy', technique: 'xrd' },
    { name: 'surface_scan.csv', technique: 'xps' },
    { name: 'ftir_test.csv', technique: 'ftir' },
    { name: 'raman_test.txt', technique: 'raman' },
  ];

  const chooseTechnique = (technique: AnalysisTechnique) => {
    const next = new URLSearchParams(searchParams);
    next.set('technique', technique);
    setSearchParams(next, { replace: false });
    if (pendingFile) {
      const session = createAnalysisSession(technique, pendingFile);
      navigate(quickWorkspacePath(session));
    }
  };

  const startRecent = (fileName: string, fallbackTechnique: AnalysisTechnique) => {
    const session = createAnalysisSession(selectedTechnique || fallbackTechnique, fileName);
    navigate(quickWorkspacePath(session));
  };

  return (
    <DashboardLayout>
      <div className="h-full overflow-y-auto bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4">
          <div>
            <Link to="/analysis" className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-primary">
              <ArrowLeft size={13} /> Back to Analysis Workspace
            </Link>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-text-main">New Analysis — Choose Technique</h1>
            <p className="mt-1 text-sm text-text-muted">Choose technique to start. No project required. You can attach later.</p>
            {selectedTechnique && (
              <p className="mt-2 inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase text-primary">
                Technique selected: {techniqueLabel(selectedTechnique)}
              </p>
            )}
          </div>

          {pendingFile && !selectedTechnique && (
            <Card className="rounded-lg border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Technique is required before processing <span className="font-bold">{pendingFile}</span>.
            </Card>
          )}

          <div className="grid gap-3 md:grid-cols-4">
            {TECHNIQUES.map((technique) => (
              <TechniqueCard
                key={technique}
                technique={technique}
                selected={selectedTechnique === technique}
                onClick={() => chooseTechnique(technique)}
              />
            ))}
          </div>

          <Card className="rounded-lg bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Upload size={15} className="text-primary" />
              <h2 className="text-sm font-bold text-text-main">Drop file here or click to browse</h2>
            </div>
            <FileDropZone selectedTechnique={selectedTechnique} />
          </Card>

          <Card className="rounded-lg bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock size={15} className="text-primary" />
              <h2 className="text-sm font-bold text-text-main">Recent files</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentFiles.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => startRecent(file.name, file.technique)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-semibold text-text-main hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <FileText size={14} /> {file.name}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SessionHeader({
  session,
  onSave,
}: {
  session: AnalysisSession;
  onSave: () => void;
}) {
  return (
    <Card className="rounded-lg bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/analysis" className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-primary">
            <ArrowLeft size={13} /> Back to History
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold uppercase', techniqueClass(session.technique))}>
              {techniqueLabel(session.technique)}
            </span>
            <h1 className="text-xl font-bold tracking-tight text-text-main">
              {techniqueLabel(session.technique)} - {session.fileName}
            </h1>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
            <span>Session ID: <span className="font-semibold text-text-main">{session.analysisId}</span></span>
            <span>Owner: <span className="font-semibold text-text-main">{session.owner}</span></span>
            <span>Project: <span className="font-semibold text-text-main">{session.projectName || 'No project linked'}</span></span>
            <span>Status: <span className="font-semibold text-text-main">{getStatusLabel(session.status)}</span></span>
            <span>Autosaved {session.updatedLabel === 'just now' ? '8 sec ago' : session.updatedLabel}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-bold text-white hover:bg-primary/90"
          >
            <Save size={14} /> Save
          </button>
          <Link to={`/analysis/session/${session.analysisId}/attach`} className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-bold text-text-main hover:bg-surface-hover">
            <FolderKanban size={14} /> Attach
          </Link>
          <Link to={`/analysis/session/${session.analysisId}/export`} className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-bold text-text-main hover:bg-surface-hover">
            <Download size={14} /> Export
          </Link>
        </div>
      </div>
    </Card>
  );
}

function SessionTabs({ session, active }: { session: AnalysisSession; active: string }) {
  const tabs = [
    { id: 'overview', label: 'Overview', to: `/analysis/session/${session.analysisId}?tab=overview` },
    { id: 'processing', label: 'Processing', to: `/analysis/session/${session.analysisId}?tab=processing` },
    { id: 'features', label: 'Features', to: `/analysis/session/${session.analysisId}?tab=features` },
    { id: 'match', label: 'Match / Assignment', to: `/analysis/session/${session.analysisId}?tab=match` },
    { id: 'interpretation', label: 'Interpretation', to: `/analysis/session/${session.analysisId}?tab=interpretation` },
    { id: 'notes', label: 'Notes', to: `/analysis/session/${session.analysisId}?tab=notes` },
    { id: 'export', label: 'Export', to: `/analysis/session/${session.analysisId}/export` },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-white p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.to}
          className={cn(
            'shrink-0 rounded-md px-3 py-2 text-xs font-bold',
            active === tab.id ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-hover hover:text-text-main',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

function ProcessingWorkspace({
  session,
  setSession,
}: {
  session: AnalysisSession;
  setSession: React.Dispatch<React.SetStateAction<AnalysisSession | null>>;
}) {
  const updateParameter = (id: string, value: string) => {
    setSession((current) => current
      ? {
          ...current,
          processingParameters: current.processingParameters.map((parameter) => (
            parameter.id === id ? { ...parameter, value } : parameter
          )),
        }
      : current);
  };

  const commitLog = (message: string) => {
    setSession((current) => {
      if (!current) return current;
      const saved = saveAnalysisSession({
        ...current,
        status: 'processing',
        processingLog: [message, ...current.processingLog],
      });
      return saved;
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)_320px]">
      <Card className="rounded-lg bg-white p-3">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList size={15} className="text-primary" />
          <h2 className="text-sm font-bold text-text-main">Processing Pipeline</h2>
        </div>
        <div className="space-y-2">
          {session.processingPipeline.map((step, index) => (
            <div key={step.id} className={cn('rounded-md border px-3 py-2 text-xs', stepClass(step.status))}>
              <div className="flex items-center gap-2">
                <StepIcon status={step.status} />
                <span className="font-bold">{index + 1}. {step.label}</span>
              </div>
              <p className="mt-1 text-[11px] opacity-80">{step.notes || step.status}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="rounded-lg bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
          <div>
            <h2 className="text-sm font-bold text-text-main">Raw vs Processed graph</h2>
            <p className="text-[11px] text-text-muted">{session.graphData.axisLabel} / {session.graphData.yLabel}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Before/After', 'Zoom', 'Pan', 'Reset', 'Auto scale'].map((item) => (
              <button
                key={item}
                type="button"
                className="h-7 rounded-md border border-border bg-white px-2 text-[10px] font-bold text-text-main hover:bg-surface-hover"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3">
          <div className="h-[410px] rounded-md border border-border bg-white p-2">
            <Graph
              type={session.technique}
              height="100%"
              externalData={makeGraphPoints(session.technique)}
              peakMarkers={session.graphData.markers}
              xAxisLabel={session.graphData.axisLabel}
              yAxisLabel={session.graphData.yLabel}
              showLegend
              showBackground
            />
          </div>
          <div className="mt-3 rounded-md border border-border bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <History size={14} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Processing log</h3>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              {session.processingLog.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded border border-border bg-white px-2 py-1 text-[11px] text-text-main">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-lg bg-white p-3">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-primary" />
          <h2 className="text-sm font-bold text-text-main">Processing Parameters</h2>
        </div>
        <div className="space-y-2">
          {session.processingParameters.map((parameter) => (
            <label key={parameter.id} className="block rounded-md border border-border bg-slate-50 px-2 py-2 text-xs">
              <span className="font-semibold text-text-muted">{parameter.label}</span>
              <input
                value={parameter.value}
                onChange={(event) => updateParameter(parameter.id, event.target.value)}
                className="mt-1 h-8 w-full rounded border border-border bg-white px-2 text-xs font-semibold text-text-main outline-none focus:border-primary"
              />
            </label>
          ))}
        </div>

        <div className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Quality Check</h3>
          <div className="space-y-1.5">
            {session.qualityChecks.map((metric) => (
              <div key={metric.label} className={cn('flex items-center justify-between rounded border px-2 py-1.5 text-[11px]', qualityClass(metric.state))}>
                <span className="font-semibold">{metric.label}</span>
                <span>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => commitLog('Parameters changed')} className="h-8 rounded-md bg-primary text-xs font-bold text-white hover:bg-primary/90">
            Apply
          </button>
          <button type="button" onClick={() => commitLog('Parameters reset')} className="h-8 rounded-md border border-border bg-white text-xs font-bold text-text-main hover:bg-surface-hover">
            Reset
          </button>
          <button type="button" onClick={() => commitLog('Reprocess requested')} className="h-8 rounded-md border border-border bg-white text-xs font-bold text-text-main hover:bg-surface-hover">
            Reprocess
          </button>
          <button type="button" onClick={() => commitLog('Session saved')} className="h-8 rounded-md border border-primary bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20">
            Save Session
          </button>
        </div>
      </Card>
    </div>
  );
}

function OverviewPanel({ session }: { session: AnalysisSession }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="rounded-lg bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-text-main">Continue Session from History</h2>
            <p className="mt-1 text-sm text-text-muted">Saved state is loaded and ready for continued processing.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/analysis/session/${session.analysisId}?tab=processing`} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-bold text-white">
              Continue Processing <ArrowRight size={14} />
            </Link>
            <Link to={`/analysis/session/${session.analysisId}?tab=features`} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-bold text-text-main hover:bg-surface-hover">
              Go to Features
            </Link>
          </div>
        </div>
        <div className="h-[360px] rounded-md border border-border bg-white p-2">
          <Graph
            type={session.technique}
            height="100%"
            externalData={makeGraphPoints(session.technique)}
            peakMarkers={session.graphData.markers}
            xAxisLabel={session.graphData.axisLabel}
            yAxisLabel={session.graphData.yLabel}
            showLegend
          />
        </div>
      </Card>

      <Card className="rounded-lg bg-white p-4">
        <h3 className="text-sm font-bold text-text-main">Session state preserved</h3>
        <div className="mt-3 space-y-2 text-xs">
          {[
            'raw data reference',
            'processing pipeline state',
            'parameters',
            'graph state',
            'extracted features',
            'interpretation',
            'notes',
            'save/version state',
            'project association',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded border border-border bg-slate-50 px-2 py-1.5">
              <CheckCircle2 size={13} className="text-primary" />
              <span className="font-semibold text-text-main">{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function FeaturesPanel({ session }: { session: AnalysisSession }) {
  const columns = getFeatureColumns(session.extractedFeatures);
  return (
    <Card className="rounded-lg bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-lg font-bold text-text-main">Features / Results</h2>
          <p className="mt-1 text-xs text-text-muted">{techniqueLabel(session.technique)} extracted features after processing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/analysis/session/${session.analysisId}?tab=interpretation`} className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-bold text-white">
            Go to Interpretation <ArrowRight size={13} />
          </Link>
          <Link to={`/analysis/session/${session.analysisId}/save`} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-bold text-text-main hover:bg-surface-hover">Save Result</Link>
          <Link to={`/analysis/session/${session.analysisId}/attach`} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-bold text-text-main hover:bg-surface-hover">Attach to Project</Link>
          <Link to={`/analysis/session/${session.analysisId}/export`} className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-bold text-text-main hover:bg-surface-hover">Export</Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="border-b border-border bg-slate-50 text-[10px] uppercase tracking-wider text-text-muted">
            <tr>
              <th className="px-4 py-2 font-bold">Feature</th>
              {columns.map((column) => (
                <th key={column} className="px-4 py-2 font-bold">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {session.extractedFeatures.map((feature) => (
              <tr key={feature.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-bold text-text-main">{feature.label}</td>
                {columns.map((column) => (
                  <td key={column} className="px-4 py-3 text-text-muted">{feature.values[column] || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function InterpretationPanel({ session }: { session: AnalysisSession }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="rounded-lg bg-white p-4">
        <h2 className="text-lg font-bold text-text-main">Quick Interpretation</h2>
        <div className="mt-3 space-y-2">
          {session.interpretation.quick.map((item) => (
            <div key={item} className="rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-text-main">
              {item}
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Evidence Contribution</h3>
            <p className="mt-2 text-sm font-semibold text-text-main">{session.interpretation.evidenceContribution}</p>
            <p className="mt-1 text-xs text-text-muted">Confidence: {session.interpretation.confidence}</p>
            <p className="mt-1 text-xs text-text-muted">Validation impact: {session.interpretation.validationImpact}</p>
          </div>
          <div className="rounded-md border border-border bg-white p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Quality Flags</h3>
            <div className="mt-2 space-y-1.5">
              {session.interpretation.qualityFlags.map((flag) => (
                <div key={flag} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                  {flag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-lg bg-white p-4">
        <h3 className="text-sm font-bold text-text-main">Recommended Next Steps</h3>
        <div className="mt-3 space-y-2">
          {session.interpretation.recommendedNextSteps.map((step) => (
            <div key={step} className="flex items-start gap-2 rounded border border-border bg-slate-50 px-2 py-2 text-xs text-text-main">
              <ArrowRight size={13} className="mt-0.5 shrink-0 text-primary" />
              <span>{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2">
          {[
            ['Save Interpretation', `/analysis/session/${session.analysisId}/save`],
            ['Send to Agent', `/demo/agent?analysis=${session.analysisId}`],
            ['Send to Notebook', `/notebook?analysis=${session.analysisId}`],
            ['Attach to Project', `/analysis/session/${session.analysisId}/attach`],
            ['Export', `/analysis/session/${session.analysisId}/export`],
          ].map(([label, path]) => (
            <Link key={label} to={path} className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-white px-3 text-xs font-bold text-text-main hover:bg-surface-hover">
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NotesPanel({ session, setSession }: { session: AnalysisSession; setSession: React.Dispatch<React.SetStateAction<AnalysisSession | null>> }) {
  const [draft, setDraft] = React.useState(session.notes.join('\n'));
  return (
    <Card className="rounded-lg bg-white p-4">
      <h2 className="text-lg font-bold text-text-main">Notes</h2>
      <p className="mt-1 text-xs text-text-muted">Session notes remain part of the saved analysis state.</p>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="mt-3 min-h-[260px] w-full rounded-md border border-border bg-slate-50 p-3 text-sm text-text-main outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={() => {
          const saved = saveAnalysisSession({ ...session, notes: draft.split(/\r?\n/).filter(Boolean) });
          setSession(saved);
        }}
        className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-bold text-white"
      >
        Save Notes
      </button>
    </Card>
  );
}

function MatchAssignmentPanel({ session }: { session: AnalysisSession }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {session.extractedFeatures.map((feature) => (
        <Card key={feature.id} className="rounded-lg bg-white p-4">
          <span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold uppercase', techniqueClass(session.technique))}>
            {techniqueLabel(session.technique)}
          </span>
          <h3 className="mt-3 text-sm font-bold text-text-main">{feature.label}</h3>
          <div className="mt-3 space-y-1.5">
            {Object.entries(feature.values).slice(0, 5).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-3 rounded border border-border bg-slate-50 px-2 py-1.5 text-xs">
                <span className="text-text-muted">{key}</span>
                <span className="text-right font-semibold text-text-main">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function SaveVersionPanel({ session, setSession }: { session: AnalysisSession; setSession: React.Dispatch<React.SetStateAction<AnalysisSession | null>> }) {
  const saveAsVersion = (note: string) => {
    const saved = saveCurrentAnalysisVersion(session.analysisId, note);
    if (saved) setSession(saved);
  };

  const preserveDraft = () => {
    const saved = saveAnalysisSession({ ...session, status: 'draft', processingLog: ['Preserved as draft', ...session.processingLog] });
    setSession(saved);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="rounded-lg bg-white p-4">
        <h2 className="text-lg font-bold text-text-main">Save Session</h2>
        <p className="mt-1 text-xs text-text-muted">
          Saving preserves raw data reference, processing parameters, pipeline state, graph state, features,
          interpretation, notes, project association, and version history.
        </p>
        <div className="mt-4 grid gap-2">
          <button type="button" onClick={() => saveAsVersion('saved current session')} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-bold text-white">
            <Save size={14} /> Save current session
          </button>
          <button type="button" onClick={() => saveAsVersion('saved as new version')} className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-bold text-text-main hover:bg-surface-hover">
            <FilePlus2 size={14} /> Save as new version
          </button>
          <button type="button" onClick={preserveDraft} className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-bold text-text-main hover:bg-surface-hover">
            <Clock size={14} /> Preserve as draft
          </button>
        </div>
      </Card>

      <Card className="rounded-lg bg-white">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-bold text-text-main">Version History</h2>
        </div>
        <div className="divide-y divide-border">
          {session.versions.map((item) => (
            <div key={item.versionId} className="grid gap-3 px-4 py-3 text-xs md:grid-cols-[120px_minmax(0,1fr)_140px_120px]">
              <div className="font-bold text-text-main">{item.versionLabel}</div>
              <div>
                <p className="font-semibold text-text-main">{item.note}</p>
                <p className="mt-1 text-text-muted">{item.pipelineState}</p>
              </div>
              <div className="text-text-muted">{item.owner}<br />{item.timestamp}</div>
              <div className="flex gap-1">
                <button type="button" className="h-7 rounded border border-border px-2 text-[10px] font-bold text-text-main hover:bg-surface-hover">compare</button>
                <button type="button" className="h-7 rounded border border-border px-2 text-[10px] font-bold text-text-main hover:bg-surface-hover">restore</button>
                {item.isCurrent && <span className="h-7 rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">current</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function slugifyProjectName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'analysis-project';
}

function AttachProjectPanel({ session, setSession }: { session: AnalysisSession; setSession: React.Dispatch<React.SetStateAction<AnalysisSession | null>> }) {
  const [projectId, setProjectId] = React.useState(session.projectId || PROJECT_OPTIONS[0].id);
  const [projectName, setProjectName] = React.useState('');
  const [sampleSystem, setSampleSystem] = React.useState('');
  const [contextGoal, setContextGoal] = React.useState('');
  const [attachedProject, setAttachedProject] = React.useState<{ id: string; name: string } | null>(null);
  const selectedProject = PROJECT_OPTIONS.find((project) => project.id === projectId) || PROJECT_OPTIONS[0];

  const attachSelected = () => {
    const saved = updateSessionProject(session.analysisId, selectedProject.id, selectedProject.name);
    if (saved) {
      setSession(saved);
      setAttachedProject({ id: selectedProject.id, name: selectedProject.name });
    }
  };

  const createProject = () => {
    const name = projectName || `${session.fileName} project`;
    const id = slugifyProjectName(name);
    const saved = updateSessionProject(session.analysisId, id, name);
    if (saved) {
      setSession(saved);
      setAttachedProject({ id, name });
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <Card className="rounded-lg bg-white p-4">
          <h2 className="text-lg font-bold text-text-main">Attach this analysis to a project</h2>
          <div className="mt-3 grid gap-2 text-xs md:grid-cols-5">
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-text-muted">Current project</p>
              <p className="mt-1 font-bold text-text-main">{session.projectName || 'No project'}</p>
            </div>
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-text-muted">Session title</p>
              <p className="mt-1 font-bold text-text-main">{session.title}</p>
            </div>
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-text-muted">Technique</p>
              <p className="mt-1 font-bold text-text-main">{techniqueLabel(session.technique)}</p>
            </div>
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-text-muted">File / dataset</p>
              <p className="mt-1 font-bold text-text-main">{session.fileName}</p>
            </div>
            <div className="rounded border border-border bg-slate-50 p-2">
              <p className="text-text-muted">Owner / status</p>
              <p className="mt-1 font-bold text-text-main">{session.owner} / {getStatusLabel(session.status)}</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-lg bg-white p-4">
            <h3 className="text-sm font-bold text-text-main">Attach to existing project</h3>
            <input
              placeholder="Search/select project"
              className="mt-3 h-9 w-full rounded-md border border-border bg-white px-3 text-xs font-semibold text-text-main outline-none focus:border-primary"
            />
            <div className="mt-2 space-y-2">
              {PROJECT_OPTIONS.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setProjectId(project.id)}
                  className={cn(
                    'flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left text-xs',
                    projectId === project.id ? 'border-primary/50 bg-primary/5' : 'border-border bg-slate-50 hover:bg-surface-hover',
                  )}
                >
                  <span>
                    <span className="block font-bold text-text-main">{project.name}</span>
                    <span className="text-text-muted">{project.sample}</span>
                  </span>
                  {projectId === project.id && <CheckCircle2 size={15} className="text-primary" />}
                </button>
              ))}
            </div>
            <button type="button" onClick={attachSelected} className="mt-3 h-9 w-full rounded-md bg-primary text-xs font-bold text-white hover:bg-primary/90">
              Attach to Selected Project
            </button>
          </Card>

          <Card className="rounded-lg bg-white p-4">
            <h3 className="text-sm font-bold text-text-main">Create new project from this analysis</h3>
            <div className="mt-3 space-y-2">
              {[
                ['Project name', projectName, setProjectName],
                ['Sample/system', sampleSystem, setSampleSystem],
                ['Context/goal', contextGoal, setContextGoal],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="block text-xs">
                  <span className="font-semibold text-text-muted">{label as string}</span>
                  <input
                    value={value as string}
                    onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 text-xs font-semibold text-text-main outline-none focus:border-primary"
                  />
                </label>
              ))}
              <label className="block text-xs">
                <span className="font-semibold text-text-muted">Technique evidence source</span>
                <input
                  readOnly
                  value={`${techniqueLabel(session.technique)} - ${session.fileName}`}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-slate-50 px-3 text-xs font-semibold text-text-main"
                />
              </label>
            </div>
            <button type="button" onClick={createProject} className="mt-3 h-9 w-full rounded-md border border-primary bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20">
              Create Project
            </button>
          </Card>
        </div>
      </div>

      <Card className="rounded-lg bg-white p-4">
        <h3 className="text-sm font-bold text-text-main">What will be attached</h3>
        <div className="mt-3 space-y-2">
          {[
            'raw file reference',
            'processed data',
            'processing parameters',
            'extracted features',
            'interpretation',
            'notes',
            'processing history/version',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded border border-border bg-slate-50 px-2 py-1.5 text-xs font-semibold text-text-main">
              <CheckCircle2 size={13} className="text-primary" />
              {item}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Link to={`/analysis/session/${session.analysisId}`} className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-border bg-white text-xs font-bold text-text-main hover:bg-surface-hover">
            Cancel
          </Link>
        </div>
        {attachedProject && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            <p className="font-bold">Attached to {attachedProject.name}</p>
            <p className="mt-1">The session remains visible in All Analysis History and is now listed in the Project Evidence Registry.</p>
            <Link to={`/project/${attachedProject.id}/evidence`} className="mt-2 inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-bold text-white">
              Open Evidence Registry
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

function ExportHandoffPanel({ session }: { session: AnalysisSession }) {
  const groups = [
    {
      title: 'Export Result',
      icon: Database,
      items: ['export processed data', 'export raw + processed data', 'export table CSV'],
    },
    {
      title: 'Export Report',
      icon: FileText,
      items: ['export PDF', 'export DOCX', 'export Markdown'],
    },
    {
      title: 'Export Graph',
      icon: Activity,
      items: ['export PNG', 'export SVG if supported'],
    },
    {
      title: 'Send',
      icon: Send,
      items: ['Send to Notebook', 'Send to Agent', 'Copy Link'],
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {groups.map((group) => (
        <Card key={group.title} className="rounded-lg bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <group.icon size={15} className="text-primary" />
            <h3 className="text-sm font-bold text-text-main">{group.title}</h3>
          </div>
          <div className="space-y-2">
            {group.items.map((item) => (
              <label key={item} className="flex items-center gap-2 rounded border border-border bg-slate-50 px-2 py-2 text-xs font-semibold text-text-main">
                <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-primary" />
                {item}
              </label>
            ))}
          </div>
        </Card>
      ))}
      <Card className="rounded-lg bg-white p-4 lg:col-span-4">
        <div className="flex flex-wrap gap-2">
          {[
            ['Export Result', Download],
            ['Export Report', FileText],
            ['Send to Notebook', BookOpen],
            ['Send to Agent', Bot],
            ['Copy Link', ClipboardList],
          ].map(([label, Icon]) => (
            <button key={label as string} type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-bold text-text-main hover:bg-surface-hover">
              {React.createElement(Icon as React.ElementType, { size: 14 })} {label as string}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-muted">{session.exportState.handoff}</p>
      </Card>
    </div>
  );
}

function VersionHistoryPanel({ session, setSession }: { session: AnalysisSession; setSession: React.Dispatch<React.SetStateAction<AnalysisSession | null>> }) {
  const [versionA, setVersionA] = React.useState(session.versions[0]?.versionId || '');
  const [versionB, setVersionB] = React.useState(session.versions[1]?.versionId || '');
  const restore = (versionId: string) => {
    const saved = restoreAnalysisVersion(session.analysisId, versionId);
    if (saved) setSession(saved);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="rounded-lg bg-white">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-lg font-bold text-text-main">Processing Versions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="border-b border-border bg-slate-50 text-[10px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="px-4 py-2 font-bold">Version</th>
                <th className="px-4 py-2 font-bold">Name / Note</th>
                <th className="px-4 py-2 font-bold">Pipeline State</th>
                <th className="px-4 py-2 font-bold">Changed By</th>
                <th className="px-4 py-2 font-bold">Time</th>
                <th className="px-4 py-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {session.versions.map((item) => (
                <tr key={item.versionId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-text-main">{item.versionLabel}</td>
                  <td className="px-4 py-3 text-text-main">{item.note}</td>
                  <td className="px-4 py-3 text-text-muted">{item.pipelineState}</td>
                  <td className="px-4 py-3 text-text-muted">{item.owner}</td>
                  <td className="px-4 py-3 text-text-muted">{item.timestamp}</td>
                  <td className="px-4 py-3">
                    {item.isCurrent ? (
                      <span className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">Current</span>
                    ) : (
                      <button type="button" onClick={() => restore(item.versionId)} className="rounded border border-border bg-white px-2 py-1 text-[10px] font-bold text-text-main hover:bg-surface-hover">
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="rounded-lg bg-white p-4">
        <h3 className="text-sm font-bold text-text-main">Compare Versions</h3>
        <label className="mt-3 block text-xs">
          <span className="font-semibold text-text-muted">Version A</span>
          <select value={versionA} onChange={(event) => setVersionA(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-xs font-semibold text-text-main">
            {session.versions.map((item) => <option key={item.versionId} value={item.versionId}>{item.versionLabel}</option>)}
          </select>
        </label>
        <label className="mt-2 block text-xs">
          <span className="font-semibold text-text-muted">Version B</span>
          <select value={versionB} onChange={(event) => setVersionB(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-border bg-white px-2 text-xs font-semibold text-text-main">
            {session.versions.map((item) => <option key={item.versionId} value={item.versionId}>{item.versionLabel}</option>)}
          </select>
        </label>
        <button type="button" className="mt-3 h-9 w-full rounded-md bg-primary text-xs font-bold text-white">
          Compare
        </button>
        <div className="mt-3 rounded-md border border-border bg-slate-50 p-3 text-xs text-text-muted">
          Differences shown in graph overlay and parameter deltas for {versionA || 'Version A'} versus {versionB || 'Version B'}.
        </div>
      </Card>
    </div>
  );
}

export function AnalysisSessionPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const session = getAnalysisSession(analysisId);

  if (session) {
    return <Navigate to={quickWorkspacePath(session)} replace />;
  }

  return <Navigate to={`/workspace/xrd?mode=quick&sessionId=${encodeURIComponent(analysisId ?? 'ANL-QUICK')}`} replace />;
}

export function ProjectEvidenceRegistry() {
  const { projectId } = useParams<{ projectId: string }>();
  const [entries, setEntries] = React.useState(() => getProjectEvidenceEntries(projectId));
  const sessions = getAnalysisSessions();
  const normalizedProjectId = normalizeRegistryProjectId(projectId) ?? projectId;
  const registryProject = normalizedProjectId ? getRegistryProject(normalizedProjectId) : null;
  const projectName =
    registryProject?.title ||
    PROJECT_OPTIONS.find((project) => project.id === normalizedProjectId)?.name ||
    sessions.find((session) => session.projectId === normalizedProjectId)?.projectName ||
    'Project not found';
  const linked = entries[0];
  const linkedWorkspacePath = linked?.sourceAnalysisId.startsWith('registry-')
    ? `/workspace/${linked.technique}?project=${linked.projectId}`
    : linked
      ? `/analysis/session/${linked.sourceAnalysisId}`
      : '/analysis';

  React.useEffect(() => {
    setEntries(getProjectEvidenceEntries(projectId));
  }, [projectId]);

  return (
    <DashboardLayout>
      <div className="h-full overflow-y-auto bg-slate-50">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Project</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-text-main">{projectName}</h1>
            </div>
            <Link to="/analysis" className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-xs font-bold text-text-main hover:bg-surface-hover">
              <History size={14} /> All Analysis History
            </Link>
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-white p-1">
            {['Overview', 'Evidence Registry', 'Analysis', 'Notebook', 'Agent & Gaps', 'Reports'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  'shrink-0 rounded-md px-3 py-2 text-xs font-bold',
                  tab === 'Evidence Registry' ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-hover hover:text-text-main',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card className="rounded-lg bg-white">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-lg font-bold text-text-main">Evidence Registry</h2>
                <p className="mt-1 text-xs text-text-muted">Attached analysis sessions appear here without leaving All Analysis History.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-xs">
                  <thead className="border-b border-border bg-slate-50 text-[10px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="px-4 py-2 font-bold">Technique</th>
                      <th className="px-4 py-2 font-bold">Title / Dataset</th>
                      <th className="px-4 py-2 font-bold">Source</th>
                      <th className="px-4 py-2 font-bold">Attached On</th>
                      <th className="px-4 py-2 font-bold">Owner</th>
                      <th className="px-4 py-2 font-bold">Status</th>
                      <th className="px-4 py-2 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entries.map((entry) => (
                      <tr key={entry.evidenceId} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold uppercase', techniqueClass(entry.technique))}>
                            {techniqueLabel(entry.technique)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-text-main">{entry.fileName}</p>
                          <p className="mt-1 text-[11px] text-text-muted">{entry.interpretationSummary}</p>
                        </td>
                        <td className="px-4 py-3 text-text-muted">{entry.source}</td>
                        <td className="px-4 py-3 text-text-muted">{entry.attachedAt}</td>
                        <td className="px-4 py-3 text-text-main">{entry.owner}</td>
                        <td className="px-4 py-3">
                          <span className={cn('rounded border px-2 py-0.5 text-[10px] font-bold uppercase', statusClass(entry.status))}>
                            {getStatusLabel(entry.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <HistoryActionLink
                              to={entry.sourceAnalysisId.startsWith('registry-')
                                ? `/workspace/${entry.technique}?project=${entry.projectId}`
                                : `/analysis/session/${entry.sourceAnalysisId}`}
                            >
                              Open in Analysis Workspace
                            </HistoryActionLink>
                            <HistoryActionLink
                              to={entry.sourceAnalysisId.startsWith('registry-')
                                ? `/workspace/${entry.technique}?project=${entry.projectId}`
                                : `/analysis/session/${entry.sourceAnalysisId}?tab=features`}
                            >
                              View Evidence
                            </HistoryActionLink>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="rounded-lg bg-white p-4">
              <h2 className="text-sm font-bold text-text-main">Linked Session</h2>
              <p className="mt-1 text-xl font-bold text-primary">{linked?.sourceAnalysisId || 'No linked session'}</p>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                This panel keeps the Analysis Workspace session reachable from project context.
              </p>
              <div className="mt-4 grid gap-2">
                {[
                  ['Open in Analysis Workspace', linkedWorkspacePath],
                  ['View Evidence', linked?.sourceAnalysisId.startsWith('registry-') ? linkedWorkspacePath : linked ? `/analysis/session/${linked.sourceAnalysisId}?tab=features` : '/analysis'],
                  ['Send to Agent', `/demo/agent?project=${normalizedProjectId}`],
                  ['Notebook', `/notebook?project=${normalizedProjectId}`],
                  ['Export', linked?.sourceAnalysisId.startsWith('registry-') ? `/reports?project=${normalizedProjectId}` : linked ? `/analysis/session/${linked.sourceAnalysisId}/export` : '/analysis'],
                ].map(([label, path]) => (
                  <Link key={label} to={path} className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-white px-3 text-xs font-bold text-text-main hover:bg-surface-hover">
                    {label}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
