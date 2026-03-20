@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo.
echo   ========================================
echo     Datenschutz-Tool - Installation
echo     DSGVO Compliance Manager
echo   ========================================
echo.

:: ─── Node.js prüfen ─────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] Node.js nicht gefunden.
    echo       Bitte installieren: https://nodejs.org/
    echo       Mindestens Version 18 erforderlich.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo   [OK] Node.js %NODE_VER% gefunden

:: ─── Git prüfen ─────────────────────────────────────────
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo   [!] Git nicht gefunden.
    echo       Bitte installieren: https://git-scm.com/
    echo.
    pause
    exit /b 1
)
echo   [OK] Git gefunden

:: ─── Zielverzeichnis ────────────────────────────────────
set "INSTALL_DIR=%USERPROFILE%\Desktop\datenschutz-tool"

if "%~1" neq "" (
    set "INSTALL_DIR=%~1"
)

echo.
echo   Installationsverzeichnis: %INSTALL_DIR%
echo.

:: ─── Repository klonen oder aktualisieren ───────────────
if exist "%INSTALL_DIR%\.git" (
    echo   Repository existiert bereits, aktualisiere...
    cd /d "%INSTALL_DIR%"
    git pull --ff-only
    if %errorlevel% neq 0 (
        echo   [!] Git pull fehlgeschlagen. Bitte manuell pruefen.
        pause
        exit /b 1
    )
    echo   [OK] Repository aktualisiert
) else (
    echo   Klone Repository...
    git clone --depth 1 "%REPO_URL%" "%INSTALL_DIR%" 2>nul
    if %errorlevel% neq 0 (
        :: Falls kein Remote-Repo: lokale Kopie
        echo   Kein Remote-Repository verfuegbar, kopiere lokal...
        if exist "%~dp0package.json" (
            xcopy /E /I /Y "%~dp0" "%INSTALL_DIR%" >nul 2>&1
            echo   [OK] Dateien kopiert
        ) else (
            echo   [!] Keine Quelldateien gefunden.
            pause
            exit /b 1
        )
    ) else (
        echo   [OK] Repository geklont
    )
)

cd /d "%INSTALL_DIR%"

:: ─── Installation starten ───────────────────────────────
echo.
echo   Starte Installation...
echo.
node install.js

if %errorlevel% neq 0 (
    echo.
    echo   [!] Installation fehlgeschlagen.
    pause
    exit /b 1
)

echo.
echo   Installation abgeschlossen!
echo   Starten mit: START.bat im Ordner %INSTALL_DIR%
echo.
pause
