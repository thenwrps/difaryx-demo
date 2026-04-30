import { XRD_PHASE_DATABASE } from './xrdPhaseDatabase';
import type { XrdPoint } from '../agents/xrdAgent/types';
import { gaussian, pseudoVoigt, roundTo } from '../utils/xrdMath';

export interface XrdDemoDataset {
  id: string;
  label: string;
  fileName: string;
  sampleName: string;
  description: string;
  expectedSignal: string;
  dataPoints: XrdPoint[];
}

type ComponentSpec = {
  phaseId: string;
  scale: number;
  width: number;
};

type SynthesisOptions = {
  components: ComponentSpec[];
  amorphousHalo?: {
    center: number;
    width: number;
    amplitude: number;
  };
  noiseAmplitude?: number;
  count?: number;
};

function phaseById(phaseId: string) {
  const phase = XRD_PHASE_DATABASE.find((item) => item.id === phaseId);
  if (!phase) {
    throw new Error(`Missing XRD reference phase: ${phaseId}`);
  }
  return phase;
}

function deterministicNoise(index: number, x: number, amplitude: number) {
  return amplitude * (
    0.48 * Math.sin(index * 0.71) +
    0.33 * Math.sin(index * 1.17 + 0.6) +
    0.19 * Math.sin(x * 0.41)
  );
}

function synthesizeXrdPattern(options: SynthesisOptions): XrdPoint[] {
  const count = options.count ?? 701;
  const noiseAmplitude = options.noiseAmplitude ?? 0.65;

  return Array.from({ length: count }, (_, index) => {
    const x = 10 + (70 * index) / (count - 1);
    const baseline = 12 + 3.6 * Math.exp(-(x - 10) / 38) + 0.42 * Math.sin(x * 0.24);
    const halo = options.amorphousHalo
      ? options.amorphousHalo.amplitude * gaussian(x, options.amorphousHalo.center, options.amorphousHalo.width)
      : 0;
    const crystallineSignal = options.components.reduce((sum, component) => {
      const phase = phaseById(component.phaseId);
      const phaseSignal = phase.peaks.reduce((phaseSum, peak) => {
        const main = peak.relativeIntensity * pseudoVoigt(x, peak.position, component.width, 0.3);
        const kAlphaShoulder = peak.relativeIntensity * 0.08 * pseudoVoigt(x, peak.position + 0.13, component.width * 1.4, 0.4);
        return phaseSum + main + kAlphaShoulder;
      }, 0);
      return sum + phaseSignal * component.scale;
    }, 0);

    return {
      x: roundTo(x, 2),
      y: roundTo(Math.max(0, baseline + halo + crystallineSignal + deterministicNoise(index, x, noiseAmplitude)), 3),
    };
  });
}

export const XRD_DEMO_DATASETS: XrdDemoDataset[] = [
  {
    id: 'xrd-cufe2o4-clean',
    label: 'CuFe2O4 clean',
    fileName: 'cufe2o4_clean_demo.xy',
    sampleName: 'CuFe2O4 clean reference',
    description: 'Crystalline copper ferrite pattern with the expected spinel reflection series.',
    expectedSignal: 'CuFe2O4 should score as the primary phase with limited unexplained intensity.',
    dataPoints: synthesizeXrdPattern({
      components: [{ phaseId: 'cufe2o4', scale: 0.86, width: 0.16 }],
      noiseAmplitude: 0.58,
    }),
  },
  {
    id: 'xrd-cufe2o4-fe2o3-impurity',
    label: 'CuFe2O4 + Fe2O3 impurity',
    fileName: 'cufe2o4_fe2o3_impurity_demo.xy',
    sampleName: 'CuFe2O4 with hematite impurity',
    description: 'Copper ferrite pattern with additional hematite reflections at diagnostic positions.',
    expectedSignal: 'CuFe2O4 remains plausible, while alpha-Fe2O3 should be flagged as a possible impurity.',
    dataPoints: synthesizeXrdPattern({
      components: [
        { phaseId: 'cufe2o4', scale: 0.72, width: 0.17 },
        { phaseId: 'alpha-fe2o3', scale: 0.32, width: 0.15 },
      ],
      noiseAmplitude: 0.62,
    }),
  },
  {
    id: 'xrd-amorphous-dominant',
    label: 'Amorphous-dominant sample',
    fileName: 'amorphous_dominant_demo.xy',
    sampleName: 'Amorphous-dominant ferrite precursor',
    description: 'Broad diffuse scattering with weak crystalline ferrite remnants.',
    expectedSignal: 'The agent should avoid a confident phase claim and report low confidence.',
    dataPoints: synthesizeXrdPattern({
      components: [{ phaseId: 'cufe2o4', scale: 0.13, width: 0.31 }],
      amorphousHalo: { center: 28.2, width: 5.6, amplitude: 62 },
      noiseAmplitude: 0.52,
    }),
  },
];

export function getXrdDemoDataset(datasetId?: string | null) {
  return XRD_DEMO_DATASETS.find((dataset) => dataset.id === datasetId) ?? XRD_DEMO_DATASETS[0];
}
