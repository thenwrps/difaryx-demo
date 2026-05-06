/**
 * Claim Graph + Evidence Propagation Engine - Deterministic Demo Tests
 * 
 * Tests the complete claim graph pipeline using DIFARYX demo data.
 * Verifies deterministic output and expected claim statuses.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateClaimGraph,
  type RawEvidenceInput,
  type ClaimStatus,
} from '../index';

describe('Claim Graph Engine - CuFe2O4 Demo Data', () => {
  /**
   * Test data based on CuFe2O4 spinel ferrite demo project
   * Real XRD peak positions from demo: 30.1°, 35.5°, 43.2°, 57.1°, 62.7° (2θ)
   * Real Raman mode: 690 cm⁻¹ (A₁g mode)
   */
  const cufe2o4XrdEvidence: RawEvidenceInput = {
    technique: 'XRD',
    peaks: [
      { id: 'xrd-1', position: 30.1, intensity: 44, label: '(220)', hkl: '220' },
      { id: 'xrd-2', position: 35.5, intensity: 77, label: '(311)', hkl: '311' },
      { id: 'xrd-3', position: 43.2, intensity: 49, label: '(400)', hkl: '400' },
      { id: 'xrd-4', position: 57.1, intensity: 38, label: '(511)', hkl: '511' },
      { id: 'xrd-5', position: 62.7, intensity: 44, label: '(440)', hkl: '440' },
    ],
  };

  const cufe2o4RamanEvidence: RawEvidenceInput = {
    technique: 'Raman',
    peaks: [
      { id: 'raman-1', position: 220, intensity: 12, label: 'T₂g(1)' },
      { id: 'raman-2', position: 382, intensity: 20, label: 'Eg' },
      { id: 'raman-3', position: 585, intensity: 40, label: 'T₂g(2)' },
      { id: 'raman-4', position: 690, intensity: 72, label: 'A₁g' },
    ],
  };

  const cufe2o4XpsEvidence: RawEvidenceInput = {
    technique: 'XPS',
    peaks: [
      { id: 'xps-1', position: 933.8, intensity: 55, label: 'Cu 2p₃/₂' },
      { id: 'xps-2', position: 710.5, intensity: 78, label: 'Fe 2p₃/₂' },
      { id: 'xps-3', position: 530.1, intensity: 68, label: 'O 1s lattice' },
    ],
  };

  const cufe2o4FtirEvidence: RawEvidenceInput = {
    technique: 'FTIR',
    peaks: [
      { id: 'ftir-1', position: 580, intensity: 18, label: 'M-O stretch' },
      { id: 'ftir-2', position: 3420, intensity: 14, label: 'OH/H₂O' },
    ],
  };

  it('should build claim graph from XRD evidence', () => {
    const result = evaluateClaimGraph([cufe2o4XrdEvidence]);

    expect(result.graph).toBeDefined();
    expect(result.graph.evidence_nodes.length).toBeGreaterThan(0);
    expect(result.graph.claim_nodes.length).toBeGreaterThan(0);
    expect(result.graph.relations.length).toBeGreaterThan(0);
  });

  it('should propagate claims deterministically', () => {
    const result = evaluateClaimGraph([cufe2o4XrdEvidence]);

    expect(result.propagation).toBeDefined();
    expect(result.propagation.length).toBeGreaterThan(0);

    // Each propagation result should have required fields
    result.propagation.forEach((prop) => {
      expect(prop.claim_id).toBeDefined();
      expect(prop.status).toBeDefined();
      expect(prop.rationale).toBeDefined();
      expect(Array.isArray(prop.supporting_evidence)).toBe(true);
      expect(Array.isArray(prop.contradicting_evidence)).toBe(true);
    });
  });

  it('should generate reasoning traces', () => {
    const result = evaluateClaimGraph([cufe2o4XrdEvidence]);

    expect(result.reasoningTrace).toBeDefined();
    expect(result.reasoningTrace.length).toBeGreaterThan(0);

    // Each trace should have required fields
    result.reasoningTrace.forEach((trace) => {
      expect(trace.claim).toBeDefined();
      expect(trace.resulting_status).toBeDefined();
      expect(trace.reviewer_rationale).toBeDefined();
      expect(Array.isArray(trace.observed_evidence)).toBe(true);
    });
  });

  it('should generate scientific report', () => {
    const result = evaluateClaimGraph([cufe2o4XrdEvidence]);

    expect(result.report).toBeDefined();
    expect(result.report.conclusion).toBeDefined();
    expect(result.report.evidence_basis).toBeDefined();
    expect(result.report.cross_technique_consistency).toBeDefined();
    expect(result.report.limitations).toBeDefined();
    expect(result.report.required_validation).toBeDefined();
    expect(result.report.decision).toBeDefined();
  });

  it('should support spinel_ferrite_assignment with XRD evidence', () => {
    const result = evaluateClaimGraph([cufe2o4XrdEvidence]);

    const spinelClaim = result.propagation.find(
      (p) => p.claim_id === 'spinel_ferrite_assignment'
    );

    expect(spinelClaim).toBeDefined();
    expect(spinelClaim?.status).toBe('supported');
  });

  it('should support spinel_ferrite_assignment with XRD + Raman evidence', () => {
    const result = evaluateClaimGraph([
      cufe2o4XrdEvidence,
      cufe2o4RamanEvidence,
    ]);

    const spinelClaim = result.propagation.find(
      (p) => p.claim_id === 'spinel_ferrite_assignment'
    );

    expect(spinelClaim).toBeDefined();
    expect(spinelClaim?.status).toBe('supported');
    expect(spinelClaim?.supporting_evidence.length).toBeGreaterThan(0);
  });

  it('should support oxidation_state_consistency with XPS evidence', () => {
    const result = evaluateClaimGraph([
      cufe2o4XrdEvidence,
      cufe2o4XpsEvidence,
    ]);

    const oxidationClaim = result.propagation.find(
      (p) => p.claim_id === 'oxidation_state_consistency'
    );

    expect(oxidationClaim).toBeDefined();
    // Status should be 'supported' or 'requires_validation' depending on evidence
    expect(['supported', 'requires_validation']).toContain(oxidationClaim?.status);
  });

  it('should support metal_oxygen_bonding with FTIR evidence', () => {
    const result = evaluateClaimGraph([
      cufe2o4XrdEvidence,
      cufe2o4FtirEvidence,
    ]);

    const bondingClaim = result.propagation.find(
      (p) => p.claim_id === 'metal_oxygen_bonding'
    );

    expect(bondingClaim).toBeDefined();
    expect(bondingClaim?.status).toBe('supported');
  });

  it('should handle surface_species_presence with FTIR evidence', () => {
    const result = evaluateClaimGraph([
      cufe2o4XrdEvidence,
      cufe2o4FtirEvidence,
    ]);

    const surfaceClaim = result.propagation.find(
      (p) => p.claim_id === 'surface_species_presence'
    );

    expect(surfaceClaim).toBeDefined();
    // Status should be 'partially_supported' or 'requires_validation'
    expect(['partially_supported', 'requires_validation', 'supported']).toContain(
      surfaceClaim?.status
    );
  });

  it('should produce deterministic output for same input', () => {
    const result1 = evaluateClaimGraph([cufe2o4XrdEvidence]);
    const result2 = evaluateClaimGraph([cufe2o4XrdEvidence]);

    // Same input should produce same claim statuses
    expect(result1.propagation.length).toBe(result2.propagation.length);

    result1.propagation.forEach((prop1, index) => {
      const prop2 = result2.propagation[index];
      expect(prop1.claim_id).toBe(prop2.claim_id);
      expect(prop1.status).toBe(prop2.status);
    });
  });

  it('should not use forbidden scoring terminology', () => {
    const result = evaluateClaimGraph([
      cufe2o4XrdEvidence,
      cufe2o4RamanEvidence,
      cufe2o4XpsEvidence,
      cufe2o4FtirEvidence,
    ]);

    const reportText = JSON.stringify(result.report).toLowerCase();
    const traceText = JSON.stringify(result.reasoningTrace).toLowerCase();

    // Forbidden terms
    const forbiddenTerms = [
      'score',
      'scoring',
      'confidence',
      'weight',
      'threshold',
      'high quality',
      'low quality',
      'excellent',
      'strong evidence',
      'weak evidence',
    ];

    forbiddenTerms.forEach((term) => {
      expect(reportText).not.toContain(term);
      expect(traceText).not.toContain(term);
    });

    // Allowed relation terms should be present
    const allowedTerms = [
      'supports',
      'contradicts',
      'requires',
      'contextualizes',
      'relation',
    ];

    const hasAllowedTerm = allowedTerms.some(
      (term) => reportText.includes(term) || traceText.includes(term)
    );
    expect(hasAllowedTerm).toBe(true);
  });

  it('should handle multi-technique evidence fusion', () => {
    const result = evaluateClaimGraph([
      cufe2o4XrdEvidence,
      cufe2o4RamanEvidence,
      cufe2o4XpsEvidence,
      cufe2o4FtirEvidence,
    ]);

    // Should have evidence from all techniques
    const techniques = new Set(
      result.graph.evidence_nodes.map((node) => node.technique)
    );
    expect(techniques.has('XRD')).toBe(true);
    expect(techniques.has('Raman')).toBe(true);
    expect(techniques.has('XPS')).toBe(true);
    expect(techniques.has('FTIR')).toBe(true);

    // Cross-technique consistency should be mentioned in report
    expect(result.report.cross_technique_consistency).toBeDefined();
    expect(result.report.cross_technique_consistency.length).toBeGreaterThan(0);
  });
});
