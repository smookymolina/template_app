import os
import random
import string
from app_factory import create_app
from models import db
from models.usuario import Usuario

def generate_random_suffix(length=6):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def create_users():
    app = create_app('production')
    
    users_to_create = [
        {'email': 'admin@canfindjob.com', 'nombre': 'Administrador', 'rol': 'admin'},
        {'email': 'dridan@canfindjob.com', 'nombre': 'Dridan', 'rol': 'gerente'},
        {'email': 'omar@canfindjob.com', 'nombre': 'Omar', 'rol': 'gerente'},
        {'email': 'muta@canfindjob.com', 'nombre': 'Muta', 'rol': 'gerente'},
        {'email': 'chin@canfindjob.com', 'nombre': 'Chin', 'rol': 'gerente'},
    ]
    
    with app.app_context():
        print(f"{'Email':<25} | {'Password':<20} | {'Rol':<10}")
        print("-" * 60)
        
        for user_data in users_to_create:
            # Check if user already exists
            user = Usuario.query.filter_by(email=user_data['email']).first()
            if user:
                print(f"User {user_data['email']} already exists. Skipping.")
                continue
                
            random_suffix = generate_random_suffix()
            password = f"CFJ#{random_suffix}"
            
            new_user = Usuario(
                email=user_data['email'],
                nombre=user_data['nombre'],
                rol=user_data['rol'],
                is_active=True
            )
            new_user.password = password
            
            db.session.add(new_user)
            print(f"{user_data['email']:<25} | {password:<20} | {user_data['rol']:<10}")
            
        db.session.commit()
        print("-" * 60)
        print("Users created successfully.")

if __name__ == '__main__':
    create_users()
