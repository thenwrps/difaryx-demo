# Tasks: Agent Demo v3.1 Visual Transformation

## Phase 1: Component Extraction and Structure

### 1.1 Create Component Directory Structure
- [x] Create `src/components/agent-demo/` directory
- [ ] Create subdirectories: `LeftSidebar/`, `MainHeader/`, `CenterColumn/`, `RightPanel/`
- [ ] Create index files for each component directory

### 1.2 Extract LeftSidebar Component
- [-] Create `LeftSidebar.tsx` with TypeScript interface for props
- [ ] Implement logo section at top (DIFARYX branding)
- [ ] Implement navigation items list (Agent Demo, Workflows, Data, Results, Knowledge, Settings)
- [ ] Add active state indicator for Agent Demo item
- [ ] Implement Current Dataset card at bottom
- [ ] Add dataset metadata display (filename, technique, range, step size, points, status)
- [ ] Add "View Dataset" button with navigation handler
- [ ] Apply v3.1 styling (280px width, dark background, borders)
- [ ] Add responsive behavior (drawer on mobile)

### 1.3 Extract MainHeader Component
- [ ] Create `MainHeader.tsx` with TypeScript interface for props
- [ ] Implement left section (agent version, subtitle, live execution badge)
- [ ] Implement right section (reasoning mode text, action buttons)
- [ ] Add "+ New Analysis" button with handler
- [ ] Add "Export Report" button with handler
- [ ] Implement conditional "LIVE EXECUTION" badge (visible when running)
- [ ] Apply v3.1 styling (compact height, dark background, borders)
- [ ] Add button disabled states during execution

### 1.4 Extract CenterColumn Component
- [ ] Create `CenterColumn.tsx` with TypeScript interface for props
- [ ] Create `XRDPhaseCard.tsx` sub-component
- [ ] Create `ExecutionTraceCard.tsx` sub-component
- [ ] Create `MetricCard.tsx` reusable component
- [ ] Create `ExecutionStepItem.tsx` reusable component
- [ ] Implement card layout with spacing
- [ ] Apply v3.1 styling (flexible width, scrollable, dark cards)

### 1.5 Extract RightPanel Component
- [ ] Create `RightPanel.tsx` with TypeScript interface for props
- [ ] Implement tab navigation (Agent Thinking, Evidence, Parameters, Logs)
- [ ] Create tab content container with scroll
- [ ] Add active tab state management
- [ ] Apply v3.1 styling (400px width, dark background, borders)
- [ ] Add responsive behavior (stack below center on mobile)

## Phase 2: XRD Phase Identification Card Implementation

### 2.1 Implement Card Structure
- [ ] Add card title "XRD Phase Identification"
- [ ] Add "Signal Loaded" badge next to title
- [ ] Create graph container section
- [ ] Create metrics grid section below graph
- [ ] Apply card styling (border, background, padding)

### 2.2 Integrate Graph Component
- [ ] Import existing Graph component
- [ ] Pass graphData prop (selectedDataset.dataPoints)
- [ ] Pass peakMarkers prop (conditional on showMarkers state)
- [ ] Pass baselineData prop (from xrdAnalysis)
- [ ] Set graph type to 'xrd'
- [ ] Set graph height to 400px
- [ ] Ensure graph is always visible (never hidden)
- [ ] Verify peak markers appear after step 1

### 2.3 Implement Metric Cards
- [ ] Create MetricCard component with label and value props
- [ ] Implement 4-column grid layout for metrics
- [ ] Add metric 1: "Detected Peaks" with count
- [ ] Add metric 2: "2θ Range" with range values
- [ ] Add metric 3: "Dominant Peaks" with positions
- [ ] Add metric 4: "Signal Quality" with SNR
- [ ] Use existing result.metrics data when available
- [ ] Apply color coding (cyan, emerald, violet, amber)
- [ ] Add responsive behavior (stack on mobile)

## Phase 3: Execution Trace Card Implementation

### 3.1 Implement Card Structure
- [ ] Add card title "Execution Trace"
- [ ] Create vertical step list container
- [ ] Create progress bar section at bottom
- [ ] Apply card styling (border, background, padding)

