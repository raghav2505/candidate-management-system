
from backend.crud import insert_candidate


candidate_data = {
    "name": "Rahul Kumar",
    "email": "rahul.test@gmail.com",
    "skills": ["Python", "FastAPI", "PostgreSQL"],
    "experience": 1
}

try:
    result = insert_candidate(candidate_data)

    print("Candidate inserted successfully!")
    print("Candidate details:")
    print(result)

except Exception as error:
    print("Insertion failed:", error)
