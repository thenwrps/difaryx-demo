import React, { useState } from 'react';
import { X, ChevronRight, CheckCircle2, FileText, Beaker, ClipboardCheck, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { NotebookMode, saveProjectNotebook, getLocalProjectNotebooks } from '../../data/demoProjects';

interface ProjectNotebookWizardProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type StepId = 'project' | 'mode' | 'structure' | 'setup-data' | 'review';
type ProjectSource = 'blank' | 'existing' | 'imported';
type DataDestination = 'project' | 'first-row';

interface SetupField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  helperText?: string;
}

const STEPS: Array<{ id: StepId; number: number; label: string }> = [
  { id: 'project', number: 1, label: 'Objective' },
  { id: 'mode', number: 2, label: 'Mode' },
  { id: 'structure', number: 3, label: 'Structure' },
  { id: 'setup-data', number: 4, label: 'Context & Data' },
  { id: 'review', number: 5, label: 'Review' },
];

const MODE_CONFIG = {
  research: {
    label: 'Research',
    icon: FileText,
    description: 'For thesis, manuscript, characterization studies, and scientific evidence interpretation.',
    sections: [
      'Research Objective',
      'Experimental Context',
      'Evidence Workspace',
      'Agent Reasoning',
      'Validation Gap',
      'Next Experiment',
      'Decision Log',
      'Notebook Memory',
      'Report',
    ],
  },
  rd: {
    label: 'R&D',
    icon: Beaker,
    description: 'For formulation, process development, KPI comparison, risk review, and go/no-go decisions.',
    sections: [
      'R&D Objective',
      'R&D Context',
      'Evidence Workspace',
      'Agent Reasoning',
      'Validation Gap',
      'Next Action',
      'Decision Log',
      'Notebook Memory',
      'Report',
    ],
  },
  analytical: {
    label: 'Analytical Job',
    icon: ClipboardCheck,
    description: 'For QA/QC analysis, method/SOP workflows, validated results, and analytical reports.',
    sections: [
      'Analytical Objective',
      'Analytical Context',
      'Evidence Workspace',
      'Agent Reasoning',
      'Validation Gap',
      'Next Action',
      'Decision Log',
      'Notebook Memory',
      'Report',
    ],
  },
};

const SUPPORTED_FILE_TYPES = [
  { label: '.csv', color: 'text-text-muted' },
  { label: '.txt', color: 'text-text-muted' },
  { label: '.xy', color: 'text-text-muted' },
  { label: '.dat', color: 'text-text-muted' },
  { label: '.xlsx', color: 'text-text-muted' },
  { label: '.xls', color: 'text-text-muted' },
  { label: '.docx', color: 'text-text-muted' },
  { label: '.pdf', color: 'text-text-muted' },
  { label: '.json', color: 'text-text-muted' },
  { label: '.md', color: 'text-text-muted' },
  { label: '.png', color: 'text-text-muted' },
  { label: '.jpg', color: 'text-text-muted' },
  { label: '.jpeg', color: 'text-text-muted' },
  { label: '.tif', color: 'text-text-muted' },
  { label: '.tiff', color: 'text-text-muted' },
];

