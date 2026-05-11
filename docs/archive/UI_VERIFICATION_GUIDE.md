# UI Verification Guide - Model Mode Selector

## ✅ What You Should See Now

After refreshing the page at `http://localhost:5173/demo/agent`, you should see:

### Top Control Bar (4 Selectors)

```
┌─────────────┬─────────────┬──────────────────┬─────────────┐
│  Context    │  Dataset    │ Reasoning Mode   │ Execution   │
├─────────────┼─────────────┼──────────────────┼─────────────┤
│ XRD Phase   │ CuFe2O4...  │ Deterministic ▼  │ Auto | Step │
│ Identif...  │             │                  │             │
└─────────────┴─────────────┴──────────────────┴─────────────┘
```

### Reasoning Mode Dropdown Options

When you click the "Reasoning Mode" dropdown, you should see:

```
┌──────────────────────────┐
│ Deterministic            │ ← Currently selected
│ Gemini Reasoning         │ ← NEW OPTION
│ Gemma Open Model         │ ← NEW OPTION
└──────────────────────────┘
```

## 🧪 Testing Steps

### 1. Verify Selector Appears
- [ ] Open `http://localhost:5173/demo/agent`
- [ ] Look for 4 dropdowns in the top control bar
- [ ] Third dropdown should say "Reasoning Mode"

### 2. Test Gemini Mode
- [ ] Click "Reasoning Mode" dropdown
- [ ] Select "Gemini Reasoning"
- [ ] Top bar should update to show "Reasoning Mode: Gemini Reasoning"
- [ ] Click "Run Agent"
- [ ] Watch for LLM reasoning step in tool trace (coming in next update)

### 3. Test Gemma Mode
- [ ] Click "Reasoning Mode" dropdown
- [ ] Select "Gemma Open Model"
- [ ] Top bar should update to show "Reasoning Mode: Gemma Open Model"
- [ ] Click "Run Agent"
- [ ] Watch for LLM reasoning step in tool trace (coming in next update)

### 4. Test Mode Switching
- [ ] Switch from Deterministic to Gemini
- [ ] Verify no errors in console
- [ ] Switch from Gemini to Gemma
- [ ] Verify no errors in console
- [ ] Switch back to Deterministic
- [ ] Verify no errors in console

## 🔍 What's Missing (Next Steps)

The selector is now visible, but the LLM reasoning logic hasn't been integrated yet. You'll see:

- ✅ Model mode selector (DONE)
- ❌ LLM reasoning step in tool trace (NEXT)
- ❌ LLM output in decision card (NEXT)
- ❌ AI-Assisted badge (NEXT)

## 📸 Expected UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ DIFARYX | Agent Demo | Context: Scientific Reasoning       │
│ Mode: Autonomous Agent | Reasoning Mode: Deterministic Demo │
│                                          [Ready] [Run Agent] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────┬─────────┬────────────────┬──────────┐          │
│ │ Context │ Dataset │ Reasoning Mode │Execution │          │
│ │ XRD ▼   │ CuFe▼   │ Deterministic▼ │Auto|Step │          │
│ └─────────┴─────────┴────────────────┴──────────┘          │
│                                                               │
│ [Step Flow Progress Bar]                                     │
│                                                               │
│ [XRD Graph]                                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🐛 Troubleshooting

### Selector Not Appearing
1. **Clear browser cache:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check dev server is running:** `npm run dev`
3. **Verify build passed:** `npm run build` should show Exit Code: 0
4. **Check console for errors:** F12 → Console tab

### Dropdown Shows Old Options
1. **Hard refresh:** Ctrl+F5 or Cmd+Shift+R
2. **Clear localStorage:** F12 → Application → Local Storage → Clear All
3. **Restart dev server:** Stop and run `npm run dev` again

### Mode Change Doesn't Work
1. **Check console for errors:** F12 → Console tab
2. **Verify state updates:** Look for state changes in React DevTools
3. **Try different browser:** Test in Chrome/Firefox/Edge

## ✅ Success Criteria

You'll know it's working when:
1. ✅ You see 4 dropdowns in the control bar
2. ✅ Third dropdown is labeled "Reasoning Mode"
3. ✅ Dropdown has 3 options: Deterministic, Gemini Reasoning, Gemma Open Model
4. ✅ Selecting an option updates the top bar label
5. ✅ No errors in console when switching modes
6. ✅ Build passes without errors

## 📞 Next Steps

Once you confirm the selector is visible and working:
1. I'll integrate the LLM reasoning execution logic
2. Add the LLM step to the tool trace
3. Display LLM output in the decision card
4. Add the "AI-Assisted" badge

For now, just verify you can see and interact with the "Reasoning Mode" selector!
