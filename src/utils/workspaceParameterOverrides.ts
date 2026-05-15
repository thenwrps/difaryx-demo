import type { Technique } from '../data/demoProjects';
import type { TechniqueParameterValue, TechniqueWorkspaceId } from '../data/techniqueWorkspaceContent';
import type { ParameterGroupId } from './projectEvidence';
import type { WorkspaceParameters } from './agentContext';

export type ParameterOverrideValue = TechniqueParameterValue | string;
export type ParameterOverrideMap = Record<string, ParameterOverrideValue>;

const STORAGE_PREFIX = 'difaryx-workspace-parameter-overrides:v1';

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeTechniqueKey(technique: Technique | TechniqueWorkspaceId | ParameterGroupId): TechniqueWorkspaceId | null {
  const value = String(technique).toLowerCase();
  if (value === 'xrd' || value === 'xps' || value === 'ftir' || value === 'raman') return value;
  return null;
}

export function getParameterOverrideStorageKey(projectId: string, technique: Technique | TechniqueWorkspaceId | ParameterGroupId) {
  const techniqueKey = normalizeTechniqueKey(technique);
  return techniqueKey ? `${STORAGE_PREFIX}:${projectId}:${techniqueKey}` : null;
}

export function readTechniqueParameterOverrides(
  projectId: string,
  technique: Technique | TechniqueWorkspaceId | ParameterGroupId,
): ParameterOverrideMap {
  const key = getParameterOverrideStorageKey(projectId, technique);
  if (!key || !canUseLocalStorage()) return {};

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function writeTechniqueParameterOverrides(
  projectId: string,
  technique: Technique | TechniqueWorkspaceId | ParameterGroupId,
  overrides: ParameterOverrideMap,
) {
  const key = getParameterOverrideStorageKey(projectId, technique);
  if (!key || !canUseLocalStorage()) return;

  const cleaned = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined && value !== ''),
  );

  if (Object.keys(cleaned).length === 0) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(cleaned));
}

export function clearTechniqueParameterOverrides(projectId: string, technique: Technique | TechniqueWorkspaceId | ParameterGroupId) {
  const key = getParameterOverrideStorageKey(projectId, technique);
  if (!key || !canUseLocalStorage()) return;
  window.localStorage.removeItem(key);
}

export function readProjectWorkspaceParameters(projectId: string, techniques: Technique[]): WorkspaceParameters {
  return techniques.reduce<WorkspaceParameters>((acc, technique) => {
    const overrides = readTechniqueParameterOverrides(projectId, technique);
    if (Object.keys(overrides).length > 0) {
      acc[technique as ParameterGroupId] = Object.fromEntries(
        Object.entries(overrides).map(([key, value]) => [key, String(value)]),
      );
    }
    return acc;
  }, {});
}

export function writeProjectWorkspaceParameters(projectId: string, parameters: WorkspaceParameters) {
  (Object.keys(parameters) as ParameterGroupId[]).forEach((groupId) => {
    const techniqueKey = normalizeTechniqueKey(groupId);
    if (!techniqueKey) return;
    writeTechniqueParameterOverrides(projectId, groupId, parameters[groupId] ?? {});
  });
}

export function clearProjectWorkspaceParameters(projectId: string, techniques: Technique[]) {
  techniques.forEach((technique) => clearTechniqueParameterOverrides(projectId, technique));
}
