export type SyntheticTracePoint = {
  x: number;
  y: number;
};

type Peak = {
  center: number;
  width: number;
  amplitude: number;
};

function gaussian(x: number, peak: Peak) {
  return peak.amplitude * Math.exp(-0.5 * Math.pow((x - peak.center) / peak.width, 2));
}

function sampleRange(start: number, end: number, count: number, fn: (x: number, index: number) => number): SyntheticTracePoint[] {
  return Array.from({ length: count }, (_, index) => {
    const x = start + ((end - start) * index) / (count - 1);
    return { x, y: fn(x, index) };
  });
}

export function generateXrdTrace(count = 260): SyntheticTracePoint[] {
  const peaks: Peak[] = [
    { center: 18.3, width: 0.26, amplitude: 22 },
    { center: 30.1, width: 0.32, amplitude: 52 },
    { center: 35.5, width: 0.36, amplitude: 86 },
    { center: 37.1, width: 0.3, amplitude: 32 },
    { center: 43.2, width: 0.34, amplitude: 66 },
    { center: 53.6, width: 0.38, amplitude: 34 },
    { center: 57.1, width: 0.36, amplitude: 45 },
    { center: 62.7, width: 0.4, amplitude: 50 },
  ];

  return sampleRange(10, 80, count, (x, index) => {
    const baseline = 8 + 0.9 * Math.sin(index * 0.11) + 0.45 * Math.sin(index * 0.37);
    return baseline + peaks.reduce((sum, peak) => sum + gaussian(x, peak), 0);
  });
}

export function generateRamanTrace(count = 260): SyntheticTracePoint[] {
  const peaks: Peak[] = [
    { center: 205, width: 9, amplitude: 10 },
    { center: 300, width: 12, amplitude: 36 },
    { center: 480, width: 15, amplitude: 42 },
    { center: 560, width: 18, amplitude: 18 },
    { center: 690, width: 14, amplitude: 66 },
  ];

  return sampleRange(150, 850, count, (x, index) => {
    const baseline = 11 + 1.1 * Math.sin(index * 0.08) + 0.5 * Math.sin(index * 0.29);
    return baseline + peaks.reduce((sum, peak) => sum + gaussian(x, peak), 0);
  });
}

export function generateFtirTrace(count = 260): SyntheticTracePoint[] {
  const bands: Peak[] = [
    { center: 560, width: 55, amplitude: 22 },
    { center: 1100, width: 90, amplitude: 17 },
    { center: 1630, width: 80, amplitude: 12 },
    { center: 3400, width: 220, amplitude: 24 },
  ];

  return sampleRange(400, 4000, count, (x, index) => {
    const baseline = 91 + 1.2 * Math.sin(index * 0.045);
    return baseline - bands.reduce((sum, band) => sum + gaussian(x, band), 0);
  });
}

export function generateXpsTrace(count = 260): SyntheticTracePoint[] {
  const envelopes: Peak[] = [
    { center: 529.7, width: 2.6, amplitude: 32 },
    { center: 710.6, width: 4.2, amplitude: 50 },
    { center: 724.3, width: 5.2, amplitude: 38 },
    { center: 933.4, width: 4.7, amplitude: 56 },
    { center: 953.2, width: 5.4, amplitude: 42 },
  ];

  return sampleRange(500, 970, count, (x, index) => {
    const slopingBackground = 12 + (970 - x) * 0.015 + 1.4 * Math.sin(index * 0.06);
    return slopingBackground + envelopes.reduce((sum, peak) => sum + gaussian(x, peak), 0);
  });
}

export function generateUvVisTrace(count = 220): SyntheticTracePoint[] {
  return sampleRange(300, 850, count, (x) => {
    const absorptionEdge = 1 / (1 + Math.exp((x - 515) / 34));
    const shoulder = gaussian(x, { center: 680, width: 90, amplitude: 0.18 });
    return 0.18 + 0.82 * absorptionEdge + shoulder;
  });
}

export function generateVsmTrace(count = 240): SyntheticTracePoint[] {
  return Array.from({ length: count }, (_, index) => {
    const phase = index / (count - 1);
    const field = phase < 0.5 ? -12 + phase * 48 : 12 - (phase - 0.5) * 48;
    const branchOffset = phase < 0.5 ? 1.6 : -1.6;
    const y = 58 * Math.tanh((field + branchOffset) / 3.4);
    return { x: field, y };
  });
}

export function createSvgPath(points: SyntheticTracePoint[], width = 500, height = 120, padding = 8) {
  if (points.length === 0) return '';

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const xSpan = maxX - minX || 1;
  const ySpan = maxY - minY || 1;

  return points
    .map((point, index) => {
      const x = padding + ((point.x - minX) / xSpan) * (width - padding * 2);
      const y = padding + (1 - (point.y - minY) / ySpan) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}
