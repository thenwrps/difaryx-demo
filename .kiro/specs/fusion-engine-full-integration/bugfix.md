# Bugfix Requirements Document

## Introduction

After the fusionEngine refactor, several components remain inconsistent with the goal of making fusionEngine the single reasoning authority. This bugfix addresses system-level integration issues where components either bypass fusionEngine entirely, use legacy confidence-based logic, or display outdated UI terminology. The fix ensures complete alignment across AgentDemo, MultiTechWorkspace, NotebookLab, Dashboard, XRDWorkspace, and XPSWorkspace with the scientific reasoning structure: Claim, Observed, Linked, Cross-check, Limitation, Decision.

## Bug Analysis

### Current Behavior (Defect)

#### 1. MultiTechWorkspace Parallel Reasoning System

1.1 WHEN MultiTechWorkspace performs cross-technique reasoning THEN the system uses its own `runFusionReasoning()` and `runCrossTechReview()` functions instead of calling fusionEngine.evaluate()

1.2 WHEN MultiTechWorkspace generates reasoning traces THEN the system uses custom `generateReasoningTrace()` logic instead of fusionEngine's ReasoningTraceItem structure

1.3 WHEN MultiTechWorkspace processes evidence THEN the system uses `CrossTechEvidence` and `CrossTechClaim` types instead of EvidenceNode and ClaimNode structures

1.4 WHEN MultiTechWorkspace displays reasoning output THEN the system uses hardcoded demo claims and evidence instead of fusionEngine-generated FusionResult

#### 2. XRDWorkspace Legacy Confidence Display

1.5 WHEN XRDWorkspace displays analysis results THEN the system shows confidence percentages (e.g., "93.3%") instead of decision status labels

1.6 WHEN XRDWorkspace renders interpretation data THEN the system uses `agentResult.interpretation.confidenceScore` and `agentResult.interpretation.confidenceLevel` fields instead of FusionResult structure

1.7 WHEN XRDWorkspace displays evidence THEN the system maps `agentResult.interpretation.evidence` and `agentResult.interpretation.caveats` instead of FusionResult.basis and FusionResult.limitations

#### 3. XPSWorkspace Legacy Interpretation

1.8 WHEN XPSWorkspace displays chemical state information THEN the system uses `processingResult.scientificSummary` instead of fusionEngine reasoning

1.9 WHEN XPSWorkspace shows limitations THEN the system displays "CAVEATS" section instead of "Limitations" aligned with fusionEngine terminology

#### 4. xrdAgent Incompatible Output Structure

1.10 WHEN xrdAgent produces analysis results THEN the system returns XrdInterpretation with `confidenceScore`, `confidenceLevel`, `evidence`, `conflicts`, and `caveats` fields instead of FusionResult structure

1.11 WHEN xrdAgent output is consumed by workspaces THEN the system requires mapping from XrdInterpretation to display format instead of using FusionResult directly

#### 5. Legacy Code Presence

1.12 WHEN the codebase is scanned THEN the system contains unused legacy modules (insightEngine, useScientificEngine, ScientificInsight type) that implement confidence-based reasoning

1.13 WHEN RightPanel displays evidence hints THEN the system shows "Agent Thinking → Scientific Determination" text instead of "Scientific Reasoning → Scientific Determination"

### Expected Behavior (Correct)

#### 1. MultiTechWorkspace FusionEngine Integration

2.1 WHEN MultiTechWorkspace performs cross-technique reasoning THEN the system SHALL convert CrossTechEvidence to EvidenceNode format and call fusionEngine.evaluate() as the single reasoning authority

2.2 WHEN MultiTechWorkspace generates reasoning traces THEN the system SHALL use FusionResult.reasoningTrace from fusionEngine instead of custom trace generation

2.3 WHEN MultiTechWorkspace processes evidence THEN the system SHALL map demo evidence to EvidenceNode structure compatible with fusionEngine

2.4 WHEN MultiTechWorkspace displays reasoning output THEN the system SHALL render FusionResult fields (conclusion, basis, crossTech, limitations, decision) instead of custom review output

#### 2. XRDWorkspace FusionResult Display

2.5 WHEN XRDWorkspace displays analysis results THEN the system SHALL show decision status labels ("Supported", "Working hypothesis", "Requires validation") instead of confidence percentages

2.6 WHEN XRDWorkspace renders interpretation data THEN the system SHALL convert xrdAgent output to FusionResult structure or have xrdAgent call fusionEngine directly

2.7 WHEN XRDWorkspace displays evidence THEN the system SHALL map FusionResult.basis and FusionResult.limitations instead of interpretation.evidence and interpretation.caveats

#### 3. XPSWorkspace FusionEngine Integration

2.8 WHEN XPSWorkspace displays chemical state information THEN the system SHALL convert XPS processing results to EvidenceNode format and call fusionEngine.evaluate()

2.9 WHEN XPSWorkspace shows limitations THEN the system SHALL display "Limitations" section using FusionResult.limitations aligned with fusionEngine terminology

#### 4. xrdAgent FusionEngine Output

2.10 WHEN xrdAgent produces analysis results THEN the system SHALL either output EvidenceNodes for fusionEngine consumption or call fusionEngine internally and return FusionResult structure

2.11 WHEN xrdAgent output is consumed by workspaces THEN the system SHALL provide FusionResult structure directly without requiring interpretation mapping

#### 5. Legacy Code Removal

2.12 WHEN the codebase is scanned THEN the system SHALL have deprecated or removed unused legacy modules (insightEngine, useScientificEngine, ScientificInsight type) that implement confidence-based reasoning

2.13 WHEN RightPanel displays evidence hints THEN the system SHALL show "Scientific Reasoning → Scientific Determination" text aligned with current terminology

### Unchanged Behavior (Regression Prevention)

#### 1. AgentDemo Stability

3.1 WHEN AgentDemo executes agent runs THEN the system SHALL CONTINUE TO use fusionEngine.evaluate() as the single reasoning authority

3.2 WHEN AgentDemo displays decision results THEN the system SHALL CONTINUE TO render FusionResult structure without confidence percentages

3.3 WHEN AgentDemo maps evidence THEN the system SHALL CONTINUE TO use mapXrdPeaksToEvidence() and mapDatasetToEvidence() functions

#### 2. Dashboard Status Display

3.4 WHEN Dashboard displays project status THEN the system SHALL CONTINUE TO show "Supported" status label instead of confidence percentages

3.5 WHEN Dashboard renders project cards THEN the system SHALL CONTINUE TO use "Status" label instead of "confidence" label

#### 3. NotebookLab Scientific Terminology

3.6 WHEN NotebookLab displays reasoning summary THEN the system SHALL CONTINUE TO use "Scientific Reasoning Summary" instead of "AI Insight Agent"

3.7 WHEN NotebookLab shows decision status THEN the system SHALL CONTINUE TO display research-grade status labels ("Supported", "Working hypothesis", "Requires validation")

3.8 WHEN NotebookLab renders decision section THEN the system SHALL CONTINUE TO use "Scientific Decision" heading instead of "Generated Decision"

#### 4. Demo Determinism

3.9 WHEN any component executes reasoning THEN the system SHALL CONTINUE TO produce deterministic results without LLM dependencies

3.10 WHEN users navigate between routes THEN the system SHALL CONTINUE TO maintain existing routing structure without changes

#### 5. Graph and Layout Preservation

3.11 WHEN workspaces display data THEN the system SHALL CONTINUE TO render Graph components without hiding or removing them

3.12 WHEN agent runs execute THEN the system SHALL CONTINUE TO show live graph view during execution

3.13 WHEN components render layouts THEN the system SHALL CONTINUE TO use existing layout structure without modifications

#### 6. Build and Type Safety

3.14 WHEN the project is built THEN the system SHALL CONTINUE TO compile successfully with TypeScript without errors

3.15 WHEN components import types THEN the system SHALL CONTINUE TO have type-safe interfaces without breaking changes to public APIs used by other components
