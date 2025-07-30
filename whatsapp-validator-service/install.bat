@echo off
echo ========================================
echo    WhatsApp Validator Service
echo    CRM Pietra Fina - Instalacion
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado: 
node --version

echo.
echo Instalando dependencias...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Error al instalar dependencias
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Instalacion completada!
echo ========================================
echo.
echo Para iniciar el servicio:
echo   npm start
echo.
echo Para desarrollo:
echo   npm run dev
echo.
echo Pagina de estado:
echo   http://localhost:3000
echo.
pause 