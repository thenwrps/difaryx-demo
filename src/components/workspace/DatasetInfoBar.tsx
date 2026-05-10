import React from 'react';
import { Database, Upload, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Technique } from '../../data/demoProjects';

interface DatasetInfoBarProps {
  technique: Technique;
  source: 'sample' | 'upload' | 'project';
  datasetName: string;
  projectName?: string;
}

export function DatasetInfoBar({ technique, source, datasetName, projectName }: DatasetInfoBarProps) {
  const sourceConfig = {
    sample: {
      icon: Database,
      label: 'Sample',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      iconColor: 'text-blue-600',
    },
    upload: {
      icon: Upload,
      label: 'Upload',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-900',
      iconColor: 'text-purple-600',
    },
    project: {
      icon: FileText,
      label: 'Project',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-900',
      iconColor: 'text-gray-600',
    },
  };

  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <div className={`w-full ${config.bgColor} ${config.borderColor} border-b`}>
      <div className="px-4 py-1.5 flex items-center justify-between gap-3 min-h-0">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <Icon size={14} className={`${config.iconColor} shrink-0`} />
          <span className={`text-[11px] font-bold ${config.textColor} shrink-0`}>
            {config.label}
          </span>
          <span className={`text-[11px] ${config.textColor} opacity-40 shrink-0`}>·</span>
          {projectName && (
            <>
              <span className={`text-[11px] font-semibold ${config.textColor} truncate max-w-[120px]`}>
                {projectName}
              </span>
              <span className={`text-[11px] ${config.textColor} opacity-40 shrink-0`}>/</span>
            </>
          )}
          <span className={`text-[11px] font-semibold ${config.textColor} truncate max-w-[160px]`}>
            {datasetName}
          </span>
          <span className={`text-[11px] ${config.textColor} opacity-40 shrink-0`}>·</span>
          <span className={`text-[11px] font-medium ${config.textColor} opacity-75 shrink-0`}>
            {technique}
          </span>
        </div>
        
        <Link
          to="/workspace"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${config.borderColor} bg-white hover:bg-gray-50 transition-colors text-[11px] font-medium ${config.textColor} shrink-0`}
        >
          <ArrowLeft size={12} />
          Change Technique
        </Link>
      </div>
    </div>
  );
}
