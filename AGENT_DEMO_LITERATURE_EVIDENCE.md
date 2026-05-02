# Agent Demo Literature Evidence Section

## Overview
Implemented a Literature Evidence section in the Evidence tab that uses Gemini-assisted paper search with mock data and provider-ready architecture for future integration with scholarly databases.

## Changes Made

### Files Modified

#### 1. `src/pages/AgentDemo.tsx`
**Change**: Added `projectName` prop to RightPanel
```typescript
<RightPanel
  technique={agentState.context}
  projectName={selectedProject.name}  // NEW
  currentStep={...}
  totalSteps={...}
  candidates={...}
/>
```

#### 2. `src/components/agent-demo/RightPanel/RightPanel.tsx`

**Changes**:
1. Added type definitions for Literature Evidence
2. Added `getLiteratureEvidence(technique, projectName)` function
3. Added `projectName?: string` prop to interface
4. Implemented Literature Evidence section in Evidence tab

## Architecture

### Type Definitions

```typescript
type LiteratureProvider = 'google_scholar_proxy' | 'semantic_scholar' | 'crossref' | 'mock';

interface LiteraturePaper {
  title: string;
  authors: string;
  year: string;
  source: string;
  relevance: string;
  whyItMatters: string;
  externalLink?: string;
}

interface LiteratureEvidence {
  query: string;
  provider: LiteratureProvider;
  papers: LiteraturePaper[];
  geminiSummary: string;
}
```

### Provider Abstraction

Current provider: **mock**

Supported providers (ready for future integration):
- `google_scholar_proxy` - Backend proxy for Google Scholar
- `semantic_scholar` - Semantic Scholar API
- `crossref` - CrossRef API
- `mock` - Mock data for development

## Generated Queries by Material

### CuFe₂O₄ Spinel
```
CuFe2O4 spinel ferrite XRD Raman XPS catalytic activity
```

### CuFe₂O₄/SBA-15
```
CuFe2O4 SBA-15 supported spinel ferrite mesoporous silica catalysis XRD XPS
```

### NiFe₂O₄
```
NiFe2O4 spinel ferrite XRD Raman magnetic catalytic properties
```

### CoFe₂O₄
```
CoFe2O4 spinel ferrite XRD Raman magnetic anisotropy catalysis
```

### Fe₃O₄
```
Fe3O4 magnetite XRD Raman XPS Fe2+ Fe3+ oxidation
```

## Mock Paper Examples

### CuFe₂O₄ Papers

1. **Copper ferrite spinel nanostructures for catalytic and magnetic applications**
   - Authors: Liu, X., Zhang, M., Wang, Q.
   - Year: 2023
   - Source: Advanced Materials
   - Relevance: High
   - Why it matters: Supports the interpretation that CuFe₂O₄ spinel structure is associated with redox-active ferrite behavior

2. **Phase identification and structural characterization of copper ferrite by XRD and Raman spectroscopy**
   - Authors: Chen, Y., Li, W.
   - Year: 2022
   - Source: Journal of Solid State Chemistry
   - Relevance: High
   - Why it matters: Provides reference diffraction patterns and Raman modes consistent with current observations

3. **Surface chemistry of CuFe₂O₄: XPS investigation of oxidation states**
   - Authors: Anderson, K., Brown, T.
   - Year: 2021
   - Source: Surface Science
   - Relevance: Moderate
   - Why it matters: Validates expected Cu and Fe oxidation states in spinel structure

## UI Structure

### Literature Evidence Section

Located in Evidence tab, after Limitations section:

