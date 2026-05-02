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
  // Raman modes for CuFe₂O₄ based on reference data (Graves et al., 1988)
  // Mode positions match src/data/ramanReferenceData.ts
  // Group theory predicts 5 Raman-active modes for spinel: A₁g + Eg + 3T₂g
  // Width parameter is σ (standard deviation); FWHM = 2.355 × σ
  const peaks: Peak[] = [
    // T₂g mode 1 - Asymmetric bending (lowest frequency)
    // Target FWHM: 20-40 cm⁻¹ → σ ≈ 12.7 cm⁻¹ (for FWHM ~30 cm⁻¹)
    { center: 210, width: 12.7, amplitude: 20 },
    // Eg mode - Symmetric bending vibration
    // Target FWHM: 20-40 cm⁻¹ → σ ≈ 12.7 cm⁻¹ (for FWHM ~30 cm⁻¹)
    { center: 300, width: 12.7, amplitude: 40 },
    // T₂g mode 2 - Asymmetric bending/stretching (intermediate frequency)
    // Target FWHM: 15-35 cm⁻¹ → σ ≈ 10.6 cm⁻¹ (for FWHM ~25 cm⁻¹)
    { center: 480, width: 10.6, amplitude: 50 },
    // T₂g mode 3 - Asymmetric stretching (highest frequency)
    // Target FWHM: 15-35 cm⁻¹ → σ ≈ 10.6 cm⁻¹ (for FWHM ~25 cm⁻¹)
    { center: 560, width: 10.6, amplitude: 60 },
    // A₁g mode - Symmetric stretching (strongest mode)
    // Target FWHM: 15-30 cm⁻¹ → σ ≈ 9.3 cm⁻¹ (for FWHM ~22 cm⁻¹)
    { center: 690, width: 9.3, amplitude: 100 },
  ];

  return sampleRange(150, 850, count, (x, index) => {
    // Fluorescence background typical of visible excitation (532 nm or 633 nm laser)
    // Exponentially decaying background with gentle slope
    const normalizedX = (x - 150) / 700; // Normalize to [0, 1]
    const fluorescenceDecay = 15 * Math.exp(-normalizedX * 0.8); // Exponential decay
    const gentleSlope = 8 - 2 * normalizedX; // Slight downward slope
    const undulation = 0.8 * Math.sin(index * 0.06) + 0.4 * Math.sin(index * 0.23);
    const baseline = fluorescenceDecay + gentleSlope + undulation;
    
    return baseline + peaks.reduce((sum, peak) => sum + gaussian(x, peak), 0);
  });
}

export function generateFtirTrace(count = 260): SyntheticTracePoint[] {
  // FTIR bands for CuFe₂O₄ based on reference data (Waldron, 1955)
  // Band positions match src/data/ftirReferenceData.ts
  const bands: Peak[] = [
    // Octahedral site metal-oxygen stretching (400 cm⁻¹)
    { center: 400, width: 60, amplitude: 18 },
    // Tetrahedral site Fe-O stretching (580 cm⁻¹)
    { center: 580, width: 55, amplitude: 24 },
    // Adsorbed water H-O-H bending (1630 cm⁻¹)
    { center: 1630, width: 65, amplitude: 12 },
    // Surface hydroxyl O-H stretching (3400 cm⁻¹)
    { center: 3400, width: 95, amplitude: 20 },
  ];

  return sampleRange(400, 4000, count, (x, index) => {
    // Realistic baseline drift typical of transmission measurements
    // Combines linear drift with gentle undulation
    const normalizedX = (x - 400) / 3600; // Normalize to [0, 1]
    const linearDrift = 91 + 3.5 * normalizedX; // Gradual upward drift
    const undulation = 1.8 * Math.sin(index * 0.035) + 0.9 * Math.sin(index * 0.12);
    const baseline = linearDrift + undulation;
    
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
