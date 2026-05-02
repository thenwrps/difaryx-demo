import React, { useState } from 'react';
import { CheckCircle2, Send, XCircle } from 'lucide-react';

type TabType = 'thinking' | 'evidence' | 'parameters' | 'logs';

interface CandidateData {
  phase: string;
  peakAlignment: string;
  intensityCorr: string;
  completeness: string;
  score: string;
  result: 'Match' | 'Rejected';
  reason?: string;
}

interface RightPanelProps {
  technique?: string;
  projectName?: string;
  activeTab?: TabType;
  currentStep: number;
  totalSteps: number;
  reasoningStream?: any;
  candidates?: CandidateData[];
  onTabChange?: (tab: TabType) => void;
  onPromptSubmit?: (prompt: string) => void;
}

function getScientificSummary(technique: string) {
  switch (technique) {
    case 'XRD':
      return {
        title: 'STRUCTURAL IDENTITY',
        blocks: [
          {
            label: 'Crystal Structure',
            content: 'Cubic spinel structure (Fd-3m space group) confirmed by characteristic (220), (311), (400), (511), and (440) reflections. Lattice parameter a ≈ 8.38 Å consistent with inverse spinel configuration.',
          },
          {
            label: 'Evidence',
            content: 'Primary reflections at 2θ = 30.1°, 35.5°, 43.2°, 57.1°, 62.7° match ICDD reference within ±0.15°. Intensity ratios I(311)/I(220) = 2.8 and I(440)/I(511) = 0.6 support cation distribution model.',
          },
          {
            label: 'Interpretation',
            content: 'Sharp, well-resolved peaks indicate high crystallinity (crystallite size ~35 nm from Scherrer analysis). Absence of secondary oxide phases (Fe₂O₃, CuO) above 2% detection limit.',
          },
        ],
        confidence: 'High',
      };
    case 'FTIR':
      return {
        title: 'BONDING ENVIRONMENT',
        blocks: [
          {
            label: 'Vibrational Features',
            content: 'Tetrahedral site ν₁(M-O) at 585 cm⁻¹ and octahedral site ν₂(M-O) at 420 cm⁻¹ characteristic of spinel ferrites. Weak shoulder at 1050 cm⁻¹ indicates Si-O-Si from support.',
          },
          {
            label: 'Evidence',
            content: 'Fe-O stretching frequency ratio ν₁/ν₂ = 1.39 consistent with inverse spinel. Cu²⁺-O band at 610 cm⁻¹ confirms copper incorporation in octahedral sites. No CuO signature at 530 cm⁻¹.',
          },
          {
            label: 'Interpretation',
            content: 'Cation distribution Cu₀.₂Fe₀.₈[Cu₀.₈Fe₁.₂]O₄ supported by vibrational analysis. Surface hydroxyl groups (3400 cm⁻¹) suggest active catalytic sites. Support interaction preserved.',
          },
        ],
        confidence: 'Moderate',
      };
    case 'Raman':
      return {
        title: 'LATTICE DYNAMICS',
        blocks: [
          {
            label: 'Raman Modes',
            content: 'Five active modes observed: A₁g (690 cm⁻¹), Eg (340 cm⁻¹), and three T₂g modes (210, 475, 620 cm⁻¹). Mode positions consistent with Fd-3m symmetry and Cu-Fe cation ordering.',
          },
          {
            label: 'Evidence',
            content: 'A₁g symmetric breathing mode at 690 cm⁻¹ (vs. 670 cm⁻¹ for Fe₃O₄) indicates Cu substitution effect. T₂g mode splitting (Δν = 145 cm⁻¹) confirms octahedral site distortion from Jahn-Teller Cu²⁺.',
          },
          {
            label: 'Interpretation',
            content: 'Sharp linewidths (FWHM < 25 cm⁻¹) indicate long-range structural order. Absence of D-band (1350 cm⁻¹) rules out carbon contamination. Lattice dynamics support inverse spinel assignment.',
          },
        ],
        confidence: 'High',
      };
    case 'XPS':
      return {
        title: 'CHEMICAL STATE',
        blocks: [
          {
            label: 'Oxidation States',
            content: 'Cu 2p₃/₂ at 933.8 eV with satellite at 942 eV confirms Cu²⁺. Fe 2p₃/₂ shows mixed Fe³⁺ (711.2 eV) and Fe²⁺ (709.4 eV) with 3:1 ratio. O 1s deconvolution reveals lattice oxygen (530.1 eV) and surface hydroxyl (531.8 eV).',
          },
          {
            label: 'Evidence',
            content: 'Cu²⁺/Cu⁺ ratio >95% from Auger parameter analysis. Fe³⁺/Fe²⁺ = 2.8 consistent with inverse spinel stoichiometry. Surface enrichment factor Cu(surface)/Cu(bulk) = 1.3 indicates preferential surface segregation.',
          },
          {
            label: 'Interpretation',
            content: 'Surface composition Cu₁.₃Fe₁.₇O₄ vs. bulk CuFe₂O₄ suggests reconstruction. Absence of metallic Cu (932.5 eV) confirms oxide stability. Hydroxyl coverage θ_OH = 0.4 ML indicates hydrated surface for catalysis.',
          },
        ],
        confidence: 'Moderate to High',
      };
    default:
      return {
        title: 'GENERAL MATERIAL SUMMARY',
        blocks: [
          {
            label: 'Observation',
            content: 'Multi-technique evidence indicates consistent material behavior',
          },
          {
            label: 'Interpretation',
            content: 'No major conflicting signals detected',
          },
        ],
        confidence: 'Moderate',
      };
  }
}

type LiteratureProvider = 'google_scholar_proxy' | 'semantic_scholar' | 'crossref' | 'mock';

interface LiteraturePaper {
  title: string;
  authors: string;
  year: string;
  source: string;
  relevance: string;
  keyEvidence: string;
  consistencyCheck: string;
  impactOnDecision: string;
  externalLink?: string;
}

interface LiteratureEvidence {
  query: string;
  provider: LiteratureProvider;
  papers: LiteraturePaper[];
  geminiSummary: string;
}

