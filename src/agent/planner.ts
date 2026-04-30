export function planScientificWorkflow(input: any) {
  return [
    { id: 'context', label: 'Validate Context' },
    { id: 'xrd', label: 'XRD Phase Screening' },
    { id: 'raman', label: 'Raman Validation' },
    { id: 'ftir', label: 'FTIR Check' },
    { id: 'xps', label: 'XPS Validation' },
    { id: 'fusion', label: 'Evidence Fusion' },
    { id: 'decision', label: 'Generate Decision' }
  ];
}
