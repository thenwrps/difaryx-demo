export interface DatasetRef {
  id: string;
  projectId: string;
  technique: string;
  fileName: string;
  sampleName?: string;
}

export interface Evidence {
  id: string;
  datasetId: string;
  technique: string;
  claim: string;
  evidenceRole?: 'primary' | 'supporting' | 'context';
  support?: string;
  limitations?: string;
}

export interface AgentStep {
  id: string;
  label: string;
  narrativeStage: 'Goal' | 'Plan' | 'Execute' | 'Evidence' | 'Reason' | 'Decision' | 'Report';
  status: 'pending' | 'active' | 'complete' | 'warning' | 'error';
  summary?: string;
  evidenceIds?: string[];
  startedAt?: string;
  completedAt?: string;
}

export interface AgentRun {
  id: string;
  projectId: string;
  goal: string;
  datasets: DatasetRef[];
  steps: AgentStep[];
  evidence: Evidence[];
  decision?: string;
  claimStatus?: 'strongly_supported' | 'supported' | 'partial' | 'inconclusive' | 'contradicted';
  validationState?: 'complete' | 'partial' | 'requires_validation';
  reportStatus?: 'not_started' | 'draft' | 'ready' | 'exported';
  createdAt: string;
  updatedAt?: string;
}
