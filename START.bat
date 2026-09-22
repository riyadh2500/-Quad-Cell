@echo off
title Quad Cell Server
color 0A
echo.
echo  ================================
echo   QUAD CELL - Starting...
echo   Open: http://localhost:4000
echo   Keep this window OPEN!
echo  ================================
echo.
cd /d "%~dp0"
node server.js
echo.
echo Server stopped. Press any key to exit.
pause > nul
