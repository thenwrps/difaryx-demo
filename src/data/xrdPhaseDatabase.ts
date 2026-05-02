import type { XrdPhaseReference } from '../agents/xrdAgent/types';

export const XRD_PHASE_DATABASE: XrdPhaseReference[] = [
  {
    id: 'cufe2o4',
    name: 'CuFe2O4',
    formula: 'CuFe2O4',
    family: 'spinel ferrite',
    crystalSystem: 'cubic',
    spaceGroup: 'Fd-3m',
    latticeParameters: {
      a: 8.37, // Å
    },
    jcpdsCard: '25-0283',
    referenceNote: 'Copper ferrite inverse spinel structure. Peak positions from JCPDS 25-0283. D-spacings calculated using Bragg\'s law with Cu Kα radiation (λ = 1.5406 Å).',
    peaks: [
      // Peak positions from JCPDS 25-0283
      // d-spacing calculated using Bragg's law: d = λ / (2 sin θ)
      // where λ = 1.5406 Å for Cu Kα radiation
      { position: 18.3, relativeIntensity: 22, hkl: '(111)', dSpacing: 4.843 }, // d = 1.5406 / (2 * sin(18.3°/2))
      { position: 30.1, relativeIntensity: 58, hkl: '(220)', dSpacing: 2.967 }, // d = 1.5406 / (2 * sin(30.1°/2))
      { position: 35.5, relativeIntensity: 100, hkl: '(311)', dSpacing: 2.527 }, // d = 1.5406 / (2 * sin(35.5°/2))
      { position: 43.2, relativeIntensity: 47, hkl: '(400)', dSpacing: 2.093 }, // d = 1.5406 / (2 * sin(43.2°/2))
      { position: 53.6, relativeIntensity: 29, hkl: '(422)', dSpacing: 1.709 }, // d = 1.5406 / (2 * sin(53.6°/2))
      { position: 57.1, relativeIntensity: 39, hkl: '(511)', dSpacing: 1.612 }, // d = 1.5406 / (2 * sin(57.1°/2))
      { position: 62.7, relativeIntensity: 46, hkl: '(440)', dSpacing: 1.481 }, // d = 1.5406 / (2 * sin(62.7°/2))
    ],
  },
  {
    id: 'fe3o4',
    name: 'Fe3O4',
    formula: 'Fe3O4',
    family: 'inverse spinel iron oxide',
    crystalSystem: 'cubic',
    spaceGroup: 'Fd-3m',
    latticeParameters: {
      a: 8.396, // Å
    },
    jcpdsCard: '19-0629',
    icddPdf: '01-088-0315',
    referenceNote: 'Magnetite inverse spinel structure. Included to expose shared ferrite reflections with copper ferrite.',
    peaks: [
      { position: 18.3, relativeIntensity: 14, hkl: '(111)', dSpacing: 4.843 },
      { position: 30.1, relativeIntensity: 32, hkl: '(220)', dSpacing: 2.967 },
      { position: 35.5, relativeIntensity: 100, hkl: '(311)', dSpacing: 2.527 },
      { position: 43.1, relativeIntensity: 24, hkl: '(400)', dSpacing: 2.096 },
      { position: 53.5, relativeIntensity: 10, hkl: '(422)', dSpacing: 1.711 },
      { position: 57.0, relativeIntensity: 14, hkl: '(511)', dSpacing: 1.615 },
      { position: 62.6, relativeIntensity: 22, hkl: '(440)', dSpacing: 1.484 },
    ],
  },
  {
    id: 'alpha-fe2o3',
    name: 'alpha-Fe2O3',
    formula: 'Fe2O3',
    family: 'hematite',
    crystalSystem: 'rhombohedral',
    spaceGroup: 'R-3c',
    latticeParameters: {
      a: 5.038, // Å
      c: 13.772, // Å
    },
    jcpdsCard: '33-0664',
    icddPdf: '01-089-0599',
    referenceNote: 'Hematite rhombohedral structure. Diagnostic non-spinel reflections distinguish from ferrite phases.',
    peaks: [
      { position: 24.1, relativeIntensity: 41, hkl: '(012)', dSpacing: 3.689 },
      { position: 33.2, relativeIntensity: 100, hkl: '(104)', dSpacing: 2.697 },
      { position: 35.6, relativeIntensity: 72, hkl: '(110)', dSpacing: 2.519 },
      { position: 40.9, relativeIntensity: 28, hkl: '(113)', dSpacing: 2.205 },
      { position: 49.5, relativeIntensity: 45, hkl: '(024)', dSpacing: 1.840 },
      { position: 54.1, relativeIntensity: 60, hkl: '(116)', dSpacing: 1.694 },
      { position: 57.6, relativeIntensity: 10, hkl: '(018)', dSpacing: 1.599 },
      { position: 62.4, relativeIntensity: 36, hkl: '(214)', dSpacing: 1.487 },
      { position: 64.0, relativeIntensity: 25, hkl: '(300)', dSpacing: 1.453 },
    ],
  },
  {
    id: 'nife2o4',
    name: 'NiFe2O4',
    formula: 'NiFe2O4',
    family: 'spinel ferrite',
    crystalSystem: 'cubic',
    spaceGroup: 'Fd-3m',
    latticeParameters: {
      a: 8.339, // Å
    },
    jcpdsCard: '10-0325',
    icddPdf: '01-086-2267',
    referenceNote: 'Nickel ferrite inverse spinel structure. Close-family reference for ambiguity handling.',
    peaks: [
      { position: 18.4, relativeIntensity: 20, hkl: '(111)', dSpacing: 4.817 },
      { position: 30.3, relativeIntensity: 45, hkl: '(220)', dSpacing: 2.948 },
      { position: 35.7, relativeIntensity: 100, hkl: '(311)', dSpacing: 2.513 },
      { position: 43.4, relativeIntensity: 60, hkl: '(400)', dSpacing: 2.084 },
      { position: 53.8, relativeIntensity: 15, hkl: '(422)', dSpacing: 1.703 },
      { position: 57.4, relativeIntensity: 35, hkl: '(511)', dSpacing: 1.604 },
      { position: 63.0, relativeIntensity: 50, hkl: '(440)', dSpacing: 1.474 },
      { position: 75.3, relativeIntensity: 10, hkl: '(533)', dSpacing: 1.262 },
    ],
  },
  {
    id: 'cofe2o4',
    name: 'CoFe2O4',
    formula: 'CoFe2O4',
    family: 'spinel ferrite',
    crystalSystem: 'cubic',
    spaceGroup: 'Fd-3m',
    latticeParameters: {
      a: 8.392, // Å
    },
    jcpdsCard: '22-1086',
    icddPdf: '01-077-0426',
    referenceNote: 'Cobalt ferrite inverse spinel structure. Close-family reference for ambiguity handling.',
    peaks: [
      { position: 18.2, relativeIntensity: 15, hkl: '(111)', dSpacing: 4.869 },
      { position: 30.1, relativeIntensity: 35, hkl: '(220)', dSpacing: 2.967 },
      { position: 35.4, relativeIntensity: 100, hkl: '(311)', dSpacing: 2.534 },
      { position: 43.1, relativeIntensity: 50, hkl: '(400)', dSpacing: 2.096 },
      { position: 53.6, relativeIntensity: 15, hkl: '(422)', dSpacing: 1.709 },
      { position: 57.0, relativeIntensity: 30, hkl: '(511)', dSpacing: 1.615 },
      { position: 62.6, relativeIntensity: 40, hkl: '(440)', dSpacing: 1.484 },
      { position: 74.0, relativeIntensity: 8, hkl: '(533)', dSpacing: 1.281 },
    ],
  },
  {
    id: 'cuo',
    name: 'CuO',
    formula: 'CuO',
    family: 'tenorite',
    crystalSystem: 'monoclinic',
    spaceGroup: 'C2/c',
    latticeParameters: {
      a: 4.684, // Å
      b: 3.423, // Å
      c: 5.129, // Å
      beta: 99.54, // degrees
    },
    jcpdsCard: '48-1548',
    icddPdf: '01-089-5899',
    referenceNote: 'Copper oxide tenorite monoclinic structure. Non-ferrite impurity reference.',
    peaks: [
      { position: 32.5, relativeIntensity: 72, hkl: '(-111)', dSpacing: 2.752 },
      { position: 35.5, relativeIntensity: 100, hkl: '(002)', dSpacing: 2.527 },
      { position: 38.7, relativeIntensity: 78, hkl: '(111)', dSpacing: 2.325 },
      { position: 48.7, relativeIntensity: 32, hkl: '(-202)', dSpacing: 1.869 },
      { position: 53.5, relativeIntensity: 19, hkl: '(020)', dSpacing: 1.711 },
      { position: 58.3, relativeIntensity: 24, hkl: '(202)', dSpacing: 1.581 },
      { position: 61.5, relativeIntensity: 17, hkl: '(-113)', dSpacing: 1.506 },
      { position: 66.2, relativeIntensity: 20, hkl: '(022)', dSpacing: 1.410 },
      { position: 68.1, relativeIntensity: 12, hkl: '(220)', dSpacing: 1.376 },
    ],
  },
];

export function getXrdPhaseReference(phaseId: string) {
  return XRD_PHASE_DATABASE.find((phase) => phase.id === phaseId);
}
