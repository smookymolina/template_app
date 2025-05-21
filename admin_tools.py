#!/usr/bin/env python3
"""
Sistema de Gestión de Reclutas - Herramienta de Administración
---------------------------------------------------------
Herramienta para gestionar usuarios administradores y gerentes.
Permite crear, listar, modificar y eliminar usuarios.
"""

import os
import sys
import time
import getpass
import logging
import re
from datetime import datetime
import hashlib
import secrets

# Configurar logging
LOG_FILE = "admin_activity.log"
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
try:
    # Usar la nueva estructura de importación
    print("Intentando importar desde app_factory...")
    
    # Monkey patch para evitar la necesidad de flask_cors
    import sys
    import types
    mock_module = types.ModuleType('flask_cors')
    mock_module.CORS = lambda app, **kwargs: None
    sys.modules['flask_cors'] = mock_module
    
    # Ahora importamos normalmente
    from app_factory import create_app
    print("Importando Usuario desde models.usuario...")
    from models.usuario import Usuario
    print("Importando db desde models...")
    from models import db
    
    print("Creando aplicación con contexto...")
    app = create_app('development')
    print("Aplicación creada exitosamente")
except ImportError as e:
    print(f"Error detallado de importación: {e}")
    # Mostrar los paths donde Python está buscando módulos
    print("\nPaths de búsqueda de Python:")
    for p in sys.path:
        print(f"  - {p}")
    print("\nAsegúrate de que este script esté en la carpeta raíz del proyecto")
    sys.exit(1)

# Colores para la terminal
class Color:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Configuración de seguridad para el script
ADMIN_PASSWORD_HASH_FILE = ".admin_hash"
MAX_LOGIN_ATTEMPTS = 3

def clear_screen():
    """Limpia la pantalla de la terminal"""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header(text):
    """Imprime un encabezado formateado"""
    print(f"\n{Color.HEADER}{Color.BOLD}{'=' * 50}{Color.ENDC}")
    print(f"{Color.HEADER}{Color.BOLD}{text.center(50)}{Color.ENDC}")
    print(f"{Color.HEADER}{Color.BOLD}{'=' * 50}{Color.ENDC}\n")

def print_success(message):
    """Imprime un mensaje de éxito"""
    print(f"{Color.GREEN}✓ {message}{Color.ENDC}")

def print_error(message):
    """Imprime un mensaje de error"""
    print(f"{Color.RED}✗ ERROR: {message}{Color.ENDC}")

def print_warning(message):
    """Imprime un mensaje de advertencia"""
    print(f"{Color.YELLOW}⚠ {message}{Color.ENDC}")

def print_info(message):
    """Imprime un mensaje informativo"""
    print(f"{Color.BLUE}ℹ {message}{Color.ENDC}")

def validate_email(email):
    """Valida que el correo electrónico tenga un formato correcto"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Valida que la contraseña cumpla con los requisitos mínimos"""
    if len(password) < 6:
        return False, "La contraseña debe tener al menos 6 caracteres"
    
    # Puedes agregar más validaciones según tus requisitos
    return True, ""

def confirm_action(message):
    """Solicita confirmación para una acción"""
    response = input(f"{Color.YELLOW}{message} (s/n): {Color.ENDC}").lower()
    return response == 's'

def log_activity(activity, success=True, details=None):
    """Registra una actividad en el log"""
    status = "ÉXITO" if success else "FALLO"
    log_message = f"{status}: {activity}"
    if details:
        log_message += f" - {details}"
    
    logging.info(log_message)

