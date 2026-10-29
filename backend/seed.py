import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.provider import ProviderProfile
from app.models.service import Service, ProviderService

app = create_app()

SERVICES_SEED = [
    {"name": "Electrical", "description": "Wiring, switchboard repair, fan installation, lighting, circuit breakers.", "icon": "Zap", "base_price": 299.0},
    {"name": "Plumbing", "description": "Tap repair, pipe leaks, drain unblocking, bathroom fitting, water heater installation.", "icon": "Wrench", "base_price": 349.0},
    {"name": "Carpentry", "description": "Door fitting, furniture assembly, lock installation, wooden repair, custom shelves.", "icon": "Hammer", "base_price": 399.0},
    {"name": "Cleaning", "description": "Home deep cleaning, sofa & carpet shampooing, bathroom sanitization, kitchen cleaning.", "icon": "Sparkles", "base_price": 499.0},
    {"name": "AC Service", "description": "AC filter cleaning, gas refilling, compressor check, installation & uninstallation.", "icon": "Fan", "base_price": 599.0},
    {"name": "Appliance Repair", "description": "Washing machine, refrigerator, microwave oven, TV, and water purifier repair.", "icon": "Tv", "base_price": 449.0},
    {"name": "Painting", "description": "Interior & exterior wall painting, damp proofing, touch-up polish, wallpaper installation.", "icon": "Paintbrush", "base_price": 799.0},
    {"name": "Locksmith", "description": "Emergency door lockout, key duplication, smart lock fitting, cylinder replacement.", "icon": "KeyRound", "base_price": 349.0},
    {"name": "Other Home Services", "description": "General maintenance, handyman assistance, pest control, curtain hanging.", "icon": "HelpCircle", "base_price": 299.0},
]

PROVIDERS_SEED = [
    {
        "name": "Arun Kumar",
        "email": "arun@quickmend.com",
        "phone": "+91 9876543210",
        "password": "provider123",
        "experience": 5,
        "skills": "Electrical wiring, AC installation & gas refill, MCB repair",
        "rating": 4.7,
        "completed_jobs": 120,
        "duty_status": "ON_DUTY",
        "availability_status": "AVAILABLE",
        "services": ["Electrical", "AC Service"],
        "lat": 12.9720,
        "lng": 77.5950
    },
    {
        "name": "Suresh Raina",
        "email": "suresh@quickmend.com",
        "phone": "+91 9876543211",
        "password": "provider123",
        "experience": 6,
        "skills": "Pipe leakage fixing, tap & mixer fitting, flush tank repair",
        "rating": 4.6,
        "completed_jobs": 95,
        "duty_status": "ON_DUTY",
        "availability_status": "AVAILABLE",
        "services": ["Plumbing"],
        "lat": 12.9750,
        "lng": 77.5920
    },
    {
        "name": "Vijay Verma",
        "email": "vijay@quickmend.com",
        "phone": "+91 9876543212",
        "password": "provider123",
        "experience": 4,
        "skills": "Furniture repair, door alignment, carpet deep cleaning",
        "rating": 4.5,
        "completed_jobs": 40,
        "duty_status": "OFF_DUTY",
        "availability_status": "UNAVAILABLE",
        "services": ["Carpentry", "Cleaning"],
        "lat": 12.9680,
        "lng": 77.6000
    },
    {
        "name": "Meena Kumari",
        "email": "meena@quickmend.com",
        "phone": "+91 9876543213",
        "password": "provider123",
        "experience": 3,
        "skills": "Kitchen sanitization, bathroom scrub, sofa dry cleaning",
        "rating": 4.8,
        "completed_jobs": 85,
        "duty_status": "ON_DUTY",
        "availability_status": "AVAILABLE",
        "services": ["Cleaning"],
        "lat": 12.9710,
        "lng": 77.5980
    }
]

