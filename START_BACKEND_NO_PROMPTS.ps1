# Start Backend with All Permissions (No Manual Prompts)
# This script runs Deno with --allow-all flag to avoid permission prompts

Write-Host "🚀 Starting Backend with Full Permissions..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  NOTE: Make sure you're in your BACKEND directory!" -ForegroundColor Yellow
Write-Host "   If not, press Ctrl+C and navigate to your backend folder first." -ForegroundColor Yellow
Write-Host ""

# Set environment variables (adjust these to match your configuration)
$env:GEMINI_API_KEY="AIzaSyDWBm5_rBO_zcx_liCFcnwPScPX5OOu00o"
$env:GEMINI_MODEL="gemini-2.5-flash"
$env:MONGODB_URL="mongodb+srv://jingyingt002_db_user:Rgb12138-jyp@cluster0.ewrfonr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
$env:DB_NAME="First_Concept_DB"

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host "   - GEMINI_API_KEY: Set" -ForegroundColor Gray
Write-Host "   - GEMINI_MODEL: $env:GEMINI_MODEL" -ForegroundColor Gray
Write-Host "   - MONGODB_URL: Set" -ForegroundColor Gray
Write-Host "   - DB_NAME: $env:DB_NAME" -ForegroundColor Gray
Write-Host ""

Write-Host "🔓 Running with --allow-all (no permission prompts)" -ForegroundColor Cyan
Write-Host ""

# Start backend with all permissions (no prompts)
deno run --allow-all src/concept_server.ts --port 8000 --baseUrl /api
