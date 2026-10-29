import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_migrate import Migrate

db = SQLAlchemy()
jwt = JWTManager()
cors = CORS()
socketio = SocketIO()
migrate = Migrate()

def create_app(config=None):
    app = Flask(__name__)

    # Configuration defaults
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        database_url = "sqlite:///" + os.path.join(app.root_path, "..", "quickmend.db")
    elif database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "quickmend-super-secret-jwt-key-2026")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "quickmend-flask-secret-key-2026")

    if config:
        app.config.update(config)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    socketio.init_app(app, cors_allowed_origins="*")
    migrate.init_app(app, db)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.services import services_bp
    from app.routes.providers import providers_bp
    from app.routes.ai import ai_bp
    from app.routes.service_requests import service_requests_bp
    from app.routes.bookings import bookings_bp
    from app.routes.payments import payments_bp
    from app.routes.reviews import reviews_bp
    from app.routes.notifications import notifications_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(services_bp, url_prefix="/api/services")
    app.register_blueprint(providers_bp, url_prefix="/api/providers")
    app.register_blueprint(ai_bp, url_prefix="/api/ai")
    app.register_blueprint(service_requests_bp, url_prefix="/api/service-requests")
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")
    app.register_blueprint(payments_bp, url_prefix="/api/payments")
    app.register_blueprint(reviews_bp, url_prefix="/api/reviews")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    # Import socket events
    from app.sockets import events

    @app.route("/")
    def index():
        return {
            "status": "ok",
            "app": "QuickMend API",
            "version": "1.0.0",
            "message": "QuickMend backend is running. Use /api/health or the API routes under /api/."
        }

    @app.route("/api/health")
    def health_check():
        return {"status": "ok", "app": "QuickMend API", "version": "1.0.0"}

    return app
