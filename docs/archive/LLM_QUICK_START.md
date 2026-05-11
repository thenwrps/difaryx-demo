# DIFARYX LLM Integration - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### 1. Current Status
✅ **LLM integration is COMPLETE and WORKING**
✅ **Demo mode is ACTIVE** (no backend required)
✅ **Build is PASSING**

### 2. Try It Now

```bash
# Start development server
npm run dev

# Open browser
http://localhost:5173/demo/agent
```

### 3. Test LLM Reasoning

1. **Select Reasoning Mode:**
   - Click the "Reasoning Mode" dropdown
   - Choose "Gemini Reasoning" or "Gemma Open Model"

2. **Select Context:**
   - Choose XRD, XPS, FTIR, or Raman

3. **Run Agent:**
   - Click "Run Agent" button
   - Watch the execution flow

4. **Observe LLM Step:**
   - Tool trace shows `llm_reasoning` step
   - Status updates: pending → running → complete
   - Badge shows "AI-Assisted: Gemini" or "AI-Assisted: Gemma"

5. **View Results:**
   - Decision card shows LLM reasoning output
   - Evidence summary with specific bullets
   - Rejected alternatives with reasons
   - Decision logic explanation
   - Uncertainty factors
   - Recommended next step

### 4. Compare Modes

**Deterministic Mode:**
- Uses only deterministic tools
- No LLM reasoning step
- Fast execution (~3-4 seconds)
- Predictable results

**Gemini Mode:**
- Adds LLM reasoning after evidence fusion
- Simulated Gemini API call (~1.2 seconds)
- AI-assisted decision making
- More nuanced reasoning

**Gemma Mode:**
- Adds LLM reasoning after evidence fusion
- Simulated Gemma local model (~0.8 seconds)
- Open-source AI reasoning
- Faster than Gemini

---

## 📊 What You'll See

### Tool Trace (Gemini Mode)
```
1. ✓ Load Dataset (complete)
2. ✓ Peak Detection (complete)
3. ✓ Candidate Search (complete)
4. ✓ Score Candidates (complete)
5. ✓ Evidence Fusion (complete)
6. ⟳ LLM Reasoning (running) ← NEW STEP
   Provider: gemini
   Model: gemini-2.0-flash-exp
7. ✓ Make Decision (complete)
```

### Decision Card (LLM Output)
```
Primary Result: CuFe₂O₄ (Spinel)
Confidence: 93% (High confidence)

Evidence Summary:
• 9 XRD features detected and analyzed
• Top candidate shows 8/9 feature matches
• Fused evidence score: 93.0%
• Strong agreement across multiple evidence dimensions

Rejected Alternatives:
• Fe₃O₄ rejected: lower match score (72% vs 93%)
• Fe₃O₄: missing critical features (35.4°)
• CuO: insufficient match score (65%)

Decision Logic:
Selected CuFe₂O₄ based on highest feature match score (93.0%) 
and strongest agreement with detected XRD features. The candidate 
shows 8 matched features out of 9 expected, with 1 missing features. 
1 unexplained features suggest possible impurities or secondary phases. 
The fused evidence score of 93.0% strongly supports this conclusion.

Uncertainty:
• Missing expected features: 62.3°
• Unexplained features present: 40.2°

Recommended Next Step:
Validate with complementary techniques (XPS for surface chemistry, 
Raman for structural confirmation)
```

### Status Badge
```
[Complete] [AI-Assisted: Gemini]
```

---

## 🔧 Configuration

### Demo Mode (Current)
- **Location:** `src/services/llmIntegration.ts`
- **Setting:** `useMock = true`
- **Behavior:** Simulates LLM calls, no API required
- **Perfect for:** Demos, testing, development

### Production Mode (Requires Backend)
- **Location:** `src/services/llmIntegration.ts`
- **Setting:** `useMock = false`
- **Requires:** Backend API at `/api/llm/reason`
- **Environment Variables:**
  - `GEMINI_API_KEY` for Gemini
  - `GEMMA_ENDPOINT` for Gemma

---

## 🎯 Key Features

### 1. Safety First
- ✅ LLM receives ONLY structured evidence
- ✅ LLM cannot invent data or measurements
- ✅ Output validation prevents hallucination
- ✅ Automatic fallback on error

