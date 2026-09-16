@echo off
setlocal enabledelayedexpansion

title gschan Setup ^& Launcher

echo.
echo    ____ _____ ____ _   _    _    _   _ 
echo   / ___/ ___// ___^| ^| ^| ^|  / \  ^| \ ^| ^|
echo  ^| ^|  _\___ \ ^|   ^| ^|_^| ^| / _ \ ^|  \^| ^|
echo  ^| ^|_^| ^|___) ^| ^|__^|  _  ^|/ ___ \^| ^|\  ^|
echo   \____^|____/ \____^|_^| ^|_/_/   \_\_^| \_^|
echo.
echo  gschan Setup ^& Dev Launcher
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js (v18 or newer) from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js detected: !NODE_VER!

:: 2. Check for pnpm or npm
where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    set PKG_MGR=pnpm
    for /f "tokens=*" %%v in ('pnpm -v') do set PKG_VER=%%v
    echo [OK] Package manager: pnpm !PKG_VER!
) else (
    where npm >nul 2>nul
    if %errorlevel% equ 0 (
        set PKG_MGR=npm
        for /f "tokens=*" %%v in ('npm -v') do set PKG_VER=%%v
        echo [OK] Package manager: npm !PKG_VER!
    ) else (
        echo [ERROR] Neither pnpm nor npm was found in PATH.
        echo Please ensure Node.js is properly installed.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo [1/3] Installing dependencies with !PKG_MGR!...
call !PKG_MGR! install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Dependency installation failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Launching interactive setup wizard...
call !PKG_MGR! run setup
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Setup script encountered an issue.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Starting development server...
call !PKG_MGR! run dev