const DATA_FIELDS: Record<NotebookMode, SetupField[]> = {
  research: [
    { key: 'projectDescription', label: 'Project / Study Description', placeholder: 'Describe the research project or study', required: true },
    { key: 'scientificQuestion', label: 'Scientific Question', placeholder: 'What scientific question are you investigating?', required: false, helperText: 'Optional at setup. You can start with a project description and refine the scientific question later.' },
    { key: 'hypothesis', label: 'Hypothesis', placeholder: 'Working hypothesis or expected outcome', required: false },
    { key: 'sampleSystem', label: 'Sample System', placeholder: 'Material system or sample type', required: true },
    { key: 'plannedTechniques', label: 'Planned Techniques', placeholder: 'XRD, Raman, FTIR, XPS, etc.', required: false },
    { key: 'expectedEvidence', label: 'Expected Evidence', placeholder: 'What evidence do you expect to collect?', required: false },
    { key: 'validationBoundary', label: 'Validation Boundary', placeholder: 'Known limitations or validation requirements', required: false },
    { key: 'publicationTarget', label: 'Publication / Thesis Target', placeholder: 'Target journal, conference, or thesis', required: false },
  ],
  rd: [
    { key: 'projectDescription', label: 'Project / Development Description', placeholder: 'Describe the R&D project or development effort', required: true },
    { key: 'productGoal', label: 'Product / Process Goal', placeholder: 'What product or process are you developing?', required: true },
    { key: 'targetKpi', label: 'Target KPI', placeholder: 'Key performance indicator or target metric', required: false },
    { key: 'successCriteria', label: 'Success Criteria', placeholder: 'What defines success for this project?', required: false },
    { key: 'materialSystem', label: 'Material / Formulation System', placeholder: 'Material or formulation being developed', required: false },
    { key: 'decisionNeeded', label: 'Decision Needed', placeholder: 'Go/no-go, formulation choice, etc.', required: false },
    { key: 'riskLevel', label: 'Risk Level', placeholder: 'Technical risk or uncertainty level', required: false },
    { key: 'nextMilestone', label: 'Next Milestone', placeholder: 'Next development milestone or decision point', required: false },
  ],
  analytical: [
    { key: 'jobDescription', label: 'Job / Request Description', placeholder: 'Describe the analytical job or request', required: true },
    { key: 'sampleSubmitted', label: 'Sample Submitted', placeholder: 'Sample ID or description', required: true },
    { key: 'analysisPurpose', label: 'Analysis Purpose', placeholder: 'Purpose of this analysis', required: false },
    { key: 'methodSop', label: 'Method / SOP', placeholder: 'Standard operating procedure or method', required: false },
    { key: 'specification', label: 'Specification / Standard', placeholder: 'Specification or standard to meet', required: false },
    { key: 'acceptanceCriteria', label: 'Acceptance Criteria', placeholder: 'Criteria for acceptance or rejection', required: false },
    { key: 'qaqcRequirement', label: 'QA/QC Requirement', placeholder: 'Quality assurance requirements', required: false },
    { key: 'reportType', label: 'Report Type', placeholder: 'Certificate of analysis, test report, etc.', required: false },
    { key: 'dueDate', label: 'Due Date / Priority', placeholder: 'Due date or priority level', required: false },
  ],
};

