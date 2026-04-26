import type { SpectrumPoint, ProcessingConfig, ProcessedResult } from './types';

// ── Smoothing: moving average ────────────────────────────────────────

function smooth(data: SpectrumPoint[], windowSize: number): SpectrumPoint[] {
  const half = Math.floor(windowSize / 2);
  return data.map((pt, i) => {
    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < data.length) {
        sum += data[j].y;
        count++;
      }
    }
    return { x: pt.x, y: sum / count };
  });
}

// ── Baseline correction: iterative rolling minimum (SNIP-like) ───────

function estimateBaseline(
  data: SpectrumPoint[],
  iterations: number,
): SpectrumPoint[] {
  // Start from the data
  let baseline = data.map((pt) => pt.y);

  for (let iter = 0; iter < iterations; iter++) {
    const windowHalf = Math.max(1, Math.floor((iterations - iter) * 2));
    const next: number[] = [];
    for (let i = 0; i < baseline.length; i++) {
      const lo = Math.max(0, i - windowHalf);
      const hi = Math.min(baseline.length - 1, i + windowHalf);
      const avg = (baseline[lo] + baseline[hi]) / 2;
      next.push(Math.min(baseline[i], avg));
    }
    baseline = next;
  }

  // Final smooth of the baseline itself
  const smoothed: number[] = [];
  const blurWindow = 15;
  const blurHalf = Math.floor(blurWindow / 2);
  for (let i = 0; i < baseline.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i - blurHalf; j <= i + blurHalf; j++) {
      if (j >= 0 && j < baseline.length) {
        sum += baseline[j];
        count++;
      }
    }
    smoothed.push(sum / count);
  }

  return data.map((pt, i) => ({ x: pt.x, y: smoothed[i] }));
}

function subtractBaseline(
  data: SpectrumPoint[],
  baseline: SpectrumPoint[],
): SpectrumPoint[] {
  return data.map((pt, i) => ({
    x: pt.x,
    y: Math.max(0, pt.y - baseline[i].y),
  }));
}

// ── Normalization: scale to 0–100 ────────────────────────────────────

function normalize(data: SpectrumPoint[]): SpectrumPoint[] {
  let max = 0;
  for (const pt of data) {
    if (pt.y > max) max = pt.y;
  }
  if (max === 0) return data;
  return data.map((pt) => ({ x: pt.x, y: (pt.y / max) * 100 }));
}

// ── Full pipeline ────────────────────────────────────────────────────

export function processSpectrum(
  raw: SpectrumPoint[],
  config: ProcessingConfig,
): ProcessedResult {
  // Step 1: Smoothing
  const smoothed = config.smoothing
    ? smooth(raw, config.smoothingWindow)
    : raw.map((pt) => ({ ...pt }));

  // Step 2: Baseline estimation + correction
  const baseline = config.baselineCorrection
    ? estimateBaseline(smoothed, config.baselineIterations)
    : smoothed.map((pt) => ({ x: pt.x, y: 0 }));

  const corrected = config.baselineCorrection
    ? subtractBaseline(smoothed, baseline)
    : smoothed.map((pt) => ({ ...pt }));

  // Step 3: Normalization
  const normalized = config.normalization
    ? normalize(corrected)
    : corrected.map((pt) => ({ ...pt }));

  // Determine final output
  let output = normalized;
  if (!config.normalization && !config.baselineCorrection && !config.smoothing) {
    output = raw.map((pt) => ({ ...pt }));
  }

  return {
    raw,
    smoothed,
    baseline,
    corrected,
    normalized,
    output,
  };
}