function getTechniqueParameters(technique: string) {
  switch (technique) {
    case 'XRD':
      return {
        analysisConfig: {
          title: 'XRD Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '5% I/I₀' },
                { label: 'Peak width (FWHM) range:', value: '0.1° - 0.8° (2θ)' },
                { label: 'Background polynomial order:', value: '5th order Chebyshev' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay (window=7)' },
              ],
            },
            {
              subtitle: 'Phase Matching',
              params: [
                { label: 'Position tolerance (Δ2θ):', value: '±0.2°' },
                { label: 'Intensity correlation threshold:', value: 'r ≥ 0.80' },
                { label: 'Minimum completeness:', value: '70% expected peaks' },
                { label: 'Database search scope:', value: 'ICDD + COD + AMCSD' },
              ],
            },
            {
              subtitle: 'Scoring Weights',
              params: [
                { label: 'Peak position matching:', value: '40%', highlight: true },
                { label: 'Intensity correlation:', value: '35%', highlight: true },
                { label: 'Peak completeness:', value: '25%', highlight: true },
              ],
              note: 'Weights optimized for crystalline phase identification. Alternative profiles available for amorphous or nanocrystalline materials.',
            },
          ],
        },
        instrumental: {
          title: 'XRD Instrumental Parameters',
          sections: [
            {
              subtitle: 'Diffractometer Configuration',
              params: [
                { label: 'Radiation source:', value: 'Cu Kα (λ = 1.5406 Å)' },
                { label: 'Scan range:', value: '10° - 80° (2θ)' },
                { label: 'Step size:', value: '0.02° (2θ)' },
                { label: 'Dwell time:', value: '1.0 s/step' },
                { label: 'Instrumental broadening:', value: '0.08° FWHM (LaB₆ std)' },
              ],
            },
            {
              subtitle: 'Data Processing',
              params: [
                { label: 'Kα₂ stripping:', value: 'Rachinger algorithm' },
                { label: 'Background subtraction:', value: 'Polynomial (order 5)' },
                { label: 'Peak fitting:', value: 'Pseudo-Voigt profile' },
                { label: 'Lattice refinement:', value: 'Nelson-Riley extrapolation' },
              ],
            },
          ],
        },
      };
    case 'Raman':
      return {
        analysisConfig: {
          title: 'Raman Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '3% of max intensity' },
                { label: 'Peak width (FWHM) range:', value: '5 - 50 cm⁻¹' },
                { label: 'Baseline correction:', value: 'Asymmetric least squares' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay (window=9)' },
              ],
            },
            {
              subtitle: 'Mode Assignment',
              params: [
                { label: 'Position tolerance:', value: '±5 cm⁻¹' },
                { label: 'Symmetry matching:', value: 'Factor group analysis' },
                { label: 'Minimum mode count:', value: '3 active modes' },
                { label: 'Database scope:', value: 'RRUFF + literature references' },
              ],
            },
            {
              subtitle: 'Scoring Weights',
              params: [
                { label: 'Mode position matching:', value: '45%', highlight: true },
                { label: 'Relative intensity:', value: '30%', highlight: true },
                { label: 'Mode count completeness:', value: '25%', highlight: true },
              ],
              note: 'Weights optimized for crystalline phase identification. Intensity ratios less reliable for oriented samples.',
            },
          ],
        },
        instrumental: {
          title: 'Raman Instrumental Parameters',
          sections: [
            {
              subtitle: 'Spectrometer Configuration',
              params: [
                { label: 'Laser wavelength:', value: '532 nm (green)' },
                { label: 'Laser power:', value: '10 mW at sample' },
                { label: 'Spectral range:', value: '100 - 4000 cm⁻¹' },
                { label: 'Spectral resolution:', value: '2 cm⁻¹' },
                { label: 'Acquisition time:', value: '30 s × 3 accumulations' },
              ],
            },
            {
              subtitle: 'Data Processing',
              params: [
                { label: 'Cosmic ray removal:', value: 'Median filter (3 spectra)' },
                { label: 'Fluorescence correction:', value: 'Polynomial baseline (order 3)' },
                { label: 'Peak fitting:', value: 'Lorentzian profile' },
                { label: 'Calibration standard:', value: 'Si (520.7 cm⁻¹)' },
              ],
            },
          ],
        },
      };
    case 'XPS':
      return {
        analysisConfig: {
          title: 'XPS Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '2% of max intensity' },
                { label: 'Peak width (FWHM) range:', value: '0.8 - 3.5 eV' },
                { label: 'Background model:', value: 'Shirley or Tougaard' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay (window=5)' },
              ],
            },
            {
              subtitle: 'Chemical State Assignment',
              params: [
                { label: 'Binding energy tolerance:', value: '±0.3 eV' },
                { label: 'Satellite identification:', value: 'Shake-up/off analysis' },
                { label: 'Auger parameter:', value: 'Modified Auger parameter (α)' },
                { label: 'Database scope:', value: 'NIST XPS + literature' },
              ],
            },
            {
              subtitle: 'Quantification Weights',
              params: [
                { label: 'Binding energy match:', value: '50%', highlight: true },
                { label: 'Peak shape consistency:', value: '30%', highlight: true },
                { label: 'Satellite structure:', value: '20%', highlight: true },
              ],
              note: 'Relative sensitivity factors (RSF) applied for elemental quantification. Surface charging corrected to C 1s = 284.8 eV.',
            },
          ],
        },
        instrumental: {
          title: 'XPS Instrumental Parameters',
          sections: [
            {
              subtitle: 'Spectrometer Configuration',
              params: [
                { label: 'X-ray source:', value: 'Al Kα (1486.6 eV)' },
                { label: 'X-ray power:', value: '300 W (15 kV, 20 mA)' },
                { label: 'Analyzer mode:', value: 'Constant analyzer energy (CAE)' },
                { label: 'Pass energy:', value: '20 eV (high resolution)' },
                { label: 'Energy resolution:', value: '0.6 eV (Ag 3d₅/₂ FWHM)' },
              ],
            },
            {
              subtitle: 'Data Processing',
              params: [
                { label: 'Charge correction:', value: 'C 1s reference (284.8 eV)' },
                { label: 'Background subtraction:', value: 'Shirley method' },
                { label: 'Peak fitting:', value: 'Gaussian-Lorentzian mix (GL30)' },
                { label: 'Quantification:', value: 'Scofield RSF with λ correction' },
              ],
            },
          ],
        },
      };
    case 'FTIR':
      return {
        analysisConfig: {
          title: 'FTIR Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '5% transmittance change' },
                { label: 'Peak width (FWHM) range:', value: '10 - 100 cm⁻¹' },
                { label: 'Baseline correction:', value: 'Rubber band (64 points)' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay (window=11)' },
              ],
            },
            {
              subtitle: 'Band Assignment',
              params: [
                { label: 'Position tolerance:', value: '±10 cm⁻¹' },
                { label: 'Functional group matching:', value: 'Characteristic frequencies' },
                { label: 'Minimum band count:', value: '2 diagnostic bands' },
                { label: 'Database scope:', value: 'NIST Chemistry WebBook + IR tables' },
              ],
            },
            {
              subtitle: 'Scoring Weights',
              params: [
                { label: 'Band position matching:', value: '40%', highlight: true },
                { label: 'Relative intensity:', value: '35%', highlight: true },
                { label: 'Band shape (sharp/broad):', value: '25%', highlight: true },
              ],
              note: 'Weights optimized for inorganic materials. Organic samples may require adjusted intensity weighting due to extinction coefficient variations.',
            },
          ],
        },
        instrumental: {
          title: 'FTIR Instrumental Parameters',
          sections: [
            {
              subtitle: 'Spectrometer Configuration',
              params: [
                { label: 'Measurement mode:', value: 'Attenuated total reflectance (ATR)' },
                { label: 'ATR crystal:', value: 'Diamond (single bounce)' },
                { label: 'Spectral range:', value: '400 - 4000 cm⁻¹' },
                { label: 'Spectral resolution:', value: '4 cm⁻¹' },
                { label: 'Number of scans:', value: '64 scans averaged' },
              ],
            },
            {
              subtitle: 'Data Processing',
              params: [
                { label: 'ATR correction:', value: 'Depth-dependent correction applied' },
                { label: 'Baseline correction:', value: 'Concave rubber band' },
                { label: 'Normalization:', value: 'Vector normalization' },
                { label: 'Peak fitting:', value: 'Gaussian-Lorentzian profile' },
              ],
            },
          ],
        },
      };
    default:
      return {
        analysisConfig: {
          title: 'General Analysis Configuration',
          sections: [
            {
              subtitle: 'Peak Detection',
              params: [
                { label: 'Minimum intensity threshold:', value: '5% of max' },
                { label: 'Background correction:', value: 'Polynomial baseline' },
                { label: 'Smoothing filter:', value: 'Savitzky-Golay' },
              ],
            },
          ],
        },
        instrumental: {
          title: 'Instrumental Parameters',
          sections: [
            {
              subtitle: 'Configuration',
              params: [
                { label: 'Technique:', value: 'Multi-technique analysis' },
              ],
            },
          ],
        },
      };
  }
}

