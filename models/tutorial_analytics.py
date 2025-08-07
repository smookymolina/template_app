"""
Modelo para analytics del tutorial (opcional)
Archivo: models/tutorial_analytics.py
"""
from models import db
from datetime import datetime

class TutorialAnalytics(db.Model):
    __tablename__ = 'tutorial_analytics'
    
    id = db.Column(db.Integer, primary_key=True)
    device_fingerprint = db.Column(db.String(100), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)  # started, completed, skipped, step_completed
    step_number = db.Column(db.Integer)  # 1-6 para pasos específicos
    time_spent = db.Column(db.Integer)  # milisegundos
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<TutorialAnalytics {self.event_type} - Step {self.step_number}>'
    
    @classmethod
    def log_event(cls, device_id, event_type, step=None, time_spent=None, ip=None, user_agent=None):
        """
        Registra un evento del tutorial
        """
        try:
            analytics = cls(
                device_fingerprint=device_id,
                event_type=event_type,
                step_number=step,
                time_spent=time_spent,
                ip_address=ip,
                user_agent=user_agent
            )
            db.session.add(analytics)
            db.session.commit()
            return True
        except Exception:
            db.session.rollback()
            return False