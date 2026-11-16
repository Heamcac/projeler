@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows-local.ps1" -Action Start -OpenBrowser
if errorlevel 1 pause
