from datetime import datetime
from app import db

class ProviderProfile(db.Model):
    __tablename__ = "provider_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    experience_years = db.Column(db.Integer, default=1)
    skills = db.Column(db.Text, nullable=True) # Comma-separated or description
    service_area = db.Column(db.String(150), nullable=True)
    rating = db.Column(db.Float, default=5.0, index=True)
    review_count = db.Column(db.Integer, default=0)
    completed_jobs = db.Column(db.Integer, default=0)
    service_quality_score = db.Column(db.Float, default=100.0) # 0-100 score
    duty_status = db.Column(db.String(20), default="OFF_DUTY", index=True) # ON_DUTY, OFF_DUTY
    availability_status = db.Column(db.String(20), default="UNAVAILABLE", index=True) # AVAILABLE, UNAVAILABLE, BUSY
    latitude = db.Column(db.Float, nullable=True, index=True)
    longitude = db.Column(db.Float, nullable=True, index=True)
    last_location_update = db.Column(db.DateTime, default=datetime.utcnow)
    service_radius = db.Column(db.Float, default=15.0) # Radius in Km
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider_services = db.relationship("ProviderService", backref="provider_profile", lazy="dynamic", cascade="all, delete-orphan")
    bookings_as_provider = db.relationship("Booking", foreign_keys="Booking.provider_id", backref="provider_user", lazy="dynamic")

    def to_dict(self, include_services=True):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.user.name if self.user else None,
            "email": self.user.email if self.user else None,
            "phone": self.user.phone if self.user else None,
            "profile_image": self.user.profile_image if self.user else None,
            "experience_years": self.experience_years,
            "skills": self.skills,
            "service_area": self.service_area,
            "rating": round(self.rating or 5.0, 2),
            "review_count": self.review_count or 0,
            "completed_jobs": self.completed_jobs or 0,
            "service_quality_score": round(self.service_quality_score or 100.0, 1),
            "duty_status": self.duty_status,
            "availability_status": self.availability_status,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "last_location_update": self.last_location_update.isoformat() if self.last_location_update else None,
            "service_radius": self.service_radius,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        if include_services:
            data["services"] = [ps.to_dict() for ps in self.provider_services.filter_by(is_active=True).all()]
        return data
