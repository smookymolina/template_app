from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import SQLAlchemyError
import uuid  # Añadir esta importación

# Instancia de SQLAlchemy para ser importada por otros módulos
db = SQLAlchemy()

# Excepción personalizada para errores de base de datos
class DatabaseError(Exception):
    """Excepción personalizada para errores de base de datos"""
    pass

# Método de utilidad para commits seguros
def safe_commit():
    """Realiza un commit seguro con manejo de excepciones"""
    try:
        db.session.commit()
        return True
    except SQLAlchemyError as e:
        db.session.rollback()
        raise DatabaseError(f"Error en la base de datos: {str(e)}")

# Importar modelos para hacerlos disponibles desde models
from models.usuario import Usuario
from models.recluta import Recluta
from models.entrevista import Entrevista 
from models.user_session import UserSession