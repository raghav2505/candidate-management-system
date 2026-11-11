
def validate_candidate(candidate_data):

    errors = []

    # 1. Validate candidate name
    name = candidate_data.get("name")

    if not isinstance(name, str) or not name.strip():
        errors.append("Candidate name is missing")

    # 2. Validate email
    email = candidate_data.get("email")

    if not isinstance(email, str) or not email.strip():
        errors.append("Candidate email is missing")

    elif "@" not in email or "." not in email.split("@")[-1]:
        errors.append("Invalid email format")

    # 3. Validate skills
    skills = candidate_data.get("skills")

    if not isinstance(skills, list) or len(skills) == 0:
        errors.append("Skills must contain at least one skill")

    elif not all(
        isinstance(skill, str) and skill.strip()
        for skill in skills
    ):
        errors.append("Skills contain empty or invalid values")

    # 4. Validate experience
    experience = candidate_data.get("experience")

    if (
        isinstance(experience, bool)
        or not isinstance(experience, (int, float))
    ):
        errors.append("Experience must be a number")

    elif experience < 0:
        errors.append("Experience cannot be negative")

    return {
        "is_valid": len(errors) == 0,
        "errors": errors
    }
