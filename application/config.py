# application/config.py

class Config():
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = True


class LocalDevelopmentConfig(Config):
    # Flask settings
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///healixcare.db'

    # Flask-Security settings
    SECRET_KEY = "aclasssecretkey"
    SECURITY_PASSWORD_HASH = "bcrypt"
    SECURITY_PASSWORD_SALT = "aclasssalt"
    WTF_CSRF_ENABLED = False
    SECURITY_TOKEN_AUTHENTICATION_HEADER = 'Authentication-Token'
    SECURITY_TOKEN_AUTHENTICATION_KEY = 'token'
    
    SECURITY_TOKEN_AUTHENTICATION_ENABLED = True
    SECURITY_TOKEN_MAX_AGE = 3600  # 1 hour

    SECURITY_UNAUTHORIZED_VIEW = None

    GOOGLE_CHAT_WEBHOOK_URL = "https://chat.googleapis.com/v1/spaces/AAQAGo_eSw4/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=PTx5Da_zACxdGDgIjS39QBsXwEF6GMo9tvPVAKg4ynA"