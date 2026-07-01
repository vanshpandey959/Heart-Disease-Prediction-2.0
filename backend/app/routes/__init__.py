from app.routes.auth import router as auth_router
from app.routes.predict import router as predict_router
from app.routes.history import router as history_router

__all__ = ["auth_router", "predict_router", "history_router"]