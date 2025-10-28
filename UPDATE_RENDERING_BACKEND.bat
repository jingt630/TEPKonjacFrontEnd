@echo off
echo.
echo ========================================
echo   Update Rendering Backend
echo   (Replace Old Outputs Feature)
echo ========================================
echo.
echo This will copy the updated backend file
echo that keeps only the latest render output.
echo.
pause

echo.
echo [1/1] Copying updated backend file...
copy /Y concepts\Rendering\RenderingSimpleInstructions.ts concepts\Rendering\Rendering.ts

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Backend Updated
    echo ========================================
    echo.
    echo What changed:
    echo  - Old render outputs are now deleted
    echo  - Only latest render is kept per image
    echo  - Cleaner database and UI
    echo.
    echo Next step:
    echo  1. Restart your backend
    echo     deno run --allow-all server.ts
    echo.
    echo  2. Test: Render same image twice
    echo     You should see only 1 output!
    echo.
    echo Read REPLACE_OLD_RENDER_OUTPUTS.md for details.
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   ERROR: Copy failed
    echo ========================================
    echo Please check the file path and try again.
)

echo.
pause
