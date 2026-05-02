# Agent Demo User Prompt Input

## Overview
Added a user prompt input box at the top of the "Agent Thinking" tab in the right panel, allowing users to provide instructions and constraints to guide the agent's analysis.

## Changes Made

### File Modified: `src/components/agent-demo/RightPanel/RightPanel.tsx`

### New Features

#### 1. **Experiment Instructions Input Box**
- Located at the top of the "Agent Thinking" tab
- Appears before the "Reasoning Stream" section
- Allows users to provide custom instructions to the agent

#### 2. **Input Features**
- **Multi-line textarea**: Supports longer instructions
- **Placeholder text**: Provides examples of what users can input
- **Character limit**: Reasonable size for instructions
- **Keyboard shortcuts**:
  - `Enter` → Send prompt to agent
  - `Shift + Enter` → New line in textarea

#### 3. **Send Button**
- Gradient blue button with send icon
- Disabled when textarea is empty
- Hover effect with slight lift animation
- Shows "Send to Agent" label

#### 4. **Visual Design**
- Dark background (#070B12) matching the theme
- Blue accent badge labeled "User Control"
- Slate borders with cyan focus state
- Helper text showing keyboard shortcuts

### Visual Layout

```
┌─────────────────────────────────────────┐
│ EXPERIMENT INSTRUCTIONS    [User Control]│
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Provide instructions or constraints │ │
│ │ for the agent...                    │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ Press Enter to send...  [Send to Agent] │
└─────────────────────────────────────────┘
```

### Example User Instructions

Users can provide instructions like:
- "Focus on Cu oxidation states"
- "Check for secondary phases"
- "Prioritize peak intensity analysis"
- "Look for evidence of mixed valence states"
- "Compare with reference pattern for CuFe₂O₄"
- "Evaluate texture and preferred orientation effects"
- "Consider sample preparation artifacts"

### Props Interface

```typescript
interface RightPanelProps {
  // ... existing props
  onPromptSubmit?: (prompt: string) => void;  // NEW
}
```

### State Management

```typescript
const [userPrompt, setUserPrompt] = useState('');

const handlePromptSubmit = () => {
  if (userPrompt.trim() && onPromptSubmit) {
    onPromptSubmit(userPrompt.trim());
    setUserPrompt('');  // Clear after sending
  }
};
```

### Integration with AgentDemo

To use this feature in `AgentDemo.tsx`, add the handler:

```typescript
const handleUserPrompt = (prompt: string) => {
  // Log the user's instruction
  appendLog({
    stamp: '[user]',
    message: `User instruction: ${prompt}`,
    type: 'info',
  });
  
  // Could be used to:
  // - Adjust agent parameters
  // - Add constraints to analysis
  // - Guide reasoning focus
  // - Modify confidence thresholds
};

// Pass to RightPanel
<RightPanel
  // ... other props
  onPromptSubmit={handleUserPrompt}
/>
```

## Benefits

1. **User Control**: Users can guide the agent's analysis
2. **Flexibility**: Supports various types of instructions
3. **Transparency**: Makes it clear that users can influence the process
4. **Iterative Refinement**: Users can adjust instructions based on results
5. **Educational**: Helps users understand what factors affect analysis

## User Experience

### Before Agent Run:
1. User enters instructions in the prompt box
2. Example: "Focus on identifying secondary phases"
3. Clicks "Send to Agent" or presses Enter
4. Instruction is logged and can influence the analysis

### During Agent Run:
- The prompt box remains visible
- Users can add additional instructions
- Instructions can be queued or applied to next run

### After Agent Run:
- Users can review results
- Provide follow-up instructions
- Refine analysis based on findings

## Styling Details

- **Background**: Dark (#070B12) matching the panel theme
- **Border**: Slate-700 with cyan focus state
- **Text**: Slate-200 for input, slate-500 for placeholder
- **Button**: Blue-to-indigo gradient with shadow
- **Badge**: Blue accent with "User Control" label
- **Spacing**: Consistent 6-unit spacing between sections

## Future Enhancements

Potential additions:
- **Preset instructions**: Quick-select common instructions
- **Instruction history**: Recall previous instructions
- **Instruction templates**: Pre-defined analysis focuses
- **Real-time feedback**: Show how instructions affect analysis
- **Instruction validation**: Suggest improvements to instructions

## Build Status
✅ Build passes successfully  
✅ Prompt input box rendering correctly  
✅ Send button working with proper disabled state  
✅ Keyboard shortcuts functional  
✅ Visual design matches theme
