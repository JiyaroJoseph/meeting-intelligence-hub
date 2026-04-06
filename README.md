# DEBRIEF

## Project Title
DEBRIEF Meeting Intelligence Platform

## The Problem
Teams often finish meetings with decisions, action items, and risks buried inside long transcripts. That makes it hard to quickly understand what was decided, who owns each task, and what needs attention next.

## The Solution
DEBRIEF turns meeting transcripts into a clean executive brief. It extracts decisions, action items, conflict checks, key points, and risk flags, then presents them in a focused web dashboard and a professional PDF export so the most important information is easy to review and share.

## Tech Stack
- Programming languages: Python, JavaScript
- Frontend frameworks and tools: React, Vite, Tailwind CSS, Axios, Lucide React, React Router
- Backend framework: FastAPI
- PDF generation: ReportLab
- APIs and tools: Anthropic API, FastAPI CORS, python-dotenv, python-multipart
- Storage: Local file-based storage in the backend

## Setup Instructions

### 1. Install dependencies
Open two terminals, one for the backend and one for the frontend.

Backend:
```powershell
cd backend
python -m pip install -r requirements.txt
```

Frontend:
```powershell
cd frontend2
npm install
```

### 2. Run the backend
From the `backend` folder:
```powershell
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Run the frontend
From the `frontend2` folder:
```powershell
npm run dev
```

### 4. Open the app
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

### 5. Optional environment setup
If you want the AI-powered extraction to use an Anthropic API key, create a `.env` file in the `backend` folder and add your key there.
