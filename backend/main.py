
import json
import re
import csv
import io

from pathlib import Path

from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    ValidationError,
    field_validator
)

from backend.processing.cleaner import clean_candidate

from backend.crud import (
    insert_candidate,
    get_all_candidates,
    get_candidate_count,
    DuplicateCandidateError
)


# --------------------------------------------------
# 1. FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="Candidate Ingestion API",
    description="Candidate ingestion and management system",
    version="1.0.0"
)


# --------------------------------------------------
# 2. CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# --------------------------------------------------
# 3. TECHNICAL SKILL VALIDATION RULES
# --------------------------------------------------

VALID_TECH_SKILLS = {
    "python", "python 2", "python 3",
    "java", "java 8", "java 11", "java 17", "java 21",
    "c", "c++", "c#", "javascript", "typescript",
    "r", "go", "golang", "rust", "ruby", "php",
    "kotlin", "swift", "dart", "scala",

    "html", "html5", "css", "css3",
    "react", "react.js", "angular", "vue", "vue.js",
    "next.js", "bootstrap", "tailwind css",

    "node.js", "express.js", "fastapi", "django",
    "flask", "spring", "spring boot",
    "asp.net", ".net", "laravel",

    "sql", "mysql", "postgresql", "postgres",
    "mongodb", "sqlite", "oracle", "redis",
    "sql server", "sql server 2022",

    "machine learning", "deep learning",
    "artificial intelligence", "generative ai",
    "data science", "data analytics",
    "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "keras",
    "xgboost", "nlp", "opencv",

    "aws", "azure", "gcp",
    "docker", "kubernetes", "terraform",
    "jenkins", "git", "github",
    "linux", "bash", "ansible",

    "rest api", "rest apis", "graphql",
    "postman", "microservices",
    "power bi", "tableau", "excel",
    "apache kafka", "spark", "pyspark"
}


def normalize_skill(skill):
    return " ".join(skill.casefold().split())


# --------------------------------------------------
# 4. PYDANTIC CANDIDATE MODEL
# --------------------------------------------------

class Candidate(BaseModel):

    name: str = Field(min_length=2)
    email: EmailStr
    skills: list[str] = Field(min_length=1)
    experience: float = Field(ge=0)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):

        value = " ".join(value.split())

        name_pattern = r"[^\W\d_]+(?:[ '-][^\W\d_]+)*"

        if not re.fullmatch(name_pattern, value):
            raise ValueError(
                "Invalid name. Name must contain alphabetic "
                "characters, spaces, hyphens or apostrophes."
            )

        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        return str(value).strip().lower()

    @field_validator("skills")
    @classmethod
    def validate_skills(cls, skills):

        cleaned_skills = []
        seen_skills = set()

        for skill in skills:

            if not isinstance(skill, str):
                raise ValueError(
                    "Each skill must be a text value."
                )

            skill = " ".join(skill.strip().split())

            if not skill:
                raise ValueError(
                    "Skills cannot be empty."
                )

            skill_key = normalize_skill(skill)

            if skill_key not in VALID_TECH_SKILLS:
                raise ValueError(
                    f"Invalid or unsupported skill '{skill}'. "
                    "Please enter a recognized technical skill."
                )

            if skill_key not in seen_skills:
                cleaned_skills.append(skill)
                seen_skills.add(skill_key)

        if not cleaned_skills:
            raise ValueError(
                "At least one valid technical skill is required."
            )

        return cleaned_skills


# --------------------------------------------------
# 5. COMMON CLEANING AND VALIDATION
# --------------------------------------------------

def prepare_candidate(record):

    cleaned_record = clean_candidate(record)

    validated_candidate = Candidate.model_validate(
        cleaned_record
    )

    return validated_candidate.model_dump()


# --------------------------------------------------
# 6. QUARANTINE CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

QUARANTINE_FILE = (
    BASE_DIR / "data" / "quarantine" / "invalid_records.jsonl"
)

QUARANTINE_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)


def quarantine_record(record):

    with open(QUARANTINE_FILE, "a") as file:

        file.write(
            json.dumps(record, default=str) + "\n"
        )


# --------------------------------------------------
# 7. ROOT ENDPOINT
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "Welcome to Candidate Ingestion API",
        "status": "Running"
    }


# --------------------------------------------------
# 8. HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "Candidate Ingestion API"
    }


# --------------------------------------------------
# 9. INSERT SINGLE CANDIDATE
# --------------------------------------------------

