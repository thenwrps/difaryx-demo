import React, { useState, useEffect } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, FileText, Target, Settings, Database, Brain, ListChecks, TrendingUp, Shield, Search, Lock, Unlock, Edit3, ExternalLink } from 'lucide-react';
import type { AgentContext, EvidenceLayer, WorkflowStep, ParameterGroup, BoundaryContext, TraceContext, WorkspaceParameters } from '../../../utils/agentContext';
import type { ValidationGap, NextDecision } from '../../../data/demoProjects';
import type { ParameterGroupId } from '../../../utils/projectEvidence';
import { getProvenanceLabel, getProvenanceStyle } from '../../../utils/projectEvidence';
import type { AgentEvidenceWorkspace } from '../../../utils/agentEvidenceModel';
import type { RegistryProject } from '../../../data/demoProjectRegistry';
import type { RuntimeMode } from '../../../runtime/difaryxRuntimeMode';

// Mode configuration with tab IDs
const AGENT_MODES = {
  deterministic: {
    label: 'Deterministic',
    purpose: 'Controlled reproducible workflow',
    tabs: [
      { id: 'goal', label: 'Goal' },
      { id: 'parameters', label: 'Parameters' },
      { id: 'evidence', label: 'Evidence' },
      { id: 'trace', label: 'Trace' },
      { id: 'boundary', label: 'Boundary' },
    ],
    inputLabel: 'Goal',
    inputPlaceholder: 'Set a controlled goal for this project, such as checking secondary phases, reviewing peak evidence, or validating the claim boundary.',
  },
  guided: {
    label: 'Guided',
    purpose: 'Researcher-agent interpretation',
    tabs: [
      { id: 'question', label: 'Question' },
      { id: 'evidence', label: 'Evidence' },
      { id: 'discussion', label: 'Discussion' },
      { id: 'compare', label: 'Compare' },
      { id: 'notebook', label: 'Notebook' },
    ],
    inputLabel: 'Researcher Question',
    inputPlaceholder: 'Ask the agent to interpret the selected evidence, compare techniques, or refine the scientific claim.',
  },
  autonomous: {
    label: 'Autonomous',
    purpose: 'Agent-led evidence review',
    tabs: [
      { id: 'objective', label: 'Objective' },
      { id: 'plan', label: 'Plan' },
      { id: 'findings', label: 'Findings' },
      { id: 'gaps', label: 'Gaps' },
      { id: 'decision', label: 'Decision' },
    ],
    inputLabel: 'Review Objective',
    inputPlaceholder: 'Define the review objective. The agent will inspect evidence, identify validation gaps, and recommend the next scientific action.',
  },
} as const;

type AgentMode = keyof typeof AGENT_MODES;

