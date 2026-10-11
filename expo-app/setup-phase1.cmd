@echo off
cd /d "C:\Users\pc\OneDrive\Desktop\food\expo-app"
echo Node Version:
node -v
echo NPM Version:
npm -v
echo Installing dependencies...
call npm install
echo Aligning Expo dependencies...
call npx expo install --fix
echo Running Expo Doctor...
call npx expo-doctor
echo Running TypeScript validation...
call npx tsc --noEmit
echo Setup complete.
pause
