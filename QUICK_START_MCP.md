# DIFARYX MCP Integration - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Test Deterministic Mode
1. Open http://localhost:5173
2. Navigate to `/demo/agent`
3. Select "Deterministic" from Reasoning Mode dropdown
4. Click "Run Agent"
5. ✅ Should complete successfully

### 4. Test Gemma Mode (Optional)

#### Install Ollama
```bash
# macOS/Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai
```

#### Pull Gemma Model
```bash
ollama pull gemma-2-9b-it
```

#### Configure Environment
```bash
# Create .env file
cp .env.example .env

# Edit .env (Ollama runs on localhost:11434 by default)
GEMMA_ENDPOINT=http://localhost:11434/api/generate
GEMMA_MODEL=gemma-2-9b-it
```

#### Test Gemma
1. Ensure Ollama is running: `ollama list`
2. Select "Gemma Open Model" from Reasoning Mode dropdown
3. Click "Run Agent"
4. ✅ Should show "AI-Assisted" badge when complete

### 5. Test Vertex AI Mode (Requires GCP)

#### Prerequisites
- Google Cloud Project with billing enabled
- Vertex AI API enabled
- Service account with `roles/aiplatform.user`

#### Install Vertex AI SDK
```bash
npm install @google-cloud/vertexai
```

#### Uncomment Production Code
Edit `src/server/llm/vertexGemini.ts`:
1. Remove the demo error throw (line ~120)
2. Uncomment the Vertex AI import and implementation (lines ~90-115)

#### Configure Environment
```bash
# Edit .env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true
```

#### Authenticate
```bash
gcloud auth application-default login
```

#### Test Vertex AI
1. Select "Vertex AI Gemini" from Reasoning Mode dropdown
2. Click "Run Agent"
3. ✅ Should show "AI-Assisted" badge when complete

## 🎯 What to Look For

### Deterministic Mode
- ✅ No "AI-Assisted" badge
- ✅ Traditional reasoning in decision card
- ✅ Provider shows "Deterministic" in metrics

### Gemma Mode (Success)
- ✅ "AI-Assisted" badge appears
- ✅ LLM reasoning in execution log
- ✅ Provider shows "Gemma" in metrics
- ✅ Subtitle shows "AI-Assisted Reasoning"

### Gemma Mode (Fallback)
- ⚠️ No "AI-Assisted" badge
- ⚠️ Log shows "LLM provider unavailable, using deterministic fallback"
- ✅ Still produces valid result

### Vertex AI Mode (Success)
- ✅ "AI-Assisted" badge appears
- ✅ LLM reasoning in execution log
- ✅ Provider shows "Vertex AI" in metrics
- ✅ Subtitle shows "AI-Assisted Reasoning"

### Vertex AI Mode (Fallback)
- ⚠️ No "AI-Assisted" badge
- ⚠️ Log shows "LLM provider unavailable, using deterministic fallback"
- ✅ Still produces valid result

## 🔍 Debugging

### Check Provider Status
Open browser console and run:
```javascript
// Check if Gemma is configured
console.log('GEMMA_ENDPOINT:', import.meta.env.GEMMA_ENDPOINT);

// Check if Vertex AI is configured
console.log('GOOGLE_CLOUD_PROJECT:', import.meta.env.GOOGLE_CLOUD_PROJECT);
```

### Check Ollama
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check if Gemma is installed
ollama list

# Test Gemma directly
curl http://localhost:11434/api/generate -d '{
  "model": "gemma-2-9b-it",
  "prompt": "Hello",
  "stream": false
}'
```

### Check Vertex AI
```bash
# Check authentication
gcloud auth application-default print-access-token

# Check Vertex AI API
gcloud services list --enabled | grep aiplatform

# Test Vertex AI access
gcloud ai models list --region=us-central1
```

## 📊 Evidence Packet Inspection

To see the evidence packet sent to LLM:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run agent with Gemma or Vertex AI mode
4. Look for evidence packet in console logs

Example packet structure:
```json
{
  "context": "xrd",
  "datasetId": "xrd-001",
  "signalSummary": {
    "featureCount": 9,
    "signalQuality": "high"
  },
  "detectedFeatures": [
    { "position": 35.5, "intensity": 100, "assignment": "CuFe2O4 (311)" }
  ],
  "candidates": [
    {
      "label": "CuFe2O4 (Copper Ferrite)",
      "score": 0.92,
      "matchedFeatures": 8,
      "totalFeatures": 9
    }
  ],
  "fusedScore": 0.92,
  "uncertaintyFlags": [],
  "processingNotes": [
    "Deterministic peak detection via prominence analysis"
  ]
}
```

## 🚨 Common Issues

### Issue: "LLM provider unavailable"
**Solution**: Check that Ollama is running or Vertex AI is configured

### Issue: "GEMMA_ENDPOINT not set"
**Solution**: Create `.env` file with `GEMMA_ENDPOINT=http://localhost:11434/api/generate`

### Issue: "GOOGLE_CLOUD_PROJECT not set"
**Solution**: Create `.env` file with your GCP project ID

### Issue: Ollama connection refused
**Solution**: Start Ollama: `ollama serve` (or restart Ollama app)

### Issue: Vertex AI 403 Forbidden
**Solution**: Check service account has `roles/aiplatform.user` role

### Issue: Build fails
**Solution**: 
```bash
rm -rf node_modules dist
npm install
npm run build
```

## 📝 Testing Checklist

- [ ] Deterministic mode works
- [ ] Gemma mode works (with Ollama)
- [ ] Gemma fallback works (without Ollama)
- [ ] Vertex AI mode works (with GCP)
- [ ] Vertex AI fallback works (without GCP)
- [ ] "AI-Assisted" badge appears correctly
- [ ] Execution logs show LLM steps
- [ ] Decision card shows provider
- [ ] Build passes: `npm run build`

## 🎓 Next Steps

1. **Read Full Documentation**:
   - `DEPLOYMENT.md` - Cloud Run deployment
   - `MCP_INTEGRATION_COMPLETE.md` - Implementation details
   - `AGENTS.md` - Project context

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy difaryx-agent-demo \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "GOOGLE_CLOUD_PROJECT=your-project-id"
   ```

3. **Test All Modes in Production**:
   - Deterministic (always works)
   - Vertex AI (with GCP credentials)
   - Gemma (with hosted endpoint)

## 💡 Tips

- **Start with Deterministic**: Always test deterministic mode first
- **Use Gemma Locally**: Easiest to test with Ollama
- **Vertex AI for Production**: Best for deployed demos
- **Check Logs**: Execution logs show exactly what happened
- **Fallback is Good**: System always produces a result

## 🎉 Success!

If you see the "AI-Assisted" badge and LLM reasoning in logs, you're ready for the hackathon! 🚀

---

**Questions?** Check `DEPLOYMENT.md` for troubleshooting or review the implementation in `MCP_INTEGRATION_COMPLETE.md`.
