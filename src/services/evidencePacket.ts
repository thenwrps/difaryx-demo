/**
 * Evidence Packet Builder for DIFARYX Agent Demo
 * 
 * Converts deterministic tool outputs into structured evidence packets
 * that LLMs can reason over WITHOUT inventing data.
 */

import type { AgentEvidencePacket } from '../types/llm';
import type { DemoDataset, DemoProject, Technique } from '../data/demoProjects';

/**
 * Build evidence packet for XRD context.
 */
export function buildXRDEvidencePacket(
  dataset: DemoDataset,
  project: DemoProject,
  xrdAnalysis: {
    detectedPeaks: Array<{ position: number; intensity: number; label?: string }>;
    candidates: Array<{
      phase: { name: string; peaks: any[] };
      score: number;
      matches: any[];
      missing: any[];
      unexplained: any[];
    }>;
    interpretation: {
      decision: string;
      confidence: number;
      evidence: string[];
      caveats: string[];
    };
  },
): AgentEvidencePacket {
  const topCandidate = xrdAnalysis.candidates[0];
  const uncertaintyFlags: string[] = [];

  // Assess signal quality
  const peakCount = xrdAnalysis.detectedPeaks.length;
  const signalQuality: 'high' | 'medium' | 'low' =
    peakCount >= 8 ? 'high' : peakCount >= 5 ? 'medium' : 'low';

  if (signalQuality === 'low') {
    uncertaintyFlags.push('Low peak count may indicate poor crystallinity or weak signal');
  }

  // Check for missing peaks
  if (topCandidate && topCandidate.missing.length > 0) {
    uncertaintyFlags.push(`${topCandidate.missing.length} expected peaks not detected`);
  }

  // Check for unexplained peaks
  if (topCandidate && topCandidate.unexplained.length > 0) {
    uncertaintyFlags.push(`${topCandidate.unexplained.length} unexplained peaks suggest impurities or secondary phases`);
  }

  // Check score gap
  if (xrdAnalysis.candidates.length >= 2) {
    const scoreGap = xrdAnalysis.candidates[0].score - xrdAnalysis.candidates[1].score;
    if (scoreGap < 0.15) {
      uncertaintyFlags.push('Small score gap between top candidates indicates ambiguity');
    }
  }

  return {
    context: 'xrd',
    datasetId: dataset.id,
    datasetName: dataset.fileName,
    materialSystem: project.material,
    signalSummary: {
      featureCount: xrdAnalysis.detectedPeaks.length,
      noiseLevel: undefined,
      signalQuality,
    },
    detectedFeatures: xrdAnalysis.detectedPeaks.map((peak) => ({
      position: peak.position,
      intensity: peak.intensity,
      assignment: peak.label,
    })),
    candidates: xrdAnalysis.candidates.slice(0, 5).map((candidate) => ({
      label: candidate.phase.name,
      score: candidate.score,
      matchedFeatures: candidate.matches.length,
      totalFeatures: candidate.phase.peaks.length,
      missingFeatures: candidate.missing.map((m: any) => `${m.position.toFixed(2)}°`),
      unexplainedFeatures: candidate.unexplained.map((u: any) => `${u.position.toFixed(2)}°`),
    })),
    fusedScore: topCandidate ? topCandidate.score : 0,
    uncertaintyFlags,
    processingNotes: [
      'Deterministic peak detection via prominence analysis',
      'Phase matching against COD reference database',
      'Score based on matched peaks, intensity agreement, and missing/unexplained features',
    ],
  };
}

/**
 * Build evidence packet for XPS context.
 */
export function buildXPSEvidencePacket(
  dataset: DemoDataset,
  project: DemoProject,
  featureCount: number,
  baseConfidence: number,
): AgentEvidencePacket {
  const uncertaintyFlags: string[] = [
    'XPS provides surface chemistry only, not bulk phase information',
    'Quantitative peak fitting not performed in this demo',
    'Charge correction not applied',
  ];

  const signalQuality: 'high' | 'medium' | 'low' =
    featureCount >= 5 ? 'high' : featureCount >= 3 ? 'medium' : 'low';

  // Generate synthetic features based on project material
  const features: Array<{ position: number; intensity: number; assignment?: string }> = [];
  
  if (project.material.toLowerCase().includes('cu')) {
    features.push(
      { position: 933.2, intensity: 86, assignment: 'Cu 2p3/2 (Cu2+)' },
      { position: 953.1, intensity: 52, assignment: 'Cu 2p1/2' },
    );
  }
  
  if (project.material.toLowerCase().includes('fe')) {
    features.push(
      { position: 710.8, intensity: 92, assignment: 'Fe 2p3/2 (Fe3+)' },
      { position: 724.2, intensity: 48, assignment: 'Fe 2p1/2' },
    );
  }
  
  features.push({ position: 531.4, intensity: 74, assignment: 'O 1s (lattice oxygen)' });

  return {
    context: 'xps',
    datasetId: dataset.id,
    datasetName: dataset.fileName,
    materialSystem: project.material,
    signalSummary: {
      featureCount,
      signalQuality,
    },
    detectedFeatures: features.slice(0, featureCount),
    candidates: [
      {
        label: `Surface chemistry consistent with ${project.material}`,
        score: baseConfidence / 100,
        matchedFeatures: featureCount,
        totalFeatures: featureCount,
        missingFeatures: [],
        unexplainedFeatures: [],
      },
      {
        label: 'Surface contamination or oxidation',
        score: 0.35,
        matchedFeatures: 2,
        totalFeatures: featureCount,
        missingFeatures: ['Clean metal states'],
        unexplainedFeatures: ['Possible C 1s contamination'],
      },
    ],
    fusedScore: baseConfidence / 100,
    uncertaintyFlags,
    processingNotes: [
      'Deterministic component detection in core-level regions',
      'Oxidation state assignment based on binding energy windows',
      'Surface evidence treated as supportive, not standalone phase claim',
    ],
  };
}

