/**
 * Test FTIR Band Detection
 * Verify that the fixed detection produces 5-10 meaningful bands only
 */

// Simulate the FTIR processing
function generateFtirSpectrum() {
  const wavenumber = [];
  const absorbance = [];
  
  for (let wn = 4000; wn >= 400; wn -= 2) {
    wavenumber.push(wn);
    
    let signal = 0.05 + (4000 - wn) / 40000;
    signal += (Math.random() - 0.5) * 0.008;
    
    // Band 1: Surface hydroxyl (O–H stretch) at ~3400 cm⁻¹ (broad)
    const oh_stretch = 0.45 * Math.exp(-Math.pow((wn - 3400) / 100, 2));
    
    // Band 2: Adsorbed water (H–O–H bend) at ~1630 cm⁻¹ (medium)
    const water_bend = 0.25 * Math.exp(-Math.pow((wn - 1630) / 30, 2));
    
    // Band 3: Carbonate (CO₃²⁻) at ~1450 cm⁻¹ (medium)
    const carbonate = 0.18 * Math.exp(-Math.pow((wn - 1450) / 35, 2));
    
    // Band 4: Carboxylate (COO⁻) at ~1550 cm⁻¹ (medium)
    const carboxylate = 0.15 * Math.exp(-Math.pow((wn - 1550) / 40, 2));
    
    // Band 5: Metal-oxygen (M–O stretch) at ~550 cm⁻¹ (broad)
    const metal_oxygen = 0.35 * Math.exp(-Math.pow((wn - 550) / 50, 2));
    
    // Band 6: C–H stretch at ~2920 cm⁻¹ (narrow, minor)
    const ch_stretch = 0.08 * Math.exp(-Math.pow((wn - 2920) / 15, 2));
    
    signal += oh_stretch + water_bend + carbonate + carboxylate + metal_oxygen + ch_stretch;
    
    absorbance.push(Number(signal.toFixed(4)));
  }
  
  return { wavenumber, absorbance };
}

function correctBaseline(dataPoints, method = 'Polynomial') {
  const n = dataPoints.length;
  const baseline = new Array(n);
  
  const minY = Math.min(...dataPoints.map(p => p.y));
  for (let i = 0; i < n; i++) {
    const progress = i / (n - 1);
    baseline[i] = minY + (dataPoints[0].y - minY) * (1 - progress) * 0.3;
  }
  
  const corrected = dataPoints.map((p, i) => ({
    x: p.x,
    y: Math.max(0, p.y - baseline[i]),
  }));
  
  return { corrected, baseline };
}

function smoothData(dataPoints, windowSize = 9) {
  const halfWindow = Math.floor(windowSize / 2);
  const smoothed = [];
  
  for (let i = 0; i < dataPoints.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(dataPoints.length, i + halfWindow + 1);
    const window = dataPoints.slice(start, end);
    
    const avg = window.reduce((sum, p) => sum + p.y, 0) / window.length;
    
    smoothed.push({
      x: dataPoints[i].x,
      y: avg,
    });
  }
  
  return smoothed;
}

