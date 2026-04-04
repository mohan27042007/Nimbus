FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for XGBoost + compilation
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker layer caching
COPY backend/ml_service/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML service files
COPY backend/ml_service/ .

# Expose ML service port
EXPOSE 8001

# Run ML service
CMD ["python", "-m", "uvicorn", "nimbus_ml_api:app", \
     "--host", "0.0.0.0", "--port", "8001"]
