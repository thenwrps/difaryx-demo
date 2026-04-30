export const xrdAgentToolSchemas = [
  {
    name: 'validate_xrd_input',
    description: 'Validate that an XRD trace has usable numeric 2theta and intensity points.',
    inputSchema: {
      type: 'object',
      required: ['datasetId', 'sampleName', 'dataPoints'],
      properties: {
        datasetId: { type: 'string' },
        sampleName: { type: 'string' },
        dataPoints: {
          type: 'array',
          items: {
            type: 'object',
            required: ['x', 'y'],
            properties: {
              x: { type: 'number', description: '2theta position in degrees' },
              y: { type: 'number', description: 'Observed intensity' },
            },
          },
        },
      },
    },
  },
  {
    name: 'preprocess_xrd',
    description: 'Sort, smooth, baseline-correct, and normalize the XRD signal without adding synthetic peaks.',
    inputSchema: {
      type: 'object',
      required: ['dataPoints'],
      properties: {
        dataPoints: { type: 'array', items: { type: 'object' } },
      },
    },
  },
  {
    name: 'detect_xrd_peaks',
    description: 'Detect observed local maxima, prominence, width, and d-spacing from the processed trace.',
    inputSchema: {
      type: 'object',
      required: ['preprocessedData'],
      properties: {
        preprocessedData: { type: 'array', items: { type: 'object' } },
      },
    },
  },
  {
    name: 'search_phase_database',
    description: 'Match detected sharp peaks against compact Cu K-alpha reference phase patterns.',
    inputSchema: {
      type: 'object',
      required: ['detectedPeaks'],
      properties: {
        detectedPeaks: { type: 'array', items: { type: 'object' } },
      },
    },
  },
  {
    name: 'score_phase_candidates',
    description: 'Apply the configured weighted score to matched phase candidates.',
    inputSchema: {
      type: 'object',
      required: ['searchResults', 'detectedPeaks'],
      properties: {
        searchResults: { type: 'array', items: { type: 'object' } },
        detectedPeaks: { type: 'array', items: { type: 'object' } },
      },
    },
  },
  {
    name: 'analyze_peak_conflicts',
    description: 'Report missing strong reference peaks, unexplained observed peaks, ambiguity, and impurity flags.',
    inputSchema: {
      type: 'object',
      required: ['candidates', 'detectedPeaks'],
      properties: {
        candidates: { type: 'array', items: { type: 'object' } },
        detectedPeaks: { type: 'array', items: { type: 'object' } },
      },
    },
  },
  {
    name: 'generate_xrd_interpretation',
    description: 'Generate an evidence-linked XRD interpretation with explicit confidence and caveats.',
    inputSchema: {
      type: 'object',
      required: ['conflicts', 'candidates'],
      properties: {
        conflicts: { type: 'object' },
        candidates: { type: 'array', items: { type: 'object' } },
      },
    },
  },
] as const;

export type XrdAgentToolName = (typeof xrdAgentToolSchemas)[number]['name'];
