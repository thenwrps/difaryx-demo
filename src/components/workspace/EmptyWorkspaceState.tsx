import React from 'react';
import { Database, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Technique } from '../../data/demoProjects';

interface EmptyWorkspaceStateProps {
  technique: Technique;
  onLoadSample: () => void;
  onUploadDataset: () => void;
}

export function EmptyWorkspaceState({
  technique,
  onLoadSample,
  onUploadDataset,
}: EmptyWorkspaceStateProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface">
            <Database size={32} className="text-text-muted" />
          </div>
          <h2 className="text-xl font-bold text-text-main">No Dataset Loaded</h2>
          <p className="mt-2 text-sm text-text-muted">
            Load a sample dataset or upload your own {technique} data to begin analysis
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full gap-2"
            onClick={onLoadSample}
          >
            <Database size={16} />
            Load Sample Dataset
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onUploadDataset}
          >
            <Upload size={16} />
            Upload Dataset
          </Button>
        </div>

        <p className="mt-6 text-xs text-text-muted">
          Supported formats: CSV, TXT, XY
        </p>
      </Card>
    </div>
  );
}
