"""
Feeta Backend Application Factory
Clean, modular Flask application
"""
import logging
from flask import Flask
from flask_cors import CORS
from app.config import Config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress werkzeug SSL handshake errors
logging.getLogger('werkzeug').setLevel(logging.WARNING)


def create_app():
    """Application factory pattern"""
    
    logger.info("="*80)
    logger.info("🚀 Initializing Feeta Backend")
    logger.info("="*80)
    
    # Create Flask app
    app = Flask(__name__)
    app.config.from_object(Config)
    app.secret_key = Config.SECRET_KEY  # Required for session
    
    # Initialize Flask-JWT-Extended
    from flask_jwt_extended import JWTManager
    jwt = JWTManager(app)
    logger.info("✅ JWT Manager initialized")
    
    # Validate configuration
    try:
        Config.validate()
    except ValueError as e:
        logger.error(f"❌ Configuration Error: {e}")
        raise
    
    # Setup CORS
    CORS(app, 
         supports_credentials=True,
         origins=[
             Config.FRONTEND_URL,
             'http://localhost:3000',
             'https://localhost:3000',
             'https://www.feeta-ai.com',
             'https://feeta-ai.com'
         ],
         allow_headers=['Content-Type', 'Authorization'])
    
    logger.info(f"✅ CORS enabled for: {Config.FRONTEND_URL}")
    
    # Initialize database
    from app.database.mongodb import init_db
    db_initialized = init_db()
    if db_initialized:
        logger.info("✅ Database initialized")
    else:
        logger.warning("⚠️ Database initialization failed - app will continue but database features may not work")
    
    # Register API blueprints
    from app.api.auth import auth_bp
    from app.api.projects import project_bp
    from app.api.tasks import task_bp
    from app.api.github import github_bp
    from app.api.slack import slack_bp
    from app.api.teams import teams_bp
    from app.api.followup import followup_bp
    from app.api.gemini_test import gemini_test_bp
    from app.api.jira import jira_bp
    from app.api.demo import demo_bp
    from app.api.dashboard import dashboard_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(project_bp, url_prefix='/api')
    app.register_blueprint(task_bp, url_prefix='/api')
    app.register_blueprint(github_bp, url_prefix='/github')
    app.register_blueprint(slack_bp, url_prefix='/slack')
    app.register_blueprint(teams_bp)
    app.register_blueprint(followup_bp, url_prefix='/api/followup')
    app.register_blueprint(gemini_test_bp, url_prefix='/api')
    app.register_blueprint(jira_bp, url_prefix='/api/jira')
    app.register_blueprint(demo_bp, url_prefix='/api/demo')
    
    logger.info("✅ API routes registered")
    
    # Start automatic task follow-up scheduler
    from app.scheduler.task_followup import start_followup_scheduler
    start_followup_scheduler()
    logger.info("✅ Task follow-up scheduler started (every 10 minutes)")
    
    # Simple request logging (filter out SSL noise)
    @app.before_request
    def log_request_info():
        from flask import request
        # Only log valid HTTP requests
        if request.method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']:
            logger.info(f"{request.method} {request.path}")
    
    @app.after_request
    def log_response_info(response):
        if response.status_code != 400:  # Don't log SSL handshake errors
            logger.info(f"Response: {response.status_code}")
        return response
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'feeta-backend'}, 200
    
    logger.info("="*80)
    logger.info("✨ Feeta Backend Ready!")
    logger.info(f"🌐 Running on: {Config.BACKEND_URL}")
    logger.info("="*80)
    
    return app

