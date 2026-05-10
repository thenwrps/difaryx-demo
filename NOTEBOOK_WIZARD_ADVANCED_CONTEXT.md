# ProjectNotebookWizard Advanced Context Refinement

## Overview
Added a compact collapsed "Advanced Context" section to the ProjectNotebookWizard, providing optional depth for scientific workflow intelligence while maintaining a clean, balanced initial view across all three modes.

## Changes Made

### 1. New ADVANCED_FIELDS Configuration
Added a separate configuration for advanced/optional fields by mode:

**Research (4 advanced fields):**
- Hypothesis
- Expected Evidence
- Validation Boundary
- Publication / Thesis Target

**R&D (5 advanced fields):**
- Material / Formulation System
- Risk Level
- Expected Evidence
- Validation Boundary
- Next Milestone

**Analytical Job (5 advanced fields):**
- Specification / Standard
- Acceptance Criteria
- QA/QC Requirement
- Report Type
- Due Date / Priority

### 2. Collapsible UI Component
Added a collapsible Advanced Context section with:
- **Header button** with clear label and helper text
- **ChevronDown icon** that rotates when expanded
- **Smooth transition** between collapsed and expanded states
- **Nested field container** with proper styling and spacing

### 3. State Management
Added state for tracking the collapsed/expanded status:
```typescript
const [advancedExpanded, setAdvancedExpanded] = useState(false);
```

Reset on modal close to ensure consistent behavior.

### 4. Visual Design
**Collapsed state:**
- Compact button with title and description
- Clear affordance for expansion
- Minimal vertical space usage

**Expanded state:**
- Fields appear in a bordered container
- Same input styling as essential fields
- Proper spacing and hierarchy
- No layout breaking or excessive scrolling

### 5. Field Organization
**Essential fields (always visible):**
- 4 fields per mode
- 2 required fields per mode
- Core workflow information

**Advanced fields (collapsed by default):**
- 4-5 fields per mode
- All optional
- Deeper context for reasoning and validation

## User Experience

### Initial View
- Users see only 4 essential fields
- Modal remains compact and approachable
- No overwhelming form experience
- Clear path to completion

### Optional Depth
- Users can expand Advanced Context if needed
- Provides stronger reasoning context
- Supports validation boundaries
- Enables better reporting

### Balanced Across Modes
- Research: 4 essential + 4 advanced = 8 total
- R&D: 4 essential + 5 advanced = 9 total
- Analytical: 4 essential + 5 advanced = 9 total

All modes feel equally supported with appropriate depth.

## Technical Implementation

### Icon Import
Added `ChevronDown` to lucide-react imports for the expand/collapse indicator.

### Field Rendering
Advanced fields use the same rendering logic as essential fields:
- Same input components
- Same validation behavior
- Same data storage (dataFields state)
- Prefixed IDs to avoid conflicts (`adv-${field.key}`)

### Transition Behavior
- Smooth rotation of chevron icon (CSS transform)
- Conditional rendering of field container
- No animation jank or layout shift

## Verification

✅ **Build passes**: `npm.cmd run build` completed successfully
✅ **Collapsed by default**: Advanced Context starts hidden
✅ **Smooth expansion**: No layout breaking when expanded
✅ **All modes balanced**: Each mode has appropriate advanced fields
✅ **Data persistence**: Advanced field values stored in same state
✅ **Modal remains compact**: No excessive scrolling required
✅ **State cleanup**: Advanced expanded state resets on close

## Product Identity Enhancement

The Advanced Context section reinforces DIFARYX's identity as a scientific workflow intelligence system by:

1. **Providing depth without complexity**: Users can start simple and add detail as needed
2. **Supporting validation boundaries**: Critical for scientific rigor
3. **Enabling stronger reasoning**: More context = better agent decisions
4. **Maintaining premium UX**: Feels like a sophisticated SaaS product, not a basic form

## Preserved Functionality

- All existing routes and component architecture unchanged
- Form validation behavior preserved
- localStorage behavior unchanged
- Deterministic demo flow maintained
- Step navigation (Back/Next) unchanged
- Mode selection behavior unchanged
- Essential field layout unchanged
- Review step logic unchanged

## Final Field Counts

### Research Mode
- Essential: 4 fields (2 required)
- Advanced: 4 fields (0 required)
- Total: 8 fields

### R&D Mode
- Essential: 4 fields (2 required)
- Advanced: 5 fields (0 required)
- Total: 9 fields

### Analytical Job Mode
- Essential: 4 fields (2 required)
- Advanced: 5 fields (0 required)
- Total: 9 fields

## Acceptance Criteria Met

✅ First view of Context & Data stays compact
✅ Users can optionally add deeper workflow context
✅ Research, R&D, and Analytical Job remain balanced
✅ DIFARYX feels like a scientific workflow intelligence system
✅ Not a simple form wizard - has appropriate depth
✅ npm.cmd run build passes
✅ Advanced Context collapsed by default
✅ Expanding doesn't break modal layout
✅ Modal remains compact
✅ Step doesn't feel like a long form
✅ Back/Next behavior preserved
✅ Selected mode behavior preserved
✅ Advanced fields are optional (not required)
✅ All three modes equally supported