```
┌─────────────────────────────────────────┐
│ LITERATURE EVIDENCE                     │
├─────────────────────────────────────────┤
│ Provider: Google Scholar compatible     │
│                                         │
│ Generated Query:                        │
│ ┌─────────────────────────────────────┐ │
│ │ CuFe2O4 spinel ferrite XRD Raman... │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Note: Google Scholar access requires    │
│ backend proxy or third-party API        │
├─────────────────────────────────────────┤
│ Related Papers:                         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Paper Title                         │ │
│ │ Authors (Year)                      │ │
│ │ Source                              │ │
│ │ Relevance: [High]                   │ │
│ │ Why it matters: ...                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [More papers...]                        │
├─────────────────────────────────────────┤
│ Gemini Literature Interpretation        │
│ [Source: Gemini]                        │
│                                         │
│ The retrieved literature supports...    │
└─────────────────────────────────────────┘
```

### Visual Design

#### Provider & Query Card
- Background: `bg-slate-800/30`
- Border: `border-slate-700`
- Query display: Monospace font in dark box
- Note: Small gray text about backend requirement

#### Paper Cards
- Background: `bg-slate-800/30`
- Border: `border-slate-700`
- Title: `text-sm font-semibold text-slate-200`
- Authors/Year: `text-xs text-slate-400`
- Source: `text-xs text-slate-500`
- Relevance Badge:
  - High: `bg-emerald-400/10 border-emerald-400/30 text-emerald-300`
  - Moderate: `bg-amber-400/10 border-amber-400/30 text-amber-300`
- Why it matters: `text-[11px] text-slate-400`

#### Gemini Summary
- Background: `bg-purple-500/5`
- Border: `border-purple-500/20`
- Badge: `bg-purple-500/10 text-purple-400` (Source: Gemini)
- Text: `text-xs text-slate-400`

### Styling Rules

✅ Matches existing dark Evidence tab style  
✅ No glow effects  
✅ No neon colors  
✅ Compact scientific cards  
✅ Purple used subtly only for Gemini-generated content  
✅ Consistent spacing and typography  

## Adaptive Behavior

The Literature Evidence section adapts based on:
1. **Current Material**: Detected from project name
2. **Technique**: XRD, FTIR, Raman, XPS
3. **Query Generation**: Combines material + technique + application keywords

### Example Adaptations

| Material | Query Focus | Paper Count |
|----------|-------------|-------------|
| CuFe₂O₄ | Spinel + catalytic + XRD/Raman/XPS | 3 papers |
| CuFe₂O₄/SBA-15 | Supported + mesoporous + catalysis | 2 papers |
| NiFe₂O₄ | Magnetic + catalytic properties | 2 papers |
| CoFe₂O₄ | Magnetic anisotropy + catalysis | 2 papers |
| Fe₃O₄ | Magnetite + oxidation states | 2 papers |

## Future Integration

### Backend Proxy Setup

To integrate real Google Scholar data:

1. **Create backend endpoint**: `/api/literature/search`
2. **Use proxy service**: SerpAPI, ScraperAPI, or custom proxy
3. **Update provider**: Change from `mock` to `google_scholar_proxy`
4. **Add API call**:
```typescript
async function fetchLiterature(query: string) {
  const response = await fetch('/api/literature/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
  return response.json();
}
```

### Alternative APIs

- **Semantic Scholar**: Free API, no proxy needed
- **CrossRef**: Free API for DOI-based search
- **OpenAlex**: Open scholarly data

## Benefits

1. **Provider-Ready**: Architecture supports multiple scholarly databases
2. **Safe**: No direct frontend scraping of Google Scholar
3. **Adaptive**: Content changes based on material and technique
4. **Educational**: Shows how literature supports scientific decisions
5. **Professional**: Clean, compact scientific presentation
6. **Gemini Integration**: Shows AI-assisted literature interpretation

## What Was NOT Changed

✅ Graph rendering  
✅ Dataset loading  
✅ Routing  
✅ Agent execution logic  
✅ Existing handlers  
✅ Component structure  

## Build Status
✅ Build passes successfully  
✅ Literature Evidence section renders in Evidence tab  
✅ Adaptive queries based on material  
✅ Mock papers display correctly  
✅ Gemini summary shows with purple styling  
✅ Provider abstraction ready for future integration
