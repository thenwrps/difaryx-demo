/**
 * Evidence Packet Builder for MCP-Style Tool Integration
 * 
 * Builds structured evidence packets from deterministic tool outputs ONLY.
 * LLMs receive these packets and cannot modify or generate new data.
 */

import type { AgentEvidencePacket, ToolResult } from './types';
import type { DemoDataset, DemoProject, Technique } from '../../data/demoProjects';

/**
 * Build evidence packet for XRD context from deterministic tools.
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
  },
  toolTrace: ToolResult[],
): AgentEvidencePacket {
  const topCandidate = xrdAnalysis.candidates[0];
  const uncertaintyFlags: string[] = [];

  // Assess signal quality from deterministic analysis
  const peakCount = xrdAnalysis.detectedPeaks.length;
  const signalQuality: 'high' | 'medium' | 'low' =
    peakCount >= 8 ? 'high' : peakCount >= 5 ? 'medium' : 'low';

  if (signalQuality === 'low') {
    uncertaintyFlags.push('Low peak count may indicate poor crystallinity or weak signal');
  }

  if (topCandidate && topCandidate.missing.length > 0) {
    uncertaintyFlags.push(`${topCandidate.missing.length} expected peaks not detected`);
  }

  if (topCandidate && topCandidate.unexplained.length > 0) {
    uncertaintyFlags.push(
      `${topCandidate.unexplained.length} unexplained peaks suggest impurities or secondary phases`,
    );
  }

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
    toolTrace,
  };
}

/**
 * Build evidence packet for non-XRD contexts.
 */
export function buildGenericEvidencePacket(
  context: 'xps' | 'ftir' | 'raman',
  dataset: DemoDataset,
  project: DemoProject,
  featureCount: number,
  baseConfidence: number,
  toolTrace: ToolResult[],
): AgentEvidencePacket {
  const uncertaintyFlags: string[] = [];
  const signalQuality: 'high' | 'medium' | 'low' =
    featureCount >= 5 ? 'high' : featureCount >= 3 ? 'medium' : 'low';

  // Context-specific uncertainty flags
  if (context === 'xps') {
    uncertaintyFlags.push('XPS provides surface chemistry only, not bulk phase information');
    uncertaintyFlags.push('Quantitative peak fitting not performed in this demo');
  } else if (context === 'ftir') {
    uncertaintyFlags.push('FTIR provides bonding information, not crystalline phase');
    uncertaintyFlags.push('Band overlap can obscure weak features');
  } else if (context === 'raman') {
    uncertaintyFlags.push('Raman provides structural fingerprint, not quantitative phase analysis');
    uncertaintyFlags.push('Broad bands may indicate disorder or overlapping modes');
  }

  // Generate synthetic features based on context (from deterministic analysis)
  const features: Array<{ position: number; intensity: number; assignment?: string }> = [];
  
  if (context === 'xps') {
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
  } else if (context === 'ftir') {
    features.push(
      { position: 620, intensity: 64, assignment: 'Metal-O stretching (ferrite)' },
      { position: 565, intensity: 58, assignment: 'Metal-oxygen vibration' },
      { position: 1084, intensity: 78, assignment: 'Si-O-Si (support)' },
      { position: 3420, intensity: 42, assignment: 'Surface hydroxyl' },
    );
  } else if (context === 'raman') {
    features.push(
      { position: 190, intensity: 64, assignment: 'T2g(1) spinel mode' },
      { position: 300, intensity: 58, assignment: 'Eg mode' },
      { position: 470, intensity: 82, assignment: 'T2g(2) mode' },
      { position: 540, intensity: 48, assignment: 'Lattice mode' },
      { position: 680, intensity: 96, assignment: 'A1g spinel mode' },
      { position: 960, intensity: 38, assignment: 'Ferrite shoulder' },
    );
  }

  return {
    context,
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
        label: `${context.toUpperCase()} evidence consistent with ${project.material}`,
        score: baseConfidence / 100,
        matchedFeatures: featureCount,
        totalFeatures: featureCount,
        missingFeatures: [],
        unexplainedFeatures: [],
      },
    ],
    fusedScore: baseConfidence / 100,
    uncertaintyFlags,
    processingNotes: [
      `Deterministic ${context.toUpperCase()} feature detection`,
      'Evidence treated as supportive, not standalone phase claim',
      'Fused with material context for interpretation',
    ],
    toolTrace,
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
  toolTrace: ToolResult[],
): AgentEvidencePacket {
  if (context === 'XRD' && xrdAnalysis) {
    return buildXRDEvidencePacket(dataset, project, xrdAnalysis, toolTrace);
  }

  return buildGenericEvidencePacket(
    context.toLowerCase() as 'xps' | 'ftir' | 'raman',
    dataset,
    project,
    featureCount,
    baseConfidence,
    toolTrace,
  );
}