def crear_usuario():
    """Crea un nuevo usuario administrador/gerente"""
    print_header("Crear Nuevo Usuario")
    
    # Solicitar email
    while True:
        email = input("Email del nuevo usuario: ")
        if not email:
            print_warning("El email no puede estar vacío")
            continue
            
        if not validate_email(email):
            print_error("El formato del email no es válido")
            continue
            
        # Verificar si ya existe
        with app.app_context():
            if Usuario.query.filter_by(email=email).first():
                print_error(f"Ya existe un usuario con el email {email}")
                if not confirm_action("¿Deseas intentar con otro email?"):
                    return
                continue
            break
    
    # Solicitar y confirmar contraseña
    while True:
        password = getpass.getpass("Contraseña: ")
        valid, message = validate_password(password)
        if not valid:
            print_error(message)
            continue
            
        confirm_password = getpass.getpass("Confirmar contraseña: ")
        if password != confirm_password:
            print_error("Las contraseñas no coinciden")
            continue
        break
    
    # Confirmar creación
    print("\nDatos del nuevo usuario:")
    print(f"Email: {Color.BOLD}{email}{Color.ENDC}")
    
    if not confirm_action("¿Confirmas la creación de este usuario?"):
        print_info("Operación cancelada")
        log_activity("Intento de creación de usuario cancelado", success=False, details=f"Email: {email}")
        return
    
    # Crear el usuario
    try:
        with app.app_context():
            nuevo_usuario = Usuario(email=email)
            nuevo_usuario.password = password
            db.session.add(nuevo_usuario)
            db.session.commit()
            
            print_success(f"Usuario {email} creado exitosamente")
            log_activity("Usuario creado", details=f"Email: {email}")
            
            # Mostrar datos para referencia
            usuario = Usuario.query.filter_by(email=email).first()
            print_info(f"ID asignado: {usuario.id}")
    except Exception as e:
        print_error(f"No se pudo crear el usuario: {str(e)}")
        log_activity("Error al crear usuario", success=False, details=f"Email: {email}, Error: {str(e)}")
    
    input("\nPresiona Enter para continuar...")

def listar_usuarios():
    """Lista todos los usuarios administradores/gerentes"""
    print_header("Listado de Usuarios")
    
    try:
        with app.app_context():
            usuarios = Usuario.query.all()
            
            if not usuarios:
                print_info("No hay usuarios registrados en el sistema")
                log_activity("Listado de usuarios", details="No hay usuarios")
                input("\nPresiona Enter para continuar...")
                return
            
            # Encabezado de la tabla
            print(f"{Color.BOLD}{'ID':<5}| {'EMAIL':<40}| {'FECHA REGISTRO':<20}{Color.ENDC}")
            print("-" * 67)
            
            # Contenido de la tabla
            for usuario in usuarios:
                # Obtener fecha de registro si está disponible
                fecha = getattr(usuario, 'created_at', 'No disponible')
                print(f"{usuario.id:<5}| {usuario.email:<40}| {fecha}")
            
            print("-" * 67)
            print(f"Total: {len(usuarios)} usuarios")
            
            log_activity("Listado de usuarios", details=f"Total: {len(usuarios)}")
    except Exception as e:
        print_error(f"Error al listar usuarios: {str(e)}")
        log_activity("Error al listar usuarios", success=False, details=str(e))
    
    input("\nPresiona Enter para continuar...")

