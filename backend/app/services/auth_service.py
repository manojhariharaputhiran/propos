"""
Auth service: handles OAuth token exchange and user creation/lookup.
"""
import uuid
from typing import Optional, Dict, Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import User, Organisation
from app.core.config import settings
from app.core.deps import create_access_token


async def get_or_create_user_from_oauth(
    db: AsyncSession,
    provider: str,
    provider_id: str,
    email: str,
    name: Optional[str],
) -> tuple[User, str]:
    """
    Find existing user or create new one with an auto-created org.
    Returns (user, access_token).
    """
    # Try to find by provider_id first
    result = await db.execute(
        select(User).where(User.provider == provider, User.provider_id == provider_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        # Try by email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

    if not user:
        # Create org + user for first login
        org = Organisation(
            name=f"{name or email.split('@')[0]}'s Org",
            brand_voice="professional",
        )
        db.add(org)
        await db.flush()

        user = User(
            org_id=org.id,
            email=email,
            name=name,
            provider=provider,
            provider_id=provider_id,
            role="admin",
        )
        db.add(user)
        await db.flush()
    else:
        # Update provider info if changed
        user.provider = provider
        user.provider_id = provider_id
        if name:
            user.name = name

    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id), str(user.org_id))
    return user, token


async def exchange_google_code(code: str, redirect_uri: str) -> Dict[str, Any]:
    """Exchange Google auth code for user info."""
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()

        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        userinfo_resp.raise_for_status()
        return userinfo_resp.json()


async def exchange_microsoft_code(code: str, redirect_uri: str, tenant_id: str = "common") -> Dict[str, Any]:
    """Exchange Microsoft auth code for user info."""
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
            data={
                "code": code,
                "client_id": settings.microsoft_client_id,
                "client_secret": settings.microsoft_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
                "scope": "openid email profile",
            },
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()

        graph_resp = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        graph_resp.raise_for_status()
        data = graph_resp.json()
        # Normalise to Google-like structure
        return {
            "id": data.get("id"),
            "email": data.get("mail") or data.get("userPrincipalName"),
            "name": data.get("displayName"),
        }
