from app.routes.auth import router as auth_router
from app.routes.predict import router as predict_router
from app.routes.history import router as history_router
from app.routes.wellness import router as wellness_router

__all__ = ["auth_router", "predict_router", "history_router", "wellness_router"]