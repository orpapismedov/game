@echo off
echo.
echo ================================
echo   Doggo Run - Asset Setup
echo ================================
echo.
echo This script will help you set up your game assets.
echo.
echo Please rename and copy your images to the public/assets/ folder:
echo.
echo Your attached images should be renamed as follows:
echo   - momi.png (your main character dog)
echo   - dog1.png (enemy dog 1) 
echo   - dog2.png (enemy dog 2)
echo   - dog3.png (enemy dog 3)
echo   - dog4.png (enemy dog 4)
echo   - food.png (dog food collectible)
echo.
echo The assets folder is located at:
echo   %~dp0public\assets\
echo.
echo After copying your images:
echo   1. Run: npm install
echo   2. Run: npm run dev
echo   3. Open: http://localhost:3000
echo.
echo For mobile testing, use your computer's IP address:
echo   Example: http://192.168.1.100:3000
echo.
pause