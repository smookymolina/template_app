from models import db, Usuario
from flask import current_app

def asignar_recluta_automaticamente():
    """
    Encuentra el asesor con menos reclutas asignados para balancear la carga.
    Solo considera asesores activos.
    
    Returns:
        Usuario: El asesor con menos reclutas asignados o None si no hay asesores.
    """
    try:
        # Obtener todos los usuarios activos con rol de asesor
        asesores = Usuario.query.filter_by(is_active=True, rol='asesor').all()
        
        if not asesores:
            current_app.logger.warning("No hay asesores activos para asignar reclutas")
            return None
        
        # Contar reclutas por asesor
        asesores_con_carga = []
        for asesor in asesores:
            cantidad_reclutas = len(asesor.reclutas_asignados)
            asesores_con_carga.append((asesor, cantidad_reclutas))
        
        # Ordenar por cantidad de reclutas (menor a mayor)
        asesores_con_carga.sort(key=lambda x: x[1])
        
        # Devolver el asesor con menos reclutas
        asesor_seleccionado = asesores_con_carga[0][0]
        current_app.logger.info(f"Asesor seleccionado para asignación: {asesor_seleccionado.email} (ID: {asesor_seleccionado.id}) con {asesores_con_carga[0][1]} reclutas")
        
        return asesor_seleccionado
        
    except Exception as e:
        current_app.logger.error(f"Error en asignación automática: {str(e)}")
        return None