@echo off
REM Start Backend with Full Permissions (No Manual Prompts)
REM Run this from your BACKEND directory

echo Starting Backend...

set GEMINI_API_KEY=AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o
set GEMINI_MODEL=gemini-2.5-flash
set MONGODB_URL=mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true&w=majority^&appName=Cluster0
set DB_NAME=First_Concept_DB

deno run --allow-all src\concept_server.ts --port 8000 --baseUrl /api
