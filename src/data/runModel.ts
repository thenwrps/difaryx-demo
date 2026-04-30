export interface AgentRun {
  id: string;
  projectId: string;
  createdAt: string;
  mission: string;
  outputs: {
    phase: string;
    confidence: number;
    confidenceLabel: string;
    evidence: string[];
    interpretation: string;
    caveats: string[];
    recommendations: string[];
    detectedPeaks?: Array<{
      position: number;
      intensity: number;
      label: string;
    }>;
    selectedDatasets: string[];
  };
}

const RUNS_KEY = 'difaryx_runs';

export function saveRun(run: AgentRun): void {
  const runs = getAllRuns();
  const existingIndex = runs.findIndex((r) => r.id === run.id);
  
  if (existingIndex >= 0) {
    runs[existingIndex] = run;
  } else {
    runs.push(run);
  }
  
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

export function getRun(runId: string): AgentRun | null {
  const runs = getAllRuns();
  return runs.find((r) => r.id === runId) ?? null;
}

export function getAllRuns(): AgentRun[] {
  try {
    const stored = localStorage.getItem(RUNS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getRunsByProject(projectId: string): AgentRun[] {
  return getAllRuns().filter((r) => r.projectId === projectId);
}

export function deleteRun(runId: string): void {
  const runs = getAllRuns().filter((r) => r.id !== runId);
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

export function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
