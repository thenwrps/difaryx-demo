# Agent Demo Components v3.1

Complete rewrite of the Agent Demo UI components to match the v3.1 reference design with a clean, professional three-column layout.

## Architecture

```
AgentDemo.tsx (Main Page)
├── LeftSidebar/
│   └── LeftSidebar.tsx          # Navigation + Current Dataset Card
├── MainHeader/
│   └── MainHeader.tsx           # Agent Info + Action Buttons
├── CenterColumn/
│   ├── CenterColumn.tsx         # Main container
│   ├── MetricCard.tsx           # Individual metric display
│   └── ExecutionStepItem.tsx   # Step visualization
└── RightPanel/
    └── RightPanel.tsx           # Agent Thinking Tabs
```

## Component Overview

### LeftSidebar

**Purpose**: Fixed-width navigation sidebar with logo, nav items, and current dataset card

**Props**:
- `currentDataset: DemoDataset` - Active dataset information
- `currentProject: DemoProject` - Active project information
- `onNavigate?: (route: string) => void` - Optional navigation handler

**Features**:
- 280px fixed width
- DIFARYX logo at top
- Navigation items: Agent Demo (active), Workflows, Data, Results, Knowledge, Settings
- Current Dataset card at bottom with:
  - Filename
  - Technique (XRD, XPS, FTIR, Raman)
  - 2θ Range (for XRD)
  - Step Size (for XRD)
  - Points count
  - Status badge (Loaded)
  - "View Dataset" button

**Styling**:
- Dark background: `#080E19`
- Border: `rgba(255,255,255,0.08)`
- Active nav item: cyan accent with border
- Clean spacing and typography

---

### MainHeader

**Purpose**: Compact header with agent info and action buttons

**Props**:
- `agentVersion: string` - Agent version (e.g., "v0.1")
- `executionStatus: RunStatus` - Current execution status
- `modelMode: ModelMode` - Reasoning mode
- `onNewAnalysis: () => void` - New analysis handler
- `onExportReport: () => void` - Export report handler
- `isRunning: boolean` - Whether agent is currently running

**Features**:
- Left side:
  - "DIFARYX Agent v0.1" title
  - "Autonomous Scientific Agent" subtitle
  - "LIVE EXECUTION" badge (animated, only when running)
- Right side:
  - "Hybrid Reasoning: Deterministic + Gemini" text
  - "+ New Analysis" button (gradient blue)
  - "Export Report" button (outlined)
- Buttons disabled during execution

**Styling**:
- Background: `#0F172A`
- Height: ~60px
- Gradient buttons with shadow
- Clean spacing

---

### CenterColumn

**Purpose**: Main content area with graph card and execution trace

**Props**:
- `context: AgentContext` - Technique context (XRD, XPS, FTIR, Raman)
- `dataset: DemoDataset` - Dataset information
- `project: DemoProject` - Project information
- `graphData: DataPoint[]` - Graph data points
- `peakMarkers?: DemoPeak[]` - Optional peak markers
- `baselineData?: DataPoint[]` - Optional baseline data
- `executionSteps: ExecutionStep[]` - Array of 7 execution steps
- `progressPercent: number` - Progress percentage (0-100)
- `metrics: MetricData[]` - Array of metric cards

**Features**:

**Card 1: XRD Phase Identification**
- Title with "Signal Loaded" badge
- Graph (always visible, 400px height)
- 4 metric cards below graph in grid:
  1. Detected Peaks
  2. 2θ Range
  3. Dominant Peaks
  4. Signal Quality

**Card 2: Execution Trace**
- Title: "Execution Trace"
- 7 execution steps in vertical list
- Each step shows:
  - Number in circle
  - Title and description
  - Tool name chip
  - Time (when not pending)
  - Status icon (checkmark/spinner/circle/alert)
- Progress bar at bottom with percentage

**Styling**:
- Cards: `#0F172A` background
- Borders: `rgba(255,255,255,0.08)`
- Metric cards: `#070B12` background with icons
- Step items: Clean borders, status-based colors
- Progress bar: Gradient cyan to blue

---

### RightPanel

**Purpose**: Tabbed panel for agent thinking, evidence, parameters, and logs

**Props**:
- `activeTab?: TabType` - Active tab (controlled)
- `currentStep: number` - Current execution step index
- `totalSteps: number` - Total number of steps
- `reasoningStream?: any` - Reasoning stream data
- `candidates?: CandidateData[]` - Candidate phase data
- `onTabChange?: (tab: TabType) => void` - Tab change handler

