
import json
import logging
import sys
from datetime import datetime, timezone

from app.core.config import get_settings


class JsonFormatter(logging.Formatter):
    """Format log records as JSON, one record per line."""

    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line_no": record.lineno,
        }

        extra_data = getattr(record, "extra_data", None)
        if isinstance(extra_data, dict):
            log_record.update(extra_data)

        if record.exc_info:
            log_record["exception"] = self.formatException(
                record.exc_info
            )

        return json.dumps(log_record, default=str)


def setup_logging() -> logging.Logger:
    """Configure application-wide logging."""
    settings = get_settings()
    root = logging.getLogger()

    log_level = getattr(
        logging,
        settings.log_level.upper(),
        logging.INFO,
    )
    root.setLevel(log_level)

    # Avoid duplicate handlers if setup is called again.
    root.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)

    if settings.app_env.lower() == "production":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s | %(levelname)-8s | "
                "%(name)s | %(message)s"
            )
        )

    root.addHandler(handler)

    # Reduce noisy third-party logs.
    for name in (
        "httpx",
        "httpcore",
        "openai",
        "langchain",
        "urllib3",
    ):
        logging.getLogger(name).setLevel(logging.WARNING)

    return root
