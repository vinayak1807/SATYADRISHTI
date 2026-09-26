import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv


# Load the project's root .env.local file
ROOT_DIR = Path(__file__).resolve().parents[3]

ENV_FILE = ROOT_DIR / ".env.local"

load_dotenv(
    ENV_FILE
)


DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured."
    )


def get_connection():
    return psycopg.connect(
        DATABASE_URL
    )