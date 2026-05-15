import type { EvidenceSourceMode, PermissionMode, RuntimeMode } from './difaryxRuntimeMode';

export type ConnectedProvider = 'google' | 'local';

export type ConnectedAccountStatus =
  | 'not_connected'
  | 'connected_demo'
  | 'connected_read_only'
  | 'approval_required';

export type ConnectedCapability =
  | 'drive_import'
  | 'drive_export_future'
  | 'gmail_draft_future'
  | 'calendar_future'
  | 'storage_future';

export interface ConnectedCapabilityState {
  capability: ConnectedCapability;
  label: string;
  status: ConnectedAccountStatus;
  description: string;
}

export interface ConnectedAccountState {
  provider: ConnectedProvider;
  providerLabel: string;
  status: ConnectedAccountStatus;
  sourceMode: EvidenceSourceMode;
  runtimeMode: RuntimeMode;
  permissionMode: PermissionMode;
  capabilities: ConnectedCapabilityState[];
  externalWritesEnabled: boolean;
}

const CAPABILITY_LABELS: Record<ConnectedCapability, string> = {
  drive_import: 'Drive import',
  drive_export_future: 'Drive export',
  gmail_draft_future: 'Gmail draft',
  calendar_future: 'Calendar',
  storage_future: 'Storage',
};

const LOCAL_CAPABILITIES: ConnectedCapabilityState[] = [
  {
    capability: 'storage_future',
    label: CAPABILITY_LABELS.storage_future,
    status: 'connected_demo',
    description: 'Local browser storage only.',
  },
];

const GOOGLE_CAPABILITIES: ConnectedCapabilityState[] = [
  {
    capability: 'drive_import',
    label: CAPABILITY_LABELS.drive_import,
    status: 'connected_read_only',
    description: 'Read-only import shell ready; mock preview only, no Drive picker or API call is active.',
  },
  {
    capability: 'drive_export_future',
    label: CAPABILITY_LABELS.drive_export_future,
    status: 'approval_required',
    description: 'Approval required; external writes disabled.',
  },
  {
    capability: 'gmail_draft_future',
    label: CAPABILITY_LABELS.gmail_draft_future,
    status: 'approval_required',
    description: 'Approval required; Gmail draft creation is disabled.',
  },
  {
    capability: 'calendar_future',
    label: CAPABILITY_LABELS.calendar_future,
    status: 'not_connected',
    description: 'Future scheduling capability is not connected.',
  },
];

export function getDefaultConnectedAccountState(): ConnectedAccountState {
  return {
    provider: 'local',
    providerLabel: 'Local demo mode',
    status: 'connected_demo',
    sourceMode: 'demo_preloaded',
    runtimeMode: 'demo',
    permissionMode: 'read_only',
    capabilities: LOCAL_CAPABILITIES,
    externalWritesEnabled: false,
  };
}

export function getGoogleConnectedShellState(): ConnectedAccountState {
  return {
    provider: 'google',
    providerLabel: 'Google connected shell',
    status: 'approval_required',
    sourceMode: 'google_drive_connected',
    runtimeMode: 'connected',
    permissionMode: 'approval_required',
    capabilities: GOOGLE_CAPABILITIES,
    externalWritesEnabled: false,
  };
}

export function getCapabilityStatus(
  state: ConnectedAccountState,
  capability: ConnectedCapability,
): ConnectedAccountStatus {
  return state.capabilities.find((item) => item.capability === capability)?.status ?? 'not_connected';
}

export function getConnectedAccountBadgeLabel(
  value: ConnectedAccountState | ConnectedCapabilityState | ConnectedAccountStatus,
): string {
  const status = typeof value === 'string' ? value : value.status;

  if (status === 'connected_demo') return 'Local demo mode';
  if (status === 'connected_read_only') return 'Read-only placeholder';
  if (status === 'approval_required') return 'Approval required';
  return 'Not connected';
}

export function getConnectedCapabilityLabel(capability: ConnectedCapability): string {
  return CAPABILITY_LABELS[capability];
}

export function isCapabilityAvailable(
  state: ConnectedAccountState,
  capability: ConnectedCapability,
): boolean {
  const status = getCapabilityStatus(state, capability);
  return status === 'connected_demo' || status === 'connected_read_only';
}

export function isCapabilityWriteBlocked(
  state: ConnectedAccountState,
  capability: ConnectedCapability,
): boolean {
  const status = getCapabilityStatus(state, capability);
  return status === 'approval_required' || capability.endsWith('_future') || !state.externalWritesEnabled;
}
