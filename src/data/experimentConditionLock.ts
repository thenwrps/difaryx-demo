import { DEFAULT_PROJECT_ID, getLocalExperiments, type Technique } from './demoProjects';

export type ConditionCompletenessStatus =
  | 'missing'
  | 'draft'
  | 'locked'
  | 'incomplete'
  | 'validation-limited';

export type SynthesisConditions = {
  method?: string;
  precursorRatio?: string;
  solvent?: string;
  pH?: string;
  temperature?: string;
  time?: string;
  calcinationTemperature?: string;
  calcinationTime?: string;
  atmosphere?: string;
  postTreatment?: string;
};

export type MeasurementConditions = {
  instrument?: string;
  radiationOrSource?: string;
  scanRange?: string;
  stepSize?: string;
  scanRate?: string;
  calibrationReference?: string;
  acquisitionMode?: string;
};

export type ProcessingConditions = {
  baselineCorrection?: string;
  smoothing?: string;
  normalization?: string;
  peakDetection?: string;
  fittingModel?: string;
  referenceDatabase?: string;
};

export type ValidationConditions = {
  replicateRequired?: boolean;
  referenceValidationRequired?: boolean;
  crossTechniqueRequired?: string[];
  refinementRequired?: boolean;
  publicationClaimAllowed?: boolean;
};

export type ExperimentConditionLock = {
  synthesisConditions?: SynthesisConditions;
  measurementConditions?: MeasurementConditions;
  processingConditions?: ProcessingConditions;
  validationConditions?: ValidationConditions;
  userConfirmed: boolean;
  lockedAt?: string;
  completenessStatus: ConditionCompletenessStatus;
};

export const PRIMARY_DEMO_CONDITION_LOCK: ExperimentConditionLock = {
  synthesisConditions: {
    method: 'user-provided ferrite synthesis',
    calcinationTemperature: 'pending confirmation',
    calcinationTime: 'pending confirmation',
    atmosphere: 'pending confirmation',
  },
  measurementConditions: {
    instrument: 'XRD',
    radiationOrSource: 'Cu Kα',
    scanRange: '10-80° 2θ',
    stepSize: 'pending confirmation',
    calibrationReference: 'pending confirmation',
  },
  processingConditions: {
    baselineCorrection: 'applied',
    normalization: 'pending confirmation',
    peakDetection: 'local maxima',
    referenceDatabase: 'reference validation pending',
  },
  validationConditions: {
    replicateRequired: true,
    referenceValidationRequired: true,
    refinementRequired: true,
    publicationClaimAllowed: false,
    crossTechniqueRequired: ['XPS', 'Raman'],
  },
  userConfirmed: true,
  lockedAt: '2026-04-29T17:30:00.000Z',
  completenessStatus: 'validation-limited',
};

export const getPrimaryDemoConditionLock = (
  projectId?: string,
): ExperimentConditionLock | null => (
  projectId === DEFAULT_PROJECT_ID ? PRIMARY_DEMO_CONDITION_LOCK : null
);

const REQUIRED_MEASUREMENT_FIELDS: Array<keyof MeasurementConditions> = [
  'instrument',
  'radiationOrSource',
  'scanRange',
  'calibrationReference',
];

const REQUIRED_PROCESSING_FIELDS: Array<keyof ProcessingConditions> = [
  'baselineCorrection',
  'normalization',
  'peakDetection',
];

const hasText = (value?: string) => Boolean(value && value.trim().length > 0);

const hasAnyGroupValue = (group?: Record<string, unknown>) => {
  if (!group) return false;
  return Object.values(group).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
  });
};

const isGroupIncomplete = <T extends object>(
  group: T | undefined,
  fields: Array<keyof T>,
) => !group || fields.some((field) => !hasText(group[field] as string | undefined));

export const createDraftExperimentConditionLock = (): ExperimentConditionLock => ({
  synthesisConditions: {},
  measurementConditions: {},
  processingConditions: {},
  validationConditions: {
    crossTechniqueRequired: [],
    publicationClaimAllowed: false,
  },
  userConfirmed: false,
  completenessStatus: 'draft',
});