function getLiteratureEvidence(technique: string, projectName?: string): LiteratureEvidence {
  // Generate search query based on material and technique
  let query = '';
  let papers: LiteraturePaper[] = [];
  
  if (projectName?.includes('CuFe2O4/SBA-15')) {
    query = 'CuFe2O4 SBA-15 supported spinel ferrite mesoporous silica catalysis XRD XPS';
    papers = [
      {
        title: 'Copper ferrite nanoparticles supported on mesoporous SBA-15: Synthesis and catalytic applications',
        authors: 'Zhang, L., Wang, Y., Chen, H.',
        year: '2023',
        source: 'Journal of Catalysis',
        relevance: 'High - Supporting',
        keyEvidence: 'XRD shows CuFe₂O₄ lattice parameter a = 8.37 Å on SBA-15 support (vs. 8.39 Å bulk). XPS Cu 2p₃/₂ at 933.9 eV with surface Cu/Fe = 0.78 (vs. bulk 0.50). FTIR Si-O-Si band at 1048 cm⁻¹ indicates support interaction. Spinel (311) peak preserved after loading.',
        consistencyCheck: 'Our a = 8.38 Å intermediate between their supported (8.37 Å) and bulk values, consistent with partial support interaction. Our Cu/Fe = 0.76 matches their surface enrichment trend. Our FTIR shoulder at 1050 cm⁻¹ confirms Si-O-Si signature.',
        impactOnDecision: 'Validates spinel structure retention on support (+0.02 confidence). Confirms Cu surface segregation is not artifact but thermodynamic effect. Support interaction detected but does not alter bulk crystal structure.',
        externalLink: '#',
      },
      {
        title: 'Structural and magnetic properties of copper ferrite on mesoporous silica supports',
        authors: 'Kumar, R., Singh, P.',
        year: '2022',
        source: 'Materials Chemistry and Physics',
        relevance: 'Moderate - Partial Conflict',
        keyEvidence: 'Reports I(311)/I(220) = 3.1 for CuFe₂O₄/SBA-15 from Rietveld refinement, indicating random powder orientation. Cation distribution Cu₀.₂Fe₀.₈[Cu₀.₈Fe₁.₂]O₄ confirmed. However, observes 5-8% reduction in crystallite size (28-32 nm) vs. bulk (35-40 nm) due to confinement effects.',
        consistencyCheck: 'Our I(311)/I(220) = 2.8 is 10% lower, suggesting mild (111) preferred orientation (March-Dollase r = 1.15) not accounted for in their analysis. CONFLICT: Our crystallite size = 35 nm shows no confinement effect, possibly due to different synthesis temperature or loading method.',
        impactOnDecision: 'Supports inverse spinel cation distribution (+0.01). Texture difference flags potential sample preparation variation but does not affect phase assignment. Crystallite size discrepancy neutral impact (both in catalytically active range).',
        externalLink: '#',
      },
    ];
  } else if (projectName?.includes('CuFe2O4')) {
    query = 'CuFe2O4 spinel ferrite XRD Raman XPS catalytic activity';
    papers = [
      {
        title: 'Copper ferrite spinel nanostructures for catalytic and magnetic applications',
        authors: 'Liu, X., Zhang, M., Wang, Q.',
        year: '2023',
        source: 'Advanced Materials',
        relevance: 'High - Supporting',
        keyEvidence: 'Reports A₁g Raman mode at 688 cm⁻¹ for CuFe₂O₄ with 75-85% Cu²⁺ octahedral occupancy. XRD lattice parameter a = 8.377 Å from Rietveld refinement. Crystallite size 32-38 nm from Scherrer analysis correlates with catalytic activity.',
        consistencyCheck: 'Our A₁g = 690 cm⁻¹ matches within ±2 cm⁻¹ (instrumental resolution). Our a = 8.38 Å agrees within error bars. Our crystallite size 35 nm falls in reported range, validating Scherrer methodology.',
        impactOnDecision: 'Strengthens inverse spinel assignment (+0.03 confidence). Confirms Cu²⁺ octahedral site preference from Raman-structure correlation. Validates crystallite size as catalytically relevant (30-40 nm optimal range).',
        externalLink: '#',
      },
      {
        title: 'Phase identification and structural characterization of copper ferrite by XRD and Raman spectroscopy',
        authors: 'Chen, Y., Li, W.',
        year: '2022',
        source: 'Journal of Solid State Chemistry',
        relevance: 'High - Supporting',
        keyEvidence: 'Provides reference d-spacings: d₃₁₁ = 2.532 Å, d₄₄₀ = 1.481 Å, d₅₁₁ = 1.615 Å for pure CuFe₂O₄. Raman T₂g splitting Δν = 142 cm⁻¹ attributed to Jahn-Teller Cu²⁺ distortion in octahedral sites. Absence of CuO band at 530 cm⁻¹ used as phase purity criterion.',
        consistencyCheck: 'Our d₃₁₁ = 2.53 Å matches exactly. Our T₂g splitting = 145 cm⁻¹ within ±3 cm⁻¹. No CuO signature detected in our data, confirming phase purity >98%. Excellent agreement across all metrics.',
        impactOnDecision: 'Validates crystallographic indexing (+0.02 confidence). Confirms Jahn-Teller interpretation of Raman splitting. Supports single-phase conclusion by ruling out CuO contamination.',
        externalLink: '#',
      },
      {
        title: 'Surface chemistry of CuFe₂O₄: XPS investigation of oxidation states',
        authors: 'Anderson, K., Brown, T.',
        year: '2021',
        source: 'Surface Science',
        relevance: 'Moderate - Partial Conflict',
        keyEvidence: 'Reports Cu 2p₃/₂ at 933.6 eV for bulk CuFe₂O₄ with satellite I_sat/I_main = 0.38-0.42. Surface enrichment Cu(surface)/Cu(bulk) = 1.2-1.4 observed after air exposure. However, reports Fe³⁺/Fe²⁺ ratio = 3.2 (vs. expected 2.0 for stoichiometric inverse spinel).',
        consistencyCheck: 'Our Cu 2p₃/₂ = 933.8 eV is +0.2 eV higher (within calibration uncertainty). Our Cu enrichment = 1.3 matches their range. CONFLICT: Our Fe³⁺/Fe²⁺ = 2.8 differs from their 3.2, suggesting different surface oxidation states or measurement conditions.',
        impactOnDecision: 'Supports Cu²⁺ assignment and surface reconstruction (+0.01). However, Fe oxidation state discrepancy introduces uncertainty (-0.01). Net impact: neutral. Flags need for controlled-atmosphere XPS to resolve Fe²⁺ quantification ambiguity.',
        externalLink: '#',
      },
    ];
  } else if (projectName?.includes('NiFe2O4')) {
    query = 'NiFe2O4 spinel ferrite XRD Raman magnetic catalytic properties';
    papers = [
      {
        title: 'Nickel ferrite spinel: Structural and magnetic characterization',
        authors: 'Patel, S., Kumar, A.',
        year: '2023',
        source: 'Journal of Magnetism and Magnetic Materials',
        relevance: 'High',
        whyItMatters: 'Confirms NiFe₂O₄ spinel structure with XRD patterns matching current evidence',
        externalLink: '#',
      },
      {
        title: 'Raman spectroscopy of nickel ferrite: Mode assignment and structural insights',
        authors: 'Wang, H., Liu, J.',
        year: '2022',
        source: 'Vibrational Spectroscopy',
        relevance: 'High',
        whyItMatters: 'Provides Raman mode assignments consistent with observed spectrum',
        externalLink: '#',
      },
    ];
  } else if (projectName?.includes('CoFe2O4')) {
    query = 'CoFe2O4 spinel ferrite XRD Raman magnetic anisotropy catalysis';
    papers = [
      {
        title: 'Cobalt ferrite nanoparticles: Synthesis, characterization and magnetic properties',
        authors: 'Lee, S., Park, J.',
        year: '2023',
        source: 'Journal of Alloys and Compounds',
        relevance: 'High',
        whyItMatters: 'Supports CoFe₂O₄ spinel identification with similar XRD and magnetic characteristics',
        externalLink: '#',
      },
      {
        title: 'Structural and vibrational properties of cobalt ferrite studied by XRD and Raman',
        authors: 'Garcia, M., Rodriguez, A.',
        year: '2022',
        source: 'Materials Research Bulletin',
        relevance: 'High',
        whyItMatters: 'Confirms spinel structure and provides reference for peak positions',
        externalLink: '#',
      },
    ];
  } else if (projectName?.includes('Fe3O4')) {
    query = 'Fe3O4 magnetite XRD Raman XPS Fe2+ Fe3+ oxidation';
    papers = [
      {
        title: 'Magnetite nanoparticles: Structural characterization and oxidation state analysis',
        authors: 'Thompson, R., Davis, M.',
        year: '2023',
        source: 'Chemistry of Materials',
        relevance: 'High',
        whyItMatters: 'Validates Fe₃O₄ structure and mixed Fe²⁺/Fe³⁺ oxidation states',
        externalLink: '#',
      },
      {
        title: 'XPS and Raman investigation of iron oxide phases',
        authors: 'Wilson, K., Martinez, L.',
        year: '2022',
        source: 'Applied Surface Science',
        relevance: 'High',
        whyItMatters: 'Distinguishes magnetite from other iron oxides using spectroscopic signatures',
        externalLink: '#',
      },
    ];
  } else {
    query = 'spinel ferrite XRD Raman XPS structural characterization';
    papers = [
      {
        title: 'Spinel ferrites: Structural characterization and applications',
        authors: 'Smith, J., Johnson, A.',
        year: '2023',
        source: 'Materials Today',
        relevance: 'Moderate',
        whyItMatters: 'General overview of spinel ferrite characterization techniques',
        externalLink: '#',
      },
    ];
  }

  return {
    query,
    provider: 'mock',
    papers,
    geminiSummary: `**Cross-study comparison:** Three independent groups (Liu 2023, Chen 2022, Anderson 2021) report CuFe₂O₄ lattice parameters spanning 8.37-8.39 Å, with our 8.38 Å falling at the distribution center. This tight clustering (σ = 0.01 Å) across different synthesis methods rules out systematic preparation artifacts and validates our crystallographic assignment.

**Convergent evidence:** Raman A₁g mode position shows remarkable consistency: Liu (688 cm⁻¹), our data (690 cm⁻¹), literature range (685-695 cm⁻¹). This 1% variation despite different instruments and sample histories indicates robust structure-property correlation, strengthening inverse spinel conclusion.

**Resolved discrepancy:** Anderson's Fe³⁺/Fe²⁺ = 3.2 conflicts with our 2.8 and stoichiometric expectation (2.0). Analysis: Their ex-situ XPS after air exposure likely oxidized surface Fe²⁺ → Fe³⁺. Our value closer to ideal suggests fresher surface or inert transfer. This explains discrepancy without invalidating either dataset—both measure real but different surface states.

**Confidence impact:** Supporting papers (Liu, Chen, Zhang) contribute +0.05 through independent validation of lattice parameters, Raman modes, and XPS binding energies. Partial conflicts (Anderson Fe ratio, Kumar crystallite size) contribute -0.02 but are explainable by experimental conditions. Net literature contribution: +0.03 to final confidence, raising score from 0.90 → 0.93.

**Critical insight:** Multi-laboratory convergence on Cu surface enrichment (1.2-1.4×) across three studies suggests universal thermodynamic driving force rather than measurement artifact. This elevates surface reconstruction from observation to validated phenomenon, justifying inclusion in structural model.`,
  };
}

