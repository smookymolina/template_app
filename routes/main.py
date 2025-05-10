from flask import Blueprint, render_template, send_file, current_app, redirect, url_for, request, jsonify
from flask_login import login_required
import io
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
    Página pública para que los candidatos consulten su estado.
    No requiere autenticación.
    
    Returns:
        Template HTML renderizado
    """
    return render_template('seguimiento.html')

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
        Template HTML renderizado con información prellenada
    """
    # Verificar si el folio existe
    recluta = Recluta.query.filter_by(folio=folio).first()
    if not recluta:
        return render_template('seguimiento.html', error="El folio proporcionado no existe")
    
    # Renderizar template con el folio preseleccionado
    return render_template('seguimiento.html', folio=folio, auto_consulta=True)

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
    return render_template('index.html')

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