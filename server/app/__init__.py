from flask import Flask
from .config import Config
from .extensions import db, migrate, jwt
from flask_cors import CORS

from .routes.auth_routes import auth_bp
from .routes.job_routes import job_bp
from .routes.admin_routes import admin_bp
from .routes.review_routes import review_bp
from .routes.worker_routes import workers_bp
from .routes.client_routes import client_bp
from app.routes.chat_routes import chat_bp

from flask import jsonify

def register_error_handlers(app):
    @app.errorhandler(500)
    def handle_500(e):
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

    @app.errorhandler(404)
    def handle_404(e):
        return jsonify({"error": "Resource not found"}), 404


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # 1. Keep this: tells JWT manager to step aside for OPTIONS requests
    app.config["JWT_OPTIONS_CROSS_ORIGIN_WHITELISTING"] = True 

    # Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register Blueprints First 📑
    app.register_blueprint(auth_bp)
    app.register_blueprint(job_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(workers_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(chat_bp)

    # Register Global Error Handlers
    register_error_handlers(app)

    # 2. UPDATE CORS HERE 🛡️
    # Explicitly whitelist the Authorization header and PATCH/OPTIONS methods
    CORS(
        app, 
        resources={
            r"/*": {
                "origins": "http://localhost:5173",
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"]
            }
        }
    )

    return app