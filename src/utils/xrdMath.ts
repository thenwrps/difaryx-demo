export interface NumericPoint {
  x: number;
  y: number;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function gaussian(x: number, center: number, width: number) {
  const scaled = (x - center) / width;
  return Math.exp(-0.5 * scaled * scaled);
}

export function pseudoVoigt(x: number, center: number, width: number, mix = 0.35) {
  const scaled = (x - center) / width;
  const lorentzian = 1 / (1 + scaled * scaled);
  return mix * lorentzian + (1 - mix) * gaussian(x, center, width);
}

export function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function percentile(values: number[], fraction: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = clamp(fraction, 0, 1) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function movingAverage(data: NumericPoint[], radius: number) {
  return data.map((point, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(data.length - 1, index + radius);
    let sum = 0;
    let count = 0;

    for (let i = start; i <= end; i += 1) {
      sum += data[i].y;
      count += 1;
    }

    return { x: point.x, y: sum / Math.max(count, 1) };
  });
}

export function rollingPercentileBaseline(data: NumericPoint[], radius: number, fraction = 0.18) {
  const rough = data.map((point, index) => {
    const start = Math.max(0, index - radius);
    const end = Math.min(data.length - 1, index + radius);
    const windowValues: number[] = [];

    for (let i = start; i <= end; i += 1) {
      windowValues.push(data[i].y);
    }

    return { x: point.x, y: percentile(windowValues, fraction) };
  });

  return movingAverage(rough, Math.max(2, Math.round(radius / 4)));
}

export function estimateNoise(values: number[]) {
  if (values.length < 3) return 0;
  const diffs = values.slice(1).map((value, index) => value - values[index]);
  const center = median(diffs);
  const absoluteDeviations = diffs.map((value) => Math.abs(value - center));
  return (median(absoluteDeviations) * 1.4826) / Math.SQRT2;
}

export function calculateDSpacing(twoTheta: number, wavelength = 1.5406) {
  const thetaRadians = (twoTheta / 2) * (Math.PI / 180);
  const denominator = 2 * Math.sin(thetaRadians);
  return denominator > 0 ? wavelength / denominator : 0;
}
