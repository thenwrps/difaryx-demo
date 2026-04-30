# LLM Integration Guide for DIFARYX Agent Demo

## Overview

This guide shows how to integrate Gemini/Gemma LLM reasoning into the existing AgentDemo component.

## Files Created

1. **`src/types/llm.ts`** - TypeScript types for LLM integration
2. **`src/services/llmPrompt.ts`** - Prompt building and validation
3. **`src/services/llmProvider.ts`** - LLM API integration (Gemini/Gemma)
4. **`src/services/evidencePacket.ts`** - Evidence packet builder
5. **`src/services/llmIntegration.ts`** - Integration helper functions

## Changes Required in `src/pages/AgentDemo.tsx`

### 1. Add Imports

```typescript
// Add these imports at the top
import type { LLMState, LLMReasoningOutput } from '../types/llm';
import {
  executeLLMReasoning,
  shouldExecuteLLMReasoning,
  getLLMProviderLabel,
  getLLMModelName,
  formatLLMOutput,
} from '../services/llmIntegration';
```

### 2. Update Type Definitions

```typescript
// Change ModelMode type
type ModelMode = 'deterministic' | 'gemini' | 'gemma';

// Extend AgentDemoState
type AgentDemoState = {
  context: AgentContext;
  datasetId: string;
  modelMode: ModelMode;
  graphState: {
    showMarkers: boolean;
  };
  reasoningState: {
    status: RunStatus;
    currentStepIndex: number;
    executionMode: ExecutionMode;
    result: DecisionResult | null;
    logs: ExecutionLogEntry[];
  };
  toolTrace: ToolTraceEntry[];
  // ADD THESE:
  llmStatus: 'idle' | 'running' | 'complete' | 'error';
  llmOutput?: LLMReasoningOutput;
  llmError?: string;
  llmDurationMs?: number;
};
```

### 3. Update MODEL_MODE_LABELS

```typescript
const MODEL_MODE_LABELS: Record<ModelMode, string> = {
  deterministic: 'Deterministic Demo',
  gemini: 'Gemini Reasoning',  // Changed from "Gemini-ready (not connected)"
  gemma: 'Gemma Open Model',   // Changed from "Gemma-ready (not connected)"
};
```

### 4. Update makeInitialState

```typescript
function makeInitialState(projectId?: string | null): AgentDemoState {
  const context = getDefaultContext(projectId);
  const datasetId = getDefaultDatasetId(context, projectId);

  return {
    context,
    datasetId,
    modelMode: 'deterministic',
    graphState: {
      showMarkers: false,
    },
    reasoningState: {
      status: 'idle',
      currentStepIndex: -1,
      executionMode: 'auto',
      result: null,
      logs: [],
    },
    toolTrace: createToolTrace(context),
    // ADD THESE:
    llmStatus: 'idle',
    llmOutput: undefined,
    llmError: undefined,
    llmDurationMs: undefined,
  };
}
```

### 5. Update resetRunState

```typescript
function resetRunState(
  previous: AgentDemoState,
  context = previous.context,
  datasetId = previous.datasetId,
): AgentDemoState {
  return {
    ...previous,
    context,
    datasetId,
    graphState: {
      showMarkers: false,
    },
    reasoningState: {
      ...previous.reasoningState,
      status: 'idle',
      currentStepIndex: -1,
      result: null,
      logs: [],
    },
    toolTrace: createToolTrace(context),
    // ADD THESE:
    llmStatus: 'idle',
    llmOutput: undefined,
    llmError: undefined,
    llmDurationMs: undefined,
  };
}
```

### 6. Update createToolTrace to Include LLM Step

```typescript
function createToolTrace(context: AgentContext, modelMode: ModelMode = 'deterministic'): ToolTraceEntry[] {
  const stages = CONTEXT_CONFIG[context].stages;
  const baseTrace = stages.map((stage, index) => ({
    id: `${context.toLowerCase()}-${stage.id}`,
    timestamp: formatStamp(index),
    context,
    toolName: stage.toolName,
    displayName: stage.displayName,
    provider: 'deterministic' as const,
    status: 'pending' as const,
    inputSummary: stage.inputSummary,
    outputSummary: stage.outputSummary,
    durationMs: stage.durationMs,
    canInsertLlmReasoningAfter: stage.canInsertLlmReasoningAfter,
  }));

  // Insert LLM reasoning step after evidence fusion (if LLM mode enabled)
  if (shouldExecuteLLMReasoning(modelMode)) {
    const fusionIndex = baseTrace.findIndex((entry) => entry.canInsertLlmReasoningAfter);
    if (fusionIndex >= 0) {
      const llmEntry: ToolTraceEntry = {
        id: `${context.toLowerCase()}-llm-reasoning`,
        timestamp: formatStamp(fusionIndex + 1),
        context,
        toolName: 'llm_reasoning',
        displayName: 'LLM Reasoning',
        provider: modelMode as 'gemini' | 'gemma',
        status: 'pending',
        inputSummary: 'Structured evidence packet from deterministic tools',
        outputSummary: `${getLLMProviderLabel(modelMode as 'gemini' | 'gemma')} reasoning over evidence`,
        durationMs: modelMode === 'gemini' ? 1200 : 800,
      };
      baseTrace.splice(fusionIndex + 1, 0, llmEntry);
    }
  }

  return baseTrace;
}
```

