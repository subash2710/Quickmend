from app.models.review import Review
from app.models.provider import ProviderProfile
from app.models.booking import Booking
from app import db

def recalculate_provider_rating(provider_id):
    """
    Recalculates a provider's overall rating, review count, completed jobs, and service quality score
    from the database records.
    """
    provider = ProviderProfile.query.get(provider_id)
    if not provider:
        return None

    # Fetch all reviews for this provider
    reviews = Review.query.filter_by(provider_id=provider_id).all()
    review_count = len(reviews)

    if review_count > 0:
        total_rating_sum = sum(r.rating for r in reviews)
        avg_rating = total_rating_sum / review_count
        provider.rating = round(avg_rating, 2)
        provider.review_count = review_count

        # Quality score = percentage of 4 & 5 star reviews
        positive_reviews = sum(1 for r in reviews if r.rating >= 4)
        provider.service_quality_score = round((positive_reviews / review_count) * 100.0, 1)
    else:
        # Default if no reviews yet
        provider.rating = 5.0
        provider.review_count = 0
        provider.service_quality_score = 100.0

    # Calculate completed jobs count from bookings
    completed_jobs_count = Booking.query.filter(
        Booking.provider_id == provider_id,
        Booking.status.in_(["SERVICE_COMPLETED", "PAYMENT_PENDING", "PAYMENT_COMPLETED"])
    ).count()

    provider.completed_jobs = completed_jobs_count

    db.session.commit()
    return provider
