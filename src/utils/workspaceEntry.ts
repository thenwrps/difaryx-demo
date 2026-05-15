import { Technique } from '../data/demoProjects';

export type WorkspaceMode = 'sample' | 'upload' | 'empty';

export interface WorkspaceEntryState {
  mode: WorkspaceMode;
  hasProject: boolean;
  technique: Technique | null;
}

/**
 * Determines the workspace entry mode based on URL search params
 * Priority:
 * 1. If 'project' param + technique has project data → load project dataset
 * 2. If 'project' param + 'mode=upload' → show upload UI (even if project exists)
 * 3. If 'project' param + 'mode=sample' → load sample dataset
 * 4. If 'mode=sample' → load sample dataset
 * 5. If 'mode=upload' → show upload UI
 * 6. If no params → show empty state
 */
export function getWorkspaceEntryMode(
  searchParams: URLSearchParams,
  technique: string
): WorkspaceEntryState | null {
  const projectParam = searchParams.get('project');
  const modeParam = searchParams.get('mode');

  // Priority 1: Project + existing technique data (no mode param or mode not specified)
  // Return null to use existing project-based behavior
  if (projectParam && !modeParam) {
    return null;
  }

  // Priority 2 & 3: Project + explicit mode (upload or sample)
  // Mode param overrides project data
  if (projectParam && modeParam) {
    let mode: WorkspaceMode = 'empty';
    if (modeParam === 'sample') {
      mode = 'sample';
    } else if (modeParam === 'upload') {
      mode = 'upload';
    }
    return {
      mode,
      hasProject: true,
      technique: technique.toUpperCase() as Technique,
    };
  }

  // Priority 4 & 5: No project, just mode
  let mode: WorkspaceMode = 'empty';
  if (modeParam === 'sample') {
    mode = 'sample';
  } else if (modeParam === 'upload') {
    mode = 'upload';
  }

  return {
    mode,
    hasProject: false,
    technique: technique.toUpperCase() as Technique,
  };
}

/**
 * Get sample dataset name for a technique
 */
export function getSampleDatasetName(technique: string): string {
  const names: Record<string, string> = {
    xrd: 'registry_xrd_reference_sample.xy',
    xps: 'registry_xps_reference_sample.xy',
    ftir: 'registry_ftir_reference_sample.csv',
    raman: 'registry_raman_reference_sample.txt',
  };
  return names[technique.toLowerCase()] || `${technique}_sample_data`;
}