### 3.2 Implement Execution Step List
- [ ] Create ExecutionStepItem component
- [ ] Map toolTrace data to execution steps
- [ ] Display step number (1-7)
- [ ] Display step title (from stage.label)
- [ ] Display step description (from stage.detail)
- [ ] Display tool chip (from stage.toolName)
- [ ] Display time (from stage.durationMs)
- [ ] Display status icon (checkmark, spinner, circle, alert)
- [ ] Apply status-based styling (complete, running, pending, error)
- [ ] Ensure 7 steps are always displayed

### 3.3 Implement Progress Bar
- [ ] Add "EXECUTION PROGRESS" label
- [ ] Add percentage display (calculated from currentStepIndex)
- [ ] Create progress bar with gradient fill
- [ ] Animate progress bar width on step changes
- [ ] Calculate percentage: (currentStepIndex + 1) / totalSteps * 100
- [ ] Apply gradient colors (cyan to blue)
- [ ] Ensure smooth transitions

## Phase 4: Right Panel - Agent Thinking Tab

### 4.1 Implement Tab Navigation
- [ ] Create tab button components
- [ ] Add four tabs: Agent Thinking, Evidence, Parameters, Logs
- [ ] Implement active tab state
- [ ] Add active tab visual indicator (underline or background)
- [ ] Add tab click handlers
- [ ] Apply tab styling (borders, spacing, colors)

### 4.2 Implement Reasoning Stream Section
- [ ] Add "REASONING STREAM" header
- [ ] Display current step indicator (e.g., "Step 4 of 6 - Hypothesis Evaluation")
- [ ] Display "Observed Peaks" list
- [ ] Display "Evaluation Logic" checklist
- [ ] Extract data from agentState.reasoningState
- [ ] Apply section styling (spacing, borders)

### 4.3 Implement Candidate Comparison Section
- [ ] Add "CANDIDATE COMPARISON" header
- [ ] Create table with 6 columns (Candidate Phase, Peak Alignment, Intensity Corr., Completeness, Score, Result)
- [ ] Display 3 candidate rows
- [ ] Add "Match" badge for top candidate (green)
- [ ] Add "Rejected" badges for other candidates (red)
- [ ] Display rejection reasons
- [ ] Extract data from xrdAnalysis.candidates
- [ ] Apply table styling (borders, alternating rows)

### 4.4 Implement Conflict Analysis Section
- [ ] Add "CONFLICT ANALYSIS" header
- [ ] Display conflict analysis text or data
- [ ] Extract data from agentState or xrdAnalysis
- [ ] Apply section styling

### 4.5 Implement Uncertainty Assessment Section
- [ ] Add "UNCERTAINTY ASSESSMENT" header
- [ ] Display uncertainty assessment text or data
- [ ] Extract data from agentState or result
- [ ] Apply section styling

### 4.6 Implement Evidence Synthesis Section
- [ ] Add "EVIDENCE SYNTHESIS (IN PROGRESS)" header
- [ ] Display formula or equation
- [ ] Show synthesis progress indicator
- [ ] Extract data from agentState
- [ ] Apply section styling with formula formatting

### 4.7 Implement Scientific Interpretation Section
- [ ] Add "SCIENTIFIC INTERPRETATION [Source: Gemini]" header
- [ ] Display Gemini-generated interpretation text
- [ ] Add purple accent for Gemini source indicator
- [ ] Extract data from llmState.output
- [ ] Show placeholder when data not available
- [ ] Apply section styling

### 4.8 Implement Scientific Determination Section
- [ ] Add "SCIENTIFIC DETERMINATION (PENDING FINALIZATION) [Source: Hybrid]" header
- [ ] Display hybrid determination text
- [ ] Extract data from result or llmState
- [ ] Show "Pending" state when not finalized
- [ ] Apply section styling

## Phase 5: Layout Integration and Responsive Design

### 5.1 Integrate Components into AgentDemo
- [x] Import all new components
- [x] Replace old header with MainHeader component
- [ ] Remove old controls section
- [ ] Add LeftSidebar component
- [ ] Replace main content with CenterColumn component
- [ ] Add RightPanel component
- [ ] Create three-column layout structure
- [ ] Apply flexbox/grid layout