CUSTOMERS_SEED = [
    {"name": "Rahul Sharma", "email": "rahul@quickmend.com", "phone": "+91 9123456789", "password": "customer123", "address": "101 Green Park, Koramangala"},
    {"name": "Priya Patel", "email": "priya@quickmend.com", "phone": "+91 9123456790", "password": "customer123", "address": "204 Sunrise Towers, Indiranagar"},
    {"name": "Karthik Raja", "email": "karthik@quickmend.com", "phone": "+91 9123456791", "password": "customer123", "address": "55 Lake View Road, HSR Layout"}
]

ADMIN_SEED = {"name": "Vishagan R", "email": "vishagan@quickmend.com", "phone": "+91 9000000000", "password": "admin@123"}

def seed_database():
    with app.app_context():
        print("Creating database tables...")
        db.create_all()

        print("Seeding Services...")
        svc_map = {}
        for sdata in SERVICES_SEED:
            svc = Service.query.filter_by(name=sdata["name"]).first()
            if not svc:
                svc = Service(
                    name=sdata["name"],
                    description=sdata["description"],
                    icon=sdata["icon"],
                    base_price=sdata["base_price"],
                    is_active=True
                )
                db.session.add(svc)
                db.session.flush()
            svc_map[svc.name] = svc

        print("Seeding Admin User...")
        admin = User.query.filter_by(role="ADMIN").first()
        if not admin:
            admin = User(
                name=ADMIN_SEED["name"],
                email=ADMIN_SEED["email"],
                phone=ADMIN_SEED["phone"],
                role="ADMIN"
            )
            admin.set_password(ADMIN_SEED["password"])
            db.session.add(admin)
        else:
            # Keep the owner account aligned when reseeding an existing database.
            admin.name = ADMIN_SEED["name"]
            admin.email = ADMIN_SEED["email"]
            admin.phone = ADMIN_SEED["phone"]
            admin.set_password(ADMIN_SEED["password"])

        print("Seeding Customers...")
        for cdata in CUSTOMERS_SEED:
            cust = User.query.filter_by(email=cdata["email"]).first()
            if not cust:
                cust = User(
                    name=cdata["name"],
                    email=cdata["email"],
                    phone=cdata["phone"],
                    role="CUSTOMER",
                    address=cdata["address"],
                    latitude=12.9716,
                    longitude=77.5946
                )
                cust.set_password(cdata["password"])
                db.session.add(cust)

        print("Seeding Providers...")
        for pdata in PROVIDERS_SEED:
            puser = User.query.filter_by(email=pdata["email"]).first()
            if not puser:
                puser = User(
                    name=pdata["name"],
                    email=pdata["email"],
                    phone=pdata["phone"],
                    role="PROVIDER",
                    latitude=pdata["lat"],
                    longitude=pdata["lng"],
                    address="MG Road, Bangalore"
                )
                puser.set_password(pdata["password"])
                db.session.add(puser)
                db.session.flush()

            profile = ProviderProfile.query.filter_by(user_id=puser.id).first()
            if not profile:
                profile = ProviderProfile(
                    user_id=puser.id,
                    experience_years=pdata["experience"],
                    skills=pdata["skills"],
                    rating=pdata["rating"],
                    review_count=10,
                    completed_jobs=pdata["completed_jobs"],
                    service_quality_score=95.0,
                    duty_status=pdata["duty_status"],
                    availability_status=pdata["availability_status"],
                    latitude=pdata["lat"],
                    longitude=pdata["lng"],
                    service_radius=15.0
                )
                db.session.add(profile)
                db.session.flush()

            for sname in pdata["services"]:
                svc = svc_map.get(sname)
                if svc:
                    ps = ProviderService.query.filter_by(provider_id=profile.id, service_id=svc.id).first()
                    if not ps:
                        ps = ProviderService(
                            provider_id=profile.id,
                            service_id=svc.id,
                            experience_years=pdata["experience"],
                            is_active=True
                        )
                        db.session.add(ps)

        db.session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
