@echo off
setlocal
cd /d "%~dp0"
echo Updating, building, and launching Zen Writer...
echo.
npm run app:update:open
if errorlevel 1 (
  echo.
  echo Zen Writer update-and-launch stopped. No local changes were discarded.
  echo Review the message above, then press any key to close this window.
  pause >nul
  exit /b 1
)
exit /b 0