def eliminar_usuario():
    """Elimina un usuario existente"""
    print_header("Eliminar Usuario")
    
    # Listar usuarios primero
    try:
        with app.app_context():
            usuarios = Usuario.query.all()
            
            if not usuarios:
                print_info("No hay usuarios registrados en el sistema")
                input("\nPresiona Enter para continuar...")
                return
            
            # Mostrar lista de usuarios
            print(f"{Color.BOLD}{'ID':<5}| {'EMAIL':<40}{Color.ENDC}")
            print("-" * 46)
            
            for usuario in usuarios:
                print(f"{usuario.id:<5}| {usuario.email}")
            
            print("-" * 46)
            
            # Solicitar ID para eliminar
            while True:
                try:
                    id_input = input("\nID del usuario a eliminar (0 para cancelar): ")
                    if not id_input:
                        continue
                        
                    id_usuario = int(id_input)
                    if id_usuario == 0:
                        print_info("Operación cancelada")
                        return
                    
                    usuario = Usuario.query.get(id_usuario)
                    if not usuario:
                        print_error(f"No existe un usuario con ID {id_usuario}")
                        if not confirm_action("¿Deseas intentar con otro ID?"):
                            return
                        continue
                    break
                except ValueError:
                    print_error("Debes ingresar un número válido")
            
            # Confirmar eliminación
            print(f"\nVas a eliminar el usuario: {Color.BOLD}{usuario.email}{Color.ENDC}")
            print_warning("Esta acción no se puede deshacer")
            
            if not confirm_action("¿Estás SEGURO de que deseas eliminar este usuario?"):
                print_info("Operación cancelada")
                log_activity("Intento de eliminación de usuario cancelado", success=False, details=f"ID: {id_usuario}, Email: {usuario.email}")
                return
            
            # Solicitar confirmación adicional para mayor seguridad
            confirmation = input(f"Para confirmar, escribe el email '{usuario.email}': ")
            if confirmation != usuario.email:
                print_error("La confirmación no coincide. Operación cancelada.")
                log_activity("Confirmación fallida para eliminación de usuario", success=False, details=f"ID: {id_usuario}, Email: {usuario.email}")
                return
            
            # Eliminar usuario
            db.session.delete(usuario)
            db.session.commit()
            
            print_success(f"Usuario {usuario.email} eliminado exitosamente")
            log_activity("Usuario eliminado", details=f"ID: {id_usuario}, Email: {usuario.email}")
    except Exception as e:
        print_error(f"Error al eliminar usuario: {str(e)}")
        log_activity("Error al eliminar usuario", success=False, details=str(e))
    
    input("\nPresiona Enter para continuar...")

def cambiar_rol_usuario():
    """Cambia el rol de un usuario existente"""
    print_header("Cambiar Rol de Usuario")
    
    # Definir roles válidos
    roles_validos = ['admin', 'asesor', 'user']
    
    try:
        with app.app_context():
            usuarios = Usuario.query.all()
            
            if not usuarios:
                print_info("No hay usuarios registrados en el sistema")
                input("\nPresiona Enter para continuar...")
                return
            
            # Mostrar lista de usuarios con sus roles actuales
            print(f"{Color.BOLD}{'ID':<5}| {'EMAIL':<40}| {'ROL ACTUAL':<15}{Color.ENDC}")
            print("-" * 62)
            
            for usuario in usuarios:
                rol_actual = getattr(usuario, 'rol', 'user')  # Default a 'user' si no tiene rol
                print(f"{usuario.id:<5}| {usuario.email:<40}| {rol_actual:<15}")
            
            print("-" * 62)
            
            # Solicitar ID para cambiar rol
            while True:
                try:
                    id_input = input("\nID del usuario para cambiar rol (0 para cancelar): ")
                    if not id_input:
                        continue
                        
                    id_usuario = int(id_input)
                    if id_usuario == 0:
                        print_info("Operación cancelada")
                        return
                    
                    usuario = Usuario.query.get(id_usuario)
                    if not usuario:
                        print_error(f"No existe un usuario con ID {id_usuario}")
                        if not confirm_action("¿Deseas intentar con otro ID?"):
                            return
                        continue
                    break
                except ValueError:
                    print_error("Debes ingresar un número válido")
            
            # Obtener rol actual
            rol_actual = getattr(usuario, 'rol', 'user')
            print(f"\nUsuario seleccionado: {Color.BOLD}{usuario.email}{Color.ENDC}")
            print(f"Rol actual: {Color.BOLD}{rol_actual}{Color.ENDC}")
            
            # Solicitar nuevo rol
            print("\nRoles disponibles:")
            for i, rol in enumerate(roles_validos, 1):
                print(f"{i}. {rol}")
                
            while True:
                try:
                    opcion = int(input("\nSelecciona el nuevo rol (1-3): "))
                    if 1 <= opcion <= len(roles_validos):
                        nuevo_rol = roles_validos[opcion-1]
                        break
                    else:
                        print_error(f"Selecciona una opción entre 1 y {len(roles_validos)}")
                except ValueError:
                    print_error("Debes ingresar un número válido")
            
            # Confirmar cambio
            if nuevo_rol == rol_actual:
                print_warning(f"El usuario ya tiene el rol de {nuevo_rol}")
                if not confirm_action("¿Deseas continuar con el cambio de todas formas?"):
                    print_info("Operación cancelada")
                    return
            
            # Realizar cambio
            usuario.rol = nuevo_rol
            db.session.commit()
            
            print_success(f"Rol actualizado exitosamente: {usuario.email} ahora es {nuevo_rol}")
            log_activity(f"Cambio de rol de usuario", details=f"ID: {id_usuario}, Email: {usuario.email}, Nuevo rol: {nuevo_rol}")
            
    except Exception as e:
        print_error(f"Error al cambiar rol de usuario: {str(e)}")
        log_activity("Error al cambiar rol de usuario", success=False, details=str(e))
    
    input("\nPresiona Enter para continuar...")

