# Nimbus API Gateway

Runs on **port 8000**. Proxies ML requests to the ML service (default **port 8001**) with CORS enabled for the Vite dev server.

## Setup

```bash
cd backend/gateway
pip install -r requirements.txt
```

Copy `.env.example` to `.env` if needed and set `ML_SERVICE_URL`.

## Run

```bash
cd backend/gateway
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Gateway health + ML service connectivity |
| POST | `/api/premium/calculate` | Proxies to ML service |
| POST | `/api/fraud/score` | Proxies to ML service |

## Requires

Start the ML service first:

```bash
cd backend/ml_service
python -m uvicorn nimbus_ml_api:app --host 127.0.0.1 --port 8001
```