export const evaluateExperimentConditionLock = (
  lock?: Partial<ExperimentConditionLock> | null,
): ConditionCompletenessStatus => {
  if (!lock) return 'missing';
  if (!lock.userConfirmed) return hasAnyGroupValue(lock as Record<string, unknown>) ? 'draft' : 'missing';

  const measurementIncomplete = isGroupIncomplete(
    lock.measurementConditions,
    REQUIRED_MEASUREMENT_FIELDS,
  );
  const processingIncomplete = isGroupIncomplete(
    lock.processingConditions,
    REQUIRED_PROCESSING_FIELDS,
  );
  const validation = lock.validationConditions;

  if (measurementIncomplete || processingIncomplete) return 'incomplete';

  if (
    !validation ||
    validation.publicationClaimAllowed !== true ||
    validation.referenceValidationRequired ||
    validation.refinementRequired ||
    (validation.crossTechniqueRequired?.length ?? 0) > 0
  ) {
    return 'validation-limited';
  }

  return 'locked';
};

export const lockExperimentConditions = (
  lock: ExperimentConditionLock,
  lockedAt = new Date().toISOString(),
): ExperimentConditionLock => {
  const next: ExperimentConditionLock = {
    ...lock,
    validationConditions: {
      crossTechniqueRequired: lock.validationConditions?.crossTechniqueRequired ?? [],
      publicationClaimAllowed: false,
      ...lock.validationConditions,
    },
    userConfirmed: true,
    lockedAt,
  };

  return {
    ...next,
    completenessStatus: evaluateExperimentConditionLock(next),
  };
};

export const getConditionLockStatusLabel = (
  lock?: ExperimentConditionLock | null,
) => {
  const status = evaluateExperimentConditionLock(lock);

  switch (status) {
    case 'locked':
      return 'Locked';
    case 'validation-limited':
      return 'Locked · Validation-limited';
    case 'incomplete':
      return 'Locked · Condition-limited';
    case 'draft':
      return 'Pending confirmation';
    case 'missing':
    default:
      return 'No condition lock';
  }
};

export const getConditionLockStatusTone = (
  lock?: ExperimentConditionLock | null,
) => {
  const status = evaluateExperimentConditionLock(lock);

  switch (status) {
    case 'locked':
      return 'ok';
    case 'validation-limited':
    case 'incomplete':
      return 'limited';
    case 'draft':
      return 'pending';
    case 'missing':
    default:
      return 'missing';
  }
};

export const formatConditionLockTimestamp = (
  lock?: ExperimentConditionLock | null,
) => {
  if (!lock?.lockedAt) return 'Not locked';

  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(lock.lockedAt));
  } catch {
    return lock.lockedAt;
  }
};

export const getConditionBoundaryNotes = (
  lock?: ExperimentConditionLock | null,
  availableTechniques: string[] = [],
) => {
  if (!lock?.userConfirmed) {
    return [
      'Experiment conditions are pending explicit confirmation; interpretation remains condition-limited.',
      'Publication-level claims are blocked until the experiment record is locked by the user.',
    ];
  }

  const notes: string[] = [];
  const normalizedAvailable = availableTechniques.map((technique) => technique.toUpperCase());
  const validation = lock.validationConditions;

  if (isGroupIncomplete(lock.measurementConditions, REQUIRED_MEASUREMENT_FIELDS)) {
    notes.push('Measurement conditions are incomplete; interpretation remains measurement-limited.');
  }

  if (isGroupIncomplete(lock.processingConditions, REQUIRED_PROCESSING_FIELDS)) {
    notes.push('Processing conditions are incomplete; output remains method-limited.');
  }

  if (!validation || validation.publicationClaimAllowed !== true) {
    notes.push('Publication-level claims are blocked unless validation conditions explicitly allow them.');
  }

  if (validation?.referenceValidationRequired) {
    notes.push('Reference validation is required before stronger material claims are handed off.');
  }

  if (validation?.replicateRequired) {
    notes.push('Replicate evidence is required before the interpretation can move beyond evidence-limited status.');
  }

  if (validation?.refinementRequired) {
    notes.push('Phase-purity claims remain blocked until refinement evidence is attached.');
  }

  const missingRequired = (validation?.crossTechniqueRequired ?? []).filter(
    (technique) => !normalizedAvailable.includes(technique.toUpperCase()),
  );

  if (missingRequired.length > 0) {
    notes.push(
      `Cross-technique validation remains pending for ${missingRequired.join(', ')} evidence.`,
    );
  }

  if (missingRequired.some((technique) => technique.toUpperCase() === 'XPS')) {
    notes.push('Oxidation-state and surface validation claims remain blocked until XPS evidence is attached.');
  }

  return notes.length > 0
    ? notes
    : [
        'Experiment conditions are locked; interpretation remains bounded by the user-provided condition record.',
      ];
};