def cambiar_password():
    """Cambia la contraseña de un usuario existente"""
    print_header("Cambiar Contraseña")
    
    # Listar usuarios primero
    try:
        with app.app_context():
            usuarios = Usuario.query.all()
            
            if not usuarios:
                print_info("No hay usuarios registrados en el sistema")
                input("\nPresiona Enter para continuar...")
                return
            
            # Mostrar lista de usuarios
            print(f"{Color.BOLD}{'ID':<5}| {'EMAIL':<40}{Color.ENDC}")
            print("-" * 46)
            
            for usuario in usuarios:
                print(f"{usuario.id:<5}| {usuario.email}")
            
            print("-" * 46)
            
            # Solicitar ID para cambiar contraseña
            while True:
                try:
                    id_input = input("\nID del usuario para cambiar contraseña (0 para cancelar): ")
                    if not id_input:
                        continue
                        
                    id_usuario = int(id_input)
                    if id_usuario == 0:
                        print_info("Operación cancelada")
                        return
                    
                    usuario = Usuario.query.get(id_usuario)
                    if not usuario:
                        print_error(f"No existe un usuario con ID {id_usuario}")
                        if not confirm_action("¿Deseas intentar con otro ID?"):
                            return
                        continue
                    break
                except ValueError:
                    print_error("Debes ingresar un número válido")
            
            print(f"\nCambiando contraseña para el usuario: {Color.BOLD}{usuario.email}{Color.ENDC}")
            
            # Solicitar y validar nueva contraseña
            while True:
                password = getpass.getpass("Nueva contraseña: ")
                valid, message = validate_password(password)
                if not valid:
                    print_error(message)
                    continue
                    
                confirm_password = getpass.getpass("Confirmar nueva contraseña: ")
                if password != confirm_password:
                    print_error("Las contraseñas no coinciden")
                    continue
                break
            
            # Confirmar cambio
            if not confirm_action("¿Confirmas el cambio de contraseña?"):
                print_info("Operación cancelada")
                log_activity("Intento de cambio de contraseña cancelado", success=False, details=f"ID: {id_usuario}, Email: {usuario.email}")
                return
            
            # Actualizar contraseña
            usuario.password = password
            db.session.commit()
            
            print_success(f"Contraseña actualizada exitosamente para {usuario.email}")
            log_activity("Contraseña actualizada", details=f"ID: {id_usuario}, Email: {usuario.email}")
    except Exception as e:
        print_error(f"Error al cambiar contraseña: {str(e)}")
        log_activity("Error al cambiar contraseña", success=False, details=str(e))
    
    input("\nPresiona Enter para continuar...")

