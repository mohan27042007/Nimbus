from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Nimbus API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:8001")

http_client = httpx.AsyncClient(
    base_url=ML_SERVICE_URL,
    timeout=15.0,
)


@app.get("/health")
async def health():
    """Gateway health + ML service connectivity check."""
    try:
        resp = await http_client.get("/health")
        ml_data = resp.json()
        return {
            "status": "ok",
            "gateway": "healthy",
            "ml_service": "connected",
            "ml_models": ml_data.get("models", []),
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"ML service unreachable at {ML_SERVICE_URL}: {str(e)}",
        )


class PremiumRequest(BaseModel):
    zone_risk_score: int
    earnings_baseline: float
    trust_score: int
    past_claims_count: int
    claim_approval_rate: float
    weeks_active: int
    forecast_rain_mm: float
    forecast_aqi: int
    tier: str
    city: str
    month: int


@app.post("/api/premium/calculate")
async def calculate_premium(req: PremiumRequest):
    try:
        resp = await http_client.post(
            "/api/premium/calculate",
            json=req.model_dump(),
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"ML service error: {e.response.text}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"ML service unreachable: {str(e)}",
        )


class FraudRequest(BaseModel):
    trust_score: int
    gps_speed_kmph: float
    gps_jump_km: float
    gps_in_zone: int
    api_confirmed: int
    same_event_claims_count: int
    pincode_changes_30days: int
    weekly_claims: int
    avg_weekly_claims: float
    claim_spike_ratio: float
    payout_amount: float
    earnings_baseline: float
    payout_vs_baseline_ratio: float
    hours_since_last_claim: float
    zone_disruption_confirmed: int
    neighbor_zone_payout: int


@app.post("/api/fraud/score")
async def score_fraud(req: FraudRequest):
    try:
        resp = await http_client.post(
            "/api/fraud/score",
            json=req.model_dump(),
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"ML service error: {e.response.text}",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"ML service unreachable: {str(e)}",
        )


@app.on_event("shutdown")
async def shutdown():
    await http_client.aclose()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
