@echo off
rem ---------------------------------------------------------------------------
rem  BlueKnight Panel - double-clickable deploy launcher.
rem
rem  Double-click from Explorer or a Desktop shortcut to get the interactive
rem  picker. Passes any arguments straight through, so a shortcut can pin one
rem  target:  BlueKnight-Deploy.cmd cloudflare
rem  Validate: BlueKnight-Deploy.cmd --check
rem  Native:   BlueKnight-Deploy.cmd native --host=vpn.example.com --prepare-only
rem  Pass arguments for unattended use; only the double-click menu pauses.
rem ---------------------------------------------------------------------------
setlocal EnableExtensions

rem UTF-8 so the checkmarks and arrows in the output render correctly.
chcp 65001 >nul 2>&1
title BlueKnight Panel - Deploy

rem Explorer launches double-clicked files from C:\Windows\System32, so anchor
rem the working directory to this file's folder or every relative path breaks.
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Node.js was not found on PATH.
  echo.
  echo   Install Node 24 LTS ^(minimum 22^) from https://nodejs.org
  echo   then double-click this file again.
  echo.
  if "%~1"=="" pause
  exit /b 1
)

if not exist "deploy.mjs" (
  echo.
  echo   deploy.mjs is missing from:
  echo     %CD%
  echo.
  echo   Keep this launcher in the BlueKnight project folder.
  echo.
  if "%~1"=="" pause
  exit /b 1
)

node deploy.mjs %*
set "EXITCODE=%ERRORLEVEL%"

echo.
if "%EXITCODE%"=="0" (
  echo   Finished.
) else (
  echo   Finished with errors ^(exit code %EXITCODE%^).
)
echo.
if "%~1"=="" (
  echo   Press any key to close this window.
  pause >nul
)
exit /b %EXITCODE%
