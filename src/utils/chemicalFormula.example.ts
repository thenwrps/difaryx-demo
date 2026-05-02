/**
 * Example usage of the chemical formula formatting utility
 * 
 * This file demonstrates how to use formatChemicalFormula and
 * formatChemicalFormulasInText functions in the DIFARYX application.
 */

import { formatChemicalFormula, formatChemicalFormulasInText } from './chemicalFormula';

// Example 1: Format the main compound CuFe₂O₄
const copperFerrite = formatChemicalFormula('CuFe2O4');
console.log('Copper Ferrite:', copperFerrite); // Output: CuFe₂O₄

// Example 2: Format oxidation states
const copperIon = formatChemicalFormula('Cu2+');
const ironIon = formatChemicalFormula('Fe3+');
const oxideIon = formatChemicalFormula('O2-');
console.log('Copper(II):', copperIon);   // Output: Cu²⁺
console.log('Iron(III):', ironIon);      // Output: Fe³⁺
console.log('Oxide:', oxideIon);         // Output: O²⁻

// Example 3: Format other common compounds
const water = formatChemicalFormula('H2O');
const magnetite = formatChemicalFormula('Fe3O4');
const hematite = formatChemicalFormula('Fe2O3');
console.log('Water:', water);           // Output: H₂O
console.log('Magnetite:', magnetite);   // Output: Fe₃O₄
console.log('Hematite:', hematite);     // Output: Fe₂O₃

// Example 4: Format text containing multiple formulas
const description = formatChemicalFormulasInText(
  'CuFe2O4 is an inverse spinel structure where Cu2+ ions occupy octahedral sites ' +
  'and Fe3+ ions occupy both tetrahedral and octahedral sites.'
);
console.log('Description:', description);
// Output: CuFe₂O₄ is an inverse spinel structure where Cu²⁺ ions occupy octahedral sites
//         and Fe³⁺ ions occupy both tetrahedral and octahedral sites.

// Example 5: Use in React components
// In a React component, you can use it like this:
/*
import { formatChemicalFormula } from '@/utils/chemicalFormula';

function PhaseCard({ phase }: { phase: string }) {
  return (
    <div className="phase-card">
      <h3>{formatChemicalFormula(phase)}</h3>
    </div>
  );
}

// Usage:
<PhaseCard phase="CuFe2O4" />  // Displays: CuFe₂O₄
*/

// Example 6: Use in technique descriptions
const xpsDescription = formatChemicalFormulasInText(
  'XPS analysis reveals Cu2+ 2p3/2 binding energy at 933.5 eV and ' +
  'Fe3+ 2p3/2 binding energy at 710.8 eV, confirming the oxidation states ' +
  'in CuFe2O4 spinel structure.'
);
console.log('XPS Description:', xpsDescription);
// Output: XPS analysis reveals Cu²⁺ 2p3/2 binding energy at 933.5 eV and
//         Fe³⁺ 2p3/2 binding energy at 710.8 eV, confirming the oxidation states
//         in CuFe₂O₄ spinel structure.

// Example 7: Use in graph labels or axis titles
const graphTitle = formatChemicalFormula('XRD Pattern of CuFe2O4');
console.log('Graph Title:', graphTitle); // Output: XRD Pattern of CuFe₂O₄

// Example 8: Use in interpretation text
const interpretation = formatChemicalFormulasInText(
  'The detected peaks match the reference pattern for CuFe2O4 (JCPDS 25-0283). ' +
  'The presence of Cu2+ satellite peaks at +9 eV confirms the divalent copper oxidation state.'
);
console.log('Interpretation:', interpretation);
// Output: The detected peaks match the reference pattern for CuFe₂O₄ (JCPDS 25-0283).
//         The presence of Cu²⁺ satellite peaks at +9 eV confirms the divalent copper oxidation state.
