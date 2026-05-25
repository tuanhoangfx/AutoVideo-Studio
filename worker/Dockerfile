# AutoVideo Studio worker — Docker image.
# Build: docker build -t avs-worker .
# Run:   docker run -p 8021:8021 -v $(pwd)/storage:/app/storage avs-worker

FROM python:3.12-slim

# ffmpeg bundled by imageio-ffmpeg (no apt install needed for ffmpeg itself),
# but we need basic build tools for some wheels.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY main.py .
COPY pipeline/ ./pipeline/

# Storage volume mount-point
RUN mkdir -p /app/storage/jobs
VOLUME ["/app/storage"]

EXPOSE 8021

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8021"]