def ver_reclutas_por_asesor():
    """Muestra los reclutas asignados a cada asesor"""
    print_header("Reclutas por Asesor")
    
    try:
        with app.app_context():
            # Importar modelo de Recluta
            from models.recluta import Recluta
            
            # Primero, obtener todos los asesores
            asesores = Usuario.query.filter_by(rol='asesor').all()
            
            if not asesores:
                print_info("No hay usuarios con rol de asesor en el sistema")
                input("\nPresiona Enter para continuar...")
                return
            
            # Mostrar lista de asesores
            print(f"{Color.BOLD}{'ID':<5}| {'EMAIL/NOMBRE':<40}| {'# RECLUTAS':<10}{Color.ENDC}")
            print("-" * 57)
            
            for asesor in asesores:
                # Contar reclutas asignados a este asesor
                num_reclutas = Recluta.query.filter_by(asesor_id=asesor.id).count()
                nombre_mostrar = asesor.nombre if hasattr(asesor, 'nombre') and asesor.nombre else asesor.email
                print(f"{asesor.id:<5}| {nombre_mostrar:<40}| {num_reclutas:<10}")
            
            print("-" * 57)
            
            # Solicitar ID para ver detalle
            id_input = input("\nID del asesor para ver detalle (0 para volver): ")
            if not id_input or id_input == "0":
                return
                
            try:
                id_asesor = int(id_input)
                asesor = Usuario.query.get(id_asesor)
                
                if not asesor:
                    print_error(f"No existe un usuario con ID {id_asesor}")
                    input("\nPresiona Enter para continuar...")
                    return
                
                if asesor.rol != 'asesor':
                    print_warning(f"El usuario seleccionado no tiene rol de asesor (rol actual: {asesor.rol})")
                    if not confirm_action("¿Deseas ver sus reclutas de todas formas?"):
                        return
                
                # Obtener reclutas asignados
                reclutas = Recluta.query.filter_by(asesor_id=id_asesor).all()
                
                if not reclutas:
                    print_info(f"El asesor {asesor.email} no tiene reclutas asignados")
                    input("\nPresiona Enter para continuar...")
                    return
                
                # Mostrar reclutas
                print(f"\n{Color.BOLD}Reclutas asignados a {asesor.email}:{Color.ENDC}")
                print(f"{Color.BOLD}{'ID':<5}| {'NOMBRE':<30}| {'EMAIL':<30}| {'ESTADO':<15}{Color.ENDC}")
                print("-" * 82)
                
                for recluta in reclutas:
                    print(f"{recluta.id:<5}| {recluta.nombre:<30}| {recluta.email:<30}| {recluta.estado:<15}")
                
                print("-" * 82)
                print(f"Total: {len(reclutas)} reclutas")
                
                log_activity("Consulta de reclutas por asesor", details=f"Asesor ID: {id_asesor}, Email: {asesor.email}")
                
            except ValueError:
                print_error("Debes ingresar un número válido")
                
    except Exception as e:
        print_error(f"Error al consultar reclutas por asesor: {str(e)}")
        log_activity("Error al consultar reclutas por asesor", success=False, details=str(e))
    
    input("\nPresiona Enter para continuar...")

