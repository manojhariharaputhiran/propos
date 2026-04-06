from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt
from typing import AsyncGenerator, Optional
import uuid

from app.core.config import settings
from app.models.database import async_session_maker, Organisation, User
from sqlalchemy import select

security = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode JWT and return the current user. Falls back to demo user in dev."""
    if credentials is None:
        # In development without a real auth token, return mock user
        if settings.environment == "development":
            return await _get_or_create_demo_user(db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user


async def _get_or_create_demo_user(db: AsyncSession) -> User:
    """Return the seeded demo user for local development."""
    result = await db.execute(select(User).where(User.email == "demo@example.com"))
    user = result.scalar_one_or_none()
    if user:
        return user

    # Fallback: create inline if seed hasn't run yet
    org = Organisation(name="Demo Organisation", brand_voice="professional")
    db.add(org)
    await db.flush()

    user = User(
        org_id=org.id,
        email="demo@example.com",
        name="Demo User",
        provider="dev",
        provider_id="demo",
        role="admin",
    )
    db.add(user)
    await db.flush()
    return user


def create_access_token(user_id: str, org_id: str) -> str:
    from datetime import datetime, timedelta
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    data = {"sub": user_id, "org_id": org_id, "exp": expire}
    return jwt.encode(data, settings.jwt_secret, algorithm=settings.jwt_algorithm)