### 7. Update runAuto to Include LLM Step

```typescript
const runAuto = async (
  context = agentState.context,
  datasetId = agentState.datasetId,
) => {
  if (runningGuardRef.current) return;
  runningGuardRef.current = true;
  const token = runTokenRef.current + 1;
  runTokenRef.current = token;
  const option = getDatasetOption(context, datasetId);
  const config = CONTEXT_CONFIG[context];
  const xrdResult =
    context === 'XRD'
      ? runXrdPhaseIdentificationAgent({
          datasetId: option.dataset.id,
          sampleName: option.dataset.sampleName,
          sourceLabel: option.dataset.fileName,
          dataPoints: option.dataset.dataPoints,
        })
      : null;

  setFeedback('');
  setAgentState((current) => ({
    ...resetRunState(current, context, datasetId),
    reasoningState: {
      ...current.reasoningState,
      status: 'running',
      currentStepIndex: -1,
      result: null,
      logs: [
        {
          stamp: '[00:00]',
          message: `${agentState.modelMode === 'deterministic' ? 'Deterministic' : getLLMProviderLabel(agentState.modelMode as 'gemini' | 'gemma')} agent initialized for ${config.label}: ${missionText.trim() || DEFAULT_MISSION}`,
          type: 'system',
        },
      ],
    },
  }));

  try {
    // Execute deterministic stages
    for (let index = 0; index < config.stages.length; index += 1) {
      if (runTokenRef.current !== token) return;
      const stage = config.stages[index];
      
      setAgentState((current) => ({
        ...current,
        graphState: {
          showMarkers: context === 'XRD' && index >= 1,
        },
        reasoningState: {
          ...current.reasoningState,
          status: 'running',
          currentStepIndex: index,
        },
        toolTrace: updateTraceStatus(current.toolTrace, index, 'running'),
      }));
      
      appendLog({
        stamp: `[${formatStamp(index)}]`,
        message: `${stage.displayName}: ${stage.detail}`,
        type: 'tool',
      });
      
      await wait(stage.durationMs);
      if (runTokenRef.current !== token) return;
      
      markTool(index, 'complete');
      appendLog({
        stamp: `[${formatStamp(index)}]`,
        message: stage.outputSummary,
        type: 'info',
      });

      // INSERT LLM REASONING AFTER EVIDENCE FUSION
      if (stage.canInsertLlmReasoningAfter && shouldExecuteLLMReasoning(agentState.modelMode)) {
        const llmIndex = index + 1;
        const llmProvider = agentState.modelMode as 'gemini' | 'gemma';
        
        setAgentState((current) => ({
          ...current,
          llmStatus: 'running',
          toolTrace: updateTraceStatus(current.toolTrace, llmIndex, 'running'),
        }));
        
        appendLog({
          stamp: `[${formatStamp(llmIndex)}]`,
          message: `LLM Reasoning (${getLLMProviderLabel(llmProvider)}): Analyzing structured evidence packet...`,
          type: 'tool',
        });

        // Execute LLM reasoning
        const llmResult = await executeLLMReasoning(
          llmProvider,
          context,
          option.dataset,
          option.project,
          xrdResult,
          getFeatureCount(context, option.dataset, xrdResult),
          getBaseConfidence(context, option.project),
          true, // useMock = true for demo
        );

        if (runTokenRef.current !== token) return;

        if (llmResult.success && llmResult.output) {
          setAgentState((current) => ({
            ...current,
            llmStatus: 'complete',
            llmOutput: llmResult.output,
            llmDurationMs: llmResult.durationMs,
            toolTrace: updateTraceStatus(current.toolTrace, llmIndex, 'complete'),
          }));
          
          appendLog({
            stamp: `[${formatStamp(llmIndex)}]`,
            message: `${getLLMProviderLabel(llmProvider)} reasoning complete: ${llmResult.output.primaryResult}`,
            type: 'success',
          });
        } else {
          setAgentState((current) => ({
            ...current,
            llmStatus: 'error',
            llmError: llmResult.error,
            toolTrace: updateTraceStatus(current.toolTrace, llmIndex, 'error'),
          }));
          
          appendLog({
            stamp: `[${formatStamp(llmIndex)}]`,
            message: `LLM reasoning failed: ${llmResult.error}. Falling back to deterministic reasoning.`,
            type: 'info',
          });
        }
      }
    }

    await wait(300);
    if (runTokenRef.current !== token) return;
    finalizeRun(context, option, xrdResult);
  } finally {
    if (runTokenRef.current === token) {
      runningGuardRef.current = false;
    }
  }
};
```

### 8. Update finalizeRun to Use LLM Output

