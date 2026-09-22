from fastapi import FastAPI
from app.database.db import engine, Base
from app.routes import subscriptions, users
from fastapi.middleware.cors import CORSMiddleware

from app.utils.security import cors_config

app = FastAPI()

cors_config(app)

# tworzy bazę przy starcie
Base.metadata.create_all(bind=engine)

# Prefiks /api: Vercel serwuje api/index.py (ten sam obiekt `app`) tylko pod
# /api/* w zero-config Pythonie - bez wlasnego vercel.json (ktory wczesniej
# psul inny projekt w tym samym repo, bo Vercel czyta go z korzenia repo
# niezaleznie od Root Directory kazdego projektu).
app.include_router(subscriptions.router, prefix="/api")
app.include_router(users.router, prefix="/api")