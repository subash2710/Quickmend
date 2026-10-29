from datetime import datetime
from app import db

class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False, unique=True, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    provider_id = db.Column(db.Integer, db.ForeignKey("provider_profiles.id"), nullable=False, index=True)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default="INR")
    paypal_order_id = db.Column(db.String(100), nullable=True, index=True)
    paypal_transaction_id = db.Column(db.String(100), nullable=True, index=True)
    payment_status = db.Column(db.String(30), default="PENDING", index=True) # PENDING, COMPLETED, FAILED, REFUNDED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "customer_id": self.customer_id,
            "provider_id": self.provider_id,
            "amount": self.amount,
            "currency": self.currency,
            "paypal_order_id": self.paypal_order_id,
            "paypal_transaction_id": self.paypal_transaction_id,
            "payment_status": self.payment_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class ProviderEarning(db.Model):
    __tablename__ = "provider_earnings"

    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey("provider_profiles.id"), nullable=False, index=True)
    booking_id = db.Column(db.Integer, db.ForeignKey("bookings.id"), nullable=False, index=True)
    gross_amount = db.Column(db.Float, nullable=False)
    platform_fee = db.Column(db.Float, nullable=False) # e.g. 10%
    net_amount = db.Column(db.Float, nullable=False)
    payment_status = db.Column(db.String(30), default="COMPLETED")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "booking_id": self.booking_id,
            "gross_amount": self.gross_amount,
            "platform_fee": self.platform_fee,
            "net_amount": self.net_amount,
            "payment_status": self.payment_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
