@echo off
title AutoClip Engine - Microservice (Port 8001)
echo ========================================================
echo  Starting AutoClip Internal Engine on http://localhost:8001
echo ========================================================
cd /d "%~dp0services\autoclip"
set PORT=8001
set PYTHONPATH=.
set AUTOCLIP_INTERNAL_TOKEN=clipforge-internal-secret-2026
python backend/internal_server.py
pause
