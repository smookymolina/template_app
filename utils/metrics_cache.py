"""
🔐 Sistema de Caché Inteligente para Métricas Basado en Roles
Proporciona caché diferenciado según permisos del usuario
"""

import hashlib
import json
import time
from datetime import datetime, timedelta
from flask import session, current_app, has_app_context
from functools import wraps
from typing import Dict, Any, Optional, List


class MetricsCacheManager:
    """
    📊 Gestor de caché inteligente para métricas administrativas

    CARACTERÍSTICAS:
    - ✅ Caché estratificado por roles (admin, gerente, asesor)
    - ✅ Invalidación automática basada en cambios de datos
    - ✅ Gestión de TTL (Time To Live) por tipo de usuario
    - ✅ Backend de Redis para escalabilidad en producción
    - ✅ Logging detallado para auditoría
    """

    def __init__(self, redis_client=None):
        self.cache_ttl = {
            'admin': 300,      # 5 minutos para admins
            'gerente': 180,    # 3 minutos para gerentes
            'asesor': 120      # 2 minutos para asesores
        }
        self.cache_prefix = 'metrics_cache_'
        # El cliente de Redis se obtiene de forma diferida para evitar errores sin contexto
        self._redis_client = redis_client

    def _get_redis_client(self):
        if self._redis_client is not None:
            return self._redis_client
        if has_app_context():
            return getattr(current_app, 'redis_client', None)
        return None

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

        # Formato: metrics_cache_{role}_{user_id}_{endpoint}_{filters_hash}
        # Se elimina el timestamp por minuto para un caché más consistente
        return f"{self.cache_prefix}{user_role}_{user_id}_{endpoint}_{filters_hash}"

    def set_cache(self, cache_key: str, data: Dict[str, Any],
                  user_role: str) -> bool:
        """
        💾 ESTABLECER datos en caché de Redis

        Args:
            cache_key: Clave de caché
            data: Datos a cachear
            user_role: Rol del usuario para determinar TTL

        Returns:
            bool: True si se guardó exitosamente
        """
        redis_client = self._get_redis_client()
        if not redis_client:
            return False

        try:
            ttl = self.cache_ttl.get(user_role, 120)
            
            # Serializar el objeto de datos a una cadena JSON
            serialized_data = json.dumps(data)

            # Usar setex para establecer la clave con expiración atómica
            redis_client.setex(cache_key, ttl, serialized_data)

            current_app.logger.info(
                f"💾 Cache SET [Redis]: {cache_key} | TTL: {ttl}s | Rol: {user_role}"
            )
            return True

        except Exception as e:
            current_app.logger.error(f"❌ Error setting Redis cache: {str(e)}")
            return False

    def get_cache(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        📖 OBTENER datos del caché de Redis

        Args:
            cache_key: Clave de caché

        Returns:
            Dict o None: Datos del caché si existen y son válidos
        """
        redis_client = self._get_redis_client()
        if not redis_client:
            return None

        try:
            cached_data = redis_client.get(cache_key)
            
            if not cached_data:
                current_app.logger.debug(f"💾 Cache MISS [Redis]: {cache_key}")
                return None

            current_app.logger.info(f"💾 Cache HIT [Redis]: {cache_key}")
            
            # Deserializar la cadena JSON a un objeto Python
            return json.loads(cached_data)

        except Exception as e:
            current_app.logger.error(f"❌ Error getting Redis cache: {str(e)}")
            return None

    def invalidate_user_cache(self, user_id: int, user_role: str = None):
        """
        🗑️ INVALIDAR caché de un usuario específico en Redis

        Args:
            user_id: ID del usuario
            user_role: Rol específico a invalidar (opcional)
        """
        redis_client = self._get_redis_client()
        if not redis_client:
            return

        try:
            # Construir patrón de búsqueda
            if user_role:
                pattern = f"{self.cache_prefix}{user_role}_{user_id}_*"
            else:
                pattern = f"{self.cache_prefix}*_{user_id}_*"

            # Usar scan_iter para buscar claves sin bloquear el servidor
            keys_to_remove = [key for key in redis_client.scan_iter(match=pattern)]

            if keys_to_remove:
                redis_client.delete(*keys_to_remove)

            current_app.logger.info(
                f"🗑️ Cache invalidated [Redis] for user {user_id} ({user_role or 'all roles'}): "
                f"{len(keys_to_remove)} entries"
            )

        except Exception as e:
            current_app.logger.error(f"❌ Error invalidating Redis cache: {str(e)}")

    def invalidate_role_cache(self, user_role: str):
        """
        🗑️ INVALIDAR caché de todos los usuarios de un rol en Redis

        Args:
            user_role: Rol a invalidar
        """
        redis_client = self._get_redis_client()
        if not redis_client:
            return

        try:
            pattern = f"{self.cache_prefix}{user_role}_*"
            keys_to_remove = [key for key in redis_client.scan_iter(match=pattern)]

            if keys_to_remove:
                redis_client.delete(*keys_to_remove)

            current_app.logger.info(
                f"🗑️ Cache invalidated [Redis] for role {user_role}: {len(keys_to_remove)} entries"
            )

        except Exception as e:
            current_app.logger.error(f"❌ Error invalidating role cache [Redis]: {str(e)}")


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
                if not has_app_context():
                    return f(*args, **kwargs)

                # Obtener el cliente Redis del contexto de la app
                redis_client = getattr(current_app, 'redis_client', None)
                if not redis_client:
                    # Si Redis no está disponible, ejecutar la función sin caché
                    current_app.logger.warning(f"Cache bypass for {endpoint_name} (Redis unavailable).")
                    return f(*args, **kwargs)

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

                # Crear instancia del manager usando el cliente Redis activo
                local_cache_manager = MetricsCacheManager(redis_client=redis_client)

                # 🔑 GENERAR CLAVE DE CACHÉ
                cache_key = local_cache_manager.generate_cache_key(
                    user_id, user_role, endpoint_name, filters
                )

                # 📖 INTENTAR OBTENER DEL CACHÉ
                cached_data = local_cache_manager.get_cache(cache_key)
                if cached_data:
                    return cached_data

                # 🔄 CACHE MISS - EJECUTAR FUNCIÓN ORIGINAL
                result = f(*args, **kwargs)

                # 💾 GUARDAR EN CACHÉ SI ES RESPUESTA EXITOSA
                is_successful = False
                response_data = None

                if hasattr(result, 'status_code') and 200 <= result.status_code < 300:
                    is_successful = True
                    if hasattr(result, 'get_json'):
                        response_data = result.get_json()
                    else:
                        response_data = result # No es un objeto de respuesta de Flask
                elif isinstance(result, dict) and result.get('success', True):
                    is_successful = True
                    response_data = result
                
                if is_successful and response_data:
                    local_cache_manager.set_cache(cache_key, response_data, user_role)

                return result

            except Exception as e:
                current_app.logger.error(f"❌ Error in Redis cache decorator: {str(e)}")
                # En caso de error, ejecutar función sin caché para mantener la app funcionando
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
            # Primero ejecutar la función para asegurar que el cambio se aplique
            result = f(*args, **kwargs)

            # Invalidar caché solo si la operación fue exitosa
            try:
                is_successful = False
                if hasattr(result, 'status_code'):
                    if 200 <= result.status_code < 300:
                        is_successful = True
                elif isinstance(result, dict):
                    if result.get('success', False):
                        is_successful = True

                if is_successful:
                    if not has_app_context():
                        return result

                    # Crear una instancia del manager dentro del contexto actual
                    local_cache_manager = MetricsCacheManager()
                    
                    if affected_roles:
                        for role in affected_roles:
                            local_cache_manager.invalidate_role_cache(role)

                    if affected_users:
                        # Extraer IDs de los argumentos de la función decorada si es necesario
                        # Esta es una implementación simple, puede requerir más lógica
                        user_ids = []
                        for user_id_arg in affected_users:
                            if isinstance(user_id_arg, int):
                                user_ids.append(user_id_arg)
                            elif isinstance(user_id_arg, str) and user_id_arg in kwargs:
                                user_ids.append(kwargs[user_id_arg])
                        
                        for user_id in user_ids:
                            local_cache_manager.invalidate_user_cache(user_id)

                    current_app.logger.info(f"🗑️ Cache invalidated after {f.__name__}")

            except Exception as e:
                current_app.logger.error(f"❌ Error invalidating cache after change: {str(e)}")

            return result
        return decorated_function
    return decorator


# ============================================================================
# 🔧 FUNCIONES AUXILIARES
# ============================================================================

def get_cache_stats() -> Dict[str, Any]:
    """
    📊 OBTENER estadísticas del caché de Redis

    Returns:
        Dict con estadísticas detalladas
    """
    if not has_app_context():
        return {'error': 'No app context'}

    redis_client = getattr(current_app, 'redis_client', None)
    if not redis_client:
        return {'error': 'Redis no está conectado'}

    try:
        redis_info = redis_client.info()
        
        # Contar llaves de métricas
        metric_keys = [key for key in redis_client.scan_iter(match=f"{cache_manager.cache_prefix}*")]
        
        stats_by_role = {}
        for key in metric_keys:
            parts = key.split('_')
            if len(parts) >= 3:
                role = parts[2]
                if role not in stats_by_role:
                    stats_by_role[role] = {'count': 0}
                stats_by_role[role]['count'] += 1

        return {
            'redis_version': redis_info.get('redis_version'),
            'total_keys_in_db': redis_info.get('db0', {}).get('keys', 'N/A'),
            'metric_cache_entries': len(metric_keys),
            'used_memory': redis_info.get('used_memory_human'),
            'uptime_in_days': redis_info.get('uptime_in_days'),
            'stats_by_role': stats_by_role,
            'timestamp': datetime.utcnow().isoformat()
        }

    except Exception as e:
        current_app.logger.error(f"❌ Error getting Redis cache stats: {str(e)}")
        return {'error': str(e)}


def clear_all_metrics_cache():
    """
    🗑️ LIMPIAR todo el caché de métricas de Redis
    """
    if not has_app_context():
        return 0

    redis_client = getattr(current_app, 'redis_client', None)
    if not redis_client:
        return 0
        
    try:
        keys_to_remove = [key for key in redis_client.scan_iter(match=f"{cache_manager.cache_prefix}*")]
        
        if keys_to_remove:
            redis_client.delete(*keys_to_remove)

        current_app.logger.info(f"🗑️ All metrics cache cleared from Redis: {len(keys_to_remove)} entries")
        return len(keys_to_remove)

    except Exception as e:
        current_app.logger.error(f"❌ Error clearing Redis cache: {str(e)}")
        return 0