### 5.2 Implement Desktop Layout (≥1024px)
- [ ] Set LeftSidebar to 280px fixed width
- [ ] Set CenterColumn to flexible width (flex-1)
- [ ] Set RightPanel to 400px fixed width
- [ ] Ensure full height for all columns
- [ ] Add proper spacing between columns
- [ ] Test layout at 1920px, 1440px, 1280px, 1024px

### 5.3 Implement Tablet Layout (768px-1023px)
- [ ] Maintain three-column layout
- [ ] Adjust column widths proportionally
- [ ] Ensure content remains readable
- [ ] Test layout at 1023px, 900px, 768px

### 5.4 Implement Mobile Layout (<768px)
- [ ] Stack layout vertically
- [ ] Convert LeftSidebar to drawer/overlay
- [ ] Add hamburger menu icon to MainHeader
- [ ] Implement drawer open/close logic
- [ ] Stack RightPanel below CenterColumn
- [ ] Stack metric cards vertically (1 column)
- [ ] Ensure graph scales appropriately
- [ ] Test layout at 767px, 640px, 375px, 320px

## Phase 6: Data Integration and State Management

### 6.1 Map Existing State to New Components
- [ ] Pass agentState to all components via props
- [ ] Map selectedDataset to LeftSidebar
- [ ] Map executionStatus to MainHeader
- [ ] Map graphData to CenterColumn
- [ ] Map toolTrace to ExecutionTraceCard
- [ ] Map llmState to RightPanel
- [ ] Ensure no state structure changes

### 6.2 Preserve Existing Handlers
- [ ] Verify handlePrimaryRun works with new "+ New Analysis" button
- [ ] Verify handleExportReport works with new "Export Report" button
- [ ] Verify handleNavigate works with sidebar navigation
- [ ] Verify handleTabChange works with right panel tabs
- [ ] Verify all existing handlers remain unchanged
- [ ] Test all button clicks and interactions

### 6.3 Preserve Graph Data Sources
- [ ] Verify Graph receives selectedDataset.dataPoints
- [ ] Verify peakMarkers come from xrdAnalysis or selectedDataset.detectedFeatures
- [ ] Verify baselineData comes from xrdAnalysis.baselineData
- [ ] Verify showMarkers logic remains unchanged
- [ ] Test graph rendering with various datasets
- [ ] Verify peak markers appear at correct times

## Phase 7: Styling and Visual Polish

### 7.1 Apply v3.1 Color Scheme
- [ ] Set main background to #070B12
- [ ] Set card backgrounds to #0F172A
- [ ] Set alternate surfaces to #101622, #111827
- [ ] Set borders to rgba(255,255,255,0.08)
- [ ] Apply primary blue #1D4ED8 to buttons
- [ ] Apply emerald colors to success states
- [ ] Apply amber colors to warnings
- [ ] Apply red colors to errors/rejections
- [ ] Apply purple colors to Gemini indicators
- [ ] Apply cyan colors to running states

### 7.2 Apply Typography and Spacing
- [ ] Use existing sans-serif font stack
- [ ] Set heading colors to white
- [ ] Set body text to slate-300
- [ ] Set labels to slate-500
- [ ] Set muted text to slate-600
- [ ] Apply consistent padding (16px-24px for cards)
- [ ] Apply consistent spacing between elements
- [ ] Apply consistent border radius (8px-12px for cards)

### 7.3 Add Animations and Transitions
- [ ] Add smooth transitions to progress bar
- [ ] Add fade-in animations to sections
- [ ] Add hover effects to buttons and navigation items
- [ ] Add active state animations to tabs
- [ ] Add spinner animation to running status icons
- [ ] Ensure 60fps performance for all animations

## Phase 8: Testing and Validation

### 8.1 Unit Testing
- [ ] Write tests for LeftSidebar component
- [ ] Write tests for MainHeader component
- [ ] Write tests for CenterColumn component
- [ ] Write tests for RightPanel component
- [ ] Write tests for MetricCard component
- [ ] Write tests for ExecutionStepItem component
- [ ] Test component rendering with various props
- [ ] Test component behavior with missing/null props