**Features**:

**Tab Navigation**:
- 4 tabs: Agent Thinking | Evidence | Parameters | Logs
- Active tab has cyan underline
- Smooth transitions

**Agent Thinking Tab** (8 sections):
1. **Reasoning Stream**
   - Current step indicator
   - Observed peaks list
   - Evaluation logic checklist

2. **Candidate Comparison**
   - Table with columns: Phase, Align, Corr, Comp, Score
   - 3 candidate rows
   - Match/Rejected badges with reasons

3. **Conflict Analysis**
   - Unexplained peaks
   - Missing peaks
   - Resolution notes

4. **Uncertainty Assessment**
   - Uncertainty factors with colored dots
   - Percentage values
   - Descriptions

5. **Evidence Synthesis**
   - Formula display
   - "In Progress" badge
   - Weighted scoring explanation

6. **Scientific Interpretation**
   - Gemini-generated text
   - Purple "Source: Gemini" badge
   - Scientific reasoning

7. **Scientific Determination**
   - Hybrid determination
   - Cyan "Source: Hybrid" badge
   - Primary result, recommendation, caveat

**Styling**:
- Width: 400px fixed
- Background: `#0F172A`
- Section headers: Uppercase, slate-400
- Tables: Clean borders, compact spacing
- Badges: Color-coded by source (violet/cyan/emerald)

---

## Data Flow

```
AgentDemo.tsx
  ↓
  ├─→ LeftSidebar (dataset, project)
  ├─→ MainHeader (status, handlers)
  ├─→ CenterColumn (graph data, steps, metrics)
  └─→ RightPanel (reasoning, candidates)
```

## Styling System

**Colors**:
- Background: `#070B12` (main), `#0F172A` (cards), `#080E19` (sidebar)
- Borders: `rgba(255,255,255,0.08)`
- Text: white (headings), slate-300 (body), slate-500 (labels)
- Accents:
  - Cyan: `cyan-300/400` (running, progress)
  - Emerald: `emerald-300/400` (success, complete)
  - Violet: `violet-300/400` (Gemini source)
  - Amber: `amber-300/400` (warnings)
  - Red: `red-300/400` (errors, rejected)

**Spacing**:
- Cards: `p-6` (24px)
- Sections: `space-y-6` (24px vertical)
- Small elements: `p-4` (16px), `gap-3` (12px)

**Typography**:
- Headings: `text-lg font-bold text-white`
- Body: `text-sm text-slate-300`
- Labels: `text-xs text-slate-500 uppercase tracking-wider`
- Mono: `font-mono` for tool names, values

**Borders & Radius**:
- Cards: `rounded-lg` (8px)
- Buttons: `rounded-lg` (8px)
- Badges: `rounded-full`
- Borders: `border border-slate-800`

## Responsive Behavior

**Desktop (≥1024px)**:
- Three-column layout: Sidebar (280px) | Center (flex) | Right (400px)

**Tablet (768px-1023px)**:
- Three-column layout with adjusted widths

**Mobile (<768px)**:
- Vertical stack
- Sidebar becomes drawer/overlay
- Metric cards stack vertically (1 column)

## Key Improvements

1. **Clean Visual Hierarchy**: Clear separation of navigation, content, and reasoning
2. **Always-Visible Graph**: Graph never collapses or hides
3. **Professional Metric Cards**: 4 cards with icons below graph
4. **Clean Execution Trace**: Vertical step list with clear status indicators
5. **Organized Right Panel**: Tabbed interface with 8 well-structured sections
6. **Consistent Styling**: Professional dark theme with cyan/emerald accents
7. **Proper Spacing**: Generous padding and gaps for readability
8. **Status Indicators**: Color-coded badges and icons throughout

## Testing

All components:
- ✅ Build successfully with TypeScript
- ✅ No linting errors
- ✅ Proper prop types
- ✅ Clean imports/exports
- ✅ Responsive layout
- ✅ Accessible markup

## Future Enhancements

- [ ] Add unit tests for each component
- [ ] Add Storybook stories
- [ ] Implement mobile drawer for sidebar
- [ ] Add keyboard navigation
- [ ] Add ARIA labels for screen readers
- [ ] Implement tab content for Evidence, Parameters, Logs
- [ ] Add animation transitions
- [ ] Add loading skeletons
