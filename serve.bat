@echo off
REM -----------------------------------------------------------------------------
REM serve.bat
REM Simple batch script to serve this directory over HTTP on port 8000
REM Usage: Double-click this file. Requires Python 3 in PATH.
REM -----------------------------------------------------------------------------
REM Change to script directory
cd /d "%~dp0"

echo -----------------------------------------------------------------------------
echo Serving directory: "%cd%"
echo Open http://localhost:8000 in your browser
echo -----------------------------------------------------------------------------

REM Launch default browser to the URL
start "" "http://localhost:8000"

REM Start Python HTTP server
python -m http.server 8000
if ERRORLEVEL 1 (
    REM Fallback to Windows Python launcher if available
    py -3 -m http.server 8000
)

echo HTTP server stopped. Press any key to exit.
pause >nul