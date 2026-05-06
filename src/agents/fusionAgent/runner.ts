/**
 * Fusion Agent Runner
 * 
 * Cross-Tech Evidence Fusion for combining XPS, FTIR, and Raman evidence
 */

import type { XpsProcessingResult } from '../xpsAgent/runner';
import type { FtirProcessingResult } from '../ftirAgent/types';
import type { RamanProcessingResult } from '../ramanAgent/types';
import type {
  EvidenceItem,
  Claim,
  TechniqueSupport,
  Contradiction,
  FusionResult,
  FusionDecision,
  EvidenceMatrix,
  MatrixCell,
  TechniqueType,
  SupportType,
  ClaimHierarchy,
  TECHNIQUE_AUTHORITY_WEIGHTS,
  HIERARCHY_MULTIPLIERS,
  CONTRADICTION_SEVERITY_MULTIPLIERS,
} from './types';

// ============================================================================
// Evidence Extraction Functions
// ============================================================================

/**
 * Extract evidence items from XPS processing result
 */
function extractXpsEvidence(result: XpsProcessingResult): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  
  // Extract oxidation states from state aggregations
  if (result.stateAggregations) {
    for (const state of result.stateAggregations) {
      evidence.push({
        technique: 'XPS',
        type: 'oxidation-state',
        value: `${state.element}${state.state}`,
        confidence: state.confidence === 'high' ? 0.85 : state.confidence === 'medium' ? 0.65 : 0.45,
        weight: 1.0, // Primary oxidation state
        label: `${state.element} ${state.state} (${state.matchedOrbitals.join(', ')})`,
      });
    }
  }
  
  // Extract satellite features
  if (result.stateAggregations) {
    for (const state of result.stateAggregations) {
      if (state.hasSatellite && state.satelliteEvidence.length > 0) {
        evidence.push({
          technique: 'XPS',
          type: 'satellite',
          value: `${state.element}${state.state} satellite`,
          confidence: 0.8,
          weight: 0.8,
          label: `${state.element}${state.state} satellite peak detected`,
        });
      }
    }
  }
  
  return evidence;
}

/**
 * Extract evidence items from FTIR processing result
 */
function extractFtirEvidence(result: FtirProcessingResult): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  
  // Extract functional groups
  for (const group of result.functionalGroupCandidates) {
    const firstMatch = group.matches[0];
    if (!firstMatch) continue;
    
    evidence.push({
      technique: 'FTIR',
      type: 'functional-group',
      value: group.functionalGroup,
      confidence: group.score,
      weight: group.ambiguity ? 0.6 : 1.0,
      label: `${group.functionalGroup} at ${firstMatch.observedBand.wavenumber.toFixed(0)} cm⁻¹`,
    });
  }
  
  return evidence;
}

/**
 * Extract evidence items from Raman processing result
 */
function extractRamanEvidence(result: RamanProcessingResult): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  
  // Extract vibrational modes
  for (const mode of result.modeCandidate) {
    const firstMatch = mode.matches[0];
    if (!firstMatch) continue;
    
    // Determine weight based on mode type
    let weight = 0.6;
    if (mode.modeName.includes('A1g')) {
      weight = 1.0; // Primary diagnostic
    } else if (mode.modeName.includes('Eg') || mode.modeName.includes('T2g')) {
      weight = 0.8; // Supporting modes
    } else if (mode.modeName.includes('D band') || mode.modeName.includes('G band')) {
      weight = 0.5; // Carbon bands
    }
    
    evidence.push({
      technique: 'Raman',
      type: 'vibrational-mode',
      value: mode.modeName,
      confidence: mode.score,
      weight: weight,
      label: `${mode.modeName} at ${firstMatch.observedPeak.ramanShift.toFixed(0)} cm⁻¹`,
    });
  }
  
  return evidence;
}

// ============================================================================
// Evidence Aggregation
// ============================================================================

/**
 * Aggregate evidence score using weighted average
 */
