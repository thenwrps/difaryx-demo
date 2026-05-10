import React, { useState } from 'react';
import { X, FileText, Beaker, ClipboardCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export type NotebookMode = 'research' | 'rd' | 'analytical';

interface ProjectNotebookModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    objective: string;
    mode: NotebookMode;
    setupFields?: {
      scientificQuestion?: string;
      sampleSystem?: string;
      plannedTechniques?: string;
      targetKpi?: string;
      successCriteria?: string;
      decisionNeeded?: string;
      sampleSubmitted?: string;
      methodSop?: string;
      qaqcRequirement?: string;
    };
  }) => void;
}

const MODE_CONFIG = {
  research: {
    label: 'Research',
    icon: FileText,
    description: 'For thesis, manuscript, characterization studies, and scientific evidence interpretation.',
    sections: [
      'Research Overview',
      'Study Design',
      'Experiment Log',
      'Samples & Synthesis',
      'Characterization Data',
      'Evidence Interpretation',
      'Literature Comparison',
      'Results & Discussion',
      'Limitations & Validation',
      'Manuscript / Report',
    ],
    buttonLabel: 'Create Research Notebook',
  },
  rd: {
    label: 'R&D',
    icon: Beaker,
    description: 'For formulation, process development, KPI comparison, risk review, and go/no-go decisions.',
    sections: [
      'R&D Project Brief',
      'Target Specification / KPI',
      'Experiment Matrix',
      'Batch & Formulation Log',
      'Process Conditions',
      'Test Results',
      'KPI Comparison',
      'Risk & Failure Analysis',
      'Decision & Next Iteration',
      'R&D Memo / Technical Report',
    ],
    buttonLabel: 'Create R&D Notebook',
  },
  analytical: {
    label: 'Analytical Job',
    icon: ClipboardCheck,
    description: 'For QA/QC analysis, method/SOP workflows, validated results, and analytical reports.',
    sections: [
      'Job Overview',
      'Sample Submission',
      'Method / SOP',
      'QA/QC Checklist',
      'Analytical Runs',
      'Data Files',
      'Result Validation',
      'Specification / Standard Comparison',
      'Review & Approval',
      'Analytical Report',
    ],
    buttonLabel: 'Create Analytical Job Notebook',
  },
};

