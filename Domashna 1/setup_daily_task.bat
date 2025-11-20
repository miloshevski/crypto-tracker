@echo off
REM Setup Windows Task Scheduler for daily crypto data update
REM Run this script as Administrator

echo ================================================
echo Setting up Daily Crypto Update Task
echo ================================================

set SCRIPT_DIR=%~dp0
set PYTHON_PATH=python
set DAILY_SCRIPT=%SCRIPT_DIR%daily_update.py
set TASK_NAME=CryptoTrackerDailyUpdate

echo Script directory: %SCRIPT_DIR%
echo Python path: %PYTHON_PATH%
echo Daily script: %DAILY_SCRIPT%

echo.
echo Creating Windows Task Scheduler job...
echo Task will run daily at 00:00 (midnight)
echo.

REM Delete existing task if it exists
schtasks /Delete /TN "%TASK_NAME%" /F 2>nul

REM Create new task
schtasks /Create ^
  /TN "%TASK_NAME%" ^
  /TR "%PYTHON_PATH% \"%DAILY_SCRIPT%\"" ^
  /SC DAILY ^
  /ST 00:00 ^
  /RU "%USERNAME%" ^
  /RL HIGHEST

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo SUCCESS! Daily update task created
    echo ================================================
    echo.
    echo Task Name: %TASK_NAME%
    echo Schedule: Daily at 00:00
    echo Script: %DAILY_SCRIPT%
    echo.
    echo To view the task:
    echo   - Open Task Scheduler
    echo   - Look for "%TASK_NAME%"
    echo.
    echo To manually run the task:
    echo   schtasks /Run /TN "%TASK_NAME%"
    echo.
    echo To delete the task:
    echo   schtasks /Delete /TN "%TASK_NAME%" /F
    echo.
) else (
    echo.
    echo ================================================
    echo ERROR! Failed to create task
    echo ================================================
    echo.
    echo Make sure to run this script as Administrator
    echo Right-click and select "Run as administrator"
    echo.
)

pause
