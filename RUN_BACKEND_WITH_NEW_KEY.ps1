# Start Backend with Full Permissions (No Manual Prompts)
# Run this from your BACKEND directory

Write-Host "🚀 Starting Backend..." -ForegroundColor Cyan

$env:GEMINI_API_KEY="AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o"
$env:GEMINI_MODEL="gemini-2.5-flash"
$env:MONGODB_URL="mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
$env:DB_NAME="First_Concept_DB"

deno run --allow-all src/concept_server.ts --port 8000 --baseUrl /api
