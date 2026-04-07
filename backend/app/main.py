"""
FastAPI application entry point.
"""
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.models.database import create_tables
from app.routers import rfp, agents, organisation

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Starting RFP Automation API", environment=settings.environment)

    # Ensure SQLAlchemy tables exist (idempotent)
    try:
        await create_tables()
        logger.info("Database tables verified")
    except Exception as e:
        logger.warning("Could not verify tables via ORM (may use raw SQL migrations)", error=str(e))

    # Ensure Qdrant collection
    try:
        from app.services.qdrant_service import ensure_collection
        await ensure_collection()
        logger.info("Qdrant collection verified")
    except Exception as e:
        logger.warning("Qdrant not available at startup", error=str(e))

    yield

    logger.info("Shutting down RFP Automation API")


app = FastAPI(
    title="RFP Automation API",
    description="AI-powered multi-agent RFP response system",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
_origins = (
    ["*"] if settings.environment == "development"
    else [o.strip() for o in (settings.allowed_origins or "").split(",") if o.strip()]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Validation error logging ──────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(
        "422 validation error",
        path=str(request.url),
        content_type=request.headers.get("content-type"),
        errors=exc.errors(),
    )
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


# ── Routers ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"
app.include_router(rfp.router, prefix=API_PREFIX)
app.include_router(agents.router, prefix=API_PREFIX)
app.include_router(organisation.router, prefix=API_PREFIX)


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.get(f"{API_PREFIX}/auth/google/callback")
async def google_callback(code: str, redirect_uri: str = "http://localhost:3000/api/auth/callback/google"):
    """Handle Google OAuth callback."""
    from app.services.auth_service import exchange_google_code, get_or_create_user_from_oauth
    from app.models.database import async_session_maker

    try:
        userinfo = await exchange_google_code(code, redirect_uri)
        async with async_session_maker() as db:
            user, token = await get_or_create_user_from_oauth(
                db,
                provider="google",
                provider_id=userinfo["id"],
                email=userinfo["email"],
                name=userinfo.get("name"),
            )
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})


@app.get(f"{API_PREFIX}/auth/microsoft/callback")
async def microsoft_callback(code: str, redirect_uri: str = "http://localhost:3000/api/auth/callback/azure-ad"):
    """Handle Microsoft OAuth callback."""
    from app.services.auth_service import exchange_microsoft_code, get_or_create_user_from_oauth
    from app.models.database import async_session_maker

    try:
        userinfo = await exchange_microsoft_code(code, redirect_uri)
        async with async_session_maker() as db:
            user, token = await get_or_create_user_from_oauth(
                db,
                provider="microsoft",
                provider_id=userinfo["id"],
                email=userinfo["email"],
                name=userinfo.get("name"),
            )
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})


# ── Dev convenience: get a token for the seeded demo user ─────────────────────
@app.get(f"{API_PREFIX}/auth/dev-token")
async def dev_token():
    """Return a JWT for the seeded demo user. Used by the demo login flow."""
    from app.models.database import async_session_maker
    from app.core.deps import _get_or_create_demo_user
    from app.core.deps import create_access_token

    async with async_session_maker() as db:
        user = await _get_or_create_demo_user(db)
        token = create_access_token(str(user.id), str(user.org_id))
    return {"access_token": token, "token_type": "bearer"}


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "environment": settings.environment}


@app.get("/")
async def root():
    return {"message": "RFP Automation API", "docs": "/docs"}
