FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

# bcrypt / cryptography wheels
RUN apt-get update -qq \
    && apt-get install --no-install-recommends -y build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY seed.py .

EXPOSE 8080

# Fly http_service.internal_port=8080 — PORT=4000 secret'ı bunu ezmesin diye sabit
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