### 8.2 Integration Testing
- [ ] Test full layout rendering
- [ ] Test agent execution flow (idle → running → complete)
- [ ] Test graph visibility throughout execution
- [ ] Test peak markers appearance timing
- [ ] Test progress bar updates
- [ ] Test tab switching in right panel
- [ ] Test navigation in left sidebar
- [ ] Test button handlers

### 8.3 Responsive Testing
- [ ] Test desktop layout (1920px, 1440px, 1280px, 1024px)
- [ ] Test tablet layout (1023px, 900px, 768px)
- [ ] Test mobile layout (767px, 640px, 375px, 320px)
- [ ] Test drawer functionality on mobile
- [ ] Test metric card stacking on mobile
- [ ] Test graph scaling on small screens

### 8.4 Visual Regression Testing
- [ ] Compare layout to v3.1 reference UI design
- [ ] Verify color accuracy
- [ ] Verify spacing and alignment
- [ ] Verify typography consistency
- [ ] Verify border and shadow consistency
- [ ] Take screenshots for documentation

### 8.5 Functionality Preservation Testing
- [ ] Verify all existing features work identically
- [ ] Run existing test suite (must pass 100%)
- [ ] Test dataset selection
- [ ] Test context switching (XRD, XPS, FTIR, Raman)
- [ ] Test model mode switching
- [ ] Test execution modes (auto, step-by-step)
- [ ] Test export functionality
- [ ] Test notebook save functionality

## Phase 9: Performance Optimization

### 9.1 Optimize Component Rendering
- [ ] Add React.memo to LeftSidebar
- [ ] Add React.memo to MainHeader
- [ ] Add React.memo to RightPanel (when content unchanged)
- [ ] Memoize executionSteps transformation with useMemo
- [ ] Memoize candidate data extraction with useMemo
- [ ] Memoize metric calculations with useMemo
- [ ] Profile render times before/after optimization

### 9.2 Optimize Layout Performance
- [ ] Use CSS Grid for metric cards (faster than flexbox)
- [ ] Use CSS transforms for progress bar animation
- [ ] Lazy load right panel sections (render only active tab)
- [ ] Optimize scroll performance with will-change CSS
- [ ] Profile layout performance at 60fps

### 9.3 Optimize State Updates
- [ ] Batch state updates during execution loop
- [ ] Avoid unnecessary re-renders
- [ ] Profile state update performance
- [ ] Ensure no memory leaks during execution

## Phase 10: Documentation and Cleanup

### 10.1 Add Component Documentation
- [ ] Add JSDoc comments to LeftSidebar
- [ ] Add JSDoc comments to MainHeader
- [ ] Add JSDoc comments to CenterColumn
- [ ] Add JSDoc comments to RightPanel
- [ ] Add JSDoc comments to all sub-components
- [ ] Document props interfaces
- [ ] Add usage examples

### 10.2 Update Project Documentation
- [ ] Update README with new component structure
- [ ] Add screenshots of new layout
- [ ] Document responsive breakpoints
- [ ] Document color scheme and design tokens
- [ ] Update component diagram

### 10.3 Code Cleanup
- [ ] Remove old header code
- [ ] Remove old controls section code
- [ ] Remove unused imports
- [ ] Remove commented-out code
- [ ] Format code with Prettier
- [ ] Run ESLint and fix warnings
- [ ] Verify no console errors or warnings

### 10.4 Final Review
- [ ] Review all acceptance criteria (must be 100% complete)
- [ ] Review all non-functional requirements
- [ ] Review code quality and maintainability
- [ ] Review performance metrics
- [ ] Review accessibility compliance
- [ ] Get stakeholder approval on visual design
- [ ] Prepare for deployment

## Summary

**Total Tasks**: 10 phases, 100+ individual tasks
**Estimated Effort**: 3-5 days for experienced developer
**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 8
**Dependencies**: Each phase depends on completion of previous phase
**Risk Areas**: Responsive layout (Phase 5), data integration (Phase 6), performance (Phase 9)
