from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="CUSTOMER") # CUSTOMER, PROVIDER, ADMIN
    profile_image = db.Column(db.String(255), nullable=True)
    language = db.Column(db.String(10), nullable=False, default="en") # en, ta, hi
    address = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to provider profile if role is PROVIDER
    provider_profile = db.relationship("ProviderProfile", backref="user", uselist=False, cascade="all, delete-orphan")
    bookings_as_customer = db.relationship("Booking", foreign_keys="Booking.customer_id", backref="customer", lazy="dynamic")
    notifications = db.relationship("Notification", backref="user", lazy="dynamic", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        data = {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "profile_image": self.profile_image,
            "language": self.language,
            "address": self.address,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if self.role == "PROVIDER" and self.provider_profile:
            data["provider_profile"] = self.provider_profile.to_dict()
        return data
