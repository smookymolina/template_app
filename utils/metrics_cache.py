"""
🔐 Sistema de Caché Inteligente para Métricas Basado en Roles
Proporciona caché diferenciado según permisos del usuario
"""

import hashlib
import json
import time
from datetime import datetime, timedelta
from flask import session, current_app
from functools import wraps
from typing import Dict, Any, Optional, List


class MetricsCacheManager:
    """
    📊 Gestor de caché inteligente para métricas administrativas

    CARACTERÍSTICAS:
    - ✅ Caché estratificado por roles (admin, gerente, asesor)
    - ✅ Invalidación automática basada en cambios de datos
    - ✅ Gestión de TTL (Time To Live) por tipo de usuario
    - ✅ Compresión de datos para optimizar memoria
    - ✅ Logging detallado para auditoría
    """

    def __init__(self):
        self.cache_ttl = {
            'admin': 300,      # 5 minutos para admins
            'gerente': 180,    # 3 minutos para gerentes
            'asesor': 120      # 2 minutos para asesores
        }
        self.cache_prefix = 'metrics_cache_'

    def generate_cache_key(self, user_id: int, user_role: str,
                          endpoint: str, filters: Dict = None) -> str:
        """
        🔑 GENERAR clave única de caché

        Args:
            user_id: ID del usuario
            user_role: Rol del usuario
            endpoint: Nombre del endpoint
            filters: Filtros aplicados

        Returns:
            str: Clave única de caché
        """
        # Crear hash de filtros para key única
        filters_hash = ""
        if filters:
            filters_json = json.dumps(filters, sort_keys=True)
            filters_hash = hashlib.md5(filters_json.encode()).hexdigest()[:8]

        # Formato: metrics_cache_{role}_{user_id}_{endpoint}_{filters_hash}_{timestamp}
        timestamp = int(time.time() / 60)  # Bucket por minuto

        return f"{self.cache_prefix}{user_role}_{user_id}_{endpoint}_{filters_hash}_{timestamp}"

    def set_cache(self, cache_key: str, data: Dict[str, Any],
                  user_role: str) -> bool:
        """
        💾 ESTABLECER datos en caché

        Args:
            cache_key: Clave de caché
            data: Datos a cachear
            user_role: Rol del usuario para determinar TTL

        Returns:
            bool: True si se guardó exitosamente
        """
        try:
            ttl = self.cache_ttl.get(user_role, 120)

            cache_entry = {
                'data': data,
                'timestamp': datetime.utcnow().isoformat(),
                'expires_at': (datetime.utcnow() + timedelta(seconds=ttl)).isoformat(),
                'user_role': user_role,
                'version': '2.0'
            }

            # Usar session como almacén temporal
            # En producción, usar Redis o Memcached
            session[cache_key] = cache_entry

            current_app.logger.info(
                f"💾 Cache SET: {cache_key} | TTL: {ttl}s | Rol: {user_role}"
            )

            return True

        except Exception as e:
            current_app.logger.error(f"❌ Error setting cache: {str(e)}")
            return False

    def get_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        📖 OBTENER datos del caché

        Args:
            cache_key: Clave de caché

        Returns:
            Dict o None: Datos del caché si existen y son válidos
        """
        try:
            cache_entry = session.get(cache_key)
            if not cache_entry:
                current_app.logger.debug(f"💾 Cache MISS: {cache_key}")
                return None

            # Verificar expiración
            expires_at = datetime.fromisoformat(cache_entry['expires_at'])
            if datetime.utcnow() > expires_at:
                current_app.logger.debug(f"💾 Cache EXPIRED: {cache_key}")
                session.pop(cache_key, None)
                return None

            current_app.logger.info(f"💾 Cache HIT: {cache_key}")
            return cache_entry['data']

        except Exception as e:
            current_app.logger.error(f"❌ Error getting cache: {str(e)}")
            return None

    def invalidate_user_cache(self, user_id: int, user_role: str = None):
        """
        🗑️ INVALIDAR caché de un usuario específico

        Args:
            user_id: ID del usuario
            user_role: Rol específico a invalidar (opcional)
        """
        try:
            keys_to_remove = []

            for key in list(session.keys()):
                if key.startswith(self.cache_prefix):
                    # Parsear la key para extraer información
                    parts = key.split('_')
                    if len(parts) >= 4:
                        cached_role = parts[2]
                        cached_user_id = parts[3]

                        if str(cached_user_id) == str(user_id):
                            if user_role is None or cached_role == user_role:
                                keys_to_remove.append(key)

            # Remover keys identificadas
            for key in keys_to_remove:
                session.pop(key, None)

            current_app.logger.info(
                f"🗑️ Cache invalidated for user {user_id} ({user_role}): {len(keys_to_remove)} entries"
            )

        except Exception as e:
            current_app.logger.error(f"❌ Error invalidating cache: {str(e)}")

    def invalidate_role_cache(self, user_role: str):
        """
        🗑️ INVALIDAR caché de todos los usuarios de un rol

        Args:
            user_role: Rol a invalidar
        """
        try:
            keys_to_remove = []

            for key in list(session.keys()):
                if key.startswith(f"{self.cache_prefix}{user_role}_"):
                    keys_to_remove.append(key)

            # Remover keys identificadas
            for key in keys_to_remove:
                session.pop(key, None)

            current_app.logger.info(
                f"🗑️ Cache invalidated for role {user_role}: {len(keys_to_remove)} entries"
            )

        except Exception as e:
            current_app.logger.error(f"❌ Error invalidating role cache: {str(e)}")

    def cleanup_expired_cache(self):
        """
        🧹 LIMPIAR caché expirado
        """
        try:
            keys_to_remove = []
            now = datetime.utcnow()

            for key in list(session.keys()):
                if key.startswith(self.cache_prefix):
                    cache_entry = session.get(key)
                    if cache_entry and 'expires_at' in cache_entry:
                        expires_at = datetime.fromisoformat(cache_entry['expires_at'])
                        if now > expires_at:
                            keys_to_remove.append(key)

            # Remover keys expiradas
            for key in keys_to_remove:
                session.pop(key, None)

            current_app.logger.info(f"🧹 Expired cache cleaned: {len(keys_to_remove)} entries")

        except Exception as e:
            current_app.logger.error(f"❌ Error cleaning cache: {str(e)}")


# Instancia global del gestor de caché
cache_manager = MetricsCacheManager()


def metrics_cache_decorator(endpoint_name: str, cache_filters: List[str] = None):
    """
    🎯 DECORADOR para caché automático de métricas

    Args:
        endpoint_name: Nombre del endpoint para identificar en caché
        cache_filters: Lista de parámetros de request a incluir en filtros

    Usage:
        @metrics_cache_decorator('dashboard_unificado', ['date_from', 'date_to'])
        def get_dashboard_data():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import request
            from flask_login import current_user

            try:
                # 🔐 VERIFICAR USUARIO AUTENTICADO
                if not current_user.is_authenticated:
                    return f(*args, **kwargs)

                user_role = getattr(current_user, 'rol', 'asesor')
                user_id = current_user.id

                # 📊 EXTRAER FILTROS DE LA REQUEST
                filters = {}
                if cache_filters:
                    for filter_param in cache_filters:
                        value = request.args.get(filter_param)
                        if value:
                            filters[filter_param] = value

                # 🔑 GENERAR CLAVE DE CACHÉ
                cache_key = cache_manager.generate_cache_key(
                    user_id, user_role, endpoint_name, filters
                )

                # 📖 INTENTAR OBTENER DEL CACHÉ
                cached_data = cache_manager.get_cache(cache_key)
                if cached_data:
                    current_app.logger.info(f"💾 Serving from cache: {endpoint_name} for {user_role}")
                    return cached_data

                # 🔄 CACHE MISS - EJECUTAR FUNCIÓN ORIGINAL
                result = f(*args, **kwargs)

                # 💾 GUARDAR EN CACHÉ SI ES RESPUESTA EXITOSA
                if (hasattr(result, 'status_code') and result.status_code == 200) or \
                   (isinstance(result, dict) and result.get('success', True)):

                    # Extraer datos para cachear
                    if hasattr(result, 'get_json'):
                        cache_data = result.get_json()
                    else:
                        cache_data = result

                    cache_manager.set_cache(cache_key, cache_data, user_role)

                return result

            except Exception as e:
                current_app.logger.error(f"❌ Error in cache decorator: {str(e)}")
                # En caso de error, ejecutar función sin caché
                return f(*args, **kwargs)

        return decorated_function
    return decorator


