@echo off
title ClipForge AI - Frontend (Port 5173)
echo ========================================================
echo  Starting Frontend Web Dev Server on http://localhost:5173
echo ========================================================
cd /d "%~dp0apps\web"
npm run dev
pause
