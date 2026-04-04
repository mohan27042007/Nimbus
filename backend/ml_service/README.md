# Nimbus ML service (Phase 2)

Runs the XGBoost premium + fraud models behind FastAPI on **port 8001**.

## Setup

```bash
cd backend/ml_service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

- **`requirements.txt`** — installs on **Python 3.10–3.13** using wheels where possible (`pydantic>=2.10` on 3.13 avoids building `pydantic-core` from source). **`fastapi==0.109.0`**, **`uvicorn==0.27.0`**, **`xgboost==2.0.3`** match the ML build doc intent.
- **`requirements.doc-pins.txt`** — stricter `==` pins for **Python 3.10/3.11** (doc parity). `pandas==2.1.4` may require **Visual Studio Build Tools** on Windows if no wheel is available.

## Run

```bash
cd backend/ml_service
uvicorn nimbus_ml_api:app --host 0.0.0.0 --port 8001
```

Models load from the **current working directory** (`nimbus_*_model.json`).

## Endpoints

- `GET /health`
- `POST /api/premium/calculate`
- `POST /api/fraud/score`