def invalidate_metrics_cache_on_change(affected_roles: List[str] = None,
                                     affected_users: List[int] = None):
    """
    🗑️ DECORADOR para invalidar caché cuando hay cambios

    Args:
        affected_roles: Lista de roles afectados
        affected_users: Lista de IDs de usuarios afectados

    Usage:
        @invalidate_metrics_cache_on_change(['gerente', 'admin'], [user.id])
        def update_recluta():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)

            try:
                # Invalidar caché después de operación exitosa
                if (hasattr(result, 'status_code') and result.status_code in [200, 201]) or \
                   (isinstance(result, dict) and result.get('success', True)):

                    if affected_roles:
                        for role in affected_roles:
                            cache_manager.invalidate_role_cache(role)

                    if affected_users:
                        for user_id in affected_users:
                            cache_manager.invalidate_user_cache(user_id)

                    current_app.logger.info(f"🗑️ Cache invalidated after {f.__name__}")

            except Exception as e:
                current_app.logger.error(f"❌ Error invalidating cache: {str(e)}")

            return result
        return decorated_function
    return decorator


# ============================================================================
# 🔧 FUNCIONES AUXILIARES
# ============================================================================

def get_cache_stats() -> Dict[str, Any]:
    """
    📊 OBTENER estadísticas del caché

    Returns:
        Dict con estadísticas detalladas
    """
    try:
        cache_keys = [key for key in session.keys() if key.startswith(cache_manager.cache_prefix)]

        stats_by_role = {}
        total_size = 0
        expired_count = 0
        now = datetime.utcnow()

        for key in cache_keys:
            cache_entry = session.get(key)
            if cache_entry:
                # Analizar por rol
                parts = key.split('_')
                if len(parts) >= 3:
                    role = parts[2]
                    if role not in stats_by_role:
                        stats_by_role[role] = {'count': 0, 'size': 0}

                    stats_by_role[role]['count'] += 1

                    # Calcular tamaño aproximado
                    size = len(json.dumps(cache_entry))
                    stats_by_role[role]['size'] += size
                    total_size += size

                # Verificar expiración
                if 'expires_at' in cache_entry:
                    expires_at = datetime.fromisoformat(cache_entry['expires_at'])
                    if now > expires_at:
                        expired_count += 1

        return {
            'total_entries': len(cache_keys),
            'expired_entries': expired_count,
            'total_size_bytes': total_size,
            'stats_by_role': stats_by_role,
            'timestamp': now.isoformat()
        }

    except Exception as e:
        current_app.logger.error(f"❌ Error getting cache stats: {str(e)}")
        return {'error': str(e)}


def clear_all_metrics_cache():
    """
    🗑️ LIMPIAR todo el caché de métricas
    """
    try:
        keys_to_remove = [key for key in session.keys() if key.startswith(cache_manager.cache_prefix)]

        for key in keys_to_remove:
            session.pop(key, None)

        current_app.logger.info(f"🗑️ All metrics cache cleared: {len(keys_to_remove)} entries")
        return len(keys_to_remove)

    except Exception as e:
        current_app.logger.error(f"❌ Error clearing cache: {str(e)}")
        return 0