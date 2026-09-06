@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  call npm install
  if errorlevel 1 exit /b 1
)

node scripts/export-pdf.mjs %*
exit /b %errorlevel%
