@echo off
title Quad Cell - Local Server
color 0A
echo ==========================================
echo   QUAD CELL - Local Server
echo ==========================================
echo.
echo Starting server... please wait.
echo.
cd /d "c:\Users\AC\OneDrive\Desktop\5\quad-cell"
echo Trying npx serve...
npx serve dist -p 4000 --no-clipboard
echo.
echo If the above failed, trying Python...
python -m http.server 4000 --directory dist
echo.
pause
