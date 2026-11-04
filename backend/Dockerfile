# syntax=docker/dockerfile:1
FROM python:3.13-slim

# pin a specific uv version for reproducible builds
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH" \
    FASTEMBED_CACHE_PATH=/models \
    PORT=8000

WORKDIR /app

# dependencies first, so this layer is cached until pyproject/uv.lock change
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

COPY . .

RUN useradd --create-home --uid 1000 appuser \
 && mkdir -p /models \
 && chown -R appuser:appuser /models /app
USER appuser

EXPOSE 8000

# apply migrations, then start the API (Render provides $PORT)
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers"]