from fastapi import FastAPI
from app.database.db import engine, Base
from app.routes import subscriptions

app = FastAPI()

# tworzy bazę przy starcie
Base.metadata.create_all(bind=engine)

app.include_router(subscriptions.router)