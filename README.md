# Candidate Management & Data Ingestion System

A full-stack application built to manage candidate information, validate incoming records, clean data, and store valid candidate records in PostgreSQL.

## 🚀 Project Overview

The Candidate Management System provides a centralized platform for candidate data ingestion and management.

It uses a React frontend, FastAPI backend, and PostgreSQL database to process candidate information, identify invalid submissions, and maintain reliable records.

## ✨ Key Features

- **Candidate Dashboard:** Overview of total, valid, invalid, and quarantined records.
- **Candidate Management:** View and manage candidate information.
- **Data Ingestion:** Submit candidate records through the application.
- **Data Validation:** Validate candidate details such as names, email addresses, skills, and experience.
- **Data Cleaning:** Normalize and clean incoming candidate information.
- **Invalid Record Handling:** Identify and quarantine records that fail validation.
- **Database Integration:** Store valid candidate records in PostgreSQL.
- **REST API:** Backend services powered by FastAPI.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, CSS, JavaScript |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| Database Driver | psycopg2 |
| API Testing | FastAPI Swagger UI |
| Version Control | Git, GitHub |

## 🏗️ System Architecture

```text
       React Frontend
             |
             v
        FastAPI Backend
             |
             v
     Data Validation
             |
             v
       Data Cleaning
             |
       +-----+-----+
       |           |
       v           v
   Valid Data   Invalid Data
       |           |
       v           v
   PostgreSQL   Quarantine
```

## 📁 Project Structure

```text
CandidateWorkspace/
│
├── backend/
│   ├── processing/
│   │   ├── cleaner.py
│   │   └── validator.py
│   ├── crud.py
│   ├── database.py
│   ├── main.py
│   ├── test_crud.py
│   └── test_db.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── requirements.txt
├── .gitignore
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/raghav2505/candidate-management-system.git

cd candidate-management-system
```

### 2. Backend Setup

Create and activate a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure PostgreSQL credentials in a local `.env` file according to the environment variables used in `backend/database.py`.

### 3. Start the Backend

```bash
uvicorn backend.main:app --reload --port 8000
```

Backend URL:

http://127.0.0.1:8000

API Documentation:

http://127.0.0.1:8000/docs

### 4. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🧪 Testing

Backend tests can be executed using:

```bash
pytest backend/
```

Ensure PostgreSQL is configured and running before executing database-dependent tests.

## 🔐 Data Security

- Database credentials are maintained in environment variables.
- Sensitive configuration files are excluded through `.gitignore`.
- Invalid records are handled separately from valid candidate records.

## 🎯 Project Objective

The objective of this project is to demonstrate practical full-stack development, REST API integration, data validation, data cleaning, database operations, and structured error handling.

## 👨‍💻 Author

**Raghav Aditya**

GitHub: [@raghav2505](https://github.com/raghav2505)

---

⭐ If you find this project interesting, consider giving the repository a star!
