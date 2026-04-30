import { runXRDAnalysis } from './tools/xrd';
import { runRamanAnalysis } from './tools/raman';
import { runFTIRAnalysis } from './tools/ftir';
import { runXPSAnalysis } from './tools/xps';

export function executeScientificPlan(plan: any[]) {
  const evidence = [];
  
  for (const step of plan) {
    switch (step.id) {
      case 'xrd':
        evidence.push(runXRDAnalysis());
        break;
      case 'raman':
        evidence.push(runRamanAnalysis());
        break;
      case 'ftir':
        evidence.push(runFTIRAnalysis());
        break;
      case 'xps':
        evidence.push(runXPSAnalysis());
        break;
      default:
        // Other steps like context, fusion, decision might not generate tool evidence directly
        break;
    }
  }

  return {
    steps: plan,
    evidence
  };
}
