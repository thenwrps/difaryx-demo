import { planScientificWorkflow } from './planner';
import { executeScientificPlan } from './executor';
import { generateScientificDecision } from './reasoner';

export function runScientificAgent(input: any) {
  const plan = planScientificWorkflow(input);
  const execution = executeScientificPlan(plan);
  const result = generateScientificDecision(execution.evidence);

  return {
    plan,
    steps: execution.steps,
    evidence: execution.evidence,
    result
  };
}
