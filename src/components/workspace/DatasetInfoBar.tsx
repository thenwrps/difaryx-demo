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
      label: 'Sample Dataset',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      iconColor: 'text-blue-600',
    },
    upload: {
      icon: Upload,
      label: 'Uploaded Dataset',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-900',
      iconColor: 'text-purple-600',
    },
    project: {
      icon: FileText,
      label: 'Project Dataset',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      textColor: 'text-gray-900',
      iconColor: 'text-gray-600',
    },
  };

  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <div className={`w-full ${config.bgColor} ${config.borderColor} border-b shadow-sm`}>
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon size={18} className={config.iconColor} />
          <span className={`text-sm font-bold ${config.textColor}`}>
            {config.label}
          </span>
          <span className={`text-sm ${config.textColor} opacity-50`}>•</span>
          {projectName && (
            <>
              <span className={`text-sm font-semibold ${config.textColor}`}>
                {projectName}
              </span>
              <span className={`text-sm ${config.textColor} opacity-50`}>/</span>
            </>
          )}
          <span className={`text-sm font-semibold ${config.textColor}`}>
            {datasetName}
          </span>
          <span className={`text-sm ${config.textColor} opacity-50`}>•</span>
          <span className={`text-sm font-medium ${config.textColor} opacity-75`}>
            {technique}
          </span>
        </div>
        
        <Link
          to="/workspace"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${config.borderColor} bg-white hover:bg-gray-50 transition-colors text-sm font-medium ${config.textColor}`}
        >
          <ArrowLeft size={14} />
          Change Technique
        </Link>
      </div>
    </div>
  );
}
