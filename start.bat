@echo off
rem 启动本地标注编辑服务：自动打开浏览器，编辑后可直接写回 annotations.js
cd /d "%~dp0"
start "" http://127.0.0.1:8788/index.html
node server.js
pause
