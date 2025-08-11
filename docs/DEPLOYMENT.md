## Deployment Plan

This document outlines a pragmatic deployment plan for this project, optimized for:

- Frontend: Vercel (Next.js)
- Backend: FastAPI on Google Cloud Run (HTTPS, autoscaling)
- Cache/Store: Redis (Redis Cloud/Upstash recommended) or GCP Memorystore via VPC connector

You can also host the frontend on GCP if you want everything in one place (see optional section).

### Architecture at a Glance

- Browser → Vercel (Next.js) → Backend API (Cloud Run, HTTPS)
- Backend uses OpenAI API and Redis cache
- Frontend calls backend using `NEXT_PUBLIC_API_URL`
- Backend CORS allows Vercel domains

### Prerequisites

- GCP Project with billing enabled and `gcloud` CLI configured
- Docker available locally (or use Cloud Build without local Docker)
- Vercel account with access to the Git repo
- OpenAI API key

### Environment Variables

Backend (Cloud Run):

- REQUIRED
  - `OPENAI_API_KEY`: secret
  - `CORS_ALLOW_ORIGINS`: comma-separated list; include production and preview Vercel origins
  - `REDIS_URL`: e.g., `redis://USER:PASSWORD@host:port/0` (Redis Cloud/Upstash) or `redis://<memorystore-ip>:6379/0`
- OPTIONAL
  - `PIPELINE_VERSION` (e.g., `v1.2.0`)
  - `OPENAI_MODEL_COMPOSER` (default `gpt-4o-mini`)
  - `OPENAI_MODEL_SEARCH`, `OPENAI_MODEL_ANALYSIS`
  - `AUTHORITY_FLOOR_ENABLED` (default `true`)
  - `MIN_AUTHORITY_SOURCES` (default `1`)
  - `TRUE_USE_TRUST_PRIOR` (`true|false`, default `false`)

Frontend (Vercel):

- `NEXT_PUBLIC_API_URL`: the HTTPS base URL of your Cloud Run service, e.g., `https://geo-backend-xxxxx-uc.a.run.app`

### Backend on Google Cloud Run

1. Create a Dockerfile (example)

```
FROM python:3.12-slim
WORKDIR /app
COPY backend/ /app/backend/
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
ENV PORT=8080
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

2. Build and push the image

```
gcloud builds submit --tag gcr.io/PROJECT_ID/geo-backend
```

3. Deploy to Cloud Run

```
gcloud run deploy geo-backend \
  --image gcr.io/PROJECT_ID/geo-backend \
  --region REGION \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=1
```

4. Configure secrets and environment variables

Using Secret Manager for `OPENAI_API_KEY`:

```
echo -n "sk-..." | gcloud secrets create OPENAI_API_KEY --data-file=-

gcloud run services update geo-backend \
  --region REGION \
  --set-secrets OPENAI_API_KEY=OPENAI_API_KEY:latest \
  --set-env-vars CORS_ALLOW_ORIGINS=https://your-app.vercel.app,https://your-preview.vercel.app \
  --set-env-vars REDIS_URL=redis://USER:PASSWORD@redis-host:6379/0 \
  --set-env-vars PIPELINE_VERSION=v1.2.0 \
  --set-env-vars MIN_AUTHORITY_SOURCES=1 \
  --set-env-vars TRUE_USE_TRUST_PRIOR=false
```

Notes:

- Include both production and preview Vercel URLs in `CORS_ALLOW_ORIGINS`.
- If you are using Memorystore, see the VPC connector setup below.

### Redis Options

- Simpler: Redis Cloud or Upstash (public, managed). Set full `REDIS_URL` with credentials.
- GCP native: Memorystore (private IP) + Serverless VPC Access Connector.

Memorystore steps (summary):

1. Create a Redis instance in the same region/VPC.
2. Create a Serverless VPC Access Connector.
3. Update Cloud Run deployment to attach the connector and set egress to Private Ranges Only:

```
gcloud run services update geo-backend \
  --region REGION \
  --vpc-connector CONNECTOR_NAME \
  --egress-settings private-ranges-only \
  --set-env-vars REDIS_URL=redis://10.0.0.5:6379/0
```

### Frontend on Vercel (Next.js)

1. In Vercel, import the repo and set project root to `frontend/`.

2. Build settings

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.next`

3. Environment variables (Project → Settings → Environment Variables)

- `NEXT_PUBLIC_API_URL=https://<cloud-run-url>`

4. Deploy. Verify that client requests go to `NEXT_PUBLIC_API_URL` (Network tab).

### Optional: Frontend on GCP

You can host the Next.js app on Cloud Run as well:

```
FROM node:20-slim AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
```

Then deploy with Cloud Run similar to the backend. Set `NEXT_PUBLIC_API_URL` to the backend URL.

### CORS Configuration

The backend reads `CORS_ALLOW_ORIGINS` (comma-separated). Include:

- `https://your-app.vercel.app`
- `https://*.vercel.app` (if you want to allow all previews), or list specific preview URLs

### Verification Checklist

- Backend `/` returns JSON `{ ok: true, service: "demo-api" }` over HTTPS
- Run POST `/api/search/run` with a test query (e.g., via curl or Postman) succeeds
- Next.js app loads on Vercel; initiating a search calls the backend URL
- No CORS errors in browser console
- OpenAI key is not present in frontend (only on backend)

### Monitoring & Reliability

- Set `--min-instances=1` on Cloud Run to reduce cold starts
- Enable Cloud Run logs and error reporting
- Optionally add request logging middleware and rate limits on the backend

### Rollback

- Cloud Run keeps revisions. Use `gcloud run services list` and `gcloud run services update-traffic` to route back to a prior revision.
- Vercel supports instant rollbacks to previous deployments.

### Costs (rough guide)

- Cloud Run: pay per vCPU-sec and requests; minimal with `min-instances=1`
- Redis: managed Redis typically low cost at small tiers (or use serverless Redis like Upstash)
- Vercel: hobby is fine for demos; consider Pro for higher usage

### Common Pitfalls

- Missing `NEXT_PUBLIC_API_URL` → frontend tries `localhost:8000`
- CORS not including Vercel domains → browser blocks requests
- Redis not reachable (no VPC connector or wrong `REDIS_URL`)
- OpenAI key set in frontend (should be backend only)
