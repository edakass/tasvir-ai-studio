from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.routers import categories, content, projects, generate

from dotenv import load_dotenv
import os
from pathlib import Path

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Tasvir AI Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

@app.on_event("startup")
def startup():
    init_db()

app.include_router(categories.router)
app.include_router(content.router)
app.include_router(projects.router)
app.include_router(generate.router)

@app.get("/")
def root():
    return {"message": "Tasvir AI Studio API is running!"}