const joinConditionValues = (
  label: string,
  values: Array<string | undefined>,
) => {
  const filled = values.filter(hasText);
  return filled.length > 0 ? `${label}: ${filled.join(' / ')}` : `${label}: not provided`;
};

export const getConditionLockSectionLines = (
  lock?: ExperimentConditionLock | null,
) => {
  if (!lock?.userConfirmed) {
    return [
      'Condition status: pending explicit confirmation',
      'No user-locked experiment condition record is attached. Interpretation remains condition-limited until conditions are confirmed.',
    ];
  }

  const synthesis = lock.synthesisConditions ?? {};
  const measurement = lock.measurementConditions ?? {};
  const processing = lock.processingConditions ?? {};
  const validation = lock.validationConditions ?? {};
  const required = validation.crossTechniqueRequired?.length
    ? validation.crossTechniqueRequired.join(', ')
    : 'not specified';

  return [
    `Status: ${getConditionLockStatusLabel(lock)}`,
    'Locked by user',
    `Locked at: ${formatConditionLockTimestamp(lock)}`,
    `Sample preparation: method ${synthesis.method ?? 'pending confirmation'}; calcination ${synthesis.calcinationTemperature ?? 'pending confirmation'}; atmosphere ${synthesis.atmosphere ?? 'pending confirmation'}.`,
    `Measurement: ${measurement.instrument ?? 'pending confirmation'}, ${measurement.radiationOrSource ?? 'pending confirmation'}, ${measurement.scanRange ?? 'pending confirmation'}; step size ${measurement.stepSize ?? 'pending confirmation'}.`,
    `Processing: baseline correction ${processing.baselineCorrection ?? 'pending confirmation'}; peak detection ${processing.peakDetection ?? 'pending confirmation'}; reference validation ${processing.referenceDatabase ?? 'pending'}.`,
    `Validation: replicate evidence ${validation.replicateRequired ? 'required' : 'not required'}; reference validation ${validation.referenceValidationRequired ? 'required' : 'not required'}; refinement ${validation.refinementRequired ? 'required before phase-purity claims' : 'not required'}; cross-technique ${required}; publication-level phase claim ${validation.publicationClaimAllowed ? 'user-allowed after validation' : 'not supported yet'}.`,
  ];
};

export const getLatestExperimentConditionLock = (
  projectId?: string,
): ExperimentConditionLock | null => {
  if (typeof window === 'undefined') return getPrimaryDemoConditionLock(projectId);

  const experiments = getLocalExperiments(projectId);
  const lockedExperiment = [...experiments]
    .reverse()
    .find((experiment) => experiment.conditionLock?.userConfirmed);

  return lockedExperiment?.conditionLock ?? getPrimaryDemoConditionLock(projectId);
};

export const getExperimentConditionLock = (
  projectId?: string,
  experimentId?: string | null,
): ExperimentConditionLock | null => {
  if (typeof window === 'undefined') return getPrimaryDemoConditionLock(projectId);

  const experiments = getLocalExperiments(projectId);
  const experiment = experimentId
    ? experiments.find((item) => item.id === experimentId)
    : [...experiments].reverse().find((item) => item.conditionLock);

  return experiment?.conditionLock ?? getPrimaryDemoConditionLock(projectId);
};

export const getConditionAwareClaimBoundary = (
  baseBoundary: string[],
  lock?: ExperimentConditionLock | null,
  availableTechniques: Technique[] | string[] = [],
) => [...baseBoundary, ...getConditionBoundaryNotes(lock, availableTechniques)];
