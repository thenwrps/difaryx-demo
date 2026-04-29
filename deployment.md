# DIFARYX Autonomous Scientific Agent - Deployment Instructions

This guide covers setting up and deploying the backend and frontend components of the DIFARYX Agent demo.

## 1. Backend (Node.js + Express) Setup & Cloud Run Deployment

The backend is located in the `server/` directory and exposes the `/run-agent` endpoint integrating the Gemini API.

### Local Setup
1. Open terminal and navigate to `server/`:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and add your Gemini API Key:
   ```bash
   cp .env.example .env
   # Edit .env and set GEMINI_API_KEY=your_key
   ```
4. Run the server:
   ```bash
   npm start
   ```

### Deploying to Google Cloud Run
1. Ensure you have the Google Cloud CLI (`gcloud`) installed and authenticated.
2. Submit the build to Cloud Build:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT_ID]/difaryx-agent-backend
   ```
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy difaryx-agent-backend \
     --image gcr.io/[PROJECT_ID]/difaryx-agent-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=your_gemini_api_key
   ```
4. Note the deployed service URL. You will need to update the frontend fetch request in `src/pages/AgentDemo.tsx` to point to this URL instead of `http://localhost:3001/run-agent`.

---

## 2. Frontend (React + Vite) Deployment

The frontend integrates the new `/demo/agent` route.

### Local Setup
1. In the root directory (`c:\DIFARYX-web`), install dependencies if not already done:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

### Deploying to Vercel/Netlify
1. Build the production assets:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` directory or connect your GitHub repository directly to Vercel/Netlify. The build command is `npm run build` and output directory is `dist`.

> **Note**: Before deploying the frontend to production, ensure you update the `fetch` URL in `src/pages/AgentDemo.tsx` from `http://localhost:3001/run-agent` to your Cloud Run backend URL.
