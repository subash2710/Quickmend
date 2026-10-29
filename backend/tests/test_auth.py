import pytest
from app import create_app, db
from app.models.user import User
from app.models.provider import ProviderProfile
from app.models.service import Service
from app.models.booking import Booking, ServiceRequest
from app.ai.fallback import analyze_problem_fallback

@pytest.fixture
def client():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-jwt-secret"
    })
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

def test_register_customer(client):
    res = client.post("/api/auth/register", json={
        "name": "Test Customer",
        "email": "customer@test.com",
        "password": "password123",
        "role": "CUSTOMER"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "token" in data
    assert data["user"]["email"] == "customer@test.com"

def test_login_user(client):
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "user@test.com",
        "password": "password123",
        "role": "CUSTOMER"
    })

    res = client.post("/api/auth/login", json={
        "email": "user@test.com",
        "password": "password123"
    })
    assert res.status_code == 200
    assert "token" in res.get_json()


def test_admin_login_requires_owner_credentials(client):
    admin = User(name="Vishagan R", email="vishagan@quickmend.com", role="ADMIN")
    admin.set_password("admin@123")
    db.session.add(admin)
    db.session.commit()

    invalid = client.post("/api/auth/admin-login", json={
        "name": "Vishagan R",
        "password": "wrong-password"
    })
    assert invalid.status_code == 401

    valid = client.post("/api/auth/admin-login", json={
        "name": "Vishagan R",
        "password": "admin@123"
    })
    assert valid.status_code == 200
    assert valid.get_json()["user"]["role"] == "ADMIN"


def test_public_registration_cannot_create_admin(client):
    res = client.post("/api/auth/register", json={
        "name": "Attempted Admin",
        "email": "attempted-admin@test.com",
        "password": "password123",
        "role": "ADMIN"
    })
    assert res.status_code == 400
    assert User.query.filter_by(email="attempted-admin@test.com").first() is None


