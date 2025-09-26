@echo off
echo 🚀 CONFIGURACIÓN AUTOMÁTICA DE MYSQL PARA TEMPLATE_APP
echo.

REM Verificar si MySQL está instalado
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ MySQL no está instalado en el sistema
    echo.
    echo 📋 OPCIONES DE INSTALACIÓN:
    echo 1. Descargar MySQL desde: https://dev.mysql.com/downloads/installer/
    echo 2. Usar chocolatey: choco install mysql
    echo 3. Usar winget: winget install Oracle.MySQL
    echo.
    pause
    exit /b 1
)

echo ✅ MySQL encontrado en el sistema
echo.

REM Verificar si el servicio MySQL está corriendo
net start | findstr -i mysql >nul
if %errorlevel% neq 0 (
    echo 🔄 Intentando iniciar el servicio MySQL...
    net start mysql
    if %errorlevel% neq 0 (
        echo ❌ No se pudo iniciar MySQL. Verifica la instalación.
        pause
        exit /b 1
    )
)

echo ✅ Servicio MySQL está corriendo
echo.

REM Crear las bases de datos necesarias
echo 🗄️  Creando bases de datos...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS template_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS template_app_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS template_app_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo.
echo ✅ Configuración completada
echo 📋 SIGUIENTES PASOS:
echo 1. Edita el archivo .env con tu contraseña de MySQL
echo 2. Ejecuta: python run.py
echo.
pause