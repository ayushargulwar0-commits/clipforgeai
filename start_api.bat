@echo off
title ClipForge AI - Backend API (Port 8000)
echo ========================================================
echo  Starting ClipForge AI Main Backend on http://localhost:8000
echo ========================================================
cd /d "%~dp0apps\api"
set PORT=8000
set STORAGE_BACKEND=local
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
