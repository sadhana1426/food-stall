@echo off
title Tasty Bites - Development Client
cd /d "C:\Users\tammi\Downloads\food-stall-main\food-stall-main\expo-app"

set "ANDROID_HOME=C:\TastyBitesBuild\android-sdk"
set "ANDROID_SDK_ROOT=C:\TastyBitesBuild\android-sdk"
set "PATH=C:\TastyBitesBuild\android-sdk\platform-tools;%PATH%"

echo ========================================================
echo  Starting Tasty Bites (Dev Client Mode with QR Code)...
echo ========================================================
echo.

npx.cmd expo start --dev-client --clear

pause