export function ProjectNotebookModal({ open, onClose, onCreate }: ProjectNotebookModalProps) {
  const [selectedMode, setSelectedMode] = useState<NotebookMode | null>(null);
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  
  // Research fields
  const [scientificQuestion, setScientificQuestion] = useState('');
  const [sampleSystem, setSampleSystem] = useState('');
  const [plannedTechniques, setPlannedTechniques] = useState('');
  
  // R&D fields
  const [targetKpi, setTargetKpi] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [decisionNeeded, setDecisionNeeded] = useState('');
  
  // Analytical Job fields
  const [sampleSubmitted, setSampleSubmitted] = useState('');
  const [methodSop, setMethodSop] = useState('');
  const [qaqcRequirement, setQaqcRequirement] = useState('');

  if (!open) return null;

  const handleCreate = () => {
    if (!selectedMode || !title.trim() || !objective.trim()) return;

    const setupFields: any = {};
    
    if (selectedMode === 'research') {
      if (scientificQuestion) setupFields.scientificQuestion = scientificQuestion.trim();
      if (sampleSystem) setupFields.sampleSystem = sampleSystem.trim();
      if (plannedTechniques) setupFields.plannedTechniques = plannedTechniques.trim();
    } else if (selectedMode === 'rd') {
      if (targetKpi) setupFields.targetKpi = targetKpi.trim();
      if (successCriteria) setupFields.successCriteria = successCriteria.trim();
      if (decisionNeeded) setupFields.decisionNeeded = decisionNeeded.trim();
    } else if (selectedMode === 'analytical') {
      if (sampleSubmitted) setupFields.sampleSubmitted = sampleSubmitted.trim();
      if (methodSop) setupFields.methodSop = methodSop.trim();
      if (qaqcRequirement) setupFields.qaqcRequirement = qaqcRequirement.trim();
    }

    onCreate({
      title: title.trim(),
      objective: objective.trim(),
      mode: selectedMode,
      setupFields: Object.keys(setupFields).length > 0 ? setupFields : undefined,
    });

    // Reset form
    setSelectedMode(null);
    setTitle('');
    setObjective('');
    setScientificQuestion('');
    setSampleSystem('');
    setPlannedTechniques('');
    setTargetKpi('');
    setSuccessCriteria('');
    setDecisionNeeded('');
    setSampleSubmitted('');
    setMethodSop('');
    setQaqcRequirement('');
  };

  const handleClose = () => {
    setSelectedMode(null);
    setTitle('');
    setObjective('');
    setScientificQuestion('');
    setSampleSystem('');
    setPlannedTechniques('');
    setTargetKpi('');
    setSuccessCriteria('');
    setDecisionNeeded('');
    setSampleSubmitted('');
    setMethodSop('');
    setQaqcRequirement('');
    onClose();
  };

  const config = selectedMode ? MODE_CONFIG[selectedMode] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 flex-shrink-0">
          <h2 className="text-base font-semibold text-text-main">Create Project Notebook</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3 pb-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5 uppercase tracking-wider">
              Select Workflow Mode
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(MODE_CONFIG) as [NotebookMode, typeof MODE_CONFIG.research][]).map(([mode, modeConfig]) => {
                const Icon = modeConfig.icon;
                const isSelected = selectedMode === mode;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedMode(mode)}
                    className={`w-full text-left rounded-md border p-2 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`rounded-md p-1.5 transition-colors ${
                        isSelected ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-semibold transition-colors ${
                          isSelected ? 'text-primary' : 'text-text-main'
                        }`}>
                          {modeConfig.label}
                        </h3>
                        <p className="mt-0.5 text-xs text-text-muted leading-snug line-clamp-2">
                          {modeConfig.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Details */}
          {selectedMode && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-text-main mb-2 uppercase tracking-wider">Project Details</h3>
                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="project-title" className="block text-xs font-semibold text-text-main mb-1">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="project-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter project title"
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="project-objective" className="block text-xs font-semibold text-text-main mb-1">
                      Objective / Purpose <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="project-objective"
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      placeholder="Describe the project objective or purpose"
                      rows={2}
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Mode-Specific Setup Fields */}
              <div>
                <h3 className="text-xs font-semibold text-text-main mb-2 uppercase tracking-wider">Initial Setup (Optional)</h3>
                <div className="space-y-2.5">
                  {selectedMode === 'research' && (
                    <>
                      <div>
                        <label htmlFor="scientific-question" className="block text-xs font-medium text-text-main mb-1">
                          Scientific Question
                        </label>
                        <input
                          id="scientific-question"
                          type="text"
                          value={scientificQuestion}
                          onChange={(e) => setScientificQuestion(e.target.value)}
                          placeholder="What scientific question are you investigating?"
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="sample-system" className="block text-xs font-medium text-text-main mb-1">
                          Sample System
                        </label>
                        <input
                          id="sample-system"
                          type="text"
                          value={sampleSystem}
                          onChange={(e) => setSampleSystem(e.target.value)}
                          placeholder="Material system or sample type"
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="planned-techniques" className="block text-xs font-medium text-text-main mb-1">
                          Planned Techniques
                        </label>
                        <input
                          id="planned-techniques"
                          type="text"
                          value={plannedTechniques}
                          onChange={(e) => setPlannedTechniques(e.target.value)}
                          placeholder="XRD, Raman, FTIR, XPS, etc."
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </>
                  )}

                  {selectedMode === 'rd' && (
                    <>
                      <div>
                        <label htmlFor="target-kpi" className="block text-xs font-medium text-text-main mb-1">
                          Target KPI
                        </label>
                        <input
                          id="target-kpi"
                          type="text"
                          value={targetKpi}
                          onChange={(e) => setTargetKpi(e.target.value)}
                          placeholder="Key performance indicator or target metric"
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="success-criteria" className="block text-xs font-medium text-text-main mb-1">
                          Success Criteria
                        </label>
                        <input
                          id="success-criteria"
                          type="text"
                          value={successCriteria}
                          onChange={(e) => setSuccessCriteria(e.target.value)}
                          placeholder="What defines success for this project?"
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="decision-needed" className="block text-xs font-medium text-text-main mb-1">
                          Decision Needed
                        </label>
                        <input
                          id="decision-needed"
                          type="text"
                          value={decisionNeeded}
                          onChange={(e) => setDecisionNeeded(e.target.value)}
                          placeholder="Go/no-go, formulation choice, etc."
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </>
                  )}

                  {selectedMode === 'analytical' && (
                    <>
                      <div>
                        <label htmlFor="sample-submitted" className="block text-xs font-medium text-text-main mb-1">
                          Sample Submitted
                        </label>
                        <input
                          id="sample-submitted"
                          type="text"
                          value={sampleSubmitted}
                          onChange={(e) => setSampleSubmitted(e.target.value)}
                          placeholder="Sample ID or description"
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="method-sop" className="block text-xs font-medium text-text-main mb-1">
                          Method / SOP
                        </label>
                        <input
                          id="method-sop"
                          type="text"
                          value={methodSop}
                          onChange={(e) => setMethodSop(e.target.value)}
                          placeholder="Standard operating procedure or method"
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="qaqc-requirement" className="block text-xs font-medium text-text-main mb-1">
                          QA/QC Requirement
                        </label>
                        <input
                          id="qaqc-requirement"
                          type="text"
                          value={qaqcRequirement}
                          onChange={(e) => setQaqcRequirement(e.target.value)}
                          placeholder="Quality assurance requirements"
                          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-text-main placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notebook Sections Preview */}
              <div className="rounded-md border border-border bg-background p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-semibold text-text-main">Notebook Sections</h4>
                  <span className="text-xs text-text-muted">{config!.sections.length} sections</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {config!.sections.map((section) => (
                    <span
                      key={section}
                      className="text-[10px] font-medium text-text-muted bg-surface border border-border rounded px-1.5 py-0.5"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-border bg-surface px-4 py-3 flex justify-end gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={!selectedMode || !title.trim() || !objective.trim()}
          >
            {config?.buttonLabel || 'Create Notebook'}
          </Button>
        </div>
      </div>
    </div>
  );
}
