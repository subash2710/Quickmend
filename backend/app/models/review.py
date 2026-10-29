from datetime import datetime
from app import db

class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    provider_id = db.Column(db.Integer, db.ForeignKey("provider_profiles.id"), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False) # 1 to 5 stars
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship
    customer_user = db.relationship("User", foreign_keys="Review.customer_id")

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "customer_id": self.customer_id,
            "customer_name": self.customer_user.name if self.customer_user else "Customer",
            "provider_id": self.provider_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
