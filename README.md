# DEBRIEF

## Project Title
DEBRIEF Meeting Intelligence Platform

## The Problem
Teams often finish meetings with decisions, action items, and risks buried inside long transcripts. That makes it hard to quickly understand what was decided, who owns each task, and what needs attention next.

## The Solution
DEBRIEF turns meeting transcripts into a clean executive brief. It extracts decisions, action items, conflict checks, key points, and risk flags, then presents them in a focused web dashboard and a professional PDF export so the most important information is easy to review and share.

## Core Features
- Multi-transcript upload (.txt, .vtt) with validation
- Decision and action-item extraction with owner/deadline detection
- Cross-meeting AI chat with source citations
- Meeting vibe dashboard (timeline + speaker sentiment + flagged moments)
- PDF and CSV export

## Tech Stack
- Programming languages: Python, JavaScript
- Frontend frameworks and tools: React, Vite, Tailwind CSS, Axios, Lucide React, React Router
- Backend framework: FastAPI
- PDF generation: ReportLab
- APIs and tools: Anthropic API, FastAPI CORS, python-dotenv, python-multipart
- Storage: Local file-based storage in the backend

## Demo Video
[![Watch Demo](https://drive.google.com/thumbnail?id=1EmO7F68i2RzBZF7B-gN5k4CFQ1kkjwqK)](https://drive.google.com/file/d/1EmO7F68i2RzBZF7B-gN5k4CFQ1kkjwqK/view)

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


## Recommended deployment setup
Because the frontend and backend are separate apps, deploy them separately and connect them with an environment variable.

1. Deploy the backend first
	- Use a service such as Render, Railway, or Fly.io.
	- Set the backend start command to run FastAPI with Uvicorn.
	- Add your environment variables, especially `ANTHROPIC_API_KEY`.
	- After deployment, copy the backend URL.

2. Make the frontend point to the deployed backend
	- In the frontend deployment environment, set `VITE_API_BASE_URL` to your backend URL plus `/api`.
	- Example: `https://your-backend.onrender.com/api`

3. Deploy the frontend
	- Use a service such as Vercel or Netlify.
	- Build from the `frontend2` folder.
	- Make sure the deployment uses the `VITE_API_BASE_URL` value above.

4. Verify the live app
	- Open the deployed frontend URL.
	- Upload a transcript and confirm it reaches the backend.
	- Check that transcript analysis, chat, CSV export, and PDF export all work.

## Live Links
- Frontend- https://meeting-intelligence-hub-jiyaros-projects.vercel.app/
- Backend- https://meeting-intelligence-hub-0xwn.onrender.com