export function RightPanel({
  technique = 'XRD',
  projectName,
  activeTab: controlledActiveTab,
  currentStep,
  totalSteps,
  reasoningStream,
  candidates,
  onTabChange,
  onPromptSubmit,
}: RightPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('thinking');
  const [userPrompt, setUserPrompt] = useState('');
  const [activeEvidenceId, setActiveEvidenceId] = useState<string | null>(null);
  const [parameterMode, setParameterMode] = useState<'hybrid' | 'agent'>('hybrid');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const activeTab = controlledActiveTab ?? internalActiveTab;

  // Evidence contribution data for confidence explainability
  const evidenceContributions = [
    {
      id: 'peak-alignment',
      label: 'Peak Position Alignment',
      source: 'XRD',
      contribution: '+0.36',
      score: 0.92,
      impact: 'positive',
      explanation: 'All 7 major reflections (220, 311, 400, 422, 511, 440, 533) match CuFe₂O₄ reference within Δ2θ ≤ 0.15°. Lattice parameter a = 8.38 Å from Nelson-Riley extrapolation confirms cubic Fd-3m symmetry. Contributes 40% weight × 0.92 alignment = +0.368 to base score.',
    },
    {
      id: 'intensity-corr',
      label: 'Intensity Correlation',
      source: 'XRD',
      contribution: '+0.30',
      score: 0.87,
      impact: 'positive',
      explanation: 'Pearson correlation r = 0.87 between observed and reference intensities after Lorentz-polarization correction. Mild (111) preferred orientation (March-Dollase r = 1.15) accounts for I(311)/I(220) deviation. Contributes 35% weight × 0.87 correlation = +0.305 to base score.',
    },
    {
      id: 'completeness',
      label: 'Peak Completeness',
      source: 'XRD',
      contribution: '+0.21',
      score: 0.857,
      impact: 'positive',
      explanation: '18 out of 21 expected reflections observed (85.7% completeness). Missing peaks have I/I₀ < 5% in reference, below detection threshold. Contributes 25% weight × 0.857 completeness = +0.214 to base score.',
    },
    {
      id: 'anomalous-peak',
      label: 'Unindexed Peak Penalty',
      source: 'XRD',
      contribution: '-0.02',
      score: 0.018,
      impact: 'negative',
      explanation: 'Weak reflection at 2θ = 62.3° (I/I₀ = 1.8%) cannot be indexed to Fd-3m spinel. Possible CuO trace impurity or superlattice ordering. Penalty scaled by intensity ratio: -0.02 × (1.8/100) = -0.02 confidence reduction.',
    },
    {
      id: 'raman-validation',
      label: 'Raman Mode Validation',
      source: 'Raman',
      contribution: '+0.02',
      score: 1.0,
      impact: 'positive',
      explanation: 'A₁g symmetric breathing mode at 690 cm⁻¹ matches CuFe₂O₄ reference (685-695 cm⁻¹ range). T₂g mode splitting Δν = 145 cm⁻¹ confirms Jahn-Teller Cu²⁺ distortion in octahedral sites. Independent structural validation adds +0.02 cross-technique bonus.',
    },
    {
      id: 'xps-validation',
      label: 'XPS Oxidation State Validation',
      source: 'XPS',
      contribution: '+0.02',
      score: 0.93,
      impact: 'positive',
      explanation: 'Cu 2p₃/₂ at 933.8 eV with satellite confirms Cu²⁺. Fe 2p₃/₂ shows Fe³⁺/Fe²⁺ = 2.8 consistent with inverse spinel stoichiometry (expected 2.0-3.0 range). Chemical state agreement adds +0.02 cross-technique bonus.',
    },
    {
      id: 'literature-consensus',
      label: 'Literature Cross-Validation',
      source: 'Gemini + Literature',
      contribution: '+0.02',
      score: 0.95,
      impact: 'positive',
      explanation: 'Multi-laboratory convergence: Liu 2023 (a = 8.377 Å), Chen 2022 (A₁g = 688 cm⁻¹), Zhang 2023 (Cu surface enrichment 1.2-1.4×) independently validate our measurements. Cross-study consistency adds +0.02 literature bonus.',
    },
  ];

  const handleEditSection = (sectionKey: string) => {
    if (editingSection === sectionKey) {
      // Save and close
      setEditingSection(null);
    } else {
      // Open for editing
      setEditingSection(sectionKey);
    }
  };

  const handleValueChange = (paramKey: string, newValue: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [paramKey]: newValue,
    }));
  };

  const getParamValue = (sectionIdx: number, paramIdx: number, originalValue: string) => {
    const key = `${sectionIdx}-${paramIdx}`;
    return editedValues[key] ?? originalValue;
  };

  const handleTabChange = (tab: TabType) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const handlePromptSubmit = () => {
    if (userPrompt.trim() && onPromptSubmit) {
      onPromptSubmit(userPrompt.trim());
      setUserPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  // Default candidates if none provided
  const displayCandidates: CandidateData[] = candidates ?? [
    {
      phase: 'CuFe₂O₄ (Spinel)',
      peakAlignment: '92%',
      intensityCorr: '0.87',
      completeness: '18/21',
      score: '89.2%',
      result: 'Match',
    },
    {
      phase: 'Fe₃O₄ (Magnetite)',
      peakAlignment: '78%',
      intensityCorr: '0.71',
      completeness: '14/19',
      score: '74.5%',
      result: 'Rejected',
      reason: 'Missing Cu signature peaks',
    },
    {
      phase: 'CuO (Tenorite)',
      peakAlignment: '65%',
      intensityCorr: '0.58',
      completeness: '9/15',
      score: '61.3%',
      result: 'Rejected',
      reason: 'Incompatible peak pattern',
    },
  ];

  return (
    <aside className="w-[400px] shrink-0 border-l border-white/[0.08] bg-[#0F172A] flex flex-col">
      {/* Tab Navigation */}
      <div className="shrink-0 border-b border-white/[0.08] px-4">
        <div className="flex gap-1">
          {(['thinking', 'evidence', 'parameters', 'logs'] as TabType[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-3 text-sm font-semibold capitalize transition-colors relative ${
                activeTab === tab
                  ? 'text-cyan-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'thinking' ? 'Agent Thinking' : tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'thinking' && (
          <>
            {/* User Prompt Input Box */}
            <div className="rounded-lg border border-slate-700 bg-[#070B12] p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Experiment Instructions
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-300 text-[9px] font-bold">
                  User Control
                </span>
              </div>
              <div className="space-y-3">
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Provide instructions or constraints for the agent (e.g., 'Focus on Cu oxidation states', 'Check for secondary phases', 'Prioritize peak intensity analysis')..."
                  className="w-full h-24 px-3 py-2 rounded-md bg-slate-800/50 border border-slate-700 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Press Enter to send, Shift+Enter for new line
                  </span>
                  <button
                    type="button"
                    onClick={handlePromptSubmit}
                    disabled={!userPrompt.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <Send size={12} />
                    Send to Agent
                  </button>
                </div>
              </div>
            </div>

            {/* Section 1: Reasoning Stream */}
            <Section title="Reasoning Stream">
              <div className="text-xs text-slate-400 mb-3">
                Step {currentStep >= 0 ? currentStep + 1 : 1} of {totalSteps} · Hypothesis Evaluation
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Observed Peaks (2θ):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['18.3°', '30.1°', '35.5°', '43.2°', '53.5°', '57.1°', '62.7°'].map((peak) => (
                      <span
                        key={peak}
                        className="px-2 py-1 rounded bg-slate-800/50 border border-slate-700 text-[10px] font-mono text-slate-300"
                      >
                        {peak}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-2">
                    Evaluation Logic:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span><span className="text-slate-300">Position matching:</span> Calculate Δ2θ = |θ_obs - θ_ref| for each peak. Accept if Δ2θ ≤ 0.2° (instrumental resolution limit). Current: 7/7 peaks within tolerance.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span><span className="text-slate-300">Intensity correlation:</span> Compute Pearson r between I_obs and I_ref after Lorentz-polarization correction. Threshold r ≥ 0.80 for structural match. Current: r = 0.87.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span><span className="text-slate-300">Completeness check:</span> Verify presence of all expected reflections with I/I₀ ≥ 5% from reference. Missing peaks penalize score by -0.05 per absence. Current: 18/21 expected peaks observed (85.7%).</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Section>

            {/* Section 2: Candidate Comparison */}
            <Section title="Candidate Comparison">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-2 pr-2 text-slate-500 font-semibold">Phase</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-semibold">Align</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-semibold">Corr</th>
                      <th className="text-right py-2 px-2 text-slate-500 font-semibold">Comp</th>
                      <th className="text-right py-2 pl-2 text-slate-500 font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayCandidates.map((candidate, index) => (
                      <tr key={index} className="border-b border-slate-800/50">
                        <td className="py-3 pr-2">
                          <div className="text-slate-200 font-medium mb-1">{candidate.phase}</div>
                          <div className="flex items-center gap-1.5">
                            {candidate.result === 'Match' ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[9px] font-bold">
                                Match
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-red-400/10 border border-red-400/30 text-red-300 text-[9px] font-bold">
                                Rejected
                              </span>
                            )}
                          </div>
                          {candidate.reason && (
                            <div className="text-[10px] text-slate-500 mt-1">{candidate.reason}</div>
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300 font-mono">
                          {candidate.peakAlignment}
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300 font-mono">
                          {candidate.intensityCorr}
                        </td>
                        <td className="text-right py-3 px-2 text-slate-300 font-mono">
                          {candidate.completeness}
                        </td>
                        <td className="text-right py-3 pl-2 text-slate-300 font-mono font-semibold">
                          {candidate.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Scientific Summary */}
            <Section title="Scientific Summary" badge="Source: Hybrid" badgeColor="violet">
              <div className="text-xs text-slate-400 mb-3">
                {getScientificSummary(technique).title}
              </div>
              {getScientificSummary(technique).blocks.map((block, index) => (
                <div key={index} className="mb-3">
                  <div className="text-xs font-semibold text-slate-300 mb-1">{block.label}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{block.content}</div>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Confidence:</span>
                  <span className="text-xs text-emerald-400 font-semibold">{getScientificSummary(technique).confidence}</span>
                </div>
              </div>
            </Section>

            {/* Section 3: Uncertainty Assessment */}
            <Section title="Uncertainty Assessment">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Residual uncertainty:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                    Low (σ = 0.02)
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">Quantified sources:</div>
                  <ul className="space-y-1 text-xs text-slate-500">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-600">•</span>
                      <span><span className="text-slate-400">Peak position uncertainty:</span> ±0.02° (2θ) from instrumental broadening and sample displacement (contributes σ₁ = 0.008)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-600">•</span>
                      <span><span className="text-slate-400">Intensity measurement error:</span> ±3% from counting statistics and background subtraction (contributes σ₂ = 0.012)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-600">•</span>
                      <span><span className="text-slate-400">Unindexed reflections:</span> 2 weak peaks (I/I₀ &lt; 2%) at 62.3° and 64.1° may indicate trace impurity or superlattice ordering (contributes σ₃ = 0.015)</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">Impact on conclusion:</div>
                  <div className="text-xs text-emerald-400">
                    Combined uncertainty σ_total = √(σ₁² + σ₂² + σ₃²) = 0.021 does not alter primary phase assignment. Confidence interval [0.91, 0.95] remains above decision threshold (0.85).
                  </div>
                </div>
              </div>
            </Section>

            {/* Section 4: Scientific Interpretation */}
            <Section title="Scientific Interpretation" badge="Source: Gemini" badgeColor="violet">
              <div className="text-xs text-slate-400 space-y-2">
                <p>
                  <span className="text-slate-300 font-medium">Crystallographic consistency:</span> The observed d-spacings (d₃₁₁ = 2.53 Å, d₄₄₀ = 1.48 Å) align with cubic spinel lattice within instrumental resolution (±0.02 Å). Peak intensity ratios deviate &lt;8% from powder diffraction file, suggesting minimal preferred orientation.
                </p>
                <p>
                  <span className="text-slate-300 font-medium">Phase purity assessment:</span> Integrated intensity analysis across 2θ = 10-80° accounts for 97.3% of total scattering. Residual 2.7% distributed as background noise rather than coherent secondary phase reflections, supporting single-phase conclusion.
                </p>
                <p>
                  <span className="text-slate-300 font-medium">Competing hypotheses:</span> Fe₃O₄ magnetite rejected due to absence of characteristic (111) reflection at 18.3° and incompatible lattice parameter (a_magnetite = 8.39 Å vs. a_observed = 8.38 Å). CuO tenorite ruled out by missing monoclinic signature at 38.7°.
                </p>
                <p className="text-slate-500 text-[10px] pt-2 border-t border-slate-800">
                  <span className="text-violet-400">Gemini reasoning:</span> Cross-validated peak positions against 3 independent databases (ICDD, COD, AMCSD). Confidence score adjusted +6% based on multi-technique convergence (XRD + Raman + XPS all support spinel assignment).
                </p>
              </div>
            </Section>

            {/* Section 5: Scientific Determination */}
            <Section title="Scientific Determination" badge="Source: Hybrid" badgeColor="cyan">
              <div className="space-y-3">
                <div className="text-xs">
                  <span className="text-slate-200 font-semibold">CuFe₂O₄ inverse spinel phase assignment</span>
                </div>

                <div className="rounded-lg bg-emerald-400/5 border border-emerald-400/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-300">Confidence:</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                      High (0.93 ± 0.02)
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 text-center mb-2">
                    Derived from evidence synthesis
                  </div>
                  <div className="text-[10px] text-cyan-400 text-center pt-2 border-t border-emerald-400/20">
                    📊 Confidence source: <span className="font-semibold">Evidence tab → Confidence Formation</span>
                    <br />
                    <span className="text-slate-500">Click evidence items there to see detailed contributions</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">Evidence basis:</div>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li className={`flex items-start gap-2 p-2 rounded transition-all ${
                      activeEvidenceId === 'peak-alignment' ? 'bg-blue-400/10 border border-blue-400/30' : ''
                    }`}>
                      <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span><span className="text-slate-300">Crystallographic match:</span> 7/7 major reflections indexed to Fd-3m, a = 8.38 Å</span>
                    </li>
                    <li className={`flex items-start gap-2 p-2 rounded transition-all ${
                      activeEvidenceId === 'intensity-corr' ? 'bg-blue-400/10 border border-blue-400/30' : ''
                    }`}>
                      <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span><span className="text-slate-300">Intensity correlation:</span> Pearson r = 0.87 vs. reference powder pattern</span>
                    </li>
                    <li className={`flex items-start gap-2 p-2 rounded transition-all ${
                      activeEvidenceId === 'raman-validation' || activeEvidenceId === 'xps-validation' ? 'bg-blue-400/10 border border-blue-400/30' : ''
                    }`}>
                      <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span><span className="text-slate-300">Spectroscopic validation:</span> Raman A₁g at 690 cm⁻¹, XPS Cu²⁺ satellite confirm cation ordering</span>
                    </li>
                    <li className={`flex items-start gap-2 p-2 rounded transition-all ${
                      activeEvidenceId === 'literature-consensus' ? 'bg-blue-400/10 border border-blue-400/30' : ''
                    }`}>
                      <span className="text-violet-400 shrink-0">◆</span>
                      <span><span className="text-slate-300">Gemini cross-validation:</span> Literature consensus (5 studies, 2021-2023) independently confirms structural parameters</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">Recommended validation:</div>
                  <div className="text-xs text-cyan-400">
                    <span className="text-slate-300">Priority 1:</span> High-resolution TEM to resolve 62.3° anomaly (superlattice vs. impurity). <span className="text-slate-300">Priority 2:</span> Temperature-dependent XPS to quantify surface reconstruction thermodynamics.
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'evidence' && (
          <>
            {/* Conflict Analysis */}
            <Section title="Conflict Analysis">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-2">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold">Anomalous reflection at 2θ = 62.3°</span>
                  <span className="text-slate-500"> (I/I₀ = 1.8%, FWHM = 0.4°)</span>
                </div>
                <div className="text-xs text-slate-400">
                  <span className="text-slate-300">Analysis:</span> Peak position inconsistent with CuFe₂O₄ spinel (no allowed reflection at d = 1.489 Å for Fd-3m). Possible origins: (1) trace CuO impurity (2-11) plane, (2) surface reconstruction superlattice, or (3) instrumental artifact from Kα₂ stripping error.
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-400 font-semibold">Confidence penalty:</span>
                  <span className="text-amber-300 font-mono">-0.02</span>
                  <span className="text-slate-500">(scaled by intensity ratio 1.8/100)</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700">
                  <span className="text-slate-400">Decision:</span> Insufficient intensity to support secondary phase hypothesis (detection limit ~2%). Flagged for follow-up XPS or TEM analysis if critical for application.
                </div>
              </div>
            </Section>

            {/* Evidence Synthesis */}
            <Section title="Evidence Synthesis">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Base alignment score (S_align):</span>
                  <span className="text-slate-200 font-mono font-semibold">0.89</span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-2 ml-4">
                  Weighted average: 0.4×(position match) + 0.35×(intensity corr.) + 0.25×(completeness)
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-400">Conflict penalty (P_conflict):</span>
                  <span className="text-amber-300 font-mono">-0.02</span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-2 ml-4">
                  Anomalous peak at 62.3° (1.8% intensity) → penalty = -0.02 × (I/I_threshold)
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400">Cross-technique bonus (B_cross):</span>
                  <span className="text-emerald-300 font-mono">+0.06</span>
                </div>
                <div className="text-[10px] text-slate-500 -mt-2 ml-4">
                  XRD + Raman + XPS convergence → +0.02 per independent technique agreement
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <div className="text-[11px] text-slate-400 mb-2 font-mono">
                    S_final = S_align + P_conflict + B_cross = 0.89 - 0.02 + 0.06
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">Final confidence:</span>
                    <span className="text-lg text-emerald-300 font-mono font-bold">0.93</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Confidence Formation */}
            <Section title="Confidence Formation">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-4 space-y-3">
                <div className="text-xs text-slate-400 mb-3">
                  Click on any evidence item below to see its detailed contribution to the final confidence score.
                </div>

                {/* Evidence Contribution List */}
                <div className="space-y-2">
                  {evidenceContributions.map((evidence) => (
                    <button
                      key={evidence.id}
                      type="button"
                      onClick={() => setActiveEvidenceId(evidence.id === activeEvidenceId ? null : evidence.id)}
                      className={`w-full text-left rounded-lg border p-3 transition-all ${
                        activeEvidenceId === evidence.id
                          ? 'border-blue-400 bg-blue-400/5 shadow-sm'
                          : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-300">{evidence.label}</span>
                        <span className={`text-xs font-mono font-bold ${
                          evidence.impact === 'positive' ? 'text-emerald-300' : 'text-amber-300'
                        }`}>
                          {evidence.contribution}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{evidence.source}</span>
                        {activeEvidenceId === evidence.id && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-400/10 border border-blue-400/30 text-blue-300 font-bold">
                            INSPECTING
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Selected Evidence Detail Panel */}
                {activeEvidenceId && (
                  <div className="mt-4 rounded-lg border-2 border-blue-400 bg-blue-400/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                        Selected Evidence Contribution
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveEvidenceId(null)}
                        className="ml-auto text-[10px] text-slate-400 hover:text-slate-300"
                      >
                        Close
                      </button>
                    </div>
                    {(() => {
                      const selected = evidenceContributions.find((e) => e.id === activeEvidenceId);
                      if (!selected) return null;
                      return (
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs font-semibold text-slate-300 mb-1">{selected.label}</div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-slate-400">Source:</span>
                              <span className="text-slate-200">{selected.source}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-2 border-y border-blue-400/20">
                            <span className="text-xs font-semibold text-slate-300">Contribution to Final Score:</span>
                            <span className={`text-lg font-mono font-bold ${
                              selected.impact === 'positive' ? 'text-emerald-300' : 'text-amber-300'
                            }`}>
                              {selected.contribution}
                            </span>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-300 mb-1.5">Calculation Details:</div>
                            <div className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded border border-slate-700">
                              {selected.explanation}
                            </div>
                          </div>
                          <div className="pt-2 border-t border-blue-400/20">
                            <div className="text-[10px] text-blue-300">
                              💡 This evidence item is also referenced in the <span className="font-semibold">Agent Thinking → Scientific Determination</span> section.
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="border-t border-slate-700 pt-3 mt-4">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Confidence Calculation:</div>
                  <div className="text-xs text-slate-400 font-mono bg-slate-900/50 p-2 rounded border border-slate-700 mb-3">
                    S_final = (0.36 + 0.30 + 0.21) + (-0.02) + (0.02 + 0.02 + 0.02) = 0.93
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-300">Final confidence:</span>
                    <span className="text-xl text-emerald-300 font-mono font-bold">0.93</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Uncertainty range:</span>
                    <span className="text-xs text-slate-300 font-mono">± 0.02</span>
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-3">
                  <div className="text-xs font-semibold text-slate-300 mb-1.5">Interpretation:</div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    Confidence is derived from peak alignment (position matching within ±0.2°), intensity correlation (Pearson r = 0.87), and cross-technique consistency (XRD + Raman + XPS convergence). Minor unindexed peaks reduce confidence slightly, but multi-technique agreement provides strong validation.
                  </div>
                </div>
              </div>
            </Section>

            {/* Evidence Sources */}
            <Section title="Evidence Sources">
              <div className="space-y-2">
                <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-300">Crystallographic Alignment</span>
                  </div>
                  <div className="text-xs text-slate-400 ml-6">
                    All 7 major reflections (220, 311, 400, 422, 511, 440, 533) match CuFe₂O₄ reference (ICDD 00-034-0425) within Δ2θ ≤ 0.15°. Lattice parameter a = 8.38 ± 0.01 Å from Nelson-Riley extrapolation confirms cubic Fd-3m symmetry. Zero systematic peak shifts rule out solid solution formation.
                  </div>
                </div>
                
                <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-300">Intensity Correlation</span>
                  </div>
                  <div className="text-xs text-slate-400 ml-6">
                    Observed I(311)/I(220) = 2.8 vs. calculated 3.1 for random powder (90% agreement). Deviation attributed to mild (111) preferred orientation (March-Dollase parameter r = 1.15). Pearson correlation r = 0.87 after texture correction exceeds acceptance threshold (r ≥ 0.80).
                  </div>
                </div>
                
                <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-semibold text-slate-300">Multi-Technique Convergence</span>
                  </div>
                  <div className="text-xs text-slate-400 ml-6">
                    XRD (bulk structure), Raman (cation ordering), and XPS (oxidation states) independently support inverse spinel Cu₀.₂Fe₀.₈[Cu₀.₈Fe₁.₂]O₄. Probability of false positive across 3 orthogonal techniques: P &lt; 0.001. Cross-validation eliminates systematic measurement errors.
                  </div>
                </div>
              </div>
            </Section>

            {/* Limitations */}
            <Section title="Limitations">
              <div className="rounded-lg bg-amber-400/5 border border-amber-400/20 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Unresolved weak reflections:</span> Two peaks at 2θ = 62.3° and 64.1° (I/I₀ &lt; 2%) cannot be indexed to Fd-3m spinel. Possible origins include CuO trace impurity (&lt;2 wt%), Cu-Fe ordering superlattice (P4₃32 symmetry), or instrumental artifacts. Below XRD detection limit for definitive assignment.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Surface vs. bulk discrepancy:</span> XPS indicates Cu surface enrichment (Cu/Fe = 0.76 vs. bulk 0.50), but penetration depth (~5 nm) samples only surface region. Bulk composition may deviate from nominal CuFe₂O₄ stoichiometry. Neutron diffraction or bulk ICP-OES recommended for validation.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-300 font-medium">Crystallite size uncertainty:</span> Scherrer analysis assumes spherical crystallites and zero strain. Actual morphology (TEM required) may be faceted or anisotropic, affecting catalytic site distribution. Williamson-Hall plot needed to deconvolve size and strain contributions.
                  </div>
                </div>
              </div>
            </Section>

            {/* Literature Evidence */}
            <Section title="Literature Evidence">
              <div className="space-y-3">
                {/* Provider and Query */}
                <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Provider:</span>
                    <span className="text-xs text-slate-300">Google Scholar compatible search</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 mb-1">Generated Query:</div>
                    <div className="text-xs text-slate-300 font-mono bg-slate-900/50 p-2 rounded border border-slate-700">
                      {getLiteratureEvidence(technique, projectName).query}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-700">
                    Note: Google Scholar access requires a backend proxy or third-party search API
                  </div>
                </div>

                {/* Papers */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Literature Cross-Validation:</div>
                  {getLiteratureEvidence(technique, projectName).papers.map((paper, index) => (
                    <div key={index} className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-200 mb-1">{paper.title}</div>
                        <div className="text-xs text-slate-400">
                          {paper.authors} ({paper.year})
                        </div>
                        <div className="text-xs text-slate-500">{paper.source}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          paper.relevance.includes('Supporting')
                            ? 'bg-emerald-400/10 border border-emerald-400/30 text-emerald-300'
                            : paper.relevance.includes('Conflict')
                            ? 'bg-amber-400/10 border border-amber-400/30 text-amber-300'
                            : 'bg-slate-400/10 border border-slate-400/30 text-slate-300'
                        }`}>
                          {paper.relevance}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-[11px] font-semibold text-slate-300 mb-1">Key Evidence:</div>
                          <div className="text-[11px] text-slate-400 leading-relaxed">{paper.keyEvidence}</div>
                        </div>
                        
                        <div className="pt-1 border-t border-slate-700/50">
                          <div className="text-[11px] font-semibold text-slate-300 mb-1">Consistency Check:</div>
                          <div className="text-[11px] text-slate-400 leading-relaxed">{paper.consistencyCheck}</div>
                        </div>
                        
                        <div className="pt-1 border-t border-slate-700/50">
                          <div className="text-[11px] font-semibold text-slate-300 mb-1">Impact on Decision:</div>
                          <div className="text-[11px] text-slate-400 leading-relaxed">{paper.impactOnDecision}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gemini Literature Synthesis */}
                <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-300">Gemini Literature Synthesis</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">
                      Source: Gemini
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 leading-relaxed space-y-2 whitespace-pre-line">
                    {getLiteratureEvidence(technique, projectName).geminiSummary}
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'parameters' && (
          <>
            {/* Parameter Control Mode Selector */}
            <div className="rounded-lg border border-slate-700 bg-[#070B12] p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Parameter Control Mode
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setParameterMode('hybrid')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    parameterMode === 'hybrid'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Hybrid</span>
                    <span className="text-[9px] opacity-80">Manual + Agent</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setParameterMode('agent')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    parameterMode === 'agent'
                      ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Agent 100%</span>
                    <span className="text-[9px] opacity-80">Fully Autonomous</span>
                  </div>
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="text-[10px] text-slate-500">
                  {parameterMode === 'hybrid' ? (
                    <>
                      <span className="text-blue-400 font-semibold">Hybrid Mode:</span> You can manually adjust parameters below. Agent provides recommendations and validates changes.
                    </>
                  ) : (
                    <>
                      <span className="text-purple-400 font-semibold">Agent 100% Mode:</span> Agent automatically optimizes all parameters based on data characteristics and analysis goals.
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis Configuration */}
            <Section title={getTechniqueParameters(technique).analysisConfig.title}>
              <div className="space-y-3">
                {getTechniqueParameters(technique).analysisConfig.sections.map((section, sectionIdx) => {
                  const sectionKey = `analysis-${sectionIdx}`;
                  const isEditing = editingSection === sectionKey;
                  
                  return (
                    <div key={sectionIdx} className={`rounded-lg border p-3 transition-all ${
                      isEditing 
                        ? 'bg-blue-400/5 border-blue-400/30' 
                        : 'bg-slate-800/30 border-slate-700'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-300">{section.subtitle}</div>
                        {parameterMode === 'hybrid' && (
                          <button
                            type="button"
                            onClick={() => handleEditSection(sectionKey)}
                            className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                              isEditing
                                ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/30'
                                : 'bg-blue-400/10 border-blue-400/30 text-blue-300 hover:bg-blue-400/20'
                            }`}
                          >
                            {isEditing ? 'Save' : 'Edit'}
                          </button>
                        )}
                        {parameterMode === 'agent' && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-purple-400/10 border border-purple-400/30 text-purple-300">
                            Auto-optimized
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {section.params.map((param, paramIdx) => {
                          const paramKey = `${sectionIdx}-${paramIdx}`;
                          const currentValue = getParamValue(sectionIdx, paramIdx, param.value);
                          
                          return (
                            <div key={paramIdx} className="flex items-center justify-between text-xs gap-3">
                              <span className="text-slate-400 flex-shrink-0">{param.label}</span>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) => handleValueChange(paramKey, e.target.value)}
                                  className="px-2 py-1 rounded bg-slate-900/50 border border-blue-400/30 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 min-w-[120px]"
                                />
                              ) : (
                                <span className={`font-mono ${param.highlight ? 'text-emerald-300' : 'text-slate-200'}`}>
                                  {currentValue}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {section.note && (
                        <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700">
                          {section.note}
                        </div>
                      )}
                      {isEditing && (
                        <div className="mt-2 pt-2 border-t border-blue-400/20">
                          <div className="text-[10px] text-blue-300">
                            💡 Editing mode active. Click "Save" to apply changes.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Instrumental Parameters */}
            <Section title={getTechniqueParameters(technique).instrumental.title}>
              <div className="space-y-3">
                {getTechniqueParameters(technique).instrumental.sections.map((section, sectionIdx) => {
                  const sectionKey = `instrumental-${sectionIdx}`;
                  const isEditing = editingSection === sectionKey;
                  
                  return (
                    <div key={sectionIdx} className={`rounded-lg border p-3 transition-all ${
                      isEditing 
                        ? 'bg-blue-400/5 border-blue-400/30' 
                        : 'bg-slate-800/30 border-slate-700'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-300">{section.subtitle}</div>
                        {parameterMode === 'hybrid' && (
                          <button
                            type="button"
                            onClick={() => handleEditSection(sectionKey)}
                            className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                              isEditing
                                ? 'bg-emerald-400/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/30'
                                : 'bg-blue-400/10 border-blue-400/30 text-blue-300 hover:bg-blue-400/20'
                            }`}
                          >
                            {isEditing ? 'Save' : 'Edit'}
                          </button>
                        )}
                        {parameterMode === 'agent' && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-purple-400/10 border border-purple-400/30 text-purple-300">
                            Auto-optimized
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {section.params.map((param, paramIdx) => {
                          const paramKey = `instrumental-${sectionIdx}-${paramIdx}`;
                          const currentValue = editedValues[paramKey] ?? param.value;
                          
                          return (
                            <div key={paramIdx} className="flex items-center justify-between text-xs gap-3">
                              <span className="text-slate-400 flex-shrink-0">{param.label}</span>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) => handleValueChange(paramKey, e.target.value)}
                                  className="px-2 py-1 rounded bg-slate-900/50 border border-blue-400/30 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20 min-w-[120px]"
                                />
                              ) : (
                                <span className="text-slate-200 font-mono">{currentValue}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {isEditing && (
                        <div className="mt-2 pt-2 border-t border-blue-400/20">
                          <div className="text-[10px] text-blue-300">
                            💡 Editing mode active. Click "Save" to apply changes.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Gemini Integration */}
            <Section title="Gemini Integration" badge="Source: Gemini" badgeColor="violet">
              <div className="space-y-3">
                <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
                  <div className="text-xs font-semibold text-slate-300 mb-2">Model Configuration</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Model version:</span>
                      <span className="text-slate-200 font-mono">Gemini 1.5 Pro</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Temperature:</span>
                      <span className="text-slate-200 font-mono">0.3</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Max output tokens:</span>
                      <span className="text-slate-200 font-mono">2048</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Top-p sampling:</span>
                      <span className="text-slate-200 font-mono">0.95</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
                  <div className="text-xs font-semibold text-slate-300 mb-2">Reasoning Tasks</div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-purple-400 mt-0.5 shrink-0" />
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-300">Scientific interpretation:</span> Cross-validate peak assignments against crystallographic databases
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-purple-400 mt-0.5 shrink-0" />
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-300">Literature synthesis:</span> Compare results with published studies and explain discrepancies
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-purple-400 mt-0.5 shrink-0" />
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-300">Confidence adjustment:</span> Evaluate multi-technique consistency and adjust final score
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 bg-slate-800/30 border border-slate-700 rounded p-2">
                  <span className="text-slate-400">Note:</span> Gemini provides interpretive reasoning and literature context. Deterministic algorithms handle peak detection, phase matching, and scoring calculations.
                </div>
              </div>
            </Section>

            {/* Decision Thresholds */}
            <Section title="Decision Thresholds">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">High confidence (accept):</span>
                    <span className="text-emerald-300 font-mono font-semibold">≥ 0.85</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Moderate confidence (review):</span>
                    <span className="text-amber-300 font-mono font-semibold">0.70 - 0.84</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Low confidence (reject):</span>
                    <span className="text-red-300 font-mono font-semibold">&lt; 0.70</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="text-[10px] text-slate-500">
                    Thresholds calibrated using 500+ reference materials with known phase composition. False positive rate &lt; 2% for high confidence assignments.
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'logs' && (
          <>
            {/* Execution Timeline */}
            <Section title="Execution Timeline">
              <div className="space-y-2">
                <LogEntry
                  timestamp="00:00.123"
                  level="info"
                  message="Initialized phase identification workflow"
                  details="Loaded 3 technique datasets: XRD (3501 points), Raman (1024 points), XPS (2 regions)"
                />
                <LogEntry
                  timestamp="00:00.456"
                  level="info"
                  message="XRD preprocessing complete"
                  details="Background subtraction (5th order polynomial, R² = 0.998), Kα₂ stripping, Savitzky-Golay smoothing (window=7)"
                />
                <LogEntry
                  timestamp="00:01.234"
                  level="success"
                  message="Detected 9 peaks above threshold"
                  details="Peak positions (2θ): 18.3°, 30.1°, 35.5°, 43.2°, 53.5°, 57.1°, 62.3°, 62.7°, 64.1°. Average FWHM = 0.32°"
                />
                <LogEntry
                  timestamp="00:01.567"
                  level="info"
                  message="Database search initiated"
                  details="Querying ICDD (450k entries), COD (500k entries), AMCSD (25k entries) for Cu-Fe-O system"
                />
                <LogEntry
                  timestamp="00:02.891"
                  level="success"
                  message="Retrieved 47 candidate phases"
                  details="Filtered by composition (Cu:Fe ratio 0.3-0.7) and peak count (≥5 expected reflections in scan range)"
                />
                <LogEntry
                  timestamp="00:03.234"
                  level="info"
                  message="Phase matching in progress"
                  details="Evaluating CuFe₂O₄ (spinel), Fe₃O₄ (magnetite), CuO (tenorite), Cu₂O (cuprite), α-Fe₂O₃ (hematite)..."
                />
                <LogEntry
                  timestamp="00:04.567"
                  level="success"
                  message="Top candidate identified: CuFe₂O₄"
                  details="Score = 89.2% (position: 92%, intensity: 87%, completeness: 85.7%). Next best: Fe₃O₄ (74.5%)"
                />
                <LogEntry
                  timestamp="00:04.789"
                  level="warning"
                  message="Unindexed peaks detected"
                  details="2 weak reflections at 62.3° and 64.1° (I/I₀ < 2%) cannot be assigned to CuFe₂O₄ Fd-3m. Flagged for review."
                />
                <LogEntry
                  timestamp="00:05.123"
                  level="info"
                  message="Cross-technique validation started"
                  details="Comparing XRD phase assignment with Raman modes and XPS oxidation states"
                />
                <LogEntry
                  timestamp="00:06.456"
                  level="success"
                  message="Raman validation: PASS"
                  details="A₁g mode at 690 cm⁻¹ matches CuFe₂O₄ reference (expected: 685-695 cm⁻¹). T₂g splitting confirms Cu²⁺ Jahn-Teller distortion."
                />
                <LogEntry
                  timestamp="00:07.234"
                  level="success"
                  message="XPS validation: PASS"
                  details="Cu 2p₃/₂ at 933.8 eV with satellite confirms Cu²⁺. Fe 2p₃/₂ shows Fe³⁺/Fe²⁺ = 2.8 consistent with inverse spinel."
                />
                <LogEntry
                  timestamp="00:07.567"
                  level="info"
                  message="Gemini interpretation requested"
                  details="Prompt: 'Analyze CuFe₂O₄ phase assignment with XRD peaks at [30.1°, 35.5°, 43.2°, 57.1°, 62.7°], Raman A₁g=690cm⁻¹, XPS Cu²⁺. Explain crystallographic consistency.'"
                />
                <LogEntry
                  timestamp="00:09.891"
                  level="success"
                  message="Gemini response received"
                  details="Generated 487 tokens. Key points: Fd-3m symmetry confirmed, inverse spinel cation distribution validated, multi-technique convergence supports assignment."
                />
                <LogEntry
                  timestamp="00:10.234"
                  level="info"
                  message="Literature search initiated"
                  details="Query: 'CuFe2O4 spinel ferrite XRD Raman XPS catalytic activity'. Searching Google Scholar proxy..."
                />
                <LogEntry
                  timestamp="00:12.567"
                  level="success"
                  message="Retrieved 5 relevant papers"
                  details="Liu 2023 (Advanced Materials), Chen 2022 (J. Solid State Chem), Anderson 2021 (Surface Science), Zhang 2023 (J. Catalysis), Kumar 2022 (Mater. Chem. Phys)"
                />
                <LogEntry
                  timestamp="00:13.123"
                  level="info"
                  message="Gemini literature synthesis requested"
                  details="Comparing current results with 5 literature sources. Analyzing consistency and conflicts."
                />
                <LogEntry
                  timestamp="00:15.456"
                  level="success"
                  message="Literature synthesis complete"
                  details="Cross-study validation: lattice parameter consensus (8.37-8.39 Å), Raman mode agreement (688-690 cm⁻¹). Resolved Fe³⁺/Fe²⁺ discrepancy with Anderson 2021."
                />
                <LogEntry
                  timestamp="00:15.789"
                  level="info"
                  message="Confidence calculation"
                  details="Base score: 0.89, Conflict penalty: -0.02 (unindexed peaks), Cross-technique bonus: +0.06 → Final: 0.93 ± 0.02"
                />
                <LogEntry
                  timestamp="00:16.012"
                  level="success"
                  message="Analysis complete"
                  details="Phase assignment: CuFe₂O₄ inverse spinel (Fd-3m, a=8.38Å). Confidence: High (0.93). Recommended validation: HR-TEM for 62.3° anomaly."
                />
              </div>
            </Section>

            {/* System Information */}
            <Section title="System Information">
              <div className="rounded-lg bg-slate-800/30 border border-slate-700 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total execution time:</span>
                  <span className="text-slate-200 font-mono">16.012 seconds</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Peak detection time:</span>
                  <span className="text-slate-200 font-mono">1.111 s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Database search time:</span>
                  <span className="text-slate-200 font-mono">2.343 s</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Gemini inference time:</span>
                  <span className="text-slate-200 font-mono">5.657 s (2 calls)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Literature search time:</span>
                  <span className="text-slate-200 font-mono">4.901 s</span>
                </div>
                <div className="pt-2 border-t border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Memory usage:</span>
                    <span className="text-slate-200 font-mono">342 MB peak</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Database queries:</span>
                    <span className="text-slate-200 font-mono">3 (ICDD, COD, AMCSD)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">API calls:</span>
                    <span className="text-slate-200 font-mono">3 (Gemini ×2, Scholar ×1)</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Performance Metrics */}
            <Section title="Performance Metrics">
              <div className="space-y-2">
                <div className="rounded-lg bg-emerald-400/5 border border-emerald-400/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">Deterministic Processing</span>
                    <span className="text-emerald-300 font-mono text-xs">3.454 s (21.6%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Peak detection, background subtraction, database matching, scoring calculations
                  </div>
                </div>
                
                <div className="rounded-lg bg-purple-400/5 border border-purple-400/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">Gemini Reasoning</span>
                    <span className="text-purple-300 font-mono text-xs">5.657 s (35.3%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Scientific interpretation (2.324s), literature synthesis (3.333s)
                  </div>
                </div>
                
                <div className="rounded-lg bg-cyan-400/5 border border-cyan-400/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300">External Data Retrieval</span>
                    <span className="text-cyan-300 font-mono text-xs">6.901 s (43.1%)</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Database queries (2.000s), literature search (4.901s)
                  </div>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}

interface SectionProps {
  title: string;
  badge?: string;
  badgeColor?: 'violet' | 'cyan' | 'emerald';
  children: React.ReactNode;
}

function Section({ title, badge, badgeColor = 'violet', children }: SectionProps) {
  const badgeColors = {
    violet: 'bg-violet-400/10 border-violet-400/30 text-violet-300',
    cyan: 'bg-cyan-400/10 border-cyan-400/30 text-cyan-300',
    emerald: 'bg-emerald-400/10 border-emerald-400/30 text-emerald-300',
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </h3>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

interface LogEntryProps {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

function LogEntry({ timestamp, level, message, details }: LogEntryProps) {
  const levelStyles = {
    info: {
      icon: '●',
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-400/5',
      borderColor: 'border-cyan-400/20',
    },
    success: {
      icon: '✓',
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-400/5',
      borderColor: 'border-emerald-400/20',
    },
    warning: {
      icon: '⚠',
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-400/5',
      borderColor: 'border-amber-400/20',
    },
    error: {
      icon: '✕',
      iconColor: 'text-red-400',
      bgColor: 'bg-red-400/5',
      borderColor: 'border-red-400/20',
    },
  };

  const style = levelStyles[level];

  return (
    <div className={`rounded-lg border ${style.borderColor} ${style.bgColor} p-3`}>
      <div className="flex items-start gap-2">
        <span className={`${style.iconColor} text-xs font-bold mt-0.5`}>{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500 font-mono text-[10px]">{timestamp}</span>
            <span className="text-slate-300 text-xs font-medium">{message}</span>
          </div>
          {details && (
            <div className="text-[10px] text-slate-400 leading-relaxed">{details}</div>
          )}
        </div>
      </div>
    </div>
  );
}
