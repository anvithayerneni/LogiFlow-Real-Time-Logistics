import pytest
from httpx import AsyncClient
from app.models.user import UserRole
from tests.conftest import auth_header_for


@pytest.mark.asyncio
async def test_register_customer_success(client: AsyncClient):
    payload = {
        "email": "newuser@example.com",
        "password": "strongpassword123",
        "full_name": "New User",
        "phone": "+1-555-9999",
        "role": UserRole.CUSTOMER,
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == UserRole.CUSTOMER


@pytest.mark.asyncio
async def test_register_duplicate_email_fails(client: AsyncClient, sample_customer):
    payload = {
        "email": sample_customer.email,
        "password": "anotherpassword",
        "full_name": "Imposter",
        "role": UserRole.CUSTOMER,
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, sample_customer):
    payload = {
        "email": sample_customer.email,
        "password": "password123",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["id"] == sample_customer.id


@pytest.mark.asyncio
async def test_login_wrong_password_fails(client: AsyncClient, sample_customer):
    payload = {
        "email": sample_customer.email,
        "password": "wrongpassword!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient, sample_customer):
    headers = auth_header_for(sample_customer)
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == sample_customer.email


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
