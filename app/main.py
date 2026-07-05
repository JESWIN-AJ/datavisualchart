"""
FastAPI entrypoint.

Run locally with:
    uvicorn main:app --reload

API docs (auto-generated) will be at http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import insights

app = FastAPI(title="Blackcoffer Dashboard API")

# Allow the Next.js dev server (and your deployed frontend, once you have
# a URL for it) to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(insights.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}