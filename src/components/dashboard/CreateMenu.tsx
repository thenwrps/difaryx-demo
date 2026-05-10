import React from 'react';
import { X, FileText, Zap, Upload } from 'lucide-react';

interface CreateMenuProps {
  open: boolean;
  onClose: () => void;
  onSelectOption: (option: 'project' | 'experiment' | 'import') => void;
}

export function CreateMenu({ open, onClose, onSelectOption }: CreateMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-lg border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-text-main">Create New</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => {
              onSelectOption('project');
              onClose();
            }}
            className="w-full text-left rounded-md border border-border bg-background p-4 hover:border-primary/50 hover:bg-surface-hover transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary group-hover:bg-primary/20 transition-colors">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">
                  Project Notebook
                </h3>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  For research projects, R&D campaigns, and analytical jobs with multiple experiments, samples, or files.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectOption('experiment');
              onClose();
            }}
            className="w-full text-left rounded-md border border-border bg-background p-4 hover:border-primary/50 hover:bg-surface-hover transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-cyan/10 p-2 text-cyan group-hover:bg-cyan/20 transition-colors">
                <Zap size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">
                  Quick Experiment
                </h3>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  For a single synthesis, characterization run, R&D trial, or short lab entry.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectOption('import');
              onClose();
            }}
            className="w-full text-left rounded-md border border-border bg-background p-4 hover:border-primary/50 hover:bg-surface-hover transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-amber-500/10 p-2 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                <Upload size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-text-main group-hover:text-primary transition-colors">
                  Import Data Files
                </h3>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  Start from XRD, Raman, FTIR, XPS, CSV, TXT, XY, or DAT files.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
