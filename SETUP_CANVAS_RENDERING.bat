@echo off
echo.
echo ========================================
echo   Canvas Rendering Setup
echo ========================================
echo.
echo This will:
echo  1. Copy RenderingSimpleInstructions.ts to Rendering.ts
echo  2. Enable canvas-based rendering
echo.
pause

echo.
echo [1/1] Copying backend file...
copy /Y concepts\Rendering\RenderingSimpleInstructions.ts concepts\Rendering\Rendering.ts

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Setup Complete
    echo ========================================
    echo.
    echo Next steps:
    echo  1. Restart your backend: deno run --allow-all server.ts
    echo  2. Test the HTML file: start test-canvas-rendering.html
    echo  3. Use the app normally to render images
    echo.
    echo Read CANVAS_RENDERING_SETUP_COMPLETE.md for details!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   ERROR: Copy failed
    echo ========================================
    echo Please check the file exists and try again.
)

echo.
pause
