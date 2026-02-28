@echo off
chcp 65001 >nul
echo ========================================
echo   Museum 3D Exhibition System
echo   Build Script
echo ========================================
echo.

echo [1/4] Building frontend...
call npm run build
if errorlevel 1 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Checking PyInstaller...
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo Installing PyInstaller...
    pip install pyinstaller
)

echo.
echo [3/4] Cleaning old build files...
if exist "build" rmdir /s /q "build"
if exist "dist\Museum3D.exe" del /q "dist\Museum3D.exe"

echo.
echo [4/4] Building executable...
pyinstaller museum.spec --clean
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build completed successfully!
echo   Executable: dist\Museum3D.exe
echo ========================================
echo.
echo You can now run the application by:
echo   1. Navigate to dist folder
echo   2. Run Museum3D.exe
echo.
pause
