from flask import Blueprint, render_template, send_file, current_app, redirect, url_for, request, jsonify
from flask_login import login_required
import io
import os
from PIL import Image, ImageDraw
from models.recluta import Recluta

main_bp = Blueprint('main', __name__)

@main_bp.route('/favicon.ico')
def favicon():
    """
    Genera un favicon básico.
    
    Returns:
        Imagen ICO como favicon
    """
    try:
        # Crear un favicon vacío
        empty_ico = io.BytesIO()
        img = Image.new('RGB', (16, 16), color=(255, 255, 255))
        img.save(empty_ico, 'ICO')
        empty_ico.seek(0)
        return send_file(empty_ico, mimetype='image/x-icon')
    except Exception as e:
        current_app.logger.error(f"Error al generar favicon: {str(e)}")
        return "", 204  # No content

@main_bp.route('/dashboard')
@login_required
def dashboard():
    """
    Página principal del dashboard (protegida por login).
    
    Returns:
        Template HTML renderizado
    """
    return render_template('dashboard.html')

@main_bp.route('/perfil')
@login_required
def perfil():
    """
    Página de perfil de usuario (protegida por login).
    
    Returns:
        Template HTML renderizado
    """
    return render_template('perfil.html')

@main_bp.route('/seguimiento')
def seguimiento():
    """
    Redirige a la página principal con la pestaña de seguimiento activada.
    
    Returns:
        Redirección a la página principal
    """
    return redirect(url_for('main.index') + '?tab=seguimiento')

@main_bp.route('/consulta')
def consulta_folio():
    """
    Alias para la página de seguimiento, orientado a consulta por folio.
    Redirige a la página de seguimiento con un parámetro opcional.
    
    Returns:
        Redirección a la página de seguimiento
    """
    folio = request.args.get('folio', '')
    return redirect(url_for('main.seguimiento', folio=folio))

@main_bp.route('/estado/<folio>')
def estado_folio(folio):
    """
    Muestra directamente el estado de un folio específico.
    Es una forma rápida de compartir el estado con un link directo.
    
    Args:
        folio: Número de folio del candidato
        
    Returns:
        Redirección a la página principal con folio preseleccionado
    """
    # Verificar si el folio existe
    recluta = Recluta.query.filter_by(folio=folio).first()
    if not recluta:
        return redirect(url_for('main.index') + f'?tab=seguimiento&error=folio_no_existe')
    
    # Redirigir con el folio preseleccionado
    return redirect(url_for('main.index') + f'?tab=seguimiento&folio={folio}&auto_consulta=true')

@main_bp.route('/cliente')
def portal_cliente():
    """
    Portal principal para clientes, con acceso a diferentes opciones
    como seguimiento, FAQs, contacto, etc.
    
    Returns:
        Template HTML renderizado
    """
    return render_template('cliente.html')

@main_bp.route('/verificar-folio/<folio>')
def validar_folio_publico(folio):
    """
    Endpoint público para verificar si un folio existe sin mostrar datos sensibles.
    Útil para validación en frontend antes de hacer consultas completas.
    
    Args:
        folio: Número de folio a verificar
        
    Returns:
        JSON con resultado de la verificación
    """
    recluta = Recluta.query.filter_by(folio=folio).first()
    return jsonify({
        "success": recluta is not None,
        "exists": recluta is not None,
        "message": "Folio válido" if recluta else "Folio no encontrado"
    })

@main_bp.errorhandler(404)
def page_not_found(e):
    """
    Manejador para errores 404 (página no encontrada).
    
    Args:
        e: Objeto de error
        
    Returns:
        Template HTML renderizado con código 404
    """
    return render_template('404.html'), 404

@main_bp.route('/')
def index():
    """
    Ruta principal. Muestra la página de inicio/login.

    Returns:
        Template HTML renderizado
    """
    # Obtener lista de gerentes para la calculadora de fichas
    gerentes_list = []
    try:
        from models.usuario import Usuario
        from flask_login import current_user

        # Solo cargar gerentes si el usuario está autenticado y es admin
        if current_user.is_authenticated and current_user.is_admin():
            gerentes_query = Usuario.query.filter_by(rol='gerente', is_active=True).order_by(Usuario.nombre)
            gerentes_list = gerentes_query.all()
            current_app.logger.info(f"Cargados {len(gerentes_list)} gerentes para la vista")
    except Exception as e:
        current_app.logger.error(f"Error al cargar gerentes para la vista: {str(e)}")

    return render_template('index.html', include_components=True, gerentes_list=gerentes_list)

@main_bp.route('/api/placeholder/<int:width>/<int:height>')
def placeholder(width, height):
    """
    Genera una imagen placeholder con dimensiones especificadas.
    
    Args:
        width: Ancho de la imagen en píxeles
        height: Alto de la imagen en píxeles
        
    Returns:
        Imagen PNG generada dinámicamente
    """
    # Limitar tamaños para evitar problemas de recursos
    width = min(width, 800)
    height = min(height, 800)
    
    try:
        # Crear una imagen gris con las dimensiones especificadas
        img = Image.new('RGB', (width, height), color=(200, 200, 200))
        draw = ImageDraw.Draw(img)
        
        # Dibujar un borde
        draw.rectangle([(0, 0), (width-1, height-1)], outline=(150, 150, 150))
        
        # Añadir texto con el tamaño
        text = f"{width}x{height}"
        draw.text((width//2-20, height//2-10), text, fill=(100, 100, 100))
        
        # Convertir a bytes para enviar
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        
        return send_file(img_io, mimetype='image/png')
    except Exception as e:
        current_app.logger.error(f"Error al generar placeholder: {str(e)}")
        # Devolver una imagen más pequeña en caso de error
        img = Image.new('RGB', (100, 100), color=(255, 0, 0))
        img_io = io.BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        return send_file(img_io, mimetype='image/png')

@main_bp.route('/media/profiles/<path:filename>')
def serve_profile_image(filename):
    """Sirve las imágenes de perfil de forma segura."""
    from flask import send_from_directory
    return send_from_directory(current_app.config['PROFILE_IMG_FOLDER'], filename)

@main_bp.route('/uploads/<path:path>')
def serve_uploads(path):
    """Sirve archivos de la carpeta de uploads."""
    from flask import send_from_directory
    return send_from_directory(os.path.join(current_app.root_path, 'uploads'), path)