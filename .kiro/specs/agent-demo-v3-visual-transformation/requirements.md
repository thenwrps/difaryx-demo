# Requirements Document: Agent Demo v3.1 Visual Transformation

## Feature Overview

Transform the AgentDemo.tsx page from its current single-column layout with top controls to match the v3.1 reference UI design featuring a three-column layout with left navigation sidebar, center content area, and right agent thinking panel. This is a visual and rendering transformation only—no changes to routing, dataset logic, graph data sources, or button handlers.

## Acceptance Criteria

### 1. Left Sidebar Implementation

**Requirement**: Implement a fixed-width left sidebar with logo, navigation, and current dataset card

**Acceptance Criteria**:
- [ ] 1.1 Sidebar is 280px wide, fixed position, full height
- [ ] 1.2 DIFARYX logo displayed at top of sidebar
- [ ] 1.3 Navigation items displayed in order: Agent Demo (active), Workflows, Data, Results, Knowledge, Settings
- [ ] 1.4 Active navigation item (Agent Demo) has visual indicator (background color, border, or icon)
- [ ] 1.5 Current Dataset card displayed at bottom of sidebar
- [ ] 1.6 Dataset card shows: filename, technique, 2θ range, step size, points count, status badge, "View Dataset" button
- [ ] 1.7 Dataset card displays "sample_spinel_01.xrd" as filename
- [ ] 1.8 Dataset card shows "Technique: XRD"
- [ ] 1.9 Dataset card shows "2θ Range: 10° - 80°"
- [ ] 1.10 Dataset card shows "Step Size: 0.02°"
- [ ] 1.11 Dataset card shows "Points: 2048"
- [ ] 1.12 Dataset card shows "Status: Loaded" with green badge
- [ ] 1.13 "View Dataset" button is clickable and navigates to workspace
- [ ] 1.14 Sidebar has dark background (#080E19)
- [ ] 1.15 Sidebar has right border (rgba(255,255,255,0.08))

### 2. Main Header Transformation

**Requirement**: Replace current header and controls section with compact main header

**Acceptance Criteria**:
- [ ] 2.1 Header is compact (height ~60px), spans full width above center and right columns
- [ ] 2.2 Left side displays "DIFARYX Agent v0.1" text
- [ ] 2.3 Left side displays "Autonomous Scientific Agent" subtitle
- [ ] 2.4 Left side displays "LIVE EXECUTION" badge when agent is running
- [ ] 2.5 "LIVE EXECUTION" badge is hidden when agent is idle or complete
- [ ] 2.6 Right side displays "Hybrid Reasoning: Deterministic + Gemini" text
- [ ] 2.7 Right side displays "+ New Analysis" button
- [ ] 2.8 Right side displays "Export Report" button
- [ ] 2.9 "+ New Analysis" button triggers existing handlePrimaryRun function
- [ ] 2.10 "Export Report" button triggers existing handleExportReport function
- [ ] 2.11 Both buttons are disabled when agent is running
- [ ] 2.12 Header has dark background (#0F172A)
- [ ] 2.13 Header has bottom border (rgba(255,255,255,0.08))
- [ ] 2.14 Old header with Brain icon and status badges is removed
- [ ] 2.15 Old controls section with dropdowns and buttons is removed

### 3. Center Column - XRD Phase Identification Card

**Requirement**: Transform graph display into Card 1 with title, badge, graph, and metric cards

**Acceptance Criteria**:
- [ ] 3.1 Card has title "XRD Phase Identification"
- [ ] 3.2 Card has "Signal Loaded" badge next to title (green background, green border)
- [ ] 3.3 Graph is always visible (never hidden or collapsed)
- [ ] 3.4 Graph displays XRD data using existing Graph component
- [ ] 3.5 Graph receives same data source (selectedDataset.dataPoints)
- [ ] 3.6 Graph shows peak markers when agentState.graphState.showMarkers is true
- [ ] 3.7 Graph shows baseline data when available
- [ ] 3.8 Peak markers appear after execution starts (step 1 or later)
- [ ] 3.9 Four metric cards displayed below graph in grid layout
- [ ] 3.10 Metric card 1 shows "Detected Peaks: 24 significant"
- [ ] 3.11 Metric card 2 shows "2θ Range: 10° - 80°"
- [ ] 3.12 Metric card 3 shows "Dominant Peaks (2θ): 35.5°, 43.2° (highest intensity)"
- [ ] 3.13 Metric card 4 shows "Signal Quality: High, SNR 28.7 dB"
- [ ] 3.14 Metric cards use existing result.metrics data when available
- [ ] 3.15 Card has dark background (#0F172A)
- [ ] 3.16 Card has border (rgba(255,255,255,0.08))

### 4. Center Column - Execution Trace Card

**Requirement**: Transform execution log into Card 2 with vertical step list and progress bar

**Acceptance Criteria**:
- [ ] 4.1 Card has title "Execution Trace"
- [ ] 4.2 Seven execution steps displayed in vertical list
- [ ] 4.3 Step 1: "Load Dataset" - "Load diffraction spectrum, check integrity" - Tool: file_loader - 1.2s
- [ ] 4.4 Step 2: "Peak Detection" - "Detect peaks using adaptive threshold and prominence" - Tool: peak_detector - 3.4s
- [ ] 4.5 Step 3: "Candidate Generation" - "Generate phase candidates from peak database" - Tool: candidate_generator - 2.7s
- [ ] 4.6 Step 4: "Hypothesis Evaluation" - "Compare candidates against observed patterns" - Tool: hypothesis_evaluator - 6.1s
- [ ] 4.7 Step 5: "Evidence Synthesis" - "Aggregate scores, apply penalties and adjustments" - Tool: evidence_synthesizer - Running (when active)
- [ ] 4.8 Step 6: "AI Interpretation" - "Generate scientific interpretation and reasoning" - Tool: gemini_reasoner - Pending (when not started)
- [ ] 4.9 Step 7: "Scientific Determination" - "Finalize conclusions with confidence estimation" - Tool: decision_engine - Pending (when not started)
- [ ] 4.10 Each step shows: number, title, description, tool chip, time, status icon
- [ ] 4.11 Status icons: checkmark (complete), spinner (running), circle (pending), alert (error)
- [ ] 4.12 Tool chips have dark background and border
- [ ] 4.13 Progress bar displayed at bottom of card
- [ ] 4.14 Progress bar shows "EXECUTION PROGRESS 72%" label
- [ ] 4.15 Progress bar percentage matches (currentStepIndex + 1) / totalSteps * 100
- [ ] 4.16 Progress bar has gradient fill (cyan to blue)
- [ ] 4.17 Steps use existing toolTrace data from agentState
- [ ] 4.18 Card has dark background (#0F172A)
- [ ] 4.19 Card has border (rgba(255,255,255,0.08))

### 5. Right Panel - Tab Navigation

**Requirement**: Implement right panel with tab navigation for Agent Thinking, Evidence, Parameters, Logs

**Acceptance Criteria**:
- [ ] 5.1 Right panel is 400px wide, fixed position, full height
- [ ] 5.2 Four tabs displayed: Agent Thinking | Evidence | Parameters | Logs
- [ ] 5.3 Agent Thinking tab is active by default
- [ ] 5.4 Active tab has visual indicator (underline, background, or border)
- [ ] 5.5 Clicking tab changes active tab and displays corresponding content
- [ ] 5.6 Tab content area scrolls independently from tabs
- [ ] 5.7 Right panel has dark background (#0F172A)
- [ ] 5.8 Right panel has left border (rgba(255,255,255,0.08))

### 6. Right Panel - Agent Thinking Tab Content

**Requirement**: Display 8 sections in Agent Thinking tab with reasoning stream, candidates, analysis

**Acceptance Criteria**:
- [ ] 6.1 Section 1: "REASONING STREAM" header displayed
- [ ] 6.2 Section 1 shows "Step 4 of 6 - Hypothesis Evaluation" (dynamic based on currentStepIndex)
- [ ] 6.3 Section 1 shows "Observed Peaks" list with peak positions
- [ ] 6.4 Section 1 shows "Evaluation Logic" checklist with items
- [ ] 6.5 Section 2: "CANDIDATE COMPARISON" header displayed
- [ ] 6.6 Section 2 shows table with columns: Candidate Phase, Peak Alignment, Intensity Corr., Completeness, Score, Result
- [ ] 6.7 Section 2 shows 3 candidate rows with data
- [ ] 6.8 Candidate 1 shows "Match" result with green badge
- [ ] 6.9 Candidates 2-3 show "Rejected" result with red badge and reason
- [ ] 6.10 Section 3: "CONFLICT ANALYSIS" header displayed
- [ ] 6.11 Section 3 shows conflict analysis text or data
- [ ] 6.12 Section 4: "UNCERTAINTY ASSESSMENT" header displayed
- [ ] 6.13 Section 4 shows uncertainty assessment text or data
- [ ] 6.14 Section 5: "EVIDENCE SYNTHESIS (IN PROGRESS)" header displayed
- [ ] 6.15 Section 5 shows formula or equation for evidence synthesis
- [ ] 6.16 Section 6: "SCIENTIFIC INTERPRETATION [Source: Gemini]" header displayed
- [ ] 6.17 Section 6 shows Gemini-generated interpretation text
- [ ] 6.18 Section 6 has purple accent color for Gemini source indicator
- [ ] 6.19 Section 7: "SCIENTIFIC DETERMINATION (PENDING FINALIZATION) [Source: Hybrid]" header displayed
- [ ] 6.20 Section 7 shows hybrid determination text when available
- [ ] 6.21 All sections have consistent spacing and styling
- [ ] 6.22 Sections use existing llmState.output data when available
- [ ] 6.23 Sections show placeholder or "Pending" text when data not yet available

### 7. Responsive Behavior

**Requirement**: Layout adapts to different screen sizes with stacking on mobile

**Acceptance Criteria**:
- [ ] 7.1 Desktop (≥1024px): Three-column layout (sidebar | center | right panel)
- [ ] 7.2 Tablet (768px-1023px): Three-column layout with narrower columns
- [ ] 7.3 Mobile (<768px): Vertical stack (sidebar → header → center → right panel)
- [ ] 7.4 Mobile: Left sidebar becomes drawer/overlay (hidden by default)
- [ ] 7.5 Mobile: Hamburger menu icon appears in main header
- [ ] 7.6 Mobile: Clicking hamburger opens left sidebar as overlay
- [ ] 7.7 Mobile: Right panel stacks below center column
- [ ] 7.8 All content remains accessible on all screen sizes
- [ ] 7.9 Graph scales appropriately on smaller screens
- [ ] 7.10 Metric cards stack vertically on mobile (1 column instead of 4)

### 8. Visual Style Consistency

**Requirement**: Apply v3.1 visual style with dark theme, borders, and color accents

**Acceptance Criteria**:
- [ ] 8.1 Background color: #070B12 (main app background)
- [ ] 8.2 Surface colors: #0F172A (cards), #101622 (alternate), #111827 (tertiary)
- [ ] 8.3 Borders: rgba(255,255,255,0.08) (subtle white borders)
- [ ] 8.4 Primary blue: #1D4ED8 (buttons, accents)
- [ ] 8.5 Green: emerald-300/400 for success, match, complete states
- [ ] 8.6 Amber: amber-300/400 for warnings
- [ ] 8.7 Red: red-300/400 for rejection, errors
- [ ] 8.8 Purple: violet-300/400 for Gemini source indicators
- [ ] 8.9 Cyan: cyan-300/400 for running states, progress
- [ ] 8.10 Text colors: white (headings), slate-300 (body), slate-500 (labels), slate-600 (muted)
- [ ] 8.11 Font: sans-serif (existing font stack)
- [ ] 8.12 Compact spacing: professional scientific SaaS style
- [ ] 8.13 Rounded corners: 8px-12px for cards, 4px-6px for buttons/badges
- [ ] 8.14 Consistent padding: 16px-24px for cards, 8px-12px for smaller elements

### 9. Data Preservation

**Requirement**: All existing data sources, logic, and handlers remain unchanged

**Acceptance Criteria**:
- [ ] 9.1 No changes to routing logic
- [ ] 9.2 No changes to dataset selection logic (getDatasetOption, getDatasetOptions)
- [ ] 9.3 No changes to graph data source (selectedDataset.dataPoints)
- [ ] 9.4 No changes to peak detection logic (runXrdPhaseIdentificationAgent)
- [ ] 9.5 No changes to button handlers (handlePrimaryRun, handleExportReport, etc.)
- [ ] 9.6 No changes to state management (AgentDemoState structure)
- [ ] 9.7 No changes to execution loop (runAuto, runStep functions)
- [ ] 9.8 No changes to LLM reasoning logic (callLlmReasoning)
- [ ] 9.9 No changes to decision result creation (createDecisionResult)
- [ ] 9.10 No changes to authentication or project linking
- [ ] 9.11 Graph component receives same props as before
- [ ] 9.12 All existing functionality works identically after transformation

### 10. Component Extraction

**Requirement**: Extract reusable components for sidebar, header, center column, right panel

**Acceptance Criteria**:
- [ ] 10.1 LeftSidebar component created with props: currentDataset, currentProject, onNavigate
- [ ] 10.2 MainHeader component created with props: agentVersion, executionStatus, modelMode, onNewAnalysis, onExportReport
- [ ] 10.3 CenterColumn component created with props: context, dataset, project, graphData, peakMarkers, baselineData, executionSteps, progressPercent, metrics
- [ ] 10.4 RightPanel component created with props: activeTab, currentStep, totalSteps, reasoningStream, candidates, etc.
- [ ] 10.5 Each component is self-contained and can be tested independently
- [ ] 10.6 Components use TypeScript interfaces for props
- [ ] 10.7 Components follow existing code style and conventions
- [ ] 10.8 Components are placed in appropriate directory (src/components/agent-demo/ or similar)

## Non-Functional Requirements

### Performance

- [ ] NFR-1: Initial render time ≤ 500ms (same as current implementation)
- [ ] NFR-2: Graph rendering time ≤ 200ms (same as current implementation)
- [ ] NFR-3: Tab switching time ≤ 100ms (instant visual feedback)
- [ ] NFR-4: Execution step updates ≤ 50ms per step (smooth animation)
- [ ] NFR-5: No memory leaks during execution loop
- [ ] NFR-6: Smooth scrolling in center column and right panel (60fps)

### Accessibility

- [ ] NFR-7: All interactive elements are keyboard accessible (tab navigation)
- [ ] NFR-8: Focus indicators visible on all interactive elements
- [ ] NFR-9: ARIA labels on navigation items, buttons, tabs
- [ ] NFR-10: Semantic HTML structure (nav, main, aside, header)
- [ ] NFR-11: Color contrast ratios meet WCAG AA standards (4.5:1 for text)
- [ ] NFR-12: Status changes announced to screen readers (ARIA live regions)

### Browser Compatibility

- [ ] NFR-13: Works in Chrome 90+ (primary target)
- [ ] NFR-14: Works in Firefox 88+ (secondary target)
- [ ] NFR-15: Works in Safari 14+ (secondary target)
- [ ] NFR-16: Works in Edge 90+ (secondary target)
- [ ] NFR-17: CSS Grid and Flexbox support required
- [ ] NFR-18: No IE11 support required

### Maintainability

- [ ] NFR-19: Code follows existing project conventions
- [ ] NFR-20: Components are documented with JSDoc comments
- [ ] NFR-21: TypeScript types are explicit and comprehensive
- [ ] NFR-22: No new external dependencies added
- [ ] NFR-23: Existing test suite continues to pass
- [ ] NFR-24: New components have unit tests

## Out of Scope

The following items are explicitly **not** included in this transformation:

1. **Routing Changes**: No changes to React Router configuration or route paths
2. **Dataset Logic**: No changes to dataset selection, loading, or processing logic
3. **Graph Data**: No changes to graph data sources, calculations, or transformations
4. **Button Handlers**: No changes to existing event handlers or their logic
5. **Authentication**: No changes to auth logic or user session management
6. **Project Linking**: No changes to project association or workspace navigation
7. **Backend Integration**: No new API calls or backend changes
8. **State Management**: No refactoring of AgentDemoState structure
9. **Execution Logic**: No changes to agent execution loop or step sequencing
10. **LLM Integration**: No changes to Gemini reasoning API calls or response handling
11. **New Features**: No new functionality beyond visual transformation
12. **Data Migration**: No changes to localStorage or data persistence

## Success Metrics

1. **Visual Accuracy**: Layout matches v3.1 reference UI design ≥95% (measured by visual comparison)
2. **Functionality Preservation**: All existing features work identically (100% pass rate on existing tests)
3. **Performance**: No regression in render time or execution speed (within 10% of baseline)
4. **Code Quality**: No increase in complexity (cyclomatic complexity ≤ current levels)
5. **User Experience**: Smooth transitions, no visual glitches, responsive on all screen sizes

## Dependencies

- React 18+ (existing)
- React Router 6+ (existing)
- TypeScript 4.9+ (existing)
- Tailwind CSS 3+ (existing)
- Lucide React (existing, for icons)
- Graph component (existing, no changes)

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing functionality | High | Medium | Comprehensive testing, preserve all data sources and handlers |
| Layout issues on edge cases | Medium | Medium | Responsive testing on multiple devices and screen sizes |
| Performance regression | Medium | Low | Profile before/after, optimize rendering with React.memo |
| Inconsistent styling | Low | Low | Use Tailwind utility classes, follow v3.1 design tokens |
| Component coupling | Medium | Low | Extract components with clear interfaces, avoid prop drilling |

## Assumptions

1. Current AgentDemo.tsx implementation is stable and working correctly
2. v3.1 reference UI design is final and approved
3. No breaking changes to Graph component API
4. Existing state management is sufficient for new layout
5. No new data sources or API endpoints required
6. Tailwind CSS configuration includes all required colors and utilities
7. Development environment supports TypeScript and React 18+
8. Testing environment can render components in isolation