### 2. Transparency
- ✅ Clear indication when LLM is used
- ✅ Provider and model shown in tool trace
- ✅ Status updates in real-time
- ✅ Error messages are user-friendly

### 3. Flexibility
- ✅ Switch modes anytime
- ✅ No breaking changes
- ✅ Deterministic mode still works
- ✅ Easy to extend

---

## 🧪 Testing Checklist

### Basic Tests
- [ ] Select "Gemini Reasoning" mode
- [ ] Run agent
- [ ] Verify LLM step appears in tool trace
- [ ] Verify decision card shows LLM output
- [ ] Verify "AI-Assisted: Gemini" badge appears

### Mode Switching
- [ ] Switch from Deterministic to Gemini
- [ ] Verify tool trace updates (adds LLM step)
- [ ] Switch from Gemini to Gemma
- [ ] Verify provider changes in tool trace
- [ ] Switch back to Deterministic
- [ ] Verify LLM step disappears

### Context Switching
- [ ] Select XRD context with Gemini mode
- [ ] Run agent, verify LLM reasoning
- [ ] Switch to XPS context
- [ ] Run agent, verify LLM reasoning adapts
- [ ] Repeat for FTIR and Raman

### Error Handling
- [ ] Simulate LLM error (modify mockLLMReasoning)
- [ ] Verify fallback to deterministic reasoning
- [ ] Verify error badge appears
- [ ] Verify no crash or blank state

---

## 📚 Documentation

### For Developers
- **`LLM_INTEGRATION_GUIDE.md`** - Complete integration guide
- **`LLM_INTEGRATION_COMPLETE.md`** - Implementation summary
- **`src/types/llm.ts`** - Type definitions
- **`src/services/llmPrompt.ts`** - Prompt engineering
- **`src/services/llmProvider.ts`** - Provider integration
- **`src/services/evidencePacket.ts`** - Evidence formatting
- **`src/services/llmIntegration.ts`** - Integration helpers

### For Users
- Model selector with clear labels
- Status indicators show LLM activity
- Tool trace shows execution flow
- Decision card shows reasoning output

---

## 🚨 Troubleshooting

### LLM Step Not Appearing
- **Check:** Model mode is set to "Gemini" or "Gemma"
- **Check:** Tool trace has been regenerated after mode change
- **Fix:** Switch to Deterministic and back to Gemini/Gemma

### Error Badge Showing
- **Cause:** LLM reasoning failed (expected in demo mode if modified)
- **Behavior:** Automatic fallback to deterministic reasoning
- **Fix:** Check console for error details

### Build Errors
- **Check:** All new files are in correct locations
- **Check:** Import paths are correct
- **Fix:** Run `npm run build` and check error messages

---

## 🎉 Success Criteria

You'll know it's working when:
1. ✅ Model selector shows 3 options (Deterministic/Gemini/Gemma)
2. ✅ Tool trace shows `llm_reasoning` step in Gemini/Gemma mode
3. ✅ Status badge shows "AI-Assisted: Gemini/Gemma" when complete
4. ✅ Decision card shows LLM reasoning output
5. ✅ No errors in console
6. ✅ Build passes without warnings

---

## 📞 Support

### Questions?
- Check `LLM_INTEGRATION_GUIDE.md` for detailed instructions
- Review `LLM_INTEGRATION_COMPLETE.md` for implementation details
- Inspect source files for inline documentation

### Issues?
- Verify build passes: `npm run build`
- Check console for errors: `npm run dev`
- Review `src/services/llmIntegration.ts` for configuration

---

## 🎯 Next Steps

### Immediate
1. ✅ Test demo mode (current)
2. ✅ Verify all contexts work (XRD/XPS/FTIR/Raman)
3. ✅ Compare Deterministic vs Gemini vs Gemma

### Short Term
1. Deploy backend API for production mode
2. Set up Gemini API key
3. Configure Gemma endpoint
4. Switch `useMock` to `false`

### Long Term
1. Add more LLM providers (Claude, GPT-4)
2. Implement custom prompts
3. Add confidence calibration
4. Enable multi-step reasoning

---

*Quick Start Guide - DIFARYX LLM Integration*

*Ready to use in 5 minutes!*
