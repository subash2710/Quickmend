import pytest
from app import create_app, db
from app.models.user import User
from app.models.provider import ProviderProfile
from app.models.service import Service, ProviderService
from app.services.matching import find_best_provider
from app.services.rating import recalculate_provider_rating
from app.models.review import Review
from app.models.booking import Booking

@pytest.fixture
def test_app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-jwt-secret"
    })
    with app.app_context():
        db.create_all()
        # Seed test service
        svc = Service(name="Plumbing", description="Plumbing service", icon="Wrench", base_price=300.0)
        db.session.add(svc)
        db.session.commit()
        yield app
        db.drop_all()

def test_provider_matching(test_app):
    with test_app.app_context():
        # Create Provider user & profile
        puser = User(name="Plumber Sam", email="sam@test.com", role="PROVIDER")
        puser.set_password("pass123")
        db.session.add(puser)
        db.session.flush()

        profile = ProviderProfile(
            user_id=puser.id,
            experience_years=5,
            rating=4.8,
            duty_status="ON_DUTY",
            availability_status="AVAILABLE",
            latitude=12.9716,
            longitude=77.5946,
            service_radius=15.0
        )
        db.session.add(profile)
        db.session.flush()

        svc = Service.query.filter_by(name="Plumbing").first()
        ps = ProviderService(provider_id=profile.id, service_id=svc.id)
        db.session.add(ps)
        db.session.commit()

        # Execute matching algorithm
        provider, score, dist, eta = find_best_provider(svc.id, 12.9720, 77.5950)
        assert provider is not None
        assert provider.id == profile.id
        assert score > 0

def test_provider_matching_falls_back_to_nearest_available_service_area(test_app):
    with test_app.app_context():
        puser = User(name="Remote Tech", email="remote@test.com", role="PROVIDER")
        puser.set_password("pass123")
        db.session.add(puser)
        db.session.flush()

        profile = ProviderProfile(
            user_id=puser.id,
            experience_years=4,
            rating=4.7,
            duty_status="ON_DUTY",
            availability_status="AVAILABLE",
            latitude=12.9716,
            longitude=77.5946,
            service_radius=15.0,
        )
        db.session.add(profile)
        db.session.flush()

        svc = Service.query.filter_by(name="Plumbing").first()
        ps = ProviderService(provider_id=profile.id, service_id=svc.id)
        db.session.add(ps)
        db.session.commit()

        provider, score, dist, eta = find_best_provider(svc.id, 12.5, 77.8)
        assert provider is not None
        assert provider.id == profile.id
        assert dist <= 100
        assert eta >= 4


def test_rating_recalculation(test_app):
    with test_app.app_context():
        # Create Customer & Provider
        cust = User(name="Customer User", email="c@test.com", role="CUSTOMER")
        prov_user = User(name="Prov User", email="p@test.com", role="PROVIDER")
        cust.set_password("pass")
        prov_user.set_password("pass")
        db.session.add_all([cust, prov_user])
        db.session.flush()

        profile = ProviderProfile(user_id=prov_user.id, rating=5.0, review_count=0)
        db.session.add(profile)
        db.session.flush()

        svc = Service.query.first()
        booking = Booking(
            customer_id=cust.id,
            provider_id=profile.id,
            service_id=svc.id,
            problem_description="Fix tap",
            customer_latitude=12.9,
            customer_longitude=77.5,
            status="SERVICE_COMPLETED",
            service_charge=300.0,
            total_amount=300.0
        )
        db.session.add(booking)
        db.session.flush()

        rev1 = Review(booking_id=booking.id, customer_id=cust.id, provider_id=profile.id, rating=5, comment="Great job!")
        db.session.add(rev1)
        db.session.commit()

        updated_prov = recalculate_provider_rating(profile.id)
        assert updated_prov.rating == 5.0
        assert updated_prov.review_count == 1
