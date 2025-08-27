# Project Context: Recruitment Management Application

This document provides an overview of the project structure and technologies used to assist the Gemini CLI agent in understanding and interacting with the codebase.

## Application Overview

This application appears to be a web-based system designed for recruitment management. It includes features for:
- User authentication and session management.
- Managing "reclutas" (recruits/candidates) and "entrevistas" (interviews).
- Administrative tools and metrics.
- Tracking and timeline functionalities.
- API endpoints for programmatic access.

## Technology Stack

The application is built using the following technologies:

### Backend
- **Python**: The primary programming language.
- **Flask**: A micro web framework for Python, used for routing, request handling, and overall application structure.
- **SQLAlchemy**: An ORM (Object Relational Mapper) for interacting with databases, used for defining models (`models.py`, `models/`).
- **Jinja2**: A templating engine used for rendering HTML pages (`templates/`).

### Frontend
- **HTML**: For structuring web pages (`templates/`).
- **CSS**: For styling (`static/css/`).
- **JavaScript**: For client-side interactivity (`static/js/`).

## Project Structure

The project follows a modular structure:

- `app.py`: Main application entry point.
- `app_factory.py`: Likely responsible for creating and configuring the Flask application instance.
- `config.py`: Application configuration settings.
- `models.py`: Centralized model definitions (though individual models are also in `models/`).
- `admin_tools.py`: Utilities for administrative tasks.
- `requirements.txt`: Lists Python dependencies.
- `README.md`, `README.txt`: Project documentation.

### Directories:

- `models/`: Contains SQLAlchemy models for different entities (e.g., `recluta.py`, `entrevista.py`, `usuario.py`, `user_session.py`).
- `routes/`: Organizes Flask blueprints for different API endpoints and web routes:
    - `admin.py`: Admin-specific routes.
    - `api.py`: RESTful API endpoints.
    - `auth.py`: Authentication-related routes.
    - `main.py`: General application routes.
- `static/`: Static assets served directly by the web server:
    - `css/`: Stylesheets.
    - `js/`: JavaScript files for client-side logic.
    - `uploads/`: Directory for user-uploaded files (e.g., `recluta/`, `usuario/`).
- `templates/`: Jinja2 HTML templates:
    - `base.html`: Base template for common layout.
    - `index.html`: Main landing page.
    - `seguimiento.html`: Tracking/follow-up page.
    - `components/`: Reusable HTML partials (e.g., modals, sections for calendar, statistics, recruits, timeline).
- `utils/`: Utility functions and helpers:
    - `decorators.py`: Custom decorators.
    - `helpers.py`: General utility functions.
    - `security.py`: Security-related functions.
    - `validators.py`: Data validation logic.
- `__pycache__/`: Python bytecode cache.
- `.git/`: Git version control repository.

## Key Files and Their Roles

- `app.py`: Initializes the Flask application, registers blueprints, and sets up the database.
- `models/*.py`: Defines the database schema and relationships using SQLAlchemy.
- `routes/*.py`: Defines URL routes and their corresponding view functions.
- `static/js/*.js`: Implements client-side logic, form handling, and dynamic content updates.
- `static/css/*.css`: Styles the application's user interface.
- `templates/*.html`: Renders the user interface, often using data passed from Flask view functions.

## Development Environment

- **Operating System**: Windows (based on the initial context `win32`).
- **Current Working Directory**: `C:\Users\GIRTEC\Documents\GitHub\template_app`.

## How to Run (Inferred)

To run this application, one would typically:
1. Install Python dependencies from `requirements.txt`.
2. Set up environment variables (e.g., database connection string, secret key) as defined in `config.py`.
3. Run `app.py` (e.g., `python app.py`).
