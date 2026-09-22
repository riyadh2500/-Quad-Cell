@echo off
title Quad Cell Server
color 0A
echo Starting Quad Cell at http://localhost:4000
echo Keep this window open!
cd /d "c:\Users\AC\OneDrive\Desktop\5\quad-cell\dist"
python -m http.server 4000
pause
