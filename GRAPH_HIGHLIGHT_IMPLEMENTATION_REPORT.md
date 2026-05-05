# Graph Highlight Implementation Report

## Files Changed
1. **`src/pages/MultiTechWorkspace.tsx`** - Added graph highlight metadata and computation logic
2. **`src/components/ui/Graph.tsx`** - Enhanced peak markers with role-based visual styling

## Build Result
✅ **Build successful** - No errors
```
✓ 2371 modules transformed
✓ built in 3.53s
```

## Implementation Details

### 1. Extended Evidence Items with Graph Target Metadata

Added to `CrossTechEvidence` interface:
- `xValue?: number | number[]` - X-axis position(s) for graph highlights
- `xUnit?: string` - Unit label (e.g., "cm⁻¹", "2θ", "eV")
- `highlightLabel?: string` - Label to display on graph
- `highlightRole?: 'primary' | 'supporting'` - Evidence importance

**Evidence Metadata Examples**:

```typescript
// Raman A1g
{
  xValue: 690,
  xUnit: 'cm⁻¹',
  highlightLabel: 'A₁g spinel',
  highlightRole: 'primary'
}

// XRD spinel reflections (multiple peaks)
{
  xValue: [30.1, 35.5, 43.2, 57.1],
  xUnit: '2θ',
  highlightLabel: 'Spinel reflections',
  highlightRole: 'primary'
}

// XPS Cu/Fe (multiple peaks)
{
  xValue: [933.8, 710.5],
  xUnit: 'eV',
  highlightLabel: 'Cu/Fe peaks',
  highlightRole: 'primary'
}

// FTIR M-O band
{
  xValue: 580,
  xUnit: 'cm⁻¹',
  highlightLabel: 'M-O stretch',
  highlightRole: 'primary'
}

// FTIR hydroxyl
{
  xValue: 3400,
  xUnit: 'cm⁻¹',
  highlightLabel: 'OH/H₂O',
  highlightRole: 'primary'
}

// FTIR carbonate (multiple bands)
{
  xValue: [1380, 1580],
  xUnit: 'cm⁻¹',
  highlightLabel: 'Carbonate',
  highlightRole: 'primary'
}
```

### 2. Graph Highlight Computation Logic

Added `getGraphHighlights(technique: Technique)` function that:

