from flask import Blueprint, request, jsonify
from app import db, socketio
from app.models.review import Review
from app.models.booking import Booking
from app.models.provider import ProviderProfile
from app.services.rating import recalculate_provider_rating
from app.services.notification_service import send_notification
from app.auth.helpers import role_required

reviews_bp = Blueprint("reviews", __name__)

@reviews_bp.route("", methods=["POST"])
@role_required("CUSTOMER")
def submit_review(current_user):
    data = request.get_json() or {}
    booking_id = data.get("booking_id")
    rating = int(data.get("rating", 5))
    comment = data.get("comment", "")

    if not booking_id:
        return jsonify({"error": "booking_id is required"}), 400

    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5 stars"}), 400

    booking = Booking.query.get_or_404(booking_id)

    if booking.customer_id != current_user.id:
        return jsonify({"error": "You can only review your own bookings"}), 403

    # Check for duplicate review per booking constraint
    existing_review = Review.query.filter_by(booking_id=booking.id).first()
    if existing_review:
        return jsonify({"error": "You have already submitted feedback for this booking"}), 400

    review = Review(
        booking_id=booking.id,
        customer_id=current_user.id,
        provider_id=booking.provider_id,
        rating=rating,
        comment=comment
    )
    db.session.add(review)
    db.session.commit()

    # Automatically recalculate provider rating and stats in DB
    updated_provider = recalculate_provider_rating(booking.provider_id)

    # Send Notification to Provider
    if booking.provider_user:
        send_notification(
            user_id=booking.provider_user.user_id,
            notif_type="NEW_REVIEW",
            title="New Rating & Feedback Received!",
            message=f"Customer gave you {rating} stars: '{comment or 'Great job!'}'",
            booking_id=booking.id
        )

        try:
            socketio.emit(
                "provider_rating_updated",
                {
                    "provider_id": updated_provider.id if updated_provider else booking.provider_id,
                    "new_rating": updated_provider.rating if updated_provider else rating,
                    "review_count": updated_provider.review_count if updated_provider else 1,
                    "review": review.to_dict()
                },
                to=f"user_{booking.provider_user.user_id}"
            )
        except Exception as e:
            print(f"Socket error: {e}")

    return jsonify({
        "message": "Feedback submitted successfully! Provider rating updated.",
        "review": review.to_dict(),
        "updated_provider_rating": updated_provider.rating if updated_provider else rating
    }), 201


@reviews_bp.route("/provider/<int:provider_id>", methods=["GET"])
def get_provider_reviews(provider_id):
    reviews = Review.query.filter_by(provider_id=provider_id).order_by(Review.created_at.desc()).all()
    return jsonify({"reviews": [r.to_dict() for r in reviews]}), 200
