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
          <h2 className="text-xl font-bold text-text-main">Demo Dataset Pending</h2>
          <p className="mt-2 text-sm text-text-muted">
            Load the demo dataset to begin {technique} processing. Connected uploads are available in the beta workflow.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            className="w-full gap-2"
            onClick={onLoadSample}
          >
            <Database size={16} />
            Load Demo Dataset
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={onUploadDataset}
            title="Available in the connected beta workflow."
          >
            <Upload size={16} />
            Upload Dataset
          </Button>
        </div>

        <p className="mt-6 text-xs text-text-muted">
          Supported import formats in the connected beta workflow: CSV, TXT, XY
        </p>
      </Card>
    </div>
  );
}