def asignar_recluta():
    """Asigna o reasigna un recluta a un asesor"""
    print_header("Asignar Recluta a Asesor")
    
    try:
        with app.app_context():
            # Importar modelo de Recluta
            from models.recluta import Recluta
            
            # Primero, mostrar lista de reclutas sin asignar o filtrar por criterio
            print("Opciones de filtrado:")
            print("1. Ver reclutas sin asesor asignado")
            print("2. Ver todos los reclutas")
            print("3. Buscar recluta por nombre/email")
            
            opcion = input("\nSelecciona una opción (1-3): ")
            
            if opcion == "1":
                reclutas = Recluta.query.filter_by(asesor_id=None).all()
                filtro_desc = "sin asesor asignado"
            elif opcion == "2":
                reclutas = Recluta.query.all()
                filtro_desc = "todos"
            elif opcion == "3":
                busqueda = input("Introduce nombre o email a buscar: ")
                reclutas = Recluta.query.filter(
                    db.or_(
                        Recluta.nombre.like(f"%{busqueda}%"),
                        Recluta.email.like(f"%{busqueda}%")
                    )
                ).all()
                filtro_desc = f"con coincidencia de '{busqueda}'"
            else:
                print_error("Opción no válida")
                return
            
            if not reclutas:
                print_info(f"No se encontraron reclutas {filtro_desc}")
                input("\nPresiona Enter para continuar...")
                return
            
            # Mostrar reclutas encontrados
            print(f"\n{Color.BOLD}Reclutas {filtro_desc}:{Color.ENDC}")
            print(f"{Color.BOLD}{'ID':<5}| {'NOMBRE':<30}| {'EMAIL':<30}| {'ASESOR ACTUAL':<20}{Color.ENDC}")
            print("-" * 87)
            
            for recluta in reclutas:
                # Obtener nombre del asesor actual si existe
                asesor_actual = "Sin asignar"
                if recluta.asesor_id:
                    asesor = Usuario.query.get(recluta.asesor_id)
                    if asesor:
                        asesor_actual = asesor.email
                
                print(f"{recluta.id:<5}| {recluta.nombre:<30}| {recluta.email:<30}| {asesor_actual:<20}")
            
            print("-" * 87)
            print(f"Total: {len(reclutas)} reclutas")
            
            # Solicitar ID del recluta a asignar
            while True:
                try:
                    id_input = input("\nID del recluta a asignar (0 para cancelar): ")
                    if not id_input:
                        continue
                        
                    id_recluta = int(id_input)
                    if id_recluta == 0:
                        print_info("Operación cancelada")
                        return
                    
                    recluta = Recluta.query.get(id_recluta)
                    if not recluta:
                        print_error(f"No existe un recluta con ID {id_recluta}")
                        if not confirm_action("¿Deseas intentar con otro ID?"):
                            return
                        continue
                    break
                except ValueError:
                    print_error("Debes ingresar un número válido")
            
            # Obtener asesor actual si existe
            asesor_actual_id = recluta.asesor_id
            asesor_actual_nombre = "Sin asignar"
            if asesor_actual_id:
                asesor_actual = Usuario.query.get(asesor_actual_id)
                if asesor_actual:
                    asesor_actual_nombre = asesor_actual.email
            
            print(f"\nRecluta seleccionado: {Color.BOLD}{recluta.nombre} ({recluta.email}){Color.ENDC}")
            print(f"Asesor actual: {Color.BOLD}{asesor_actual_nombre}{Color.ENDC}")
            
            # Mostrar lista de asesores disponibles
            asesores = Usuario.query.filter(Usuario.rol.in_(['admin', 'asesor'])).all()
            
            if not asesores:
                print_error("No hay usuarios con rol de asesor o admin en el sistema")
                input("\nPresiona Enter para continuar...")
                return
            
            print(f"\n{Color.BOLD}Asesores disponibles:{Color.ENDC}")
            print(f"{Color.BOLD}{'ID':<5}| {'EMAIL':<40}| {'ROL':<10}{Color.ENDC}")
            print("-" * 57)
            
            for asesor in asesores:
                print(f"{asesor.id:<5}| {asesor.email:<40}| {asesor.rol:<10}")
            
            print("-" * 57)
            
            # Opción para desasignar
            print("\n0. Desasignar (sin asesor)")
            
            # Solicitar ID del asesor
            while True:
                try:
                    id_input = input("\nID del asesor a asignar (0 para desasignar): ")
                    if not id_input:
                        continue
                        
                    id_asesor = int(id_input)
                    
                    if id_asesor == 0:
                        # Desasignar
                        nuevo_asesor_nombre = "Sin asignar"
                        break
                    
                    asesor = Usuario.query.get(id_asesor)
                    if not asesor:
                        print_error(f"No existe un usuario con ID {id_asesor}")
                        if not confirm_action("¿Deseas intentar con otro ID?"):
                            return
                        continue
                    
                    if asesor.rol not in ['admin', 'asesor']:
                        print_warning(f"El usuario seleccionado no tiene rol de asesor o admin (rol actual: {asesor.rol})")
                        if not confirm_action("¿Deseas asignar este recluta de todas formas?"):
                            continue
                    
                    nuevo_asesor_nombre = asesor.email
                    break
                except ValueError:
                    print_error("Debes ingresar un número válido")
            
            # Confirmar asignación
            if id_asesor == asesor_actual_id:
                print_warning(f"El recluta ya está asignado a este asesor")
                if not confirm_action("¿Deseas continuar con la asignación de todas formas?"):
                    print_info("Operación cancelada")
                    return
            
            # Realizar asignación
            recluta.asesor_id = None if id_asesor == 0 else id_asesor
            db.session.commit()
            
            print_success(f"Recluta asignado exitosamente a {nuevo_asesor_nombre}")
            log_activity(f"Asignación de recluta", details=f"Recluta ID: {id_recluta}, Nombre: {recluta.nombre}, Asignado a: {nuevo_asesor_nombre}")
            
    except Exception as e:
        print_error(f"Error al asignar recluta: {str(e)}")
        log_activity("Error al asignar recluta", success=False, details=str(e))
    
    input("\nPresiona Enter para continuar...")

