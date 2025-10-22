@echo off
REM Start Backend with All Permissions (No Manual Prompts)
REM This script runs Deno with --allow-all flag to avoid permission prompts

echo.
echo ========================================
echo   Starting Backend with Full Permissions
echo ========================================
echo.
echo WARNING: Make sure you're in your BACKEND directory!
echo If not, press Ctrl+C and navigate to your backend folder first.
echo.
pause

REM Set environment variables (adjust these to match your configuration)
set GEMINI_API_KEY=AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o
set GEMINI_MODEL=gemini-2.5-flash
set MONGODB_URL=mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true&w=majority^&appName=Cluster0
set DB_NAME=First_Concept_DB

echo Environment variables set:
echo   - GEMINI_API_KEY: Set
echo   - GEMINI_MODEL: %GEMINI_MODEL%
echo   - MONGODB_URL: Set
echo   - DB_NAME: %DB_NAME%
echo.
echo Running with --allow-all (no permission prompts)
echo.

REM Start backend with all permissions (no prompts)
deno run --allow-all src\concept_server.ts --port 8000 --baseUrl /api
