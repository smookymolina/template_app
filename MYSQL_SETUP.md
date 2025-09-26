# 🔧 Configuración MySQL - Template App

## 🚀 Solución Rápida (5 Pasos)

### 1️⃣ Instalar MySQL
```bash
# Opción A: Descarga directa
# https://dev.mysql.com/downloads/installer/

# Opción B: Chocolatey
choco install mysql

# Opción C: Winget
winget install Oracle.MySQL
```

### 2️⃣ Iniciar Servicio MySQL
```bash
net start mysql
```

### 3️⃣ Configurar Variables de Entorno
Edita el archivo `.env` con tus credenciales:
```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_password_mysql
MYSQL_DB=template_app
```

### 4️⃣ Ejecutar Script de Inicialización
```bash
python init_db.py
```

### 5️⃣ Ejecutar la Aplicación
```bash
python run.py
```

## 🛠️ Scripts Disponibles

- `setup_mysql.bat` - Configuración automática (Windows)
- `init_db.py` - Inicialización de base de datos
- `.env.example` - Plantilla de configuración

## ❌ Solución de Problemas

### Error: "Can't connect to MySQL server"
1. ✅ Verificar que MySQL esté corriendo: `net start mysql`
2. ✅ Revisar credenciales en `.env`
3. ✅ Crear bases de datos manualmente:
   ```sql
   CREATE DATABASE template_app CHARACTER SET utf8mb4;
   CREATE DATABASE template_app_dev CHARACTER SET utf8mb4;
   CREATE DATABASE template_app_test CHARACTER SET utf8mb4;
   ```

### Error: "Access denied for user"
1. ✅ Verificar usuario y contraseña en `.env`
2. ✅ Crear usuario MySQL con permisos:
   ```sql
   CREATE USER 'template_user'@'localhost' IDENTIFIED BY 'password';
   GRANT ALL PRIVILEGES ON template_app*.* TO 'template_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

## 📊 Configuración Actual

Tu aplicación ya está configurada para MySQL con:
- ✅ PyMySQL como driver
- ✅ Pool de conexiones optimizado
- ✅ Soporte para múltiples entornos
- ✅ Migración automática desde SQLite