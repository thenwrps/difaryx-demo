import React, { useState } from 'react';
import { X, Zap, Link2, FileText } from 'lucide-react';
import { Button } from '../ui/Button';

export type ExperimentType = 'research' | 'rd' | 'analytical';
export type ExperimentAttachment = 'standalone' | 'attach';

interface QuickExperimentSetupProps {
  open: boolean;
  onClose: () => void;
  onContinue: (data: {
    type: ExperimentType;
    attachment: ExperimentAttachment;
  }) => void;
}

const EXPERIMENT_TYPES = {
  research: {
    label: 'Research Experiment',
    icon: FileText,
    description: 'For characterization studies, synthesis trials, and scientific investigation.',
  },
  rd: {
    label: 'R&D Trial',
    icon: Zap,
    description: 'For formulation tests, process optimization, and development iterations.',
  },
  analytical: {
    label: 'Analytical Run',
    icon: FileText,
    description: 'For QA/QC analysis, method validation, and routine testing.',
  },
};

export function QuickExperimentSetup({ open, onClose, onContinue }: QuickExperimentSetupProps) {
  const [selectedType, setSelectedType] = useState<ExperimentType>('research');
  const [selectedAttachment, setSelectedAttachment] = useState<ExperimentAttachment>('standalone');

  if (!open) return null;

  const handleContinue = () => {
    onContinue({
      type: selectedType,
      attachment: selectedAttachment,
    });
  };

  const handleClose = () => {
    setSelectedType('research');
    setSelectedAttachment('standalone');
    onClose();
  };

  const typeLabel = EXPERIMENT_TYPES[selectedType].label;
  const continueButtonLabel = `Continue to ${typeLabel} Setup`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleClose}>
      <div
        className="relative w-full max-w-lg rounded-lg border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-text-main">Quick Experiment</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Experiment Type */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              Experiment Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(EXPERIMENT_TYPES) as [ExperimentType, typeof EXPERIMENT_TYPES.research][]).map(([type, config]) => {
                const Icon = config.icon;
                const isSelected = selectedType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`w-full text-left rounded-md border p-3 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-md p-1.5 transition-colors ${
                        isSelected ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-sm font-semibold transition-colors ${
                          isSelected ? 'text-primary' : 'text-text-main'
                        }`}>
                          {config.label}
                        </h3>
                        <p className="mt-0.5 text-xs text-text-muted leading-relaxed">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attachment Option */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              Project Association
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAttachment('standalone')}
                className={`rounded-md border p-3 transition-colors ${
                  selectedAttachment === 'standalone'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-surface-hover'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`rounded-md p-2 transition-colors ${
                    selectedAttachment === 'standalone' ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'
                  }`}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold transition-colors ${
                      selectedAttachment === 'standalone' ? 'text-primary' : 'text-text-main'
                    }`}>
                      Standalone
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Independent entry
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAttachment('attach')}
                className={`rounded-md border p-3 transition-colors ${
                  selectedAttachment === 'attach'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background hover:border-primary/50 hover:bg-surface-hover'
                }`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`rounded-md p-2 transition-colors ${
                    selectedAttachment === 'attach' ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'
                  }`}>
                    <Link2 size={18} />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold transition-colors ${
                      selectedAttachment === 'attach' ? 'text-primary' : 'text-text-main'
                    }`}>
                      Attach to Project
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Link to notebook
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Helper Text */}
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs text-text-muted leading-relaxed">
              This entry can remain standalone or be attached to a notebook project later.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleContinue}>
            {continueButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
