Write-Host ""
Write-Host "========================================"
Write-Host "   Canvas Rendering Setup"
Write-Host "========================================"
Write-Host ""
Write-Host "This will:"
Write-Host "  1. Copy RenderingSimpleInstructions.ts to Rendering.ts"
Write-Host "  2. Enable canvas-based rendering"
Write-Host ""

$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Setup cancelled."
    exit
}

Write-Host ""
Write-Host "[1/1] Copying backend file..." -ForegroundColor Cyan

$source = "concepts\Rendering\RenderingSimpleInstructions.ts"
$dest = "concepts\Rendering\Rendering.ts"

try {
    Copy-Item -Path $source -Destination $dest -Force

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   SUCCESS! Setup Complete" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Restart your backend: deno run --allow-all server.ts"
    Write-Host "  2. Test the HTML file: start test-canvas-rendering.html"
    Write-Host "  3. Use the app normally to render images"
    Write-Host ""
    Write-Host "Read CANVAS_RENDERING_SETUP_COMPLETE.md for details!" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Green

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   ERROR: Copy failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Please check the file exists and try again."
}

Write-Host ""
Read-Host "Press Enter to exit"