@app.post("/candidates")
def create_candidate(candidate: Candidate):

    try:

        candidate_data = prepare_candidate(
            candidate.model_dump()
        )

        saved_candidate = insert_candidate(
            candidate_data
        )

        return {
            "message": "Candidate saved successfully!",
            "candidate": saved_candidate
        }

    except DuplicateCandidateError as e:

        raise HTTPException(
            status_code=409,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# 10. GET ALL CANDIDATES
# --------------------------------------------------

@app.get("/candidates")
def get_candidates():

    try:

        candidates = get_all_candidates()

        return {
            "total_candidates": len(candidates),
            "candidates": candidates
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# 11. CANDIDATE STATISTICS
# --------------------------------------------------

@app.get("/stats")
def get_statistics():

    try:

        total_candidates = get_candidate_count()

        quarantined_count = 0

        if QUARANTINE_FILE.exists():

            with open(QUARANTINE_FILE, "r") as file:

                quarantined_count = sum(
                    1 for line in file if line.strip()
                )

        return {
            "total_candidates": total_candidates,
            "valid_candidates": total_candidates,
            "invalid_candidates": quarantined_count,
            "quarantined_count": quarantined_count
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# 12. GET QUARANTINED RECORDS
# --------------------------------------------------

@app.get("/quarantine")
def get_quarantined_records():

    try:

        quarantined_records = []

        if QUARANTINE_FILE.exists():

            with open(QUARANTINE_FILE, "r") as file:

                for line in file:

                    if line.strip():

                        quarantined_records.append(
                            json.loads(line)
                        )

        return {
            "total_quarantined": len(quarantined_records),
            "quarantined_records": quarantined_records
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# 13. BULK CANDIDATE INGESTION
# --------------------------------------------------

@app.post("/candidates/bulk")
def bulk_ingestion(candidates: list[dict]):

    valid_candidates = []
    invalid_candidates = []
    saved_candidates = []

    for index, record in enumerate(candidates, start=1):

        try:

            candidate_data = prepare_candidate(record)

            valid_candidates.append(
                (index, candidate_data)
            )

        except ValidationError as e:

            invalid_record = {
                "record_number": index,
                "submitted_data": record,
                "errors": e.errors()
            }

            invalid_candidates.append(invalid_record)
            quarantine_record(invalid_record)

        except Exception as e:

            invalid_record = {
                "record_number": index,
                "submitted_data": record,
                "errors": [
                    {"message": str(e)}
                ]
            }

            invalid_candidates.append(invalid_record)
            quarantine_record(invalid_record)

    for index, candidate_data in valid_candidates:

        try:

            saved_candidate = insert_candidate(
                candidate_data
            )

            saved_candidates.append(saved_candidate)

        except DuplicateCandidateError as e:

            invalid_record = {
                "record_number": index,
                "submitted_data": candidate_data,
                "errors": [
                    {
                        "type": "duplicate_candidate",
                        "message": str(e)
                    }
                ]
            }

            invalid_candidates.append(invalid_record)
            quarantine_record(invalid_record)

        except Exception as e:

            invalid_record = {
                "record_number": index,
                "submitted_data": candidate_data,
                "errors": [
                    {"message": str(e)}
                ]
            }

            invalid_candidates.append(invalid_record)
            quarantine_record(invalid_record)

    return {
        "message": "Candidate ingestion completed",
        "total_received": len(candidates),
        "total_valid": len(saved_candidates),
        "total_invalid": len(invalid_candidates),
        "quarantined_count": len(invalid_candidates),
        "saved_candidates": saved_candidates,
        "invalid_candidates": invalid_candidates
    }


# --------------------------------------------------
# 14. CSV BULK CANDIDATE UPLOAD
# --------------------------------------------------

@app.post("/candidates/upload-csv")
async def upload_candidates_csv(
    file: UploadFile = File(...)
):

    if not file.filename or not file.filename.lower().endswith(".csv"):

        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file."
        )

    try:

        contents = await file.read()

        if not contents:

            raise HTTPException(
                status_code=400,
                detail="Uploaded CSV file is empty."
            )

        csv_content = contents.decode("utf-8-sig")

        reader = csv.DictReader(
            io.StringIO(csv_content)
        )

        required_columns = {
            "name",
            "email",
            "skills",
            "experience"
        }

        if not reader.fieldnames:

            raise HTTPException(
                status_code=400,
                detail="CSV file has no header row."
            )

        # Normalize column names
        reader.fieldnames = [
            (column or "").strip().lower()
            for column in reader.fieldnames
        ]

        if not required_columns.issubset(set(reader.fieldnames)):

            raise HTTPException(
                status_code=400,
                detail=(
                    "CSV must contain these columns: "
                    "name, email, skills, experience."
                )
            )

        candidates = []

        for row in reader:

            # Skip completely empty rows
            if not any(
                str(value).strip()
                for value in row.values()
                if value is not None
            ):
                continue

            # Convert pipe-separated skills into a list
            skills = [
                skill.strip()
                for skill in (row.get("skills") or "").split("|")
                if skill.strip()
            ]

            candidate = {
                "name": row.get("name") or "",
                "email": row.get("email") or "",
                "skills": skills,
                "experience": row.get("experience") or ""
            }

            candidates.append(candidate)

        if not candidates:

            raise HTTPException(
                status_code=400,
                detail="No candidate records found in CSV."
            )

        # Reuse existing ingestion pipeline
        result = bulk_ingestion(candidates)

        result["message"] = (
            "CSV candidate ingestion completed"
        )

        return result

    except HTTPException:
        raise

    except UnicodeDecodeError:

        raise HTTPException(
            status_code=400,
            detail="CSV must use UTF-8 encoding."
        )

    except csv.Error as e:

        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV format: {str(e)}"
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        await file.close()