```typescript
const finalizeRun = (
  context: AgentContext,
  option: DatasetOption,
  xrdResult: ReturnType<typeof runXrdPhaseIdentificationAgent> | null,
) => {
  let decision: DecisionResult;

  // Use LLM output if available and successful
  if (agentState.llmStatus === 'complete' && agentState.llmOutput) {
    const formatted = formatLLMOutput(agentState.llmOutput);
    decision = {
      runId: generateRunId(),
      ...formatted,
      metrics: [
        { label: 'Features', value: String(getFeatureCount(context, option.dataset, xrdResult)), tone: 'cyan' },
        { label: 'Confidence', value: `${formatted.confidence}%`, tone: 'emerald' },
        { label: 'Source', value: getLLMProviderLabel(agentState.modelMode as 'gemini' | 'gemma'), tone: 'violet' },
      ],
      detailRows: [],
    };
  } else {
    // Fall back to deterministic decision
    decision = createDecisionResult(context, option, xrdResult);
  }

  // ... rest of finalizeRun logic
};
```

### 9. Add Model Mode Selector to UI

```typescript
// In the main render, add model mode selector:
<label className="rounded-lg border border-slate-800 bg-[#0A0F1A] p-3">
  <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
    Reasoning Mode
  </span>
  <select
    value={agentState.modelMode}
    disabled={agentState.reasoningState.status === 'running'}
    onChange={(event) => {
      const newMode = event.target.value as ModelMode;
      setAgentState((current) => ({
        ...resetRunState(current, current.context, current.datasetId),
        modelMode: newMode,
        toolTrace: createToolTrace(current.context, newMode),
      }));
    }}
    className="h-9 w-full rounded-md border border-slate-800 bg-[#070B12] px-2 text-xs font-semibold text-white outline-none transition-colors focus:border-cyan-400/50 disabled:opacity-60"
  >
    <option value="deterministic">Deterministic</option>
    <option value="gemini">Gemini Reasoning</option>
    <option value="gemma">Gemma Open Model</option>
  </select>
</label>
```

### 10. Add LLM Status Indicator

```typescript
// Add after the main status badge:
{shouldExecuteLLMReasoning(agentState.modelMode) && agentState.llmStatus === 'complete' && (
  <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300">
    AI-Assisted: {getLLMProviderLabel(agentState.modelMode as 'gemini' | 'gemma')}
  </span>
)}

{agentState.llmStatus === 'error' && (
  <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
    LLM Error (using deterministic)
  </span>
)}
```

## Testing

### 1. Build Test
```bash
npm run build
```

### 2. Functional Tests
1. Select "Gemini Reasoning" mode
2. Run agent
3. Verify LLM reasoning step appears in tool trace
4. Verify decision card shows LLM output
5. Verify "AI-Assisted: Gemini" badge appears
6. Switch to "Gemma Open Model" and repeat
7. Switch back to "Deterministic" and verify no LLM step

### 3. Error Handling Test
1. Simulate LLM error (modify mockLLMReasoning to return error)
2. Verify fallback to deterministic reasoning
3. Verify error badge appears
4. Verify decision card shows deterministic output

## Production Deployment

### Backend API Setup

Create `server/api/llm/reason.ts`:

```typescript
import { runLLM } from '../../../src/services/llmProvider';
import { validateLLMOutput } from '../../../src/services/llmPrompt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { packet, modelMode } = req.body;

    if (!packet || !modelMode) {
      return res.status(400).json({ error: 'Missing packet or modelMode' });
    }

    const output = await runLLM(packet, modelMode);

    if (!output) {
      return res.status(500).json({ error: 'LLM returned null output' });
    }

    const validation = validateLLMOutput(output);
    if (!validation.valid) {
      return res.status(500).json({ error: `Invalid LLM output: ${validation.error}` });
    }

    return res.status(200).json({ output: validation.sanitized });
  } catch (error) {
    console.error('LLM API error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
```

### Environment Variables

```bash
# .env
GEMINI_API_KEY=your_gemini_api_key_here
GEMMA_ENDPOINT=http://localhost:11434/api/generate  # or your Gemma endpoint
```

### Install Dependencies

```bash
# For Gemini
npm install @google/generative-ai

# For Gemma (if using Ollama)
# No additional dependencies needed, uses fetch
```

## Safety Checklist

- [x] LLM receives ONLY structured evidence packets
- [x] LLM does NOT generate raw scientific data
- [x] LLM does NOT invent peaks, values, or measurements
- [x] Output validation prevents hallucination
- [x] Confidence clamped to [0, 1]
- [x] Fallback to deterministic reasoning on error
- [x] Error handling is non-blocking
- [x] UI clearly shows when LLM is used
- [x] Deterministic pipeline is NOT removed
- [x] LLM augments, does not replace, deterministic tools

## Final Notes

- **Mock Mode:** By default, `useMock = true` in `executeLLMReasoning`. This uses `mockLLMReasoning` which simulates realistic LLM behavior without API calls.
- **Production Mode:** Set `useMock = false` and deploy backend API to use real Gemini/Gemma.
- **Model Selection:** Users can switch between Deterministic, Gemini, and Gemma at any time.
- **Transparency:** UI clearly shows when LLM reasoning is active and which provider is used.
- **Safety:** Multiple validation layers prevent hallucination and ensure scientific integrity.