def ver_logs():
    """Muestra los últimos registros de actividad"""
    print_header("Registros de Actividad")
    
    if not os.path.exists(LOG_FILE):
        print_info("No hay registros de actividad disponibles")
        input("\nPresiona Enter para continuar...")
        return
    
    try:
        with open(LOG_FILE, 'r') as f:
            lines = f.readlines()
            
            if not lines:
                print_info("El archivo de registros está vacío")
                input("\nPresiona Enter para continuar...")
                return
            
            # Mostrar las últimas 20 líneas (o menos si hay menos líneas)
            num_lines = min(20, len(lines))
            print(f"Mostrando los últimos {num_lines} registros:")
            print("-" * 80)
            
            for line in lines[-num_lines:]:
                if "ÉXITO" in line:
                    print(f"{Color.GREEN}{line.strip()}{Color.ENDC}")
                elif "FALLO" in line:
                    print(f"{Color.RED}{line.strip()}{Color.ENDC}")
                else:
                    print(line.strip())
            
            print("-" * 80)
    except Exception as e:
        print_error(f"Error al leer los registros: {str(e)}")
    
    input("\nPresiona Enter para continuar...")

def setup_admin_password():
    """Configura o cambia la contraseña del script administrativo"""
    if os.path.exists(ADMIN_PASSWORD_HASH_FILE):
        print_header("Cambiar Contraseña de Administrador")
        
        # Verificar contraseña actual
        current_password = getpass.getpass("Contraseña actual: ")
        with open(ADMIN_PASSWORD_HASH_FILE, 'r') as f:
            stored_hash = f.read().strip()
            salt = stored_hash.split('$')[0]
            computed_hash = salt + '$' + hashlib.sha256((salt + current_password).encode()).hexdigest()
            
            if computed_hash != stored_hash:
                print_error("Contraseña incorrecta")
                log_activity("Intento fallido de cambio de contraseña de administrador", success=False)
                return
    else:
        print_header("Configuración Inicial de Seguridad")
        print_info("Esta es la primera vez que ejecutas esta herramienta.")
        print_info("Debes configurar una contraseña de administrador para proteger el acceso.")
    
    # Solicitar nueva contraseña
    while True:
        new_password = getpass.getpass("Nueva contraseña: ")
        valid, message = validate_password(new_password)
        if not valid:
            print_error(message)
            continue
            
        confirm_password = getpass.getpass("Confirmar nueva contraseña: ")
        if new_password != confirm_password:
            print_error("Las contraseñas no coinciden")
            continue
        break
    
    # Guardar la nueva contraseña con salt
    salt = secrets.token_hex(8)
    password_hash = salt + '$' + hashlib.sha256((salt + new_password).encode()).hexdigest()
    
    with open(ADMIN_PASSWORD_HASH_FILE, 'w') as f:
        f.write(password_hash)
    
    print_success("Contraseña de administrador configurada correctamente")
    log_activity("Contraseña de administrador actualizada")