interface NormalizedToolTraceEntry {
  id: string;
  toolName: string;
  callType: string;
  argsSummary: string;
  resultSummary: string;
  evidenceImpact: string;
  approvalStatus: string;
  timestamp: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

interface RightPanelProps {
  agentContext: AgentContext;
  mode: AgentMode;
  onSaveToNotebook?: () => void;
  onExportReport?: () => void;
  draftParameters?: WorkspaceParameters;
  onDraftParameterChange?: (groupId: ParameterGroupId, key: string, value: string) => void;
  onApplyParameters?: () => void;
  onResetParameters?: () => void;
  isConditionLocked?: boolean;
  onUnlockConditions?: () => void;
  onLockConditions?: () => void;
  evidenceWorkspace?: AgentEvidenceWorkspace;
  registryProject?: RegistryProject;
  toolTrace?: NormalizedToolTraceEntry[];
  runtimeMode?: RuntimeMode;
}

export function RightPanel({
  agentContext,
  mode,
  onSaveToNotebook,
  onExportReport,
  draftParameters,
  onDraftParameterChange,
  onApplyParameters,
  onResetParameters,
  isConditionLocked,
  onUnlockConditions,
  onLockConditions,
  evidenceWorkspace,
  registryProject,
  toolTrace,
  runtimeMode = 'demo',
}: RightPanelProps) {
  const modeConfig = AGENT_MODES[mode];
  const [activeTab, setActiveTab] = useState<string>(modeConfig.tabs[0].id);

  useEffect(() => {
    const tabs = AGENT_MODES[mode].tabs;
    if (!tabs.some(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [mode, activeTab]);

    return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-slate-900">{modeConfig.label}</div>
            <div className="text-[11px] text-slate-500">{modeConfig.purpose}</div>
          </div>
          {isConditionLocked ? <Lock size={14} className="text-amber-600" /> : <Unlock size={14} className="text-slate-400" />}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {modeConfig.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded px-1.5 py-1.5 text-[10px] font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {mode === 'deterministic' && activeTab === 'goal' && (
          <>
            <InputCard label={modeConfig.inputLabel} placeholder={modeConfig.inputPlaceholder} />
            <ProjectContextCard context={agentContext} registryProject={registryProject} />
          </>
        )}
        {mode === 'deterministic' && activeTab === 'parameters' && (
          <ParametersTabContent
            groups={agentContext.parameterGroups}
            draftParameters={draftParameters}
            onDraftParameterChange={onDraftParameterChange}
            onApplyParameters={onApplyParameters}
            onResetParameters={onResetParameters}
            isConditionLocked={isConditionLocked}
            onUnlockConditions={onUnlockConditions}
            onLockConditions={onLockConditions}
            hasOverrides={agentContext.hasParameterOverrides}
          />
        )}
        {mode === 'deterministic' && activeTab === 'evidence' && (
          evidenceWorkspace ? <EvidenceWorkspaceTabContent workspace={evidenceWorkspace} /> : <EvidenceByTechniqueCard context={agentContext} />
        )}
        {mode === 'deterministic' && activeTab === 'trace' && (
          <>
            <ToolTraceCompact trace={toolTrace ?? []} runtimeMode={runtimeMode} />
            {evidenceWorkspace ? <TraceWorkspaceTabContent workspace={evidenceWorkspace} /> : <TraceTabContent trace={agentContext.traceContext} />}
          </>
        )}
        {mode === 'deterministic' && activeTab === 'boundary' && (
          evidenceWorkspace ? <BoundaryWorkspaceTabContent workspace={evidenceWorkspace} /> : <BoundaryTabContent boundary={agentContext.boundaryContext} />
        )}

        {mode === 'guided' && activeTab === 'question' && (
          <>
            <InputCard label={modeConfig.inputLabel} placeholder={modeConfig.inputPlaceholder} />
            <ProjectContextCard context={agentContext} registryProject={registryProject} />
          </>
        )}
        {mode === 'guided' && activeTab === 'evidence' && <EvidenceByTechniqueCard context={agentContext} />}
        {mode === 'guided' && activeTab === 'discussion' && <DiscussionCard context={agentContext} />}
        {mode === 'guided' && activeTab === 'compare' && <AgentComparePlaceholder />}
        {mode === 'guided' && activeTab === 'notebook' && <NotebookPreviewCard context={agentContext} onSave={onSaveToNotebook} onExport={onExportReport} />}

        {mode === 'autonomous' && activeTab === 'objective' && (
          <>
            <InputCard label={modeConfig.inputLabel} placeholder={modeConfig.inputPlaceholder} />
            <ProjectContextCard context={agentContext} registryProject={registryProject} />
          </>
        )}
        {mode === 'autonomous' && activeTab === 'plan' && <PlanCard steps={agentContext.workflowSteps} />}
        {mode === 'autonomous' && activeTab === 'findings' && (
          <>
            <EvidenceByTechniqueCard context={agentContext} />
            <ClaimBoundaryCard context={agentContext} />
          </>
        )}
        {mode === 'autonomous' && activeTab === 'gaps' && (
          <>
            <ValidationGapsCard context={agentContext} />
            <RecommendedActionsCard context={agentContext} />
          </>
        )}
        {mode === 'autonomous' && activeTab === 'decision' && (
          <>
            <RecommendedActionsCard context={agentContext} />
            <BoundaryTabContent boundary={agentContext.boundaryContext} />
          </>
        )}
      </div>
    </aside>
  );
}

// Shared Cards

function InputCard({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className="block text-xs font-semibold text-slate-700 mb-2">{label}</label>
      <textarea
        className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
        rows={3}
        placeholder={placeholder}
      />
    </div>
  );
}

function ProjectContextCard({
  context,
  registryProject,
}: {
  context: AgentContext;
  registryProject?: RegistryProject;
}) {
  const workflowPath = registryProject?.workflowPath.map((step) => step.replace('-', ' ')).join(' -> ');
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
        <Target size={14} className="text-blue-600" />
        Project Context
      </h3>
      <div className="space-y-1.5 text-xs">
        <Row label="Project" value={registryProject?.title || context.projectTitle} />
        <Row label="Material" value={registryProject?.materialSystem || context.materialSystem} />
        <Row label="Job type" value={registryProject?.jobType || context.jobType} />
        {registryProject && <Row label="Claim status" value={registryProject.statusLabel} />}
        {context.evidenceMode === 'multi-tech' ? (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-600 block mb-1.5">Evidence Layers:</span>
            <div className="space-y-1.5">
              {context.evidenceLayers.map((layer: EvidenceLayer) => (
                <div key={layer.technique} className="flex items-start gap-2">
                  <span className="text-slate-500">-</span>
                  <div className="flex-1">
                    <span className="font-semibold text-slate-900">{layer.technique}</span>
                    <span className="text-slate-600"> - {layer.role}</span>
                    <StatusBadge status={layer.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Row label="Technique" value={context.primaryTechnique} />
        )}
        {context.objective && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-600">Objective:</span>
            <p className="mt-1 text-slate-700">{context.objective}</p>
          </div>
        )}
        {registryProject && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-600">Context:</span>
            <p className="mt-1 text-slate-700">{registryProject.context.experimentalSetup}</p>
            {workflowPath && <p className="mt-1 text-slate-500">{workflowPath}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

interface ParametersTabContentProps {
  groups: ParameterGroup[];
  draftParameters?: WorkspaceParameters;
  onDraftParameterChange?: (groupId: ParameterGroupId, key: string, value: string) => void;
  onApplyParameters?: () => void;
  onResetParameters?: () => void;
  isConditionLocked?: boolean;
  onUnlockConditions?: () => void;
  onLockConditions?: () => void;
  hasOverrides?: boolean;
}

function ParametersTabContent({
  groups,
  draftParameters,
  onDraftParameterChange,
  onApplyParameters,
  onResetParameters,
  isConditionLocked,
  onUnlockConditions,
  onLockConditions,
  hasOverrides,
}: ParametersTabContentProps) {
  const hasDraft = draftParameters && Object.keys(draftParameters).length > 0;
  const canEdit = !isConditionLocked && !!onDraftParameterChange;

  return (
    <>
      {/* Lock status banner */}
      {isConditionLocked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
          <Lock size={14} className="text-amber-700 mt-0.5 shrink-0" />
          <div className="text-xs flex-1">
            <p className="font-semibold text-amber-900">Conditions Locked</p>
            <p className="text-amber-700 mt-0.5">Parameters are read-only. Unlock experiment conditions to edit.</p>
          </div>
          {onUnlockConditions && (
            <button
              onClick={onUnlockConditions}
              className="shrink-0 rounded bg-amber-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-amber-700 transition-colors flex items-center gap-1"
            >
              <Unlock size={12} />
              Unlock
            </button>
          )}
        </div>
      )}

      {/* Unlocked status banner */}
      {!isConditionLocked && onLockConditions && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
          <Unlock size={14} className="text-slate-600 mt-0.5 shrink-0" />
          <div className="text-xs flex-1">
            <p className="font-semibold text-slate-900">Conditions Unlocked</p>
            <p className="text-slate-600 mt-0.5">Parameters are editable. Lock conditions to preserve scientific integrity.</p>
          </div>
          <button
            onClick={onLockConditions}
            className="shrink-0 rounded bg-slate-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-slate-700 transition-colors flex items-center gap-1"
          >
            <Lock size={12} />
            Lock
          </button>
        </div>
      )}

      {/* Override status banner */}
      {hasOverrides && !hasDraft && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2">
          <Edit3 size={14} className="text-blue-700 mt-0.5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-blue-900">Parameters Modified</p>
            <p className="text-blue-700 mt-0.5">User-adjusted parameters are active. Trace, boundary, and notebook reflect these changes.</p>
          </div>
        </div>
      )}

      {/* Parameter groups */}
      {groups.map((group) => {
        const groupDraft = draftParameters?.[group.id] || {};
        const isProjectGroup = group.id === 'project';
        return (
          <div key={group.id} className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
              <Settings size={14} className="text-blue-600" />
              {group.title}
            </h3>
            <div className="space-y-2 text-xs">
              {group.params.map((p) => {
                const draftValue = groupDraft[p.key];
                const displayValue = draftValue !== undefined ? draftValue : p.value;
                const isDrafted = draftValue !== undefined;
                const isEditable = canEdit && p.editable;
                return (
                  <div key={p.key} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-slate-600 font-medium">{p.key}</label>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${getProvenanceStyle(
                          isDrafted ? 'user-adjusted' : p.provenance,
                        )}`}
                      >
                        {getProvenanceLabel(isDrafted ? 'user-adjusted' : p.provenance)}
                      </span>
                    </div>
                    {isEditable ? (
                      <input
                        type="text"
                        value={displayValue}
                        onChange={(e) => onDraftParameterChange!(group.id, p.key, e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={p.value}
                      />
                    ) : (
                      <div className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 font-semibold">
                        {displayValue}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      {canEdit && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApplyParameters}
            disabled={!hasDraft}
            className="flex-1 h-8 px-3 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply Parameters
          </button>
          <button
            type="button"
            onClick={onResetParameters}
            disabled={!hasOverrides && !hasDraft}
            className="flex-1 h-8 px-3 text-xs font-semibold rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </>
  );
}

function EvidenceWorkspaceTabContent({ workspace }: { workspace: AgentEvidenceWorkspace }) {
  const selectedTechniques = workspace.techniques.filter((t) => t.selected);
  const allReferences = workspace.techniques.flatMap((t) => t.requiredReferences);
  const uniqueReferences = allReferences.filter(
    (ref, index, self) => index === self.findIndex((r) => r.type === ref.type && r.label === ref.label)
  );

  return (
    <>
      {/* Evidence Results */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
          <Database size={14} className="text-blue-600" />
          Evidence Results
        </h3>
        <div className="space-y-2">
          {selectedTechniques.map((tech) => (
            <div key={tech.techniqueId} className="text-xs border-l-2 border-blue-200 pl-2">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900">{tech.displayName}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                  {tech.availability}
                </span>
              </div>
              <p className="text-slate-700 mt-0.5 leading-relaxed">{tech.evidenceResult.summary}</p>
              {tech.evidenceResult.extractedFindings.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-slate-600">
                  {tech.evidenceResult.extractedFindings.slice(0, 2).map((finding, i) => (
                    <li key={i}>- {finding}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        {selectedTechniques.length > 1 && (
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-semibold">Cross-tech:</span> {selectedTechniques.length} techniques selected for validation
          </div>
        )}
      </div>

      {/* Research References */}
      {workspace.jobType === 'research' && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
            <BookOpen size={14} className="text-blue-600" />
            Research References
          </h3>
          <div className="space-y-2">
            {uniqueReferences.map((ref, i) => (
              <div key={i} className="text-xs border-l-2 border-slate-200 pl-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">{ref.label}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                      ref.status === 'available'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : ref.status === 'missing' || ref.status === 'required'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {ref.status}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">{ref.whyItMatters}</p>
                <p className="text-slate-500 mt-0.5 italic">{ref.boundaryImpact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Gap */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <h3 className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
          <AlertTriangle size={14} className="text-amber-600" />
          Validation Gap
        </h3>
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-semibold text-amber-900">Cannot conclude:</span>
            <ul className="mt-1 space-y-0.5 text-amber-700">
              {workspace.claimBoundary.cannotConclude.slice(0, 3).map((item, i) => (
                <li key={i}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="pt-2 border-t border-amber-200">
            <span className="font-semibold text-amber-900">Next action:</span>
            <p className="mt-1 text-amber-700">{workspace.claimBoundary.requiredNext[0]}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function ToolTraceCompact({
  trace,
  runtimeMode,
}: {
  trace: NormalizedToolTraceEntry[];
  runtimeMode: RuntimeMode;
}) {
  if (trace.length === 0) return null;
  const sourceMode = runtimeMode === 'demo' ? 'demo_preloaded' : 'google_drive_connected';
  const permissionMode = runtimeMode === 'demo' ? 'read_only' : 'approval_required';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
        <Database size={14} className="text-blue-600" />
        Tool Calls
      </h3>
      <div className="mb-2 flex items-center justify-between text-[10px]">
        <span className="font-semibold text-slate-500">Runtime</span>
        <span className={`rounded border px-1.5 py-0.5 font-semibold ${
          runtimeMode === 'demo'
            ? 'border-slate-200 bg-slate-50 text-slate-600'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}>
          {runtimeMode === 'demo' ? 'Demo deterministic' : 'Connected gated'}
        </span>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-1 text-[10px] text-slate-500">
        <span>Source: {sourceMode}</span>
        <span>Permission: {permissionMode}</span>
      </div>
      <div className="space-y-2">
        {trace.map((entry) => (
          <div key={entry.id} className="rounded border border-slate-100 bg-slate-50 p-2 text-[10px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900">{entry.toolName}</span>
              <span className="font-mono text-slate-500">{entry.timestamp}</span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1 text-slate-600">
              <span>Call: {entry.callType}</span>
              <span>Approval: {entry.approvalStatus}</span>
              <span>Args: {entry.argsSummary}</span>
              <span>Result: {entry.resultSummary}</span>
            </div>
            <p className="mt-1 border-t border-slate-200 pt-1 text-slate-500">
              {entry.evidenceImpact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TraceWorkspaceTabContent({ workspace }: { workspace: AgentEvidenceWorkspace }) {
  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
          <ListChecks size={14} className="text-blue-600" />
          Reasoning Trace
        </h3>
        <div className="space-y-2">
          {workspace.trace.map((event) => (
            <div key={event.stepNumber} className="text-xs border-l-2 border-blue-200 pl-2">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900">
                  Step {String(event.stepNumber).padStart(2, '0')} - {event.eventLabel}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                  {event.eventType.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-1 space-y-1">
                <div>
                  <span className="font-semibold text-slate-700">Input:</span>{' '}
                  <span className="text-slate-600">{event.input}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Reasoning:</span>{' '}
                  <span className="text-slate-600">{event.reasoning}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Output:</span>{' '}
                  <span className="text-slate-600">{event.output}</span>
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <span className="font-semibold text-blue-700">Boundary impact:</span>{' '}
                  <span className="text-blue-600 italic">{event.boundaryImpact}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BoundaryWorkspaceTabContent({ workspace }: { workspace: AgentEvidenceWorkspace }) {
  const jobLabel = workspace.jobType === 'rnd' ? 'R&D' : workspace.jobType === 'analytical' ? 'Analytical' : 'Research';
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-blue-900">
        <Shield size={14} className="text-blue-600" />
        Claim Boundary ({jobLabel})
      </h3>

      <div className="space-y-2 text-xs">
        <div>
          <span className="font-semibold text-emerald-900">Supported:</span>
          <ul className="mt-1 space-y-0.5 text-emerald-700">
            {workspace.claimBoundary.supported.map((item, i) => (
              <li key={i}>- {item}</li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t border-blue-200">
          <span className="font-semibold text-amber-900">Validation-limited:</span>
          <ul className="mt-1 space-y-0.5 text-amber-700">
            {workspace.claimBoundary.validationLimited.map((item, i) => (
              <li key={i}>- {item}</li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t border-blue-200">
          <span className="font-semibold text-red-900">Cannot conclude:</span>
          <ul className="mt-1 space-y-0.5 text-red-700">
            {workspace.claimBoundary.cannotConclude.map((item, i) => (
              <li key={i}>- {item}</li>
            ))}
          </ul>
        </div>

        <div className="pt-2 border-t border-blue-200">
          <span className="font-semibold text-blue-900">Required next:</span>
          <ul className="mt-1 space-y-0.5 text-blue-700">
            {workspace.claimBoundary.requiredNext.map((item, i) => (
              <li key={i}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function EvidenceByTechniqueCard({ context }: { context: AgentContext }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
        <Database size={14} className="text-blue-600" />
        Evidence Results
      </h3>
      <div className="space-y-2">
        {context.evidenceLayers.map((layer: EvidenceLayer) => (
          <div key={layer.technique} className="text-xs border-l-2 border-slate-200 pl-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900">{layer.technique}</span>
              <StatusBadge status={layer.status} />
            </div>
            <p className="text-slate-600 mt-0.5 leading-relaxed">{layer.summary}</p>
          </div>
        ))}
      </div>
      {context.evidenceMode === 'multi-tech' && (
        <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold">Cross-tech:</span> {context.discussionContext.agreement}
        </div>
      )}
    </div>
  );
}

function DiscussionCard({ context }: { context: AgentContext }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
        <Brain size={14} className="text-blue-600" />
        Interpretation
      </h3>
      <p className="text-xs text-slate-700 leading-relaxed">{context.discussionContext.interpretation}</p>
      <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <span className="font-semibold">Uncertainty:</span> {context.discussionContext.uncertainty}
      </div>
    </div>
  );
}

function TraceTabContent({ trace }: { trace: TraceContext }) {
  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
          <Database size={14} className="text-blue-600" />
          Reasoning Trace
        </h3>
        <div className="space-y-1.5 text-xs mb-3">
          <Row label="Mode" value={trace.mode} />
          <Row label="Job type" value={trace.jobType} />
          <Row label="Output" value={trace.outputLabel} />
        </div>
        <div className="space-y-2">
          {trace.steps.map((step, i) => (
            <div key={i} className="text-xs border-l-2 border-slate-200 pl-2">
              <div className="font-semibold text-slate-900">{step.label}</div>
              <div className="text-slate-600">{step.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BoundaryTabContent({ boundary }: { boundary: BoundaryContext }) {
  const jobLabel = boundary.jobType === 'rnd' ? 'R&D' : boundary.jobType === 'analytical' ? 'Analytical' : 'Research';
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-blue-900">
        <Shield size={14} className="text-blue-600" />
        Claim Boundary ({jobLabel})
      </h3>
      {boundary.supported.length > 0 && (
        <Section title="Supported" items={boundary.supported} color="emerald" />
      )}
      {boundary.validationLimited.length > 0 && (
        <Section title="Validation-limited" items={boundary.validationLimited} color="amber" />
      )}
      {boundary.cannotConclude.length > 0 && (
        <Section title="Cannot conclude" items={boundary.cannotConclude} color="rose" />
      )}
      {boundary.requiredNext.length > 0 && (
        <Section title="Required next" items={boundary.requiredNext} color="blue" />
      )}
    </div>
  );
}

function PlanCard({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
        <ListChecks size={14} className="text-blue-600" />
        Agent Review Plan
      </h3>
      <ol className="space-y-2 text-xs">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-semibold text-blue-600">{step.number}.</span>
            <div>
              <div className="font-semibold text-slate-900">{step.title}</div>
              <div className="text-slate-600">{step.description}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function NotebookPreviewCard({ context, onSave, onExport }: { context: AgentContext; onSave?: () => void; onExport?: () => void }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-emerald-900">
        <FileText size={14} className="text-emerald-600" />
        Notebook Preview
      </h3>
      <div className="text-xs text-emerald-800 space-y-1">
        <Row label="Project" value={context.notebookPayload.projectTitle} />
        <Row label="Mode" value={context.notebookPayload.mode} />
        <Row label="Job type" value={context.notebookPayload.jobType} />
        <Row label="Techniques" value={context.notebookPayload.activeTechniques.join(', ')} />
        <Row label="Gaps" value={String(context.notebookPayload.validationGaps.length)} />
      </div>
      <div className="flex gap-2">
        {onSave && (
          <button type="button" onClick={onSave} className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors">
            Save to Notebook
          </button>
        )}
        {onExport && (
          <button type="button" onClick={onExport} className="flex-1 px-3 py-2 bg-white border border-emerald-300 text-emerald-700 rounded text-xs font-semibold hover:bg-emerald-50 transition-colors">
            Export
          </button>
        )}
      </div>
    </div>
  );
}

function PaperScholarPlaceholder() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
        <BookOpen size={14} className="text-slate-500" />
        Paper / Scholar
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        External literature comparison is not connected in this demo. Use this section to document manual reference checks.
      </p>
    </div>
  );
}

function AgentComparePlaceholder() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
        <Search size={14} className="text-slate-500" />
        Agent Compare
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed">
        External agent comparison is not connected in this demo. Agent comparison currently reflects deterministic demo reasoning.
      </p>
    </div>
  );
}

function ClaimBoundaryCard({ context }: { context: AgentContext }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-2">
        <CheckCircle2 size={14} className="text-blue-600" />
        Claim Boundary
      </h3>
      <p className="text-xs text-blue-800 leading-relaxed">{context.claimBoundary}</p>
    </div>
  );
}

function ValidationGapsCard({ context }: { context: AgentContext }) {
  if (context.validationGaps.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h3 className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
          <AlertTriangle size={14} className="text-slate-500" />
          Validation Gaps
        </h3>
        <p className="text-xs text-slate-600">No validation gaps identified for this project.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
        <AlertTriangle size={14} className="text-amber-600" />
        Validation Gaps ({context.validationGaps.length})
      </h3>
      <ul className="space-y-1.5 text-xs text-amber-800">
        {context.validationGaps.map((gap: ValidationGap, i: number) => (
          <li key={i} className="flex gap-2">
            <span className="text-amber-600">-</span>
            <span className="flex-1">{gap.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendedActionsCard({ context }: { context: AgentContext }) {
  if (context.recommendedActions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h3 className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-2">
          <TrendingUp size={14} className="text-slate-500" />
          Recommended Actions
        </h3>
        <p className="text-xs text-slate-600">Recommended next action will appear after evidence review.</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
      <h3 className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-2">
        <TrendingUp size={14} className="text-emerald-600" />
        Recommended Actions
      </h3>
      <ol className="space-y-1.5 text-xs text-emerald-800">
        {context.recommendedActions.map((d: NextDecision, i: number) => (
          <li key={i} className="flex gap-2">
            <span className="font-semibold text-emerald-600">{i + 1}.</span>
            <span className="flex-1">{d.label}: {d.description}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Small Helpers

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 font-semibold text-slate-600">{label}:</span>
      <span className="flex-1 text-slate-900">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'available') return null;
  const style = status === 'required'
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-slate-100 border-slate-200 text-slate-600';
  return <span className={`ml-1 text-[10px] px-1 py-0.5 rounded border ${style}`}>{status}</span>;
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  const textColor = `text-${color}-800`;
  const bulletColor = `text-${color}-500`;
  return (
    <div>
      <span className={`text-[10px] font-bold uppercase tracking-wide ${textColor}`}>{title}</span>
      <ul className="mt-1 space-y-1 text-xs">
        {items.map((item, i) => (
          <li key={i} className={`flex gap-1.5 ${textColor}`}>
            <span className={bulletColor}>-</span>
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
