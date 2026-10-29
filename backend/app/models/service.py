from datetime import datetime
from app import db

class Service(db.Model):
    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(50), nullable=True) # Icon key e.g. Zap, Wrench, Hammer, Sparkles, Fan, Tv, Paintbrush, KeyRound, HelpCircle
    base_price = db.Column(db.Float, nullable=False, default=299.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    provider_services = db.relationship("ProviderService", backref="service", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "base_price": self.base_price,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ProviderService(db.Model):
    __tablename__ = "provider_services"

    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey("provider_profiles.id"), nullable=False, index=True)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False, index=True)
    experience_years = db.Column(db.Integer, default=1)
    service_description = db.Column(db.Text, nullable=True)
    base_charge = db.Column(db.Float, nullable=True) # Override base price if set by provider
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Unique constraint per provider-service pair
    __table_args__ = (db.UniqueConstraint("provider_id", "service_id", name="uq_provider_service"),)

    def to_dict(self):
        svc_name = self.service.name if self.service else ""
        svc_icon = self.service.icon if self.service else ""
        default_price = self.service.base_price if self.service else 299.0
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "service_id": self.service_id,
            "service_name": svc_name,
            "service_icon": svc_icon,
            "experience_years": self.experience_years,
            "service_description": self.service_description,
            "base_charge": self.base_charge if self.base_charge is not None else default_price,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