def test_update_profile_location(client):
    register = client.post("/api/auth/register", json={
        "name": "Location User",
        "email": "location@test.com",
        "password": "password123",
        "role": "CUSTOMER"
    })
    token = register.get_json()["token"]

    res = client.put("/api/auth/profile", json={
        "address": "Ramanathapuram, Tamil Nadu",
        "latitude": 9.383,
        "longitude": 78.813
    }, headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200
    data = res.get_json()
    assert data["user"]["address"] == "Ramanathapuram, Tamil Nadu"
    assert data["user"]["latitude"] == 9.383
    assert data["user"]["longitude"] == 78.813


def test_customer_can_delete_profile_and_credentials(client):
    register = client.post("/api/auth/register", json={
        "name": "Delete Customer",
        "email": "delete-customer@test.com",
        "password": "password123",
        "role": "CUSTOMER"
    })
    token = register.get_json()["token"]
    user_id = register.get_json()["user"]["id"]

    res = client.delete("/api/auth/profile", headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200
    assert User.query.get(user_id) is None
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 404
    assert client.post("/api/auth/login", json={
        "email": "delete-customer@test.com",
        "password": "password123"
    }).status_code == 401


def test_provider_can_delete_profile_and_provider_details(client):
    register = client.post("/api/auth/register", json={
        "name": "Delete Provider",
        "email": "delete-provider@test.com",
        "password": "password123",
        "role": "PROVIDER"
    })
    token = register.get_json()["token"]
    user_id = register.get_json()["user"]["id"]

    res = client.delete("/api/auth/profile", headers={"Authorization": f"Bearer {token}"})

    assert res.status_code == 200
    assert User.query.get(user_id) is None
    assert ProviderProfile.query.filter_by(user_id=user_id).first() is None


def test_customer_can_cancel_owned_active_booking(client):
    service = Service(name="Plumbing", base_price=300.0)
    db.session.add(service)
    db.session.commit()

    customer = client.post("/api/auth/register", json={
        "name": "Booking Customer",
        "email": "booking-customer@test.com",
        "password": "password123",
        "role": "CUSTOMER"
    }).get_json()
    other_customer = client.post("/api/auth/register", json={
        "name": "Other Customer",
        "email": "other-customer@test.com",
        "password": "password123",
        "role": "CUSTOMER"
    }).get_json()
    provider = client.post("/api/auth/register", json={
        "name": "Booking Provider",
        "email": "booking-provider@test.com",
        "password": "password123",
        "role": "PROVIDER",
        "selected_service_ids": [service.id]
    }).get_json()
    provider_profile = ProviderProfile.query.filter_by(user_id=provider["user"]["id"]).first()
    provider_profile.duty_status = "ON_DUTY"
    provider_profile.availability_status = "BUSY"

    service_request = ServiceRequest(
        customer_id=customer["user"]["id"],
        service_id=service.id,
        problem_description="Leaking tap",
        latitude=12.9716,
        longitude=77.5946,
        status="ASSIGNED",
        assigned_provider_id=provider_profile.id,
    )
    db.session.add(service_request)
    db.session.flush()
    booking = Booking(
        customer_id=customer["user"]["id"],
        provider_id=provider_profile.id,
        service_id=service.id,
        service_request_id=service_request.id,
        problem_description="Leaking tap",
        customer_latitude=12.9716,
        customer_longitude=77.5946,
        status="PROVIDER_ASSIGNED",
        service_charge=300.0,
        total_amount=300.0,
    )
    db.session.add(booking)
    db.session.commit()

    forbidden = client.post(
        f"/api/bookings/{booking.id}/cancel",
        headers={"Authorization": f"Bearer {other_customer['token']}"},
    )
    assert forbidden.status_code == 403

    cancelled = client.post(
        f"/api/bookings/{booking.id}/cancel",
        headers={"Authorization": f"Bearer {customer['token']}"},
    )
    assert cancelled.status_code == 200
    assert cancelled.get_json()["booking"]["status"] == "CANCELLED"
    assert Booking.query.get(booking.id).status == "CANCELLED"
    assert ServiceRequest.query.get(service_request.id).status == "CANCELLED"
    assert provider_profile.availability_status == "AVAILABLE"


def test_provider_can_cancel_assigned_active_booking(client):
    service = Service(name="Electrical", base_price=300.0)
    db.session.add(service)
    db.session.commit()

    customer = client.post("/api/auth/register", json={
        "name": "Provider Cancel Customer",
        "email": "provider-cancel-customer@test.com",
        "password": "password123",
        "role": "CUSTOMER"
    }).get_json()
    provider = client.post("/api/auth/register", json={
        "name": "Provider Cancelling User",
        "email": "provider-cancel-user@test.com",
        "password": "password123",
        "role": "PROVIDER",
        "selected_service_ids": [service.id]
    }).get_json()
    provider_profile = ProviderProfile.query.filter_by(user_id=provider["user"]["id"]).first()
    provider_profile.duty_status = "ON_DUTY"
    provider_profile.availability_status = "BUSY"

    service_request = ServiceRequest(
        customer_id=customer["user"]["id"],
        service_id=service.id,
        problem_description="Broken switch",
        latitude=12.9716,
        longitude=77.5946,
        status="ASSIGNED",
        assigned_provider_id=provider_profile.id,
    )
    db.session.add(service_request)
    db.session.flush()
    booking = Booking(
        customer_id=customer["user"]["id"],
        provider_id=provider_profile.id,
        service_id=service.id,
        service_request_id=service_request.id,
        problem_description="Broken switch",
        customer_latitude=12.9716,
        customer_longitude=77.5946,
        status="PROVIDER_ACCEPTED",
        service_charge=300.0,
        total_amount=300.0,
    )
    db.session.add(booking)
    db.session.commit()

    cancelled = client.post(
        f"/api/bookings/{booking.id}/provider-cancel",
        headers={"Authorization": f"Bearer {provider['token']}"},
    )

    assert cancelled.status_code == 200
    assert cancelled.get_json()["booking"]["status"] == "CANCELLED"
    assert Booking.query.get(booking.id).status == "CANCELLED"
    assert ServiceRequest.query.get(service_request.id).status == "CANCELLED"
    assert provider_profile.availability_status == "AVAILABLE"


def test_ai_fallback_language_support():
    result = analyze_problem_fallback("water pipe is leaking", language="ta")
    assert "கசிவு" in result["ai_response"] or "பிளம்பிங்" in result["ai_response"]
    assert result["language"] == "ta"
