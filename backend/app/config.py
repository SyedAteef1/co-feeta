"""
Application Configuration
Centralized configuration management
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    
    # Flask
    SECRET_KEY = os.getenv("FLASK_SECRET", "change_this_in_production")
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # URLs
    BACKEND_URL = os.getenv("BASE_URL", "http://localhost:5000")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # MongoDB
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DATABASE_NAME = "feeta"

    # SMTP Configuration
    MAIL_SERVER = 'smtp.hostinger.com'
    MAIL_PORT = 465
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_USE_TLS = False
    MAIL_USE_SSL = True
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME')
    
    # GitHub OAuth
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
    # Slack OAuth
    SLACK_CLIENT_ID = os.getenv("SLACK_CLIENT_ID")
    SLACK_CLIENT_SECRET = os.getenv("SLACK_CLIENT_SECRET")
    
    # AI API Keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Session
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_DOMAIN = None
    
    # JWT Configuration (for flask-jwt-extended)
    JWT_SECRET_KEY = os.getenv("FLASK_SECRET", "change_this_in_production")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_ACCESS_TOKEN_EXPIRES = False  # Tokens don't expire (or set to timedelta for expiration)
    JWT_IDENTITY_CLAIM = "user_id"  # Use 'user_id' instead of default 'sub' claim
    
    @staticmethod
    def validate():
        """Validate required configuration"""
        required = ['GEMINI_API_KEY', 'MONGO_URI']
        missing = [key for key in required if not getattr(Config, key)]
        if missing:
            raise ValueError(f"Missing required configuration: {', '.join(missing)}")
        
        print("✅ Configuration validated")


