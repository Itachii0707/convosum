"""
Integration tests for the Dialogue Summarization API.
Run with:  pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base  # noqa: F401  (needed for table creation)
from app.db.base_class import Base as BaseClass
from app.api import deps
from main import app

# ─── Test DB Setup ────────────────────────────────────────────────────────────

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    BaseClass.metadata.create_all(bind=engine)
    yield
    BaseClass.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[deps.get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def register_and_login(client: TestClient, email: str, password: str) -> str:
    """Create a user and return their JWT access token."""
    client.post(
        "/api/v1/users/",
        json={"email": email, "password": password, "full_name": "Test User"},
    )
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


# ─── Tests ────────────────────────────────────────────────────────────────────


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_user(client):
    resp = client.post(
        "/api/v1/users/",
        json={
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "full_name": "New User",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "newuser@example.com"


def test_register_duplicate_user(client):
    payload = {"email": "dup@example.com", "password": "pass123"}
    client.post("/api/v1/users/", json=payload)
    resp = client.post("/api/v1/users/", json=payload)
    assert resp.status_code == 400


def test_login_success(client):
    email, password = "login@example.com", "securepass"
    client.post("/api/v1/users/", json={"email": email, "password": password})
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    email = "wrongpass@example.com"
    client.post("/api/v1/users/", json={"email": email, "password": "correct"})
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "wrong"},
    )
    assert resp.status_code == 400


def test_get_me(client):
    email, password = "me@example.com", "mepass"
    token = register_and_login(client, email, password)
    resp = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == email


def test_models_endpoint(client):
    email, password = "models@example.com", "modelspass"
    token = register_and_login(client, email, password)
    resp = client.get(
        "/api/v1/models/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) > 0


def test_analytics_empty(client):
    email, password = "analytics@example.com", "analypass"
    token = register_and_login(client, email, password)
    resp = client.get(
        "/api/v1/analytics/",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_documents"] == 0
    assert body["total_summaries"] == 0


def test_history_empty(client):
    email, password = "hist@example.com", "histpass"
    token = register_and_login(client, email, password)
    resp = client.get(
        "/api/v1/summarize/history",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json() == []


def test_unauthorized_access(client):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 401 or resp.status_code == 403
