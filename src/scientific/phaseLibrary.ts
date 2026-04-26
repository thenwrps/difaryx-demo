import type { PhaseEntry } from './types';

export const PHASE_LIBRARY: PhaseEntry[] = [
  {
    id: 'cufe2o4-spinel',
    name: 'Copper Ferrite',
    formula: 'CuFe₂O₄',
    crystalSystem: 'Cubic (Fd-3m)',
    jcpdsRef: 'JCPDS 25-0283',
    peaks: [
      { hkl: '(111)', position: 18.3, relativeIntensity: 20 },
      { hkl: '(220)', position: 29.9, relativeIntensity: 35 },
      { hkl: '(311)', position: 35.4, relativeIntensity: 100 },
      { hkl: '(222)', position: 37.0, relativeIntensity: 15 },
      { hkl: '(400)', position: 43.1, relativeIntensity: 22 },
      { hkl: '(422)', position: 53.4, relativeIntensity: 16 },
      { hkl: '(511)', position: 57.0, relativeIntensity: 31 },
      { hkl: '(440)', position: 62.6, relativeIntensity: 42 },
      { hkl: '(533)', position: 74.0, relativeIntensity: 12 },
    ],
  },
  {
    id: 'cofe2o4-spinel',
    name: 'Cobalt Ferrite',
    formula: 'CoFe₂O₄',
    crystalSystem: 'Cubic (Fd-3m)',
    jcpdsRef: 'JCPDS 22-1086',
    peaks: [
      { hkl: '(111)', position: 18.2, relativeIntensity: 18 },
      { hkl: '(220)', position: 30.1, relativeIntensity: 30 },
      { hkl: '(311)', position: 35.5, relativeIntensity: 100 },
      { hkl: '(222)', position: 37.1, relativeIntensity: 14 },
      { hkl: '(400)', position: 43.3, relativeIntensity: 20 },
      { hkl: '(422)', position: 53.5, relativeIntensity: 15 },
      { hkl: '(511)', position: 57.3, relativeIntensity: 28 },
      { hkl: '(440)', position: 62.8, relativeIntensity: 38 },
      { hkl: '(533)', position: 74.3, relativeIntensity: 10 },
    ],
  },
];
