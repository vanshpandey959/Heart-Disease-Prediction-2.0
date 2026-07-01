"""
HeartPredict API — v2
FastAPI app entrypoint. Wires together: MongoDB connection, ML model loading,
Groq client, CORS, and all routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.utils.logger import logger
from app.database import connect_to_mongo, close_mongo_connection
from app.services.ml_service import ml_service
from app.services.groq_service import groq_service
from app.routes import auth_router, predict_router, history_router, wellness_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────
    await connect_to_mongo()
    ml_service.load()
    groq_service.load()

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────
    await close_mongo_connection()


app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)

# ── CORS — allow localhost dev + Vercel production ────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_origin_regex=r"https://.*\.vercel\.app",  # allows all vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler ───────────────────────────────────────────────────
# IMPORTANT: Starlette's CORSMiddleware only attaches CORS headers to responses
# that come back through it normally. If a route raises an *unhandled* exception
# (like the `UserOut` subscript bug), it propagates straight past CORSMiddleware
# up to Starlette's outer ServerErrorMiddleware, which builds the fallback 500
# response *without* CORS headers. The browser then reports this as a CORS
# error ("blocked by CORS policy"), even though the real problem is a 500.
#
# Registering a handler for the base Exception here means FastAPI's
# ExceptionMiddleware (which sits *inside* CORSMiddleware) catches it first and
# turns it into a normal JSONResponse, which *does* flow back out through
# CORSMiddleware and gets headers attached correctly. This doesn't fix bugs,
# but it means a bug elsewhere in the future won't ever look like a CORS issue
# again — you'll see the real error message in the response body/console.
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
    )


# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(history_router)
app.include_router(wellness_router)


# ── Misc top-level routes ──────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "model": ml_service.is_ready(),
        "shap": ml_service.is_shap_ready(),
        "groq": groq_service.is_ready(),
    }


@app.get("/health")
def health():
    return {
        "model_loaded":  ml_service.is_ready(),
        "scaler_loaded": ml_service.scaler is not None,
        "shap_ready":    ml_service.is_shap_ready(),
        "groq_ready":    groq_service.is_ready(),
        "n_features":    len(ml_service.feature_columns) if ml_service.feature_columns else None,
    }