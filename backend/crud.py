
import psycopg2
from backend.database import get_connection
from psycopg2.extras import Json


class DuplicateCandidateError(Exception):
    pass


# --------------------------------------------------
# 1. INSERT CANDIDATE
# --------------------------------------------------

def insert_candidate(candidate_data):

    connection = get_connection()

    try:
        with connection:
            with connection.cursor() as cursor:

                name = candidate_data["name"].strip()
                email = candidate_data["email"].strip().lower()
                skills = candidate_data["skills"]
                experience = candidate_data["experience"]

                cursor.execute(
                    """
                    INSERT INTO candidates
                    (name, email, skills, experience)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, name, email, skills,
                              experience, created_at
                    """,
                    (
                        name,
                        email,
                        Json(skills),
                        experience
                    )
                )

                candidate = cursor.fetchone()

                columns = [
                    description[0]
                    for description in cursor.description
                ]

                return dict(zip(columns, candidate))

    except psycopg2.errors.UniqueViolation as error:

        if error.diag.constraint_name in (
            "unique_candidate_email",
            "candidates_email_key"
        ):
            email = candidate_data["email"].strip().lower()

            raise DuplicateCandidateError(
                f"Candidate with email {email} already exists"
            ) from error

        raise

    finally:
        connection.close()


# --------------------------------------------------
# 2. GET ALL CANDIDATES
# --------------------------------------------------

def get_all_candidates():

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    name,
                    email,
                    skills,
                    experience,
                    created_at
                FROM candidates
                ORDER BY id
                """
            )

            candidates = cursor.fetchall()

            columns = [
                description[0]
                for description in cursor.description
            ]

            return [
                dict(zip(columns, candidate))
                for candidate in candidates
            ]

    finally:
        connection.close()


# --------------------------------------------------
# 3. GET TOTAL CANDIDATE COUNT
# --------------------------------------------------

def get_candidate_count():

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                "SELECT COUNT(*) FROM candidates"
            )

            result = cursor.fetchone()

            return result[0]

    finally:
        connection.close()
