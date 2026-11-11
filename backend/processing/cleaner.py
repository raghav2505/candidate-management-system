
def clean_candidate(candidate_data):

    # Create a copy so original data is not modified
    cleaned_candidate = candidate_data.copy()

    # 1. Clean candidate name
    if isinstance(cleaned_candidate.get("name"), str):

        cleaned_candidate["name"] = " ".join(
            cleaned_candidate["name"].split()
        )

    # 2. Standardize email
    if isinstance(cleaned_candidate.get("email"), str):

        cleaned_candidate["email"] = (
            cleaned_candidate["email"].strip().lower()
        )

    # 3. Clean skills
    skills = cleaned_candidate.get("skills")

    # Only clean skills if the input is actually a list
    if isinstance(skills, list):

        cleaned_skills = []
        seen_skills = set()

        for skill in skills:

            # Preserve invalid values so Pydantic can reject them
            if not isinstance(skill, str):
                cleaned_skills.append(skill)
                continue

            skill = skill.strip()

            if not skill:
                continue

            skill_key = skill.casefold()

            if skill_key not in seen_skills:

                cleaned_skills.append(skill)
                seen_skills.add(skill_key)

        cleaned_candidate["skills"] = cleaned_skills

    return cleaned_candidate