def verificar_admin_password():
    """Verifica la contraseña de administrador al inicio"""
    if not os.path.exists(ADMIN_PASSWORD_HASH_FILE):
        setup_admin_password()
        return True
    
    attempts = 0
    while attempts < MAX_LOGIN_ATTEMPTS:
        password = getpass.getpass("Contraseña de administrador: ")
        
        with open(ADMIN_PASSWORD_HASH_FILE, 'r') as f:
            stored_hash = f.read().strip()
            salt = stored_hash.split('$')[0]
            computed_hash = salt + '$' + hashlib.sha256((salt + password).encode()).hexdigest()
            
            if computed_hash == stored_hash:
                log_activity("Inicio de sesión exitoso en herramienta de administración")
                return True
        
        attempts += 1
        remaining = MAX_LOGIN_ATTEMPTS - attempts
        print_error(f"Contraseña incorrecta. Intentos restantes: {remaining}")
        log_activity("Intento fallido de inicio de sesión en herramienta de administración", success=False)
    
    print_error("Número máximo de intentos superado. El programa se cerrará.")
    log_activity("Número máximo de intentos de inicio de sesión superado", success=False)
    return False

def menu_principal():
    """Menú principal del script de administración"""
    while True:
        clear_screen()
        print_header("Sistema de Gestión de Reclutas - Administración")
        
        print(f"{Color.BOLD}=== Gestión de Usuarios ==={Color.ENDC}")
        print(f"{Color.BOLD}1.{Color.ENDC} Listar usuarios")
        print(f"{Color.BOLD}2.{Color.ENDC} Crear nuevo usuario")
        print(f"{Color.BOLD}3.{Color.ENDC} Eliminar usuario")
        print(f"{Color.BOLD}4.{Color.ENDC} Cambiar contraseña de usuario")
        print(f"{Color.BOLD}5.{Color.ENDC} Cambiar rol de usuario")
        
        print(f"\n{Color.BOLD}=== Gestión de Reclutas ==={Color.ENDC}")
        print(f"{Color.BOLD}6.{Color.ENDC} Ver reclutas por asesor")
        print(f"{Color.BOLD}7.{Color.ENDC} Asignar recluta a asesor")
        
        print(f"\n{Color.BOLD}=== Sistema ==={Color.ENDC}")
        print(f"{Color.BOLD}8.{Color.ENDC} Ver registros de actividad")
        print(f"{Color.BOLD}9.{Color.ENDC} Cambiar contraseña de administrador")
        print(f"{Color.BOLD}0.{Color.ENDC} Salir")
        
        opcion = input(f"\n{Color.BOLD}Selecciona una opción:{Color.ENDC} ")
        
        if opcion == "1":
            listar_usuarios()
        elif opcion == "2":
            crear_usuario()
        elif opcion == "3":
            eliminar_usuario()
        elif opcion == "4":
            cambiar_password()
        elif opcion == "5":
            cambiar_rol_usuario()
        elif opcion == "6":
            ver_reclutas_por_asesor()
        elif opcion == "7":
            asignar_recluta()
        elif opcion == "8":
            ver_logs()
        elif opcion == "9":
            setup_admin_password()
            input("\nPresiona Enter para continuar...")
        elif opcion == "0":
            clear_screen()
            print_info("Saliendo del programa...")
            time.sleep(1)
            break
        else:
            print_error("Opción inválida, intenta de nuevo")
            time.sleep(1)

if __name__ == "__main__":
    try:
        clear_screen()
        print_header("Sistema de Gestión de Reclutas")
        print_info("Herramienta de Administración de Usuarios")
        print(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        
        if verificar_admin_password():
            menu_principal()
    except KeyboardInterrupt:
        print("\n")
        print_warning("Programa interrumpido por el usuario")
        sys.exit(0)
    except Exception as e:
        print_error(f"Error inesperado: {str(e)}")
        logging.error(f"Error inesperado: {str(e)}")
        sys.exit(1)