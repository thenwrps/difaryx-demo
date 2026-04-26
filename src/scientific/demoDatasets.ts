import type { RawDataset, SpectrumPoint } from './types';

// ── Peak shape functions ─────────────────────────────────────────────

function gaussian(x: number, center: number, width: number): number {
  const t = (x - center) / width;
  return Math.exp(-0.5 * t * t);
}

function lorentzian(x: number, center: number, width: number): number {
  const t = (x - center) / width;
  return 1 / (1 + t * t);
}

function pseudoVoigt(
  x: number,
  center: number,
  width: number,
  mix = 0.3,
): number {
  return mix * lorentzian(x, center, width) + (1 - mix) * gaussian(x, center, width);
}

// ── Deterministic noise (seeded, no Math.random) ─────────────────────

function deterministicNoise(index: number, x: number, amplitude: number): number {
  return amplitude * (
    0.48 * Math.sin(index * 1.73 + 0.3) +
    0.31 * Math.sin(index * 0.47 + 1.6) +
    0.21 * Math.sin(x * 0.91 + 2.1)
  );
}

// ── XRD spectrum generation ──────────────────────────────────────────

/**
 * CuFe2O4 spinel peaks — realistic positions and intensities
 * Reference: JCPDS 25-0283
 */
const CUFE2O4_PEAKS = [
  { center: 18.3, height: 22, width: 0.20 },  // (111)
  { center: 29.9, height: 35, width: 0.18 },  // (220)
  { center: 35.4, height: 100, width: 0.16 }, // (311) — strongest
  { center: 37.0, height: 18, width: 0.19 },  // (222)
  { center: 43.1, height: 24, width: 0.18 },  // (400)
  { center: 53.4, height: 16, width: 0.20 },  // (422)
  { center: 57.0, height: 32, width: 0.17 },  // (511)
  { center: 62.6, height: 44, width: 0.17 },  // (440)
  { center: 74.0, height: 14, width: 0.22 },  // (533)
];

function generateXrdSpectrum(): SpectrumPoint[] {
  const MIN = 10;
  const MAX = 80;
  const NUM_POINTS = 700;
  const points: SpectrumPoint[] = [];

  for (let i = 0; i < NUM_POINTS; i++) {
    const x = MIN + (MAX - MIN) * (i / (NUM_POINTS - 1));

    // Baseline: exponential decay + slow sine drift
    const baseline = 6 + 3.5 * Math.exp(-(x - MIN) / 30) + 1.2 * Math.sin(x * 0.12);

    // Sum peak contributions
    let signal = 0;
    for (const peak of CUFE2O4_PEAKS) {
      signal += peak.height * pseudoVoigt(x, peak.center, peak.width, 0.28);
      // Kα2 satellite
      signal += peak.height * 0.15 * pseudoVoigt(x, peak.center + 0.12, peak.width * 1.3, 0.35);
    }

    // Add noise
    const noise = deterministicNoise(i, x, 1.4);

    const y = baseline + signal + noise;
    points.push({
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(3)),
    });
  }

  return points;
}

// ── Exported dataset ─────────────────────────────────────────────────

export function getCuFe2O4Dataset(): RawDataset {
  return {
    id: 'cufe2o4-xrd-001',
    label: 'CuFe₂O₄ XRD Pattern',
    technique: 'XRD',
    sampleName: 'CuFe₂O₄ (Sol-Gel, 800°C)',
    xUnit: '2θ (°)',
    yUnit: 'Intensity (a.u.)',
    points: generateXrdSpectrum(),
  };
}
