from datetime import datetime
from app import db

class AIRequest(db.Model):
    __tablename__ = "ai_requests"

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    input_type = db.Column(db.String(20), default="text") # text, image, voice
    input_text = db.Column(db.Text, nullable=True)
    image_url = db.Column(db.String(255), nullable=True)
    detected_problem = db.Column(db.String(150), nullable=True)
    detected_service = db.Column(db.String(100), nullable=True)
    severity = db.Column(db.String(50), default="Medium")
    requires_professional = db.Column(db.Boolean, default=True)
    ai_response = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "input_type": self.input_type,
            "input_text": self.input_text,
            "image_url": self.image_url,
            "detected_problem": self.detected_problem,
            "detected_service": self.detected_service,
            "severity": self.severity,
            "requires_professional": self.requires_professional,
            "ai_response": self.ai_response,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
