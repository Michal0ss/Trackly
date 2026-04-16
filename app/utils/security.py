from passlib.context import CryptContext
from starlette.middleware.cors import CORSMiddleware

# Primary context (preferred)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Fallback for environments where bcrypt backend is broken/incompatible.
fallback_pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str):
    try:
        return pwd_context.hash(password)
    except Exception:
        return fallback_pwd_context.hash(password)

def cors_config(app):
    origins = ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )