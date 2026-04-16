from fastapi import FastAPI
from app.database.db import engine, Base
from app.routes import subscriptions, users
from fastapi.middleware.cors import CORSMiddleware

from app.utils.security import cors_config

app = FastAPI()

cors_config(app)

# tworzy bazę przy starcie
Base.metadata.create_all(bind=engine)
app.include_router(subscriptions.router)
app.include_router(users.router)