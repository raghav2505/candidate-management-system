
import psycopg2
import os

from dotenv import load_dotenv
from pathlib import Path


# Locate and load the .env file

ENV_FILE = Path(__file__).resolve().parents[1] / ".env"

load_dotenv(ENV_FILE)


# PostgreSQL connection function

def get_connection():

    connection = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )

    return connection
