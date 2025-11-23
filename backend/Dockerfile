# syntax=docker/dockerfile:1

ARG PYTHON_VERSION=3.11

FROM ghcr.io/astral-sh/uv:python${PYTHON_VERSION}-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PROJECT_ROOT=/app/backend \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests first for better layer caching
COPY backend/pyproject.toml backend/uv.lock ./backend/
COPY packages/pdf_parser ./packages/pdf_parser

WORKDIR /app/backend
RUN uv sync --frozen --no-dev --no-install-project

# Now bring in the FastAPI source code
WORKDIR /app
COPY backend ./backend

ARG PYTHON_VERSION
FROM python:${PYTHON_VERSION}-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PROJECT_ROOT=/app/backend \
    PATH="/app/backend/.venv/bin:${PATH}" \
    PORT=8000

WORKDIR /app/backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment and source files from the builder layer
COPY --from=builder /app/backend/.venv /app/backend/.venv
COPY --from=builder /app/backend/app /app/backend/app
COPY --from=builder /app/backend/run.py /app/backend/run.py
COPY --from=builder /app/backend/main.py /app/backend/main.py
COPY --from=builder /app/backend/pyproject.toml /app/backend/pyproject.toml
COPY --from=builder /app/backend/uv.lock /app/backend/uv.lock

EXPOSE 8000

CMD ["sh", "-c", "exec ./.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

