# DIFARYX Agent Demo - Deployment Guide

## Overview

This guide covers deploying DIFARYX Agent Demo to Google Cloud Run for the Google Cloud Rapid Agent Hackathon. The deployment includes:

- **Frontend**: React SPA with deterministic scientific tools
- **Backend**: Server-side LLM reasoning with Vertex AI Gemini and Gemma support
- **MCP-Style Tool Integration**: Structured tool calling and evidence packets

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DIFARYX Agent Demo                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React SPA)                                        │
│  ├─ Deterministic Tools (baseline, feature detection, etc.) │
│  ├─ Evidence Packet Builder                                 │
│  └─ Reasoning API Client                                    │
├─────────────────────────────────────────────────────────────┤
│  Backend (Cloud Run)                                         │
│  ├─ Reasoning API Endpoint                                  │
│  ├─ Provider Router                                         │
│  │   ├─ Deterministic (fallback)                           │
│  │   ├─ Vertex AI Gemini                                   │
│  │   └─ Gemma (Ollama or hosted)                           │
│  └─ Tool Registry (MCP-style)                               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Google Cloud Project**
   - Active GCP project with billing enabled
   - Vertex AI API enabled
   - Cloud Run API enabled
   - Cloud Build API enabled (for deployment)

2. **Local Development Tools**
   - Node.js 18+ and npm
   - Google Cloud SDK (`gcloud` CLI)
   - Docker (optional, for local testing)

3. **Service Account**
   - Create a service account for Cloud Run
   - Grant required IAM roles (see below)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required for Vertex AI Gemini
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true

# Optional: Gemma endpoint
GEMMA_ENDPOINT=http://localhost:11434/api/generate
GEMMA_MODEL=gemma-2-9b-it
```

## IAM Roles and Permissions

Your Cloud Run service account needs:

```bash
# Vertex AI access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Cloud Logging (recommended)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"
```

## Build Commands

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Output will be in ./dist directory
```

## Cloud Run Deployment

### Option 1: Deploy from Source (Recommended)

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Deploy to Cloud Run
gcloud run deploy difaryx-agent-demo \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,GOOGLE_CLOUD_LOCATION=us-central1,GOOGLE_GENAI_USE_VERTEXAI=true"
```

### Option 2: Deploy from Container

1. **Create Dockerfile** (if not exists):

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

2. **Build and push container**:

```bash
# Build container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/difaryx-agent-demo

# Deploy container
gcloud run deploy difaryx-agent-demo \
  --image gcr.io/YOUR_PROJECT_ID/difaryx-agent-demo \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account YOUR_SERVICE_ACCOUNT@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,GOOGLE_CLOUD_LOCATION=us-central1,GOOGLE_GENAI_USE_VERTEXAI=true"
```

### Option 3: Deploy with Cloud Build

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/difaryx-agent-demo', '.']
  
  # Push the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/difaryx-agent-demo']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'difaryx-agent-demo'
      - '--image'
      - 'gcr.io/$PROJECT_ID/difaryx-agent-demo'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/difaryx-agent-demo'
```

Deploy:

```bash
gcloud builds submit --config cloudbuild.yaml
```

## Vertex AI Setup

### Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com
```

### Test Vertex AI Access

```bash
# Test with gcloud
gcloud ai models list --region=us-central1
```

### Install Vertex AI SDK (for server-side code)

```bash
npm install @google-cloud/vertexai
```

## Gemma Setup (Optional)

### Local Ollama

```bash
# Install Ollama: https://ollama.ai

# Pull Gemma model
ollama pull gemma-2-9b-it

# Ollama runs on http://localhost:11434 by default
```

### Hosted Gemma

Set `GEMMA_ENDPOINT` to your hosted endpoint URL.

## Verification

After deployment, verify:

1. **Frontend loads**: Visit your Cloud Run URL
2. **Deterministic mode works**: Run agent with "Deterministic" mode
3. **Vertex AI works**: Run agent with "Vertex AI Gemini" mode
4. **Fallback works**: Disable Vertex AI and verify deterministic fallback

## Monitoring

### Cloud Logging

```bash
# View logs
gcloud run services logs read difaryx-agent-demo --region us-central1

# Follow logs
gcloud run services logs tail difaryx-agent-demo --region us-central1
```

### Cloud Monitoring

Set up alerts for:
- High error rates
- Vertex AI quota limits
- Response latency

## Cost Optimization

1. **Vertex AI**: Use `gemini-2.0-flash-exp` for lower cost
2. **Cloud Run**: Set min instances to 0 for demo
3. **Gemma**: Use local Ollama for development

## Troubleshooting

### Vertex AI 403 Errors

- Check service account has `roles/aiplatform.user`
- Verify Vertex AI API is enabled
- Check project ID is correct

### Vertex AI 404 Errors

- Verify model name is correct (`gemini-2.0-flash-exp`)
- Check region is supported (use `us-central1`)

### Gemma Connection Errors

- Verify Ollama is running: `curl http://localhost:11434/api/tags`
- Check GEMMA_ENDPOINT is correct
- Ensure model is pulled: `ollama list`

### Build Errors

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist && npm run build`
- Check Node.js version: `node --version` (should be 18+)

## Security Notes

1. **Environment Variables**: Never commit `.env` to git
2. **Service Account**: Use least-privilege IAM roles
3. **API Keys**: Rotate regularly if using API keys
4. **CORS**: Configure appropriately for production

## Next Steps

After deployment:

1. Test all three reasoning modes (deterministic, Vertex AI, Gemma)
2. Monitor Vertex AI usage and costs
3. Set up Cloud Monitoring alerts
4. Configure custom domain (optional)
5. Enable Cloud CDN for static assets (optional)

## Support

For issues:
- Check Cloud Run logs: `gcloud run services logs read difaryx-agent-demo`
- Review Vertex AI quotas: https://console.cloud.google.com/iam-admin/quotas
- Consult Vertex AI docs: https://cloud.google.com/vertex-ai/docs

## License

See LICENSE file for details.