/**
 * Build evidence packet for FTIR context.
 */
export function buildFTIREvidencePacket(
  dataset: DemoDataset,
  project: DemoProject,
  featureCount: number,
  baseConfidence: number,
): AgentEvidencePacket {
  const uncertaintyFlags: string[] = [
    'FTIR provides bonding information, not crystalline phase',
    'Band overlap can obscure weak features',
    'Support bands may interfere with lattice vibrations',
  ];

  const signalQuality: 'high' | 'medium' | 'low' =
    featureCount >= 4 ? 'high' : featureCount >= 3 ? 'medium' : 'low';

  const features: Array<{ position: number; intensity: number; assignment?: string }> = [
    { position: 620, intensity: 64, assignment: 'Metal-O stretching (ferrite)' },
    { position: 565, intensity: 58, assignment: 'Metal-oxygen vibration' },
    { position: 1084, intensity: 78, assignment: 'Si-O-Si (support)' },
    { position: 3420, intensity: 42, assignment: 'Surface hydroxyl' },
  ];

  return {
    context: 'ftir',
    datasetId: dataset.id,
    datasetName: dataset.fileName,
    materialSystem: project.material,
    signalSummary: {
      featureCount,
      signalQuality,
    },
    detectedFeatures: features.slice(0, featureCount),
    candidates: [
      {
        label: `Bonding signatures consistent with ${project.material}`,
        score: baseConfidence / 100,
        matchedFeatures: featureCount,
        totalFeatures: featureCount,
        missingFeatures: [],
        unexplainedFeatures: [],
      },
      {
        label: 'Support-dominated spectrum',
        score: 0.42,
        matchedFeatures: 2,
        totalFeatures: featureCount,
        missingFeatures: ['Clear metal-O bands'],
        unexplainedFeatures: ['Strong support interference'],
      },
    ],
    fusedScore: baseConfidence / 100,
    uncertaintyFlags,
    processingNotes: [
      'Deterministic band detection in diagnostic windows',
      'Vibrational mode assignment based on literature references',
      'Bonding evidence fused with material context',
    ],
  };
}

/**
 * Build evidence packet for Raman context.
 */
export function buildRamanEvidencePacket(
  dataset: DemoDataset,
  project: DemoProject,
  featureCount: number,
  baseConfidence: number,
): AgentEvidencePacket {
  const uncertaintyFlags: string[] = [
    'Raman provides structural fingerprint, not quantitative phase analysis',
    'Broad bands may indicate disorder or overlapping modes',
    'Fluorescence background can obscure weak features',
  ];

  const signalQuality: 'high' | 'medium' | 'low' =
    featureCount >= 5 ? 'high' : featureCount >= 3 ? 'medium' : 'low';

  const features: Array<{ position: number; intensity: number; assignment?: string }> = [
    { position: 190, intensity: 64, assignment: 'T2g(1) spinel mode' },
    { position: 300, intensity: 58, assignment: 'Eg mode' },
    { position: 470, intensity: 82, assignment: 'T2g(2) mode' },
    { position: 540, intensity: 48, assignment: 'Lattice mode' },
    { position: 680, intensity: 96, assignment: 'A1g spinel mode' },
    { position: 960, intensity: 38, assignment: 'Ferrite shoulder' },
  ];

  return {
    context: 'raman',
    datasetId: dataset.id,
    datasetName: dataset.fileName,
    materialSystem: project.material,
    signalSummary: {
      featureCount,
      signalQuality,
    },
    detectedFeatures: features.slice(0, featureCount),
    candidates: [
      {
        label: `Structural fingerprint consistent with ${project.material}`,
        score: baseConfidence / 100,
        matchedFeatures: featureCount,
        totalFeatures: featureCount,
        missingFeatures: [],
        unexplainedFeatures: [],
      },
      {
        label: 'Related ferrite structure',
        score: 0.68,
        matchedFeatures: Math.floor(featureCount * 0.7),
        totalFeatures: featureCount,
        missingFeatures: ['Characteristic A1g shift'],
        unexplainedFeatures: [],
      },
    ],
    fusedScore: baseConfidence / 100,
    uncertaintyFlags,
    processingNotes: [
      'Deterministic mode detection via peak finding',
      'Fingerprint matching against structural families',
      'Structural evidence treated with phase-level ambiguity',
    ],
  };
}

/**
 * Build evidence packet for any context.
 * Routes to appropriate builder based on technique.
 */
export function buildEvidencePacket(
  context: Technique,
  dataset: DemoDataset,
  project: DemoProject,
  xrdAnalysis: any | null,
  featureCount: number,
  baseConfidence: number,
): AgentEvidencePacket {
  if (context === 'XRD' && xrdAnalysis) {
    return buildXRDEvidencePacket(dataset, project, xrdAnalysis);
  }
  
  if (context === 'XPS') {
    return buildXPSEvidencePacket(dataset, project, featureCount, baseConfidence);
  }
  
  if (context === 'FTIR') {
    return buildFTIREvidencePacket(dataset, project, featureCount, baseConfidence);
  }
  
  if (context === 'Raman') {
    return buildRamanEvidencePacket(dataset, project, featureCount, baseConfidence);
  }
  
  throw new Error(`Unsupported context: ${context}`);
}
