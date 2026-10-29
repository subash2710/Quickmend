from datetime import datetime
from app import db

class ServiceRequest(db.Model):
    __tablename__ = "service_requests"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False, index=True)
    problem_description = db.Column(db.Text, nullable=False)
    ai_classification = db.Column(db.String(100), nullable=True)
    severity = db.Column(db.String(50), default="Medium") # Low, Medium, High, Emergency
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default="PENDING", index=True) # PENDING, ASSIGNED, COMPLETED, EXPIRED, CANCELLED
    assigned_provider_id = db.Column(db.Integer, db.ForeignKey("provider_profiles.id"), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "service_id": self.service_id,
            "problem_description": self.problem_description,
            "ai_classification": self.ai_classification,
            "severity": self.severity,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "status": self.status,
            "assigned_provider_id": self.assigned_provider_id,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    provider_id = db.Column(db.Integer, db.ForeignKey("provider_profiles.id"), nullable=False, index=True)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False, index=True)
    service_request_id = db.Column(db.Integer, db.ForeignKey("service_requests.id"), nullable=True)
    problem_description = db.Column(db.Text, nullable=False)
    ai_classification = db.Column(db.String(100), nullable=True)
    severity = db.Column(db.String(50), default="Medium")
    customer_latitude = db.Column(db.Float, nullable=False)
    customer_longitude = db.Column(db.Float, nullable=False)
    provider_latitude = db.Column(db.Float, nullable=True)
    provider_longitude = db.Column(db.Float, nullable=True)
    
    # Booking Statuses:
    # SEARCHING_PROVIDER, PROVIDER_ASSIGNED, PROVIDER_ACCEPTED, PROVIDER_ON_THE_WAY,
    # PROVIDER_ARRIVED, SERVICE_STARTED, SERVICE_COMPLETED, PAYMENT_PENDING, PAYMENT_COMPLETED, CANCELLED
    status = db.Column(db.String(50), nullable=False, default="SEARCHING_PROVIDER", index=True)

    estimated_distance = db.Column(db.Float, nullable=True) # in Km
    estimated_arrival = db.Column(db.Integer, nullable=True) # in minutes
    service_charge = db.Column(db.Float, nullable=False, default=299.0)
    additional_charge = db.Column(db.Float, nullable=False, default=0.0)
    total_amount = db.Column(db.Float, nullable=False, default=299.0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    accepted_at = db.Column(db.DateTime, nullable=True)
    arrived_at = db.Column(db.DateTime, nullable=True)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    service_ref = db.relationship("Service", backref="bookings")
    payment = db.relationship("Payment", backref="booking", uselist=False, cascade="all, delete-orphan")
    review = db.relationship("Review", backref="booking", uselist=False, cascade="all, delete-orphan")

    def to_dict(self, include_details=True):
        data = {
            "id": self.id,
            "customer_id": self.customer_id,
            "provider_id": self.provider_id,
            "service_id": self.service_id,
            "service_name": self.service_ref.name if self.service_ref else None,
            "service_icon": self.service_ref.icon if self.service_ref else None,
            "problem_description": self.problem_description,
            "ai_classification": self.ai_classification,
            "severity": self.severity,
            "customer_latitude": self.customer_latitude,
            "customer_longitude": self.customer_longitude,
            "provider_latitude": self.provider_latitude,
            "provider_longitude": self.provider_longitude,
            "status": self.status,
            "estimated_distance": self.estimated_distance,
            "estimated_arrival": self.estimated_arrival,
            "service_charge": self.service_charge,
            "additional_charge": self.additional_charge,
            "total_amount": self.total_amount,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "accepted_at": self.accepted_at.isoformat() if self.accepted_at else None,
            "arrived_at": self.arrived_at.isoformat() if self.arrived_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "cancelled_at": self.cancelled_at.isoformat() if self.cancelled_at else None,
        }
        if include_details:
            if self.customer:
                data["customer"] = {
                    "id": self.customer.id,
                    "name": self.customer.name,
                    "email": self.customer.email,
                    "phone": self.customer.phone,
                    "address": self.customer.address,
                }
            if self.provider_user:
                data["provider"] = self.provider_user.to_dict(include_services=False)
            if self.payment:
                data["payment"] = self.payment.to_dict()
            if self.review:
                data["review"] = self.review.to_dict()
        return data