export function ProjectNotebookWizard({ open, onClose, onCreated }: ProjectNotebookWizardProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('project');
  
  // Project step
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [projectSource, setProjectSource] = useState<ProjectSource>('blank');
  
  // Mode step
  const [selectedMode, setSelectedMode] = useState<NotebookMode | null>(null);
  
  // Data step
  const [dataFields, setDataFields] = useState<Record<string, string>>({});
  
  // Import data step
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dataSkipped, setDataSkipped] = useState(false);
  const [dataDestination, setDataDestination] = useState<DataDestination>('project');
  const [dragActive, setDragActive] = useState(false);
  
  // Step 4 internal navigation
  const [step4Section, setStep4Section] = useState<'setup' | 'import'>('setup');

  if (!open) return null;

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const config = selectedMode ? MODE_CONFIG[selectedMode] : null;
  const fields = selectedMode ? DATA_FIELDS[selectedMode] : [];

  const canProceedFromProject = title.trim() && objective.trim();
  const canProceedFromMode = selectedMode !== null;
  const canProceedFromStructure = true; // Structure is informational
  const canProceedFromSetupData = selectedMode && fields
    .filter(f => f.required)
    .every(f => dataFields[f.key]?.trim());

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleCreate = () => {
    if (!selectedMode || !title.trim() || !objective.trim()) return;

    const setupFields: any = {};
    Object.entries(dataFields).forEach(([key, value]) => {
      if (value.trim()) {
        setupFields[key] = value.trim();
      }
    });

    const initialDataImport = {
      skipped: dataSkipped,
      files: selectedFiles.map(file => ({
        name: file.name,
        type: file.type || 'unknown',
        status: 'pending-parse' as const,
      })),
      destination: dataDestination,
    };

    saveProjectNotebook({
      title: title.trim(),
      objective: objective.trim(),
      mode: selectedMode,
      setupFields: Object.keys(setupFields).length > 0 ? setupFields : undefined,
      initialDataImport: dataSkipped || selectedFiles.length > 0 ? initialDataImport : undefined,
    });

    onCreated();
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep('project');
    setTitle('');
    setObjective('');
    setProjectSource('blank');
    setSelectedMode(null);
    setDataFields({});
    setSelectedFiles([]);
    setDataSkipped(false);
    setDataDestination('project');
    setDragActive(false);
    setStep4Section('setup');
    onClose();
  };

  const updateDataField = (key: string, value: string) => {
    setDataFields(prev => ({ ...prev, [key]: value }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...files]);
      setDataSkipped(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      setDataSkipped(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg border border-border bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-text-main">DIFARYX SCIENTIFIC WORKFLOW SETUP</h2>
            <p className="text-sm text-text-muted mt-0.5">Create Notebook Memory</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="border-b border-border px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;
              const isAccessible = index <= currentStepIndex;

              return (
                <React.Fragment key={step.id}>
                  <button
                    type="button"
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                    disabled={!isAccessible}
                    className={`flex items-center gap-2 transition-colors ${
                      isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                        isCompleted
                          ? 'border-primary bg-primary text-white'
                          : isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-text-muted'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-sm font-semibold">{step.number}</span>}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-primary' : isCompleted ? 'text-text-main' : 'text-text-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <ChevronRight size={16} className="text-text-dim flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Project */}
          {currentStep === 'project' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-text-main mb-3">Research Objective</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-text-main mb-1.5">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter project title"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="objective" className="block text-sm font-semibold text-text-main mb-1.5">
                      Objective / Purpose <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="objective"
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      placeholder="Describe the project objective or purpose"
                      rows={3}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  Optional Source
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'blank' as ProjectSource, label: 'Blank notebook' },
                    { id: 'existing' as ProjectSource, label: 'From existing experiment' },
                    { id: 'imported' as ProjectSource, label: 'From imported data' },
                  ].map((source) => (
                    <button
                      key={source.id}
                      type="button"
                      onClick={() => setProjectSource(source.id)}
                      className={`rounded-md border p-3 text-sm transition-colors ${
                        projectSource === source.id
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border bg-background text-text-main hover:border-primary/50'
                      }`}
                    >
                      {source.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Mode */}
          {currentStep === 'mode' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-text-main mb-3">Select Workflow Mode</h3>
              <div className="grid grid-cols-1 gap-3">
                {(Object.entries(MODE_CONFIG) as [NotebookMode, typeof MODE_CONFIG.research][]).map(([mode, modeConfig]) => {
                  const Icon = modeConfig.icon;
                  const isSelected = selectedMode === mode;

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedMode(mode)}
                      className={`w-full text-left rounded-md border p-4 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-primary/50 hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-md p-2 transition-colors ${
                          isSelected ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-base font-semibold transition-colors ${
                            isSelected ? 'text-primary' : 'text-text-main'
                          }`}>
                            {modeConfig.label}
                          </h3>
                          <p className="mt-1 text-sm text-text-muted leading-relaxed">
                            {modeConfig.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Structure */}
          {currentStep === 'structure' && config && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-text-main mb-2">Generated Notebook Structure</h3>
                <p className="text-sm text-text-muted mb-4">
                  {config.sections.length} sections will be generated for your {config.label} notebook.
                </p>
              </div>

              <div className="rounded-md border border-border bg-background p-4">
                <div className="grid grid-cols-1 gap-2">
                  {config.sections.map((section, index) => (
                    <div
                      key={section}
                      className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-text-main">{section}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Setup & Data */}
          {currentStep === 'setup-data' && selectedMode && (
            <div className="space-y-4">
              {/* Internal Navigation */}
              <div className="flex gap-2 border-b border-border pb-3">
                <button
                  type="button"
                  onClick={() => setStep4Section('setup')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    step4Section === 'setup'
                      ? 'bg-primary/10 text-primary border border-primary'
                      : 'bg-background text-text-muted border border-border hover:border-primary/50 hover:text-text-main'
                  }`}
                >
                  Context Setup
                </button>
                <button
                  type="button"
                  onClick={() => setStep4Section('import')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    step4Section === 'import'
                      ? 'bg-primary/10 text-primary border border-primary'
                      : 'bg-background text-text-muted border border-border hover:border-primary/50 hover:text-text-main'
                  }`}
                >
                  Evidence Data
                </button>
              </div>

              {/* Initial Setup Section */}
              {step4Section === 'setup' && (
                <div>
                  <h3 className="text-base font-semibold text-text-main mb-2">
                    {selectedMode === 'research' ? 'Experimental Context' : 
                     selectedMode === 'rd' ? 'R&D Context' : 
                     'Analytical Context'}
                  </h3>
                  <p className="text-sm text-text-muted mb-4">
                    Provide initial setup information for your {config?.label} notebook.
                  </p>

                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.key}>
                        <label htmlFor={field.key} className="block text-sm font-semibold text-text-main mb-1.5">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          id={field.key}
                          type="text"
                          value={dataFields[field.key] || ''}
                          onChange={(e) => updateDataField(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        {field.helperText && (
                          <p className="mt-1 text-xs text-text-dim leading-relaxed">
                            {field.helperText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Data Section */}
              {step4Section === 'import' && (
                <div>
                  <h3 className="text-base font-semibold text-text-main mb-2">Add / Import Data</h3>
                  <p className="text-sm text-text-muted mb-3">
                    Attach initial experimental files now or skip and add them later.
                  </p>

                  {/* Supported File Types */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-text-main mb-1.5 uppercase tracking-wider">
                      Supported File Types
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {SUPPORTED_FILE_TYPES.map((format) => (
                        <span
                          key={format.label}
                          className={`text-xs font-semibold ${format.color} bg-surface border border-border rounded px-2 py-0.5`}
                        >
                          {format.label}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-text-dim leading-relaxed">
                      Typical technique exports: XRD (.xy, .txt, .csv, .dat), Raman (.txt, .csv, .dat), FTIR (.csv, .txt, .dat), XPS (.csv, .txt, .dat).
                    </p>
                  </div>

                  {!dataSkipped && (
                    <>
                      {/* Dropzone */}
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative rounded-lg border-2 border-dashed transition-colors mb-3 ${
                          dragActive
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background hover:border-primary/50 hover:bg-surface-hover'
                        }`}
                      >
                        <input
                          type="file"
                          id="file-upload-wizard"
                          multiple
                          accept=".csv,.txt,.xy,.dat,.xlsx,.xls,.docx,.pdf,.json,.md,.png,.jpg,.jpeg,.tif,.tiff"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload-wizard"
                          className="flex flex-col items-center justify-center py-8 px-4 cursor-pointer"
                        >
                          <Upload size={28} className="text-text-muted mb-2" />
                          <p className="text-sm font-semibold text-text-main mb-0.5">
                            Drop files here or choose files
                          </p>
                          <p className="text-xs text-text-muted">
                            Signal data, spreadsheets, documents, and supporting images are accepted.
                          </p>
                        </label>
                      </div>

                      {/* Selected Files */}
                      {selectedFiles.length > 0 && (
                        <div className="mb-3 rounded-md border border-border bg-background p-3">
                          <h4 className="text-xs font-semibold text-text-main mb-2">Selected Files ({selectedFiles.length})</h4>
                          <div className="space-y-1">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-text-main truncate">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-600 text-xs ml-2"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data Destination */}
                      {selectedFiles.length > 0 && (
                        <div className="mb-3">
                          <label className="block text-sm font-semibold text-text-main mb-2">
                            Data Destination
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setDataDestination('project')}
                              className={`rounded-md border p-2 text-sm transition-colors ${
                                dataDestination === 'project'
                                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                                  : 'border-border bg-background text-text-main hover:border-primary/50'
                              }`}
                            >
                              Project-level data
                            </button>
                            <button
                              type="button"
                              onClick={() => setDataDestination('first-row')}
                              className={`rounded-md border p-2 text-sm transition-colors ${
                                dataDestination === 'first-row'
                                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                                  : 'border-border bg-background text-text-main hover:border-primary/50'
                              }`}
                            >
                              First {selectedMode === 'research' ? 'experiment' : selectedMode === 'rd' ? 'trial' : 'run'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Skip Option */}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setDataSkipped(!dataSkipped);
                        if (!dataSkipped) {
                          setSelectedFiles([]);
                        }
                      }}
                      className={`w-full rounded-md border p-3 text-sm transition-colors ${
                        dataSkipped
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-border bg-background text-text-main hover:border-primary/50'
                      }`}
                    >
                      {dataSkipped ? '✓ ' : ''}Skip data import for now
                    </button>
                    {dataSkipped && (
                      <p className="mt-2 text-xs text-text-muted leading-relaxed">
                        Data import skipped. You can add files later from the notebook workspace.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 'review' && selectedMode && config && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-text-main mb-3">Review & Create</h3>

              <div className="space-y-3">
                <div className="rounded-md border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold text-text-main mb-2">Objective Summary</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-xs font-medium text-text-muted">Title</dt>
                      <dd className="text-sm text-text-main mt-0.5">{title}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-text-muted">Objective</dt>
                      <dd className="text-sm text-text-main mt-0.5">{objective}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-text-muted">Workflow Mode</dt>
                      <dd className="text-sm text-text-main mt-0.5">{config.label}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-md border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold text-text-main mb-2">Structure</h4>
                  <p className="text-sm text-text-muted">{config.sections.length} sections generated</p>
                </div>

                <div className="rounded-md border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold text-text-main mb-2">Context Summary</h4>
                  <dl className="space-y-2">
                    {/* Show description field first if filled */}
                    {(() => {
                      const descriptionKey = selectedMode === 'research' ? 'projectDescription' : 
                                            selectedMode === 'rd' ? 'projectDescription' : 'jobDescription';
                      const descriptionField = fields.find(f => f.key === descriptionKey);
                      const descriptionValue = dataFields[descriptionKey];
                      
                      if (descriptionField && descriptionValue?.trim()) {
                        return (
                          <div>
                            <dt className="text-xs font-medium text-text-muted">{descriptionField.label}</dt>
                            <dd className="text-sm text-text-main mt-0.5">{descriptionValue}</dd>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Show other filled fields */}
                    {fields
                      .filter(f => {
                        const descriptionKey = selectedMode === 'research' ? 'projectDescription' : 
                                              selectedMode === 'rd' ? 'projectDescription' : 'jobDescription';
                        return f.key !== descriptionKey && dataFields[f.key]?.trim();
                      })
                      .map(field => (
                        <div key={field.key}>
                          <dt className="text-xs font-medium text-text-muted">{field.label}</dt>
                          <dd className="text-sm text-text-main mt-0.5">{dataFields[field.key]}</dd>
                        </div>
                      ))}
                  </dl>
                  <p className="text-xs text-primary mt-3 font-semibold">
                    {fields.filter(f => f.required).every(f => dataFields[f.key]?.trim())
                      ? '✓ All required fields completed'
                      : 'Some required fields missing'}
                  </p>
                </div>

                <div className="rounded-md border border-border bg-background p-4">
                  <h4 className="text-sm font-semibold text-text-main mb-2">Evidence Data Status</h4>
                  <p className="text-sm text-text-main">
                    {dataSkipped
                      ? 'No files attached · Data can be added later'
                      : selectedFiles.length > 0
                      ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} attached · Pending parse`
                      : 'No files attached'}
                  </p>
                  {selectedFiles.length > 0 && (
                    <p className="text-xs text-text-muted mt-1">
                      Destination: {dataDestination === 'project' ? 'Project-level data' : `First ${selectedMode === 'research' ? 'experiment' : selectedMode === 'rd' ? 'trial' : 'run'}`}
                    </p>
                  )}
                </div>

                <div className="rounded-md border border-primary bg-primary/5 p-4">
                  <p className="text-sm text-text-main">
                    <span className="font-semibold">Workflow Readiness:</span>{' '}
                    {fields.filter(f => f.required).every(f => dataFields[f.key]?.trim())
                      ? 'Ready for scientific workflow reasoning'
                      : 'Setup required'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex justify-between flex-shrink-0">
          <Button
            variant="secondary"
            onClick={currentStepIndex === 0 ? handleClose : handleBack}
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>

          {currentStep !== 'review' ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={
                (currentStep === 'project' && !canProceedFromProject) ||
                (currentStep === 'mode' && !canProceedFromMode) ||
                (currentStep === 'setup-data' && !canProceedFromSetupData)
              }
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!canProceedFromSetupData}
            >
              {config ? `Create ${config.label} Notebook` : 'Create Notebook'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