function aggregateEvidenceScore(evidenceItems: EvidenceItem[]): number {
  if (evidenceItems.length === 0) return 0;
  
  const weightedSum = evidenceItems.reduce((sum, item) => 
    sum + (item.confidence * item.weight), 0);
  const totalWeight = evidenceItems.reduce((sum, item) => 
    sum + item.weight, 0);
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// ============================================================================
// Claim Evaluators
// ============================================================================

/**
 * Evaluate Spinel Structure Claim
 * Authority: Raman (structure), XPS (corroboration), FTIR (context)
 */
function evaluateSpinelStructureClaim(
  xpsEvidence: EvidenceItem[],
  ftirEvidence: EvidenceItem[],
  ramanEvidence: EvidenceItem[]
): Claim {
  const supportingTechniques: TechniqueSupport[] = [];
  
  // Raman has authority for spinel structure
  const hasA1g = ramanEvidence.some(e => e.value === 'A1g spinel ferrite');
  const hasEg = ramanEvidence.some(e => e.value === 'Eg ferrite mode');
  const hasLowerFerrite = ramanEvidence.some(e => e.value === 'Lower ferrite mode');
  
  let ramanSupport: SupportType = 'neutral';
  let ramanReasoning = '';
  const ramanEvidenceItems: EvidenceItem[] = [];
  
  if (hasA1g && (hasEg || hasLowerFerrite)) {
    ramanSupport = 'supports';
    ramanReasoning = 'A1g mode with supporting Eg/T2g modes consistent with spinel structure';
    ramanEvidenceItems.push(...ramanEvidence.filter(e => 
      e.value === 'A1g spinel ferrite' || e.value === 'Eg ferrite mode' || e.value === 'Lower ferrite mode'
    ));
  } else if (hasA1g) {
    ramanSupport = 'supports';
    ramanReasoning = 'A1g mode suggests spinel structure (limited supporting evidence)';
    ramanEvidenceItems.push(...ramanEvidence.filter(e => e.value === 'A1g spinel ferrite'));
  }
  
  supportingTechniques.push({
    technique: 'Raman',
    support: ramanSupport,
    evidenceItems: ramanEvidenceItems,
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['spinel-structure'].raman,
    reasoning: ramanReasoning,
  });
  
  // XPS provides corroborating evidence for oxidation states
  const hasCu2 = xpsEvidence.some(e => e.type === 'oxidation-state' && e.value.includes('Cu²⁺'));
  const hasFe3 = xpsEvidence.some(e => e.type === 'oxidation-state' && e.value.includes('Fe³⁺'));
  
  let xpsSupport: SupportType = 'neutral';
  let xpsReasoning = '';
  const xpsEvidenceItems: EvidenceItem[] = [];
  
  if (hasCu2 || hasFe3) {
    xpsSupport = 'supports';
    xpsReasoning = 'Oxidation states consistent with ferrite chemistry';
    xpsEvidenceItems.push(...xpsEvidence.filter(e => 
      e.type === 'oxidation-state' && (e.value.includes('Cu²⁺') || e.value.includes('Fe³⁺'))
    ));
  }
  
  supportingTechniques.push({
    technique: 'XPS',
    support: xpsSupport,
    evidenceItems: xpsEvidenceItems,
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['spinel-structure'].xps,
    reasoning: xpsReasoning,
  });
  
  // FTIR provides neutral evidence (M-O band supports metal oxide but not spinel specifically)
  const hasMO = ftirEvidence.some(e => e.value === 'Metal-oxygen');
  
  let ftirSupport: SupportType = 'neutral';
  let ftirReasoning = 'FTIR M-O band supports metal oxide framework but does not confirm spinel structure';
  const ftirEvidenceItems: EvidenceItem[] = [];
  
  if (hasMO) {
    ftirEvidenceItems.push(...ftirEvidence.filter(e => e.value === 'Metal-oxygen'));
  }
  
  supportingTechniques.push({
    technique: 'FTIR',
    support: ftirSupport,
    evidenceItems: ftirEvidenceItems,
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['spinel-structure'].ftir,
    reasoning: ftirReasoning,
  });
  
  // Calculate confidence using weighted technique scores
  const techniqueScores = new Map<TechniqueType, number>();
  techniqueScores.set('Raman', aggregateEvidenceScore(ramanEvidenceItems));
  techniqueScores.set('XPS', aggregateEvidenceScore(xpsEvidenceItems));
  techniqueScores.set('FTIR', aggregateEvidenceScore(ftirEvidenceItems));
  
  const confidenceScore = calculateClaimConfidence(
    techniqueScores,
    TECHNIQUE_AUTHORITY_WEIGHTS['spinel-structure'],
    0, // No contradiction penalty yet
    HIERARCHY_MULTIPLIERS.primary
  );
  
  // Determine status and confidence level
  let status: 'supported' | 'unresolved' | 'contradicted' = 'unresolved';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (ramanSupport === 'supports' && xpsSupport === 'supports' && confidenceScore >= 0.70) {
    status = 'supported';
    confidence = 'high';
  } else if (ramanSupport === 'supports' && confidenceScore >= 0.50) {
    status = 'supported';
    confidence = 'medium';
  } else if (ramanSupport === 'supports') {
    status = 'supported';
    confidence = 'low';
  }
  
  const caveats: string[] = [];
  if (!hasEg && !hasLowerFerrite && hasA1g) {
    caveats.push('A1g mode observed without corroborating Eg or T2g modes');
  }
  if (!hasCu2 && !hasFe3) {
    caveats.push('XPS oxidation state evidence not available for corroboration');
  }
  
  return {
    id: 'spinel-structure',
    title: 'Spinel-like ferrite structure',
    description: 'Material exhibits vibrational modes and oxidation states consistent with spinel ferrite structure',
    hierarchy: 'primary',
    supportingTechniques,
    confidence,
    confidenceScore,
    status,
    caveats,
  };
}

/**
 * Evaluate Oxidation State Claim
 * Authority: XPS (oxidation states), Raman (context), FTIR (irrelevant)
 */
function evaluateOxidationStateClaim(
  xpsEvidence: EvidenceItem[],
  ftirEvidence: EvidenceItem[],
  ramanEvidence: EvidenceItem[]
): Claim {
  const supportingTechniques: TechniqueSupport[] = [];
  
  // XPS has authority for oxidation states
  const oxidationStates = xpsEvidence.filter(e => e.type === 'oxidation-state');
  
  let xpsSupport: SupportType = oxidationStates.length > 0 ? 'supports' : 'neutral';
  let xpsReasoning = oxidationStates.length > 0
    ? `Detected ${oxidationStates.map(e => e.value).join(', ')}`
    : 'No oxidation state evidence detected';
  
  supportingTechniques.push({
    technique: 'XPS',
    support: xpsSupport,
    evidenceItems: oxidationStates,
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['oxidation-states'].xps,
    reasoning: xpsReasoning,
  });
  
  // Raman provides context (ferrite modes suggest expected oxidation states)
  const hasFerriteMode = ramanEvidence.some(e => 
    e.value === 'A1g spinel ferrite' || e.value === 'Eg ferrite mode'
  );
  
  supportingTechniques.push({
    technique: 'Raman',
    support: hasFerriteMode ? 'supports' : 'neutral',
    evidenceItems: hasFerriteMode ? ramanEvidence.filter(e => 
      e.value === 'A1g spinel ferrite' || e.value === 'Eg ferrite mode'
    ) : [],
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['oxidation-states'].raman,
    reasoning: hasFerriteMode ? 'Ferrite vibrational modes suggest mixed Cu/Fe oxidation states' : '',
  });
  
  // FTIR is irrelevant for oxidation states
  supportingTechniques.push({
    technique: 'FTIR',
    support: 'neutral',
    evidenceItems: [],
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['oxidation-states'].ftir,
    reasoning: 'FTIR does not provide oxidation state information',
  });
  
  // Calculate confidence
  const techniqueScores = new Map<TechniqueType, number>();
  techniqueScores.set('XPS', aggregateEvidenceScore(oxidationStates));
  techniqueScores.set('Raman', hasFerriteMode ? 0.5 : 0);
  techniqueScores.set('FTIR', 0);
  
  const confidenceScore = calculateClaimConfidence(
    techniqueScores,
    TECHNIQUE_AUTHORITY_WEIGHTS['oxidation-states'],
    0,
    HIERARCHY_MULTIPLIERS.primary
  );
  
  let status: 'supported' | 'unresolved' | 'contradicted' = oxidationStates.length > 0 ? 'supported' : 'unresolved';
  let confidence: 'high' | 'medium' | 'low' = confidenceScore >= 0.70 ? 'high' : confidenceScore >= 0.50 ? 'medium' : 'low';
  
  const caveats: string[] = [];
  if (oxidationStates.length === 0) {
    caveats.push('No XPS oxidation state evidence available');
  }
  
  return {
    id: 'oxidation-states',
    title: 'Cu and Fe oxidation state consistency',
    description: 'Oxidation states detected by XPS are consistent with ferrite chemistry',
    hierarchy: 'primary',
    supportingTechniques,
    confidence,
    confidenceScore,
    status,
    caveats,
  };
}

/**
 * Evaluate Surface Species Claim
 * Authority: FTIR (functional groups), XPS (corroboration), Raman (context)
 */
function evaluateSurfaceSpeciesClaim(
  xpsEvidence: EvidenceItem[],
  ftirEvidence: EvidenceItem[],
  ramanEvidence: EvidenceItem[]
): Claim {
  const supportingTechniques: TechniqueSupport[] = [];
  
  // FTIR has authority for surface species
  const hasOH = ftirEvidence.some(e => e.value === 'Surface hydroxyl');
  const hasWater = ftirEvidence.some(e => e.value === 'Adsorbed water');
  
  let ftirSupport: SupportType = (hasOH || hasWater) ? 'supports' : 'neutral';
  let ftirReasoning = '';
  const ftirEvidenceItems: EvidenceItem[] = [];
  
  if (hasOH && hasWater) {
    ftirReasoning = 'Both surface hydroxyl and adsorbed water detected';
    ftirEvidenceItems.push(...ftirEvidence.filter(e => 
      e.value === 'Surface hydroxyl' || e.value === 'Adsorbed water'
    ));
  } else if (hasOH) {
    ftirReasoning = 'Surface hydroxyl detected';
    ftirEvidenceItems.push(...ftirEvidence.filter(e => e.value === 'Surface hydroxyl'));
  } else if (hasWater) {
    ftirReasoning = 'Adsorbed water detected';
    ftirEvidenceItems.push(...ftirEvidence.filter(e => e.value === 'Adsorbed water'));
  }
  
  supportingTechniques.push({
    technique: 'FTIR',
    support: ftirSupport,
    evidenceItems: ftirEvidenceItems,
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['surface-species'].ftir,
    reasoning: ftirReasoning,
  });
  
  // XPS provides corroboration (surface composition)
  supportingTechniques.push({
    technique: 'XPS',
    support: 'neutral',
    evidenceItems: [],
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['surface-species'].xps,
    reasoning: 'XPS surface composition analysis not included in current demo',
  });
  
  // Raman provides context
  supportingTechniques.push({
    technique: 'Raman',
    support: 'neutral',
    evidenceItems: [],
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['surface-species'].raman,
    reasoning: 'Raman does not directly probe surface species',
  });
  
  // Calculate confidence
  const techniqueScores = new Map<TechniqueType, number>();
  techniqueScores.set('FTIR', aggregateEvidenceScore(ftirEvidenceItems));
  techniqueScores.set('XPS', 0);
  techniqueScores.set('Raman', 0);
  
  const confidenceScore = calculateClaimConfidence(
    techniqueScores,
    TECHNIQUE_AUTHORITY_WEIGHTS['surface-species'],
    0,
    HIERARCHY_MULTIPLIERS.supporting
  );
  
  let status: 'supported' | 'unresolved' | 'contradicted' = ftirSupport === 'supports' ? 'supported' : 'unresolved';
  let confidence: 'high' | 'medium' | 'low' = confidenceScore >= 0.70 ? 'high' : confidenceScore >= 0.50 ? 'medium' : 'low';
  
  const caveats: string[] = [];
  if (hasOH && !hasWater) {
    caveats.push('Surface hydroxyl detected without clear water signature');
  }
  
  return {
    id: 'surface-species',
    title: 'Surface hydroxyl and adsorbed water',
    description: 'Surface species detected by FTIR indicate hydroxyl groups and adsorbed water',
    hierarchy: 'supporting',
    supportingTechniques,
    confidence,
    confidenceScore,
    status,
    caveats,
  };
}

/**
 * Evaluate Carbonaceous Residue Claim
 * Authority: Raman (D/G bands), FTIR (corroboration), XPS (context)
 */
function evaluateCarbonaceousResidueClaim(
  xpsEvidence: EvidenceItem[],
  ftirEvidence: EvidenceItem[],
  ramanEvidence: EvidenceItem[]
): Claim {
  const supportingTechniques: TechniqueSupport[] = [];
  
  // Raman has authority for carbon detection
  const hasDBand = ramanEvidence.some(e => e.value === 'D band (disorder)');
  const hasGBand = ramanEvidence.some(e => e.value === 'G band (graphitic)');
  
  let ramanSupport: SupportType = (hasDBand || hasGBand) ? 'supports' : 'neutral';
  let ramanReasoning = '';
  const ramanEvidenceItems: EvidenceItem[] = [];
  
  if (hasDBand && hasGBand) {
    ramanReasoning = 'D and G bands indicate carbonaceous residue or support contribution';
    ramanEvidenceItems.push(...ramanEvidence.filter(e => 
      e.value === 'D band (disorder)' || e.value === 'G band (graphitic)'
    ));
  } else if (hasDBand || hasGBand) {
    ramanReasoning = hasDBand ? 'D band suggests disorder/carbon' : 'G band suggests graphitic carbon';
    ramanEvidenceItems.push(...ramanEvidence.filter(e => 
      e.value === 'D band (disorder)' || e.value === 'G band (graphitic)'
    ));
  }
  
  supportingTechniques.push({
    technique: 'Raman',
    support: ramanSupport,
    evidenceItems: ramanEvidenceItems,
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['carbonaceous-residue'].raman,
    reasoning: ramanReasoning,
  });
  
  // FTIR provides corroboration
  supportingTechniques.push({
    technique: 'FTIR',
    support: 'neutral',
    evidenceItems: [],
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['carbonaceous-residue'].ftir,
    reasoning: 'FTIR C-H bands not included in current demo',
  });
  
  // XPS provides context
  supportingTechniques.push({
    technique: 'XPS',
    support: 'neutral',
    evidenceItems: [],
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['carbonaceous-residue'].xps,
    reasoning: 'XPS C 1s analysis not included in current demo',
  });
  
  // Calculate confidence
  const techniqueScores = new Map<TechniqueType, number>();
  techniqueScores.set('Raman', aggregateEvidenceScore(ramanEvidenceItems));
  techniqueScores.set('FTIR', 0);
  techniqueScores.set('XPS', 0);
  
  const confidenceScore = calculateClaimConfidence(
    techniqueScores,
    TECHNIQUE_AUTHORITY_WEIGHTS['carbonaceous-residue'],
    0,
    HIERARCHY_MULTIPLIERS.context
  );
  
  let status: 'supported' | 'unresolved' | 'contradicted' = ramanSupport === 'supports' ? 'supported' : 'unresolved';
  let confidence: 'high' | 'medium' | 'low' = confidenceScore >= 0.70 ? 'high' : confidenceScore >= 0.50 ? 'medium' : 'low';
  
  const caveats: string[] = [];
  if (hasDBand || hasGBand) {
    caveats.push('D/G bands do not confirm ferrite phase; indicate separate carbonaceous species');
  }
  
  return {
    id: 'carbonaceous-residue',
    title: 'Carbonaceous residue and disorder',
    description: 'Raman D and G bands indicate carbonaceous residue or support contribution',
    hierarchy: 'context',
    supportingTechniques,
    confidence,
    confidenceScore,
    status,
    caveats,
  };
}

/**
 * Evaluate Carbonate Surface Claim
 * Authority: FTIR (carbonate/carboxylate), XPS (context), Raman (irrelevant)
 */
function evaluateCarbonateSurfaceClaim(
  xpsEvidence: EvidenceItem[],
  ftirEvidence: EvidenceItem[],
  ramanEvidence: EvidenceItem[]
): Claim {
  const supportingTechniques: TechniqueSupport[] = [];
  
  // FTIR has authority for carbonate/carboxylate
  const hasCarbonate = ftirEvidence.some(e => 
    e.value === 'carbonate/carboxylate overlap' || e.value.includes('Carbonate')
  );
  
  let ftirSupport: SupportType = hasCarbonate ? 'supports' : 'neutral';
  let ftirReasoning = hasCarbonate
    ? 'Carbonate/carboxylate overlap region detected; FTIR alone cannot distinguish'
    : 'No carbonate/carboxylate evidence detected';
  const ftirEvidenceItems = hasCarbonate
    ? ftirEvidence.filter(e => e.value === 'carbonate/carboxylate overlap' || e.value.includes('Carbonate'))
    : [];
  
  supportingTechniques.push({
    technique: 'FTIR',
    support: ftirSupport,
    evidenceItems: ftirEvidenceItems,
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['carbonate-surface'].ftir,
    reasoning: ftirReasoning,
  });
  
  // XPS provides context
  supportingTechniques.push({
    technique: 'XPS',
    support: 'neutral',
    evidenceItems: [],
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['carbonate-surface'].xps,
    reasoning: 'XPS C 1s analysis not included in current demo',
  });
  
  // Raman is irrelevant
  supportingTechniques.push({
    technique: 'Raman',
    support: 'neutral',
    evidenceItems: [],
    evidenceWeight: TECHNIQUE_AUTHORITY_WEIGHTS['carbonate-surface'].raman,
    reasoning: 'Raman does not directly probe carbonate surface species',
  });
  
  // Calculate confidence
  const techniqueScores = new Map<TechniqueType, number>();
  techniqueScores.set('FTIR', aggregateEvidenceScore(ftirEvidenceItems));
  techniqueScores.set('XPS', 0);
  techniqueScores.set('Raman', 0);
  
  const confidenceScore = calculateClaimConfidence(
    techniqueScores,
    TECHNIQUE_AUTHORITY_WEIGHTS['carbonate-surface'],
    0,
    HIERARCHY_MULTIPLIERS.context
  );
  
  let status: 'supported' | 'unresolved' | 'contradicted' = ftirSupport === 'supports' ? 'supported' : 'unresolved';
  let confidence: 'high' | 'medium' | 'low' = confidenceScore >= 0.70 ? 'high' : confidenceScore >= 0.50 ? 'medium' : 'low';
  
  const caveats: string[] = [];
  if (hasCarbonate) {
    caveats.push('Carbonate/carboxylate surface species may complicate surface interpretation');
  }
  
  return {
    id: 'carbonate-surface',
    title: 'Carbonate and carboxylate surface species',
    description: 'FTIR carbonate/carboxylate overlap region indicates surface complexity',
    hierarchy: 'context',
    supportingTechniques,
    confidence,
    confidenceScore,
    status,
    caveats,
  };
}

// ============================================================================
// Confidence Calculation
// ============================================================================

/**
 * Calculate claim confidence using weighted technique scores
 */
function calculateClaimConfidence(
  techniqueScores: Map<TechniqueType, number>,
  techniqueWeights: { xps: number; ftir: number; raman: number },
  contradictionPenalty: number,
  hierarchyMultiplier: number
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  const xpsScore = techniqueScores.get('XPS') || 0;
  const ftirScore = techniqueScores.get('FTIR') || 0;
  const ramanScore = techniqueScores.get('Raman') || 0;
  
  weightedSum += xpsScore * techniqueWeights.xps;
  weightedSum += ftirScore * techniqueWeights.ftir;
  weightedSum += ramanScore * techniqueWeights.raman;
  
  totalWeight = techniqueWeights.xps + techniqueWeights.ftir + techniqueWeights.raman;
  
  const baseConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return baseConfidence * (1 - contradictionPenalty) * hierarchyMultiplier;
}

// ============================================================================
// Evidence Matrix Building
// ============================================================================

/**
 * Build evidence matrix from claims
 */
function buildEvidenceMatrix(claims: Claim[]): EvidenceMatrix {
  const techniques: TechniqueType[] = ['XPS', 'FTIR', 'Raman'];
  const cells: MatrixCell[][] = [];
  
  for (const claim of claims) {
    const row: MatrixCell[] = [];
    
    for (const technique of techniques) {
      const techSupport = claim.supportingTechniques.find(t => t.technique === technique);
      
      if (techSupport) {
        const evidenceText = techSupport.evidenceItems.length > 0
          ? techSupport.evidenceItems[0].label
          : techSupport.reasoning;
        
        row.push({
          claimId: claim.id,
          technique,
          support: techSupport.support,
          evidenceText,
          evidenceItems: techSupport.evidenceItems,
        });
      } else {
        row.push({
          claimId: claim.id,
          technique,
          support: 'neutral',
          evidenceText: 'No evidence',
          evidenceItems: [],
        });
      }
    }
    
    cells.push(row);
  }
  
  return {
    claims,
    techniques,
    cells,
  };
}

// ============================================================================
// Contradiction Detection
// ============================================================================

/**
 * Detect contradictions between techniques
 */
function detectContradictions(
  claims: Claim[],
  xpsEvidence: EvidenceItem[],
  ftirEvidence: EvidenceItem[],
  ramanEvidence: EvidenceItem[]
): Contradiction[] {
  const contradictions: Contradiction[] = [];
  
  // Rule 1: Raman suggests spinel but XPS lacks expected oxidation states
  const spinelClaim = claims.find(c => c.id === 'spinel-structure');
  const ramanSupportsSpinel = spinelClaim?.supportingTechniques.find(t => t.technique === 'Raman')?.support === 'supports';
  const xpsSupportsSpinel = spinelClaim?.supportingTechniques.find(t => t.technique === 'XPS')?.support === 'supports';
  
  if (ramanSupportsSpinel && !xpsSupportsSpinel) {
    // Calculate contradiction score
    const ramanEvidence = spinelClaim?.supportingTechniques.find(t => t.technique === 'Raman')?.evidenceItems || [];
    const evidenceStrength = aggregateEvidenceScore(ramanEvidence);
    const disagreementMagnitude = 0.5; // Partial disagreement (lack of corroboration)
    const claimImportance = 1.0; // Primary claim
    
    const contradictionScore = evidenceStrength * disagreementMagnitude * claimImportance;
    const confidenceImpact = contradictionScore * CONTRADICTION_SEVERITY_MULTIPLIERS.medium;
    
    contradictions.push({
      id: 'spinel-xps-mismatch',
      severity: 'medium',
      score: contradictionScore,
      techniques: ['Raman', 'XPS'],
      claimId: 'spinel-structure',
      explanation: 'Raman vibrational modes suggest spinel structure, but XPS does not provide corroborating oxidation state evidence',
      confidenceImpact,
      effectOnConfidence: 'Sets overall status to In Progress; spinel assignment remains tentative',
    });
  }
  
  // Rule 2: Strong carbonate/carboxylate surface species
  const carbonateClaim = claims.find(c => c.id === 'carbonate-surface');
  const ftirSupportsCarbonate = carbonateClaim?.supportingTechniques.find(t => t.technique === 'FTIR')?.support === 'supports';
  
  if (ftirSupportsCarbonate) {
    const ftirEvidenceItems = carbonateClaim?.supportingTechniques.find(t => t.technique === 'FTIR')?.evidenceItems || [];
    const evidenceStrength = aggregateEvidenceScore(ftirEvidenceItems);
    const disagreementMagnitude = 0.3; // Low disagreement (surface complexity, not contradiction)
    const claimImportance = 0.3; // Context claim
    
    const contradictionScore = evidenceStrength * disagreementMagnitude * claimImportance;
    const confidenceImpact = contradictionScore * CONTRADICTION_SEVERITY_MULTIPLIERS.low;
    
    contradictions.push({
      id: 'surface-complexity',
      severity: 'low',
      score: contradictionScore,
      techniques: ['FTIR'],
      claimId: 'carbonate-surface',
      explanation: 'Strong carbonate/carboxylate surface species may complicate surface interpretation',
      confidenceImpact,
      effectOnConfidence: 'Does not affect bulk phase identification but indicates surface complexity',
    });
  }
  
  // Rule 3: Raman D/G bands indicate carbon contribution
  const carbonClaim = claims.find(c => c.id === 'carbonaceous-residue');
  const ramanSupportsCarbon = carbonClaim?.supportingTechniques.find(t => t.technique === 'Raman')?.support === 'supports';
  
  if (ramanSupportsCarbon) {
    const ramanEvidenceItems = carbonClaim?.supportingTechniques.find(t => t.technique === 'Raman')?.evidenceItems || [];
    const evidenceStrength = aggregateEvidenceScore(ramanEvidenceItems);
    const disagreementMagnitude = 0.3; // Low disagreement (additional species, not contradiction)
    const claimImportance = 0.3; // Context claim
    
    const contradictionScore = evidenceStrength * disagreementMagnitude * claimImportance;
    const confidenceImpact = contradictionScore * CONTRADICTION_SEVERITY_MULTIPLIERS.low;
    
    contradictions.push({
      id: 'carbon-contribution',
      severity: 'low',
      score: contradictionScore,
      techniques: ['Raman'],
      claimId: 'carbonaceous-residue',
      explanation: 'Raman D and G bands indicate carbonaceous residue or support contribution',
      confidenceImpact,
      effectOnConfidence: 'Does not contradict ferrite phase but indicates additional carbon-based species',
    });
  }
  
  return contradictions;
}

// ============================================================================
// Final Decision Generation
// ============================================================================

/**
 * Generate final decision from claims and contradictions
 */
function generateFinalDecision(
  claims: Claim[],
  contradictions: Contradiction[]
): FusionDecision {
  const spinelClaim = claims.find(c => c.id === 'spinel-structure');
  const surfaceClaim = claims.find(c => c.id === 'surface-species');
  const carbonClaim = claims.find(c => c.id === 'carbonaceous-residue');
  
  // Build conclusion from supported claims
  const conclusionParts: string[] = [];
  
  if (spinelClaim?.status === 'supported') {
    if (spinelClaim.confidence === 'high') {
      conclusionParts.push('Multi-technique evidence supports a spinel-like ferrite material');
    } else {
      conclusionParts.push('Evidence suggests a spinel-like ferrite material');
    }
  }
  
  if (surfaceClaim?.status === 'supported') {
    conclusionParts.push('with surface hydroxyl/water species');
  }
  
  if (carbonClaim?.status === 'supported') {
    conclusionParts.push('and possible carbonaceous residue');
  }
  
  let conclusion = conclusionParts.join(' ');
  
  // Add XPS caveat if oxidation state evidence is weak
  const xpsSupport = spinelClaim?.supportingTechniques.find(t => t.technique === 'XPS')?.support;
  if (xpsSupport !== 'supports') {
    conclusion += '. Oxidation-state confirmation remains dependent on XPS evidence quality';
  }
  
  // Calculate final confidence from primary claims only
  const primaryClaims = claims.filter(c => c.hierarchy === 'primary' && c.status === 'supported');
  
  let confidenceScore = 0.3; // Default LOW
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (primaryClaims.length > 0) {
    // Final confidence is minimum of primary claim confidences
    confidenceScore = Math.min(...primaryClaims.map(c => c.confidenceScore));
    
    // Apply contradiction penalties
    const majorContradictions = contradictions.filter(c => c.severity === 'high' || c.severity === 'medium');
    for (const contradiction of majorContradictions) {
      confidenceScore -= contradiction.confidenceImpact;
    }
    
    // Ensure minimum confidence
    confidenceScore = Math.max(0.3, confidenceScore);
    
    // Classify
    if (confidenceScore >= 0.70) {
      confidence = 'high';
    } else if (confidenceScore >= 0.50) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
  }
  
  return {
    primaryConclusion: conclusion,
    confidence,
    confidenceScore,
  };
}

// ============================================================================
// Caveat and Recommendation Generation
// ============================================================================

/**
 * Generate caveats from claims and contradictions
 */
function generateCaveats(claims: Claim[], contradictions: Contradiction[]): string[] {
  const caveats: string[] = [];
  
  // Collect caveats from all claims
  for (const claim of claims) {
    caveats.push(...claim.caveats);
  }
  
  // Add contradiction-specific caveats
  for (const contradiction of contradictions) {
    if (contradiction.severity === 'medium' || contradiction.severity === 'high') {
      caveats.push(contradiction.explanation);
    }
  }
  
  // Remove duplicates
  return Array.from(new Set(caveats));
}

/**
 * Generate recommended validation steps
 */
function generateRecommendations(claims: Claim[], contradictions: Contradiction[]): string[] {
  const recommendations: string[] = [];
  
  // Check for XPS oxidation state gaps
  const oxidationClaim = claims.find(c => c.id === 'oxidation-states');
  if (oxidationClaim?.status === 'unresolved' || oxidationClaim?.confidence === 'low') {
    recommendations.push('XPS depth profiling to confirm bulk oxidation states');
  }
  
  // Check for spinel structure confirmation
  const spinelClaim = claims.find(c => c.id === 'spinel-structure');
  if (spinelClaim?.status === 'supported' && spinelClaim.confidence !== 'high') {
    recommendations.push('TEM for structural confirmation');
    recommendations.push('Complementary XRD for crystallographic phase identification');
  }
  
  // Check for surface species complexity
  const carbonateClaim = claims.find(c => c.id === 'carbonate-surface');
  if (carbonateClaim?.status === 'supported') {
    recommendations.push('Temperature-programmed desorption (TPD) to characterize surface species');
  }
  
  // Check for carbon contribution
  const carbonClaim = claims.find(c => c.id === 'carbonaceous-residue');
  if (carbonClaim?.status === 'supported') {
    recommendations.push('Elemental analysis (CHN) to quantify carbon content');
  }
  
  return recommendations;
}

/**
 * Generate reviewer-style report
 */
function formatFusionStatus(level: 'high' | 'medium' | 'low'): string {
  if (level === 'high') return 'Complete';
  if (level === 'medium') return 'Ready';
  return 'In Progress';
}

function formatClaimReviewStatus(status: 'supported' | 'unresolved' | 'contradicted'): string {
  if (status === 'supported') return 'Ready';
  if (status === 'unresolved') return 'Pending';
  return 'Review';
}

function generateReport(
  decision: FusionDecision,
  claims: Claim[],
  evidenceMatrix: EvidenceMatrix,
  contradictions: Contradiction[]
): string {
  let report = '# Cross-Technique Insights Report\n\n';
  
  // Final Decision
  report += '## Conclusion\n\n';
  report += `**Conclusion:** ${decision.primaryConclusion}\n\n`;
  report += `**Status:** ${formatFusionStatus(decision.confidence)}\n\n`;
  
  // Evidence by Technique
  report += '## Supporting Data\n\n';
  
  report += '### Raman Spectroscopy\n';
  const ramanClaims = claims.filter(c => 
    c.supportingTechniques.find(t => t.technique === 'Raman' && t.support === 'supports')
  );
  for (const claim of ramanClaims) {
    const ramanSupport = claim.supportingTechniques.find(t => t.technique === 'Raman');
    report += `- **${claim.title}:** ${ramanSupport?.reasoning}\n`;
  }
  report += '\n';
  
  report += '### FTIR Spectroscopy\n';
  const ftirClaims = claims.filter(c => 
    c.supportingTechniques.find(t => t.technique === 'FTIR' && t.support === 'supports')
  );
  for (const claim of ftirClaims) {
    const ftirSupport = claim.supportingTechniques.find(t => t.technique === 'FTIR');
    report += `- **${claim.title}:** ${ftirSupport?.reasoning}\n`;
  }
  report += '\n';
  
  report += '### XPS\n';
  const xpsClaims = claims.filter(c => 
    c.supportingTechniques.find(t => t.technique === 'XPS' && t.support === 'supports')
  );
  for (const claim of xpsClaims) {
    const xpsSupport = claim.supportingTechniques.find(t => t.technique === 'XPS');
    report += `- **${claim.title}:** ${xpsSupport?.reasoning}\n`;
  }
  report += '\n';
  
  // Agent Interpretation
  report += '## Agent Interpretation\n\n';
  for (const claim of claims) {
    report += `### ${claim.title} (${formatFusionStatus(claim.confidence)})\n`;
    report += `**Status:** ${formatClaimReviewStatus(claim.status)}\n\n`;
    report += `**Description:** ${claim.description}\n\n`;
    
    if (claim.caveats.length > 0) {
      report += '**Limitations and Follow-up Validation:**\n';
      for (const caveat of claim.caveats) {
        report += `- ${caveat}\n`;
      }
      report += '\n';
    }
  }
  
  // Contradictions
  if (contradictions.length > 0) {
    report += '## Review\n\n';
    for (const contradiction of contradictions) {
      report += `### ${contradiction.id} (${contradiction.severity.toUpperCase()})\n`;
      report += `**Techniques:** ${contradiction.techniques.join(', ')}\n\n`;
      report += `**Explanation:** ${contradiction.explanation}\n\n`;
      report += `**Effect on Conclusion:** ${contradiction.effectOnConfidence}\n\n`;
    }
  }
  
  return report;
}

// ============================================================================
// Main Fusion Analysis Function
// ============================================================================

/**
 * Run fusion analysis on XPS, FTIR, and Raman results
 */
export function runFusionAnalysis(
  xpsResult: XpsProcessingResult,
  ftirResult: FtirProcessingResult,
  ramanResult: RamanProcessingResult
): FusionResult {
  // Step 1: Extract evidence items from each technique
  const xpsEvidence = extractXpsEvidence(xpsResult);
  const ftirEvidence = extractFtirEvidence(ftirResult);
  const ramanEvidence = extractRamanEvidence(ramanResult);
  
  // Step 2: Evaluate each claim
  const claims: Claim[] = [
    evaluateSpinelStructureClaim(xpsEvidence, ftirEvidence, ramanEvidence),
    evaluateOxidationStateClaim(xpsEvidence, ftirEvidence, ramanEvidence),
    evaluateSurfaceSpeciesClaim(xpsEvidence, ftirEvidence, ramanEvidence),
    evaluateCarbonaceousResidueClaim(xpsEvidence, ftirEvidence, ramanEvidence),
    evaluateCarbonateSurfaceClaim(xpsEvidence, ftirEvidence, ramanEvidence),
  ];
  
  // Step 3: Build evidence matrix
  const evidenceMatrix = buildEvidenceMatrix(claims);
  
  // Step 4: Detect contradictions
  const contradictions = detectContradictions(claims, xpsEvidence, ftirEvidence, ramanEvidence);
  
  // Step 5: Generate final decision
  const decision = generateFinalDecision(claims, contradictions);
  
  // Step 6: Categorize claims
  const supportedClaims = claims.filter(c => c.status === 'supported').map(c => c.id);
  const unresolvedClaims = claims.filter(c => c.status === 'unresolved').map(c => c.id);
  
  // Step 7: Generate caveats and recommendations
  const caveats = generateCaveats(claims, contradictions);
  const recommendedValidation = generateRecommendations(claims, contradictions);
  
  // Step 8: Generate report
  const report = generateReport(decision, claims, evidenceMatrix, contradictions);
  
  return {
    decision,
    claims,
    evidenceMatrix,
    contradictions,
    supportedClaims,
    unresolvedClaims,
    caveats,
    recommendedValidation,
    report,
  };
}
