# Agent Demo Expandable Data Section

## Overview
Enhanced the left sidebar navigation with an expandable "Data" section that shows links to all available techniques (XRD, XPS, FTIR, Raman) for the current project.

## Changes Made

### File Modified: `src/components/agent-demo/LeftSidebar/LeftSidebar.tsx`

### New Features

#### 1. **Expandable Data Section**
- The "Data" nav item is now expandable/collapsible
- Click to toggle between expanded and collapsed states
- Shows chevron icon (down when expanded, right when collapsed)
- Starts expanded by default

#### 2. **Technique Sub-Links**
- Displays all techniques available for the current project
- Each technique links to its specific workspace
- Current technique is highlighted in cyan
- Other techniques are shown in gray

#### 3. **Visual Hierarchy**
```
Data ▼
├─ XRD      (highlighted if current)
├─ XPS
├─ FTIR
└─ Raman
```

### Route Mapping

Each technique links to its workspace:
- **XRD** → `/workspace/xrd?project={projectId}`
- **XPS** → `/workspace/xps?project={projectId}`
- **FTIR** → `/workspace/ftir?project={projectId}`
- **Raman** → `/workspace/raman?project={projectId}`

### Example for CuFe₂O₄/SBA-15 Project

This project has all 4 techniques, so the Data section shows:

```
Data ▼
├─ XRD   → /workspace/xrd?project=cufe2o4-sba15
├─ XPS   → /workspace/xps?project=cufe2o4-sba15
├─ FTIR  → /workspace/ftir?project=cufe2o4-sba15
└─ Raman → /workspace/raman?project=cufe2o4-sba15
```

### Example for CuFe₂O₄ Spinel Project

This project has XRD, XPS, FTIR (3 techniques):

```
Data ▼
├─ XRD   → /workspace/xrd?project=cu-fe2o4-spinel
├─ XPS   → /workspace/xps?project=cu-fe2o4-spinel
└─ FTIR  → /workspace/ftir?project=cu-fe2o4-spinel
```

### Visual Design

#### Collapsed State:
```
┌─────────────────────────┐
│ 📊 Data              ▶  │
└─────────────────────────┘
```

#### Expanded State:
```
┌─────────────────────────┐
│ 📊 Data              ▼  │
│   │                     │
│   ├─ • XRD   (cyan)     │
│   ├─ • XPS             │
│   ├─ • FTIR            │
│   └─ • Raman           │
└─────────────────────────┘
```

### Styling Details

- **Expanded/Collapsed Button**: Hover effect with slate background
- **Technique Links**: 
  - Current technique: Cyan background with cyan text
  - Other techniques: Gray text with hover effect
  - Small dot indicator before each technique name
  - Indented with left border for visual hierarchy

### State Management

```typescript
const [dataExpanded, setDataExpanded] = useState(true);
```

- Uses React state to track expanded/collapsed state
- Starts expanded by default for better discoverability
- Persists during the session (resets on page reload)

## Benefits

1. **Complete Technique Access**: Users can quickly navigate to any technique workspace
2. **Context Awareness**: Only shows techniques available for the current project
3. **Visual Feedback**: Current technique is clearly highlighted
4. **Space Efficient**: Collapsible design saves space when not needed
5. **Intuitive UX**: Familiar expand/collapse pattern

## User Experience

When viewing the Agent Demo for "CuFe₂O₄/SBA-15":
1. See "Data" section with chevron down (expanded)
2. See all 4 techniques listed (XRD, XPS, FTIR, Raman)
3. Current technique (e.g., XRD) is highlighted in cyan
4. Click any technique to navigate to that workspace
5. Click "Data" header to collapse/expand the section

## Build Status
✅ Build passes successfully  
✅ Expandable section working  
✅ All technique links properly constructed  
✅ Current technique highlighting working
