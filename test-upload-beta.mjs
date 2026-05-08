import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { transformWithOxc } from 'vite';

const source = await readFile(new URL('./src/data/uploadedSignalRuns.ts', import.meta.url), 'utf8');
const transformed = await transformWithOxc(source, 'uploadedSignalRuns.ts', {
  lang: 'ts',
});

const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed.code).toString('base64')}`;
const uploadCore = await import(moduleUrl);

const {
  CLAIM_BOUNDARY_BY_TECHNIQUE,
  INSUFFICIENT_EVIDENCE_MESSAGE,
  UPLOADED_SIGNAL_RUNS_KEY,
  createUploadedSignalRun,
  getUploadedSignalStorageStatus,
  mapUploadedSignalColumns,
  parseUploadedSignalText,
  readUploadedSignalRuns,
  saveUploadedSignalRun,
} = uploadCore;

function createLocalStorageMock() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

function assertNoForbiddenUploadWording(text) {
  const forbiddenPatterns = [
    new RegExp(`\\b${['pro', 've'].join('')}s?\\b`, 'i'),
    new RegExp(`\\b${['def', 'initive'].join('')}\\b`, 'i'),
    new RegExp(['confirmed', 'identity'].join(' '), 'i'),
    new RegExp(['phase purity', 'confirmed'].join(' '), 'i'),
    new RegExp(['publication', 'ready'].join('-'), 'i'),
  ];

  forbiddenPatterns.forEach((pattern) => {
    assert.equal(pattern.test(text), false, `Forbidden upload wording found: ${pattern}`);
  });
}

function assertNoCanonicalDemoAssumption(run) {
  const output = JSON.stringify(run).toLowerCase();
  assert.equal(output.includes('cufe'), false, 'Uploaded run must not inject CuFe demo assumptions');
  assert.equal(output.includes('cufe2o4'), false, 'Uploaded run must not inject CuFe2O4 demo assumptions');
  assert.equal(output.includes('spinel ferrite'), false, 'Uploaded run must not inject canonical spinel-ferrite assumptions');
}

function makeLargeSignal(count) {
  return Array.from({ length: count }, (_, index) => ({
    x: index,
    y: 25 + Math.sin(index / 12) * 10 + (index % 91 === 0 ? 35 : 0),
  }));
}

const validCsv = `two_theta,intensity
20,12
25,18
30,55
35,21
40,80
45,24
50,16
`;

const parsed = parseUploadedSignalText('public-beta-xrd.csv', validCsv);
assert.equal(parsed.ok, true, 'Valid CSV should parse successfully');
assert.equal(parsed.numericRows, 7, 'Valid CSV should produce seven numeric rows');
assert.deepEqual(parsed.points.map((point) => point.x), [20, 25, 30, 35, 40, 45, 50]);
assert.deepEqual(parsed.points.map((point) => point.y), [12, 18, 55, 21, 80, 24, 16]);

const mappedPoints = mapUploadedSignalColumns(parsed, 1, 2);
assert.equal(mappedPoints.length, 7, 'Column mapping should preserve the valid X/Y rows');
assert.deepEqual(mappedPoints[0], { x: 20, y: 12 });
assert.ok(mappedPoints.length >= 5, 'Mapped points should be enough for plotting and feature extraction');

const uploadedRun = createUploadedSignalRun({
  fileName: parsed.fileName,
  technique: 'XRD',
  sampleIdentity: 'Public beta upload sample',
  xAxisLabel: '2theta (deg)',
  yAxisLabel: 'Intensity (a.u.)',
  referenceScope: 'Upload-derived signal evidence; reference validation pending',
  points: mappedPoints,
});

assert.equal(uploadedRun.technique, 'XRD', 'Technique should be settable to XRD');
assert.equal(uploadedRun.lockedContext.technique, 'XRD', 'Locked context should retain the selected technique');
assert.ok(uploadedRun.extractedFeatures.length > 0, 'Valid XRD-like signal should produce extracted features');
assert.equal(uploadedRun.evidenceQuality.state, 'ready', 'Valid signal should pass the beta quality gate');
assert.equal(uploadedRun.evidenceQuality.canInterpret, true, 'Ready quality gate should permit bounded handoff');
assert.ok(
  uploadedRun.claimBoundary.join(' ').includes('phase purity remains validation-limited'),
  'XRD claim boundary should remain validation-limited',
);
assertNoForbiddenUploadWording(JSON.stringify(uploadedRun));
assertNoCanonicalDemoAssumption(uploadedRun);

const invalidCsv = `sample,note
A,not numeric
B,still not numeric
`;

const invalidParsed = parseUploadedSignalText('public-beta-invalid.csv', invalidCsv);
assert.equal(invalidParsed.ok, false, 'Invalid CSV should not parse as a usable signal');
assert.equal(invalidParsed.evidenceQuality.canInterpret, false, 'Invalid upload must not be handoff-ready');
assert.notEqual(invalidParsed.evidenceQuality.state, 'ready', 'Invalid upload must not produce ready evidence quality');
assert.ok(
  invalidParsed.evidenceQuality.messages.some((message) => message.includes('Interpretation is bounded')),
  'Invalid upload should still derive a bounded user-facing error state',
);
assert.equal(
  INSUFFICIENT_EVIDENCE_MESSAGE.includes('could not generate a bounded interpretation'),
  true,
  'Insufficient evidence fallback should be available for blocked report states',
);

globalThis.window = {
  localStorage: createLocalStorageMock(),
};

for (let index = 0; index < 10; index += 1) {
  const run = createUploadedSignalRun({
    fileName: `large-upload-${index}.csv`,
    technique: 'XRD',
    sampleIdentity: `Large beta sample ${index}`,
    xAxisLabel: '2theta (deg)',
    yAxisLabel: 'Intensity (a.u.)',
    referenceScope: 'Storage compaction smoke test',
    points: makeLargeSignal(1500 + index),
  });
  run.id = `uploaded-storage-${index}`;
  saveUploadedSignalRun(run);
}

const savedRuns = readUploadedSignalRuns();
assert.equal(savedRuns.length, 8, 'Saved uploaded runs should be capped at eight');
savedRuns.forEach((run) => {
  assert.ok(run.points.length <= 1200, 'Persisted signal points should be capped at 1200');
  assert.equal(run.sourceType, 'uploaded', 'Persisted runs should remain upload-scoped');
});

window.localStorage.setItem(UPLOADED_SIGNAL_RUNS_KEY, '{not-valid-json');
assert.deepEqual(readUploadedSignalRuns(), [], 'Malformed stored JSON should not break reading saved runs');
const storageStatus = getUploadedSignalStorageStatus();
assert.equal(storageStatus.corrupted, true, 'Malformed stored JSON should surface corrupted storage status');
assert.equal(storageStatus.available, true, 'Malformed JSON should not mark browser storage itself unavailable');

Object.values(CLAIM_BOUNDARY_BY_TECHNIQUE).forEach(assertNoForbiddenUploadWording);

console.log('upload beta smoke: valid fixture, invalid fixture, persistence, and wording guardrails passed');