**Computes highlights based on**:
- Selected evidence (if technique matches)
- Linked evidence (from selected evidence's linkedEvidenceIds)
- All evidence for selected claim (if claim is selected)

**Returns `GraphHighlight[]` with**:
- `position: number` - X-axis position
- `intensity: number` - Visual intensity (100 for selected, 80 for linked, 70 for claim)
- `label?: string` - Label text (only for selected)
- `role: 'selected' | 'linked'` - Visual role

**Deduplication**: Prevents duplicate highlights at same position

### 3. Graph Component Enhancement

**Updated `PeakMarker` interface**:
```typescript
interface PeakMarker {
  position: number;
  intensity: number;
  label?: string;
  role?: 'selected' | 'linked';  // NEW
}
```

**Visual Styling by Role**:

| Role | Stroke Color | Stroke Width | Opacity | Label |
|------|-------------|--------------|---------|-------|
| **selected** | `#3b82f6` (blue) | 2.5px | 0.85 | Shown (bold, 9px) |
| **linked** | `#06b6d4` (cyan) | 2.0px | 0.6 | Hidden |
| default | `#a0a0a0` (gray) | 1.0px | 0.18 | Hidden |

**Rendering**: Vertical reference lines at specified x-positions with role-based styling

### 4. Matrix Cell Click Behavior

When clicking a matrix cell:
1. Sets `selectedClaimId` to the clicked claim
2. Sets `selectedEvidenceId` if evidence exists for that cell
3. Triggers `getGraphHighlights()` for all techniques
4. Graph highlights update across all technique panels

### 5. Evidence Click Behavior

When clicking an evidence item:
1. Sets `selectedEvidenceId` to the clicked evidence
2. Clears `selectedClaimId`
3. Triggers `getGraphHighlights()` for all techniques
4. Selected evidence highlighted in its technique graph
5. Linked evidence highlighted in their respective technique graphs

### 6. Hover Behavior

When hovering over evidence:
1. Sets `hoveredEvidenceId` (if no selection exists)
2. Triggers temporary graph highlights
3. Does not overwrite selected state
4. Highlights clear when hover ends

## Behavior Testing

### Test 1: Clicking Raman A1g Evidence

**Action**: Click "A₁g mode at ~690 cm⁻¹" in Raman panel

**Graph Highlights Appear**:

1. **Raman Graph** (selected evidence):
   - Vertical line at **690 cm⁻¹**
   - Color: **Blue** (#3b82f6)
   - Width: **2.5px**
   - Opacity: **0.85**
   - Label: **"A₁g spinel"** (shown above line)

2. **XRD Graph** (linked evidence):
   - Vertical lines at **30.1°, 35.5°, 43.2°, 57.1° (2θ)**
   - Color: **Cyan** (#06b6d4)
   - Width: **2.0px**
   - Opacity: **0.6**
   - Label: **None** (linked evidence doesn't show labels)

3. **FTIR Graph** (linked evidence):
   - Vertical line at **580 cm⁻¹**
   - Color: **Cyan** (#06b6d4)
   - Width: **2.0px**
   - Opacity: **0.6**
   - Label: **None**

4. **XPS Graph**:
   - No highlights (not linked to Raman A1g)

**Evidence Card Highlights**:
- Raman A1g: Primary color (border-primary bg-primary/10)
- XRD spinel: Cyan (linked)
- FTIR M-O band: Cyan (linked)

### Test 2: Clicking Raman Cell in Spinel Ferrite Assignment Row

**Action**: Click Raman column cell in "Spinel ferrite assignment" row in Evidence Matrix

**Graph Highlights Appear**:

1. **Raman Graph**:
   - Vertical line at **690 cm⁻¹** (Raman A1g evidence)
   - Color: **Blue** (#3b82f6)
   - Width: **2.5px**
   - Opacity: **0.85**
   - Label: **"A₁g spinel"**

2. **XRD Graph**:
   - Vertical lines at **30.1°, 35.5°, 43.2°, 57.1° (2θ)** (XRD spinel evidence)
   - Color: **Cyan** (#06b6d4)
   - Width: **2.0px**
   - Opacity: **0.6**
   - Label: **None**
   - Note: These are linked to the selected Raman A1g evidence

3. **FTIR Graph**:
   - Vertical line at **580 cm⁻¹** (FTIR M-O band evidence)
   - Color: **Cyan** (#06b6d4)
   - Width: **2.0px**
   - Opacity: **0.6**
   - Label: **None**
   - Note: This is linked to the selected Raman A1g evidence

4. **XPS Graph**:
   - No highlights (XPS evidence not part of spinel-ferrite claim's linked evidence)

**State Updates**:
- `selectedClaimId` = 'spinel-ferrite'
- `selectedEvidenceId` = 'raman-a1g'
- Matrix row highlighted
- Matrix cell highlighted with ring
- All evidence items for spinel-ferrite claim highlighted in their technique cards

**Behavior Difference from Test 1**:
- Same graph highlights (because clicking the matrix cell sets the same selectedEvidenceId)
- Additional UI state: matrix row and cell are highlighted
- Scientific Justification shows claim-level content instead of evidence-level content

## Visual Hierarchy

**Selected Evidence** (Primary):
- Strong blue vertical line (2.5px, 85% opacity)
- Label displayed above line
- Clearly indicates the user's focus

**Linked Evidence** (Supporting):
- Subtle cyan vertical lines (2.0px, 60% opacity)
- No labels (reduces visual clutter)
- Shows cross-technique corroboration

**No Animation**:
- Highlights appear instantly
- No fade-in or transition effects
- Maintains scientific precision

## Technical Notes

1. **Deduplication**: If multiple evidence items point to the same x-position, only one highlight is rendered
2. **Array Support**: Evidence can specify multiple x-values (e.g., XRD reflections, XPS peaks)
3. **Hover vs Selection**: Hover uses `hoveredEvidenceId` only when `selectedEvidenceId` is null
4. **Claim-Based Highlights**: When claim is selected, all evidence for that claim gets highlighted
5. **No Confidence Scores**: Implementation maintains research-grade wording with no AI terminology

## Summary

The implementation successfully adds **matrix-to-graph and evidence-to-graph highlight propagation**:

✅ Evidence items extended with graph target metadata (xValue, xUnit, highlightLabel)
✅ Graph highlights computed based on selected/linked/claim evidence
✅ Visual hierarchy: selected (blue, strong) vs linked (cyan, subtle)
✅ Matrix cell clicks propagate to graph highlights
✅ Evidence clicks propagate to graph highlights
✅ Hover shows temporary highlights without overwriting selection
✅ No animations (instant updates)
✅ No confidence scores or AI wording
✅ Build successful with no errors

The workspace now provides **visual evidence traceability** across technique graphs, making cross-technique reasoning more intuitive and scientifically rigorous.
