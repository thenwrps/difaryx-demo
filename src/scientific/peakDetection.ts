import type { SpectrumPoint, DetectedPeak } from './types';

interface PeakDetectionConfig {
  /** Fraction of max intensity; peaks below this are discarded (0–1). Default 0.05 */
  threshold: number;
  /** Minimum distance between peaks in x-units. Default 1.5 */
  minDistance: number;
}

const DEFAULT_CONFIG: PeakDetectionConfig = {
  threshold: 0.05,
  minDistance: 1.5,
};

// ── FWHM calculation ─────────────────────────────────────────────────

function calculateFwhm(data: SpectrumPoint[], peakIndex: number): number {
  const halfMax = data[peakIndex].y / 2;

  // Walk left
  let leftX = data[peakIndex].x;
  for (let i = peakIndex - 1; i >= 0; i--) {
    if (data[i].y <= halfMax) {
      // Linear interpolation
      const fraction =
        (halfMax - data[i].y) / (data[i + 1].y - data[i].y);
      leftX = data[i].x + fraction * (data[i + 1].x - data[i].x);
      break;
    }
    if (i === 0) leftX = data[0].x;
  }

  // Walk right
  let rightX = data[peakIndex].x;
  for (let i = peakIndex + 1; i < data.length; i++) {
    if (data[i].y <= halfMax) {
      const fraction =
        (halfMax - data[i].y) / (data[i - 1].y - data[i].y);
      rightX = data[i].x - fraction * (data[i].x - data[i - 1].x);
      break;
    }
    if (i === data.length - 1) rightX = data[data.length - 1].x;
  }

  return Math.abs(rightX - leftX);
}

// ── Area estimation (trapezoidal) ────────────────────────────────────

function estimateArea(data: SpectrumPoint[], peakIndex: number, fwhm: number): number {
  const center = data[peakIndex].x;
  const halfRange = fwhm * 2; // integrate over ±2×FWHM
  let area = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i].x < center - halfRange || data[i - 1].x > center + halfRange) continue;
    const dx = data[i].x - data[i - 1].x;
    const avgY = (data[i].y + data[i - 1].y) / 2;
    area += dx * avgY;
  }

  return area;
}

// ── Main detection algorithm ─────────────────────────────────────────

export function detectPeaks(
  data: SpectrumPoint[],
  userConfig?: Partial<PeakDetectionConfig>,
): DetectedPeak[] {
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  if (data.length < 3) return [];

  // Find global max for threshold
  let maxY = 0;
  for (const pt of data) {
    if (pt.y > maxY) maxY = pt.y;
  }
  const absoluteThreshold = config.threshold * maxY;

  // Step 1: Find all local maxima above threshold
  const candidates: { index: number; x: number; y: number }[] = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (
      data[i].y > data[i - 1].y &&
      data[i].y > data[i + 1].y &&
      data[i].y > absoluteThreshold
    ) {
      candidates.push({ index: i, x: data[i].x, y: data[i].y });
    }
  }

  // Step 2: Sort by intensity descending
  candidates.sort((a, b) => b.y - a.y);

  // Step 3: Distance filtering (non-maximum suppression)
  const accepted: { index: number; x: number; y: number }[] = [];
  for (const cand of candidates) {
    const tooClose = accepted.some(
      (a) => Math.abs(a.x - cand.x) < config.minDistance,
    );
    if (!tooClose) {
      accepted.push(cand);
    }
  }

  // Step 4: Compute FWHM and area for each accepted peak
  const peaks: DetectedPeak[] = accepted.map((p) => {
    const fwhm = calculateFwhm(data, p.index);
    const area = estimateArea(data, p.index, fwhm);
    return {
      position: Number(p.x.toFixed(2)),
      intensity: Number(p.y.toFixed(2)),
      fwhm: Number(fwhm.toFixed(3)),
      area: Number(area.toFixed(2)),
    };
  });

  // Sort by position for display
  peaks.sort((a, b) => a.position - b.position);

  return peaks;
}
