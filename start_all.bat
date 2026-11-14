@echo off
title ClipForge AI - Launcher
echo ========================================================
echo  Launching ClipForge AI Development Environment
echo ========================================================
echo 1. Starting Backend API on http://localhost:8000 ...
start "ClipForge Backend (8000)" cmd /k "%~dp0start_api.bat"
timeout /t 2 /nobreak >nul

echo 2. Starting AutoClip Engine on http://localhost:8001 ...
start "AutoClip Engine (8001)" cmd /k "%~dp0start_autoclip.bat"
timeout /t 2 /nobreak >nul

echo 3. Starting Frontend Web on http://localhost:5173 ...
start "Frontend Web (5173)" cmd /k "%~dp0start_web.bat"

echo.
echo All services launched!
echo Open http://localhost:5173 in your browser.
pause
