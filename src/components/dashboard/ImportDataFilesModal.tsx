import React, { useState } from 'react';
import { X, Upload, FileText, Link2, FolderOpen } from 'lucide-react';
import { Button } from '../ui/Button';

interface ImportDataFilesModalProps {
  open: boolean;
  onClose: () => void;
  onAction: (action: 'quick' | 'attach' | 'convert') => void;
}

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

export function ImportDataFilesModal({ open, onClose, onAction }: ImportDataFilesModalProps) {
  const [dragActive, setDragActive] = useState(false);

  if (!open) return null;

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
    // Placeholder - no actual file handling yet
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder - no actual file handling yet
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-lg border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 flex-shrink-0">
          <h2 className="text-base font-semibold text-text-main">Import Data Files</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3 pb-6">
          {/* Description */}
          <p className="text-sm text-text-muted">
            Start from experimental data files and create a quick analysis entry.
          </p>

          {/* Supported File Types */}
          <div>
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

          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed transition-colors ${
              dragActive
                ? 'border-primary bg-primary/10'
                : 'border-border bg-background hover:border-primary/50 hover:bg-surface-hover'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".csv,.txt,.xy,.dat,.xlsx,.xls,.docx,.pdf,.json,.md,.png,.jpg,.jpeg,.tif,.tiff"
              onChange={handleFileInput}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
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

          {/* Actions */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5 uppercase tracking-wider">
              Import Actions
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  onAction('quick');
                  onClose();
                }}
                className="w-full text-left rounded-md border border-border bg-background p-2.5 hover:border-primary/50 hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="rounded-md bg-primary/10 p-1.5 text-primary group-hover:bg-primary/20 transition-colors">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
                      Create Quick Analysis
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted leading-snug">
                      Import files as a standalone analysis entry
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAction('attach');
                  onClose();
                }}
                className="w-full text-left rounded-md border border-border bg-background p-2.5 hover:border-primary/50 hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="rounded-md bg-cyan/10 p-1.5 text-cyan group-hover:bg-cyan/20 transition-colors">
                    <Link2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
                      Attach to Project
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted leading-snug">
                      Add files to an existing project notebook
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAction('convert');
                  onClose();
                }}
                className="w-full text-left rounded-md border border-border bg-background p-2.5 hover:border-primary/50 hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                    <FolderOpen size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
                      Convert to Project Notebook
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted leading-snug">
                      Create a new project notebook from imported files
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-border px-4 py-3 flex justify-end flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
