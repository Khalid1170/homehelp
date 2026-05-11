from flask import Flask
from .config import Config
from .extensions import db, migrate, jwt
from .models import User, Worker

from .routes.auth_routes import auth_bp


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    app.register_blueprint(auth_bp)

    return app