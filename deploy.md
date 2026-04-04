# Nimbus — Deployment Guide

## Local Development (without Docker)

### Terminal 1 — ML Service
cd backend/ml_service
python -m uvicorn nimbus_ml_api:app --host 127.0.0.1 --port 8001

### Terminal 2 — Gateway  
cd backend/gateway
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

### Terminal 3 — Frontend
npm run dev
# Open http://localhost:8080

---

## Docker (Full Stack — One Command)

### Prerequisites
- Docker Desktop installed and running
- Copy .env values into .env.docker

### Setup
cp .env.docker .env.docker.local
# Edit .env.docker.local with your real Supabase values

### Run
docker compose --env-file .env.docker up --build

### Access
- Frontend: http://localhost:8080
- Gateway API: http://localhost:8000
- ML Service: http://localhost:8001
- Gateway health: http://localhost:8000/health

### Stop
docker compose down

### Rebuild after code changes
docker compose up --build

---

## Cloud Deployment (Render)

1. Push repo to GitHub
2. Go to render.com → New → Web Service
3. Connect your GitHub repo
4. For each service (ml-service, gateway, frontend):
   - Set build command and start command
   - Add environment variables from .env.docker
5. Deploy

---

## Troubleshooting

### Port already in use
netstat -ano | findstr :8000
netstat -ano | findstr :8001
netstat -ano | findstr :8080

### Container logs
docker compose logs ml-service
docker compose logs gateway
docker compose logs frontend

### Rebuild single service
docker compose up --build ml-service