function detectBands(dataPoints, prominence = 0.1, minDistance = 20, minHeight = 0.05) {
  const candidateBands = [];
  const maxIntensity = Math.max(...dataPoints.map(p => p.y));
  const prominenceThreshold = prominence * maxIntensity;
  const heightThreshold = minHeight * maxIntensity;
  
  // Step 3a: Detect all local maxima
  for (let i = 1; i < dataPoints.length - 1; i++) {
    const curr = dataPoints[i];
    const prev = dataPoints[i - 1];
    const next = dataPoints[i + 1];
    
    if (curr.y > prev.y && curr.y > next.y) {
      if (curr.y >= prominenceThreshold && curr.y >= heightThreshold) {
        const tooClose = candidateBands.some(band => 
          Math.abs(curr.x - band.wavenumber) < minDistance
        );
        
        if (!tooClose) {
          const halfMax = curr.y / 2;
          let leftIdx = i;
          let rightIdx = i;
          
          while (leftIdx > 0 && dataPoints[leftIdx].y > halfMax) leftIdx--;
          while (rightIdx < dataPoints.length - 1 && dataPoints[rightIdx].y > halfMax) rightIdx++;
          
          const fwhm = Math.abs(dataPoints[leftIdx].x - dataPoints[rightIdx].x);
          
          let classification;
          if (fwhm < 50) {
            classification = 'narrow';
          } else if (fwhm <= 100) {
            classification = 'medium';
          } else {
            classification = 'broad';
          }
          
          const area = curr.y * fwhm * 0.8;
          
          const windowSize = 50;
          const startIdx = Math.max(0, i - windowSize);
          const endIdx = Math.min(dataPoints.length - 1, i + windowSize);
          const localMin = Math.min(...dataPoints.slice(startIdx, endIdx + 1).map(p => p.y));
          const localProminence = curr.y - localMin;
          
          candidateBands.push({
            id: `band-${candidateBands.length + 1}`,
            wavenumber: curr.x,
            intensity: curr.y,
            rawIntensity: curr.y,
            prominence: localProminence,
            fwhm: fwhm,
            area: area,
            classification: classification,
          });
        }
      }
    }
  }
  
  console.log(`\nCandidate bands detected: ${candidateBands.length}`);
  
  // Step 3b: Apply strict meaningful band filter
  const meaningfulBands = candidateBands.filter(band => {
    if (band.intensity < 0.08) {
      return false;
    }
    
    if (band.fwhm > 500) {
      return false;
    }
    
    if (band.prominence < 0.04) {
      return false;
    }
    
    if (band.wavenumber >= 2000 && band.wavenumber <= 3000) {
      if (Math.abs(band.wavenumber - 2920) > 100 || band.intensity < 0.08) {
        return false;
      }
    }
    
    if (band.area < 2.0) {
      return false;
    }
    
    return true;
  });
  
  console.log(`After meaningful filter: ${meaningfulBands.length}`);
  
  // Step 3c: Remove near-duplicates
  const filteredBands = [];
  const sortedByIntensity = [...meaningfulBands].sort((a, b) => b.intensity - a.intensity);
  
  for (const band of sortedByIntensity) {
    const tooClose = filteredBands.some(existing => 
      Math.abs(band.wavenumber - existing.wavenumber) < 40
    );
    
    if (!tooClose) {
      filteredBands.push(band);
    }
  }
  
  filteredBands.sort((a, b) => b.wavenumber - a.wavenumber);
  
  filteredBands.forEach((band, index) => {
    band.id = `band-${index + 1}`;
  });
  
  console.log(`After duplicate removal: ${filteredBands.length}`);
  
  return filteredBands;
}

// Run test
console.log('=== FTIR Band Detection Test ===\n');

const spectrum = generateFtirSpectrum();
const dataPoints = spectrum.wavenumber.map((wn, i) => ({
  x: wn,
  y: spectrum.absorbance[i],
}));

console.log(`Total data points: ${dataPoints.length}`);

const { corrected } = correctBaseline(dataPoints);
console.log('Baseline correction applied');

const smoothed = smoothData(corrected);
console.log('Smoothing applied');

const bands = detectBands(smoothed);

console.log('\n=== FINAL RESULTS ===');
console.log(`Detected bands: ${bands.length}`);
console.log('\nBand List:');
bands.forEach((band, index) => {
  console.log(`${index + 1}. ${band.wavenumber.toFixed(0)} cm⁻¹ - Intensity: ${band.intensity.toFixed(3)}, FWHM: ${band.fwhm.toFixed(0)}, Area: ${band.area.toFixed(1)}, Class: ${band.classification}`);
});

console.log('\n=== TEST RESULT ===');
if (bands.length >= 5 && bands.length <= 10) {
  console.log('✅ PASS: Band count is within target range (5-10)');
} else {
  console.log(`❌ FAIL: Band count ${bands.length} is outside target range (5-10)`);
}

// Check for expected bands
const expectedBands = [
  { name: 'O-H stretch', range: [3300, 3500] },
  { name: 'C-H stretch', range: [2850, 2990] },
  { name: 'H-O-H bend', range: [1600, 1660] },
  { name: 'Carboxylate', range: [1500, 1600] },
  { name: 'Carbonate', range: [1400, 1500] },
  { name: 'M-O stretch', range: [500, 600] },
];

console.log('\nExpected bands check:');
expectedBands.forEach(expected => {
  const found = bands.find(b => b.wavenumber >= expected.range[0] && b.wavenumber <= expected.range[1]);
  if (found) {
    console.log(`✅ ${expected.name}: Found at ${found.wavenumber.toFixed(0)} cm⁻¹`);
  } else {
    console.log(`⚠️  ${expected.name}: Not found in range ${expected.range[0]}-${expected.range[1]} cm⁻¹`);
  }
});
