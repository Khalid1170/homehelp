from flask import Flask
from .config import Config
from .extensions import db, migrate, jwt
from flask_cors import CORS

from .routes.auth_routes import auth_bp
from .routes.job_routes import job_bp
from .routes.admin_routes import admin_bp
from .routes.review_routes import review_bp

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
    CORS(app, resources={r"/*": {"origins": "*"}})

    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(job_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(review_bp)

    return app