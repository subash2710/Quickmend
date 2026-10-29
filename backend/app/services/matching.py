from app.models.provider import ProviderProfile
from app.models.service import ProviderService
from app.models.booking import Booking
from app.utils.geo import calculate_distance, calculate_eta_minutes
from app import db

def find_best_provider(service_id, customer_lat, customer_lng, exclude_provider_ids=None):
    """
    Finds the best eligible ON-DUTY available provider offering service_id near customer_lat/customer_lng.
    Falls back to a broader search radius when the default local radius yields no matches.
    Returns (provider_profile, score, distance_km, eta_mins) or (None, 0, 0, 0)
    """
    candidates = find_provider_options(
        service_id, customer_lat, customer_lng, exclude_provider_ids
    )
    if not candidates:
        return None, 0, 0, 0
    best = candidates[0]
    return best["provider"], best["score"], best["distance_km"], best["eta_mins"]


def find_provider_options(service_id, customer_lat, customer_lng, exclude_provider_ids=None):
    """Return eligible providers ordered by matching score, with distance and ETA."""
    exclude_ids = exclude_provider_ids or []
    provider_services = ProviderService.query.filter_by(
        service_id=service_id,
        is_active=True
    ).all()

    if not provider_services:
        return []

    candidate_provider_ids = [ps.provider_id for ps in provider_services if ps.provider_id not in exclude_ids]
    if not candidate_provider_ids:
        return []

    eligible_profiles = ProviderProfile.query.filter(
        ProviderProfile.id.in_(candidate_provider_ids),
        ProviderProfile.duty_status == "ON_DUTY",
        ProviderProfile.availability_status == "AVAILABLE"
    ).all()

    scored_candidates = []

    for provider in eligible_profiles:
        active_booking = Booking.query.filter(
            Booking.provider_id == provider.id,
            Booking.status.in_([
                "PROVIDER_ASSIGNED",
                "PROVIDER_ACCEPTED",
                "PROVIDER_ON_THE_WAY",
                "PROVIDER_ARRIVED",
                "SERVICE_STARTED"
            ])
        ).first()

        if active_booking:
            continue

        dist = calculate_distance(customer_lat, customer_lng, provider.latitude, provider.longitude)
        max_radius = provider.service_radius or 15.0
        if dist > max_radius:
            continue

        dist_score = max(0.0, (1.0 - (dist / max_radius))) * 100.0 if max_radius > 0 else 100.0
        avail_score = 100.0 if provider.availability_status == "AVAILABLE" else 0.0
        rating_score = ((provider.rating or 5.0) / 5.0) * 100.0
        exp_score = min((provider.experience_years or 1) / 10.0, 1.0) * 100.0
        quality_score = provider.service_quality_score or 100.0

        total_score = (
            (dist_score * 0.30) +
            (avail_score * 0.20) +
            (rating_score * 0.20) +
            (exp_score * 0.15) +
            (quality_score * 0.15)
        )

        eta = calculate_eta_minutes(dist)
        scored_candidates.append({
            "provider": provider,
            "score": round(total_score, 2),
            "distance_km": dist,
            "eta_mins": eta
        })

    if not scored_candidates:
        fallback_candidates = []
        for provider in eligible_profiles:
            active_booking = Booking.query.filter(
                Booking.provider_id == provider.id,
                Booking.status.in_([
                    "PROVIDER_ASSIGNED",
                    "PROVIDER_ACCEPTED",
                    "PROVIDER_ON_THE_WAY",
                    "PROVIDER_ARRIVED",
                    "SERVICE_STARTED"
                ])
            ).first()
            if active_booking:
                continue

            dist = calculate_distance(customer_lat, customer_lng, provider.latitude, provider.longitude)
            if dist <= 100.0:
                rating_score = ((provider.rating or 5.0) / 5.0) * 100.0
                exp_score = min((provider.experience_years or 1) / 10.0, 1.0) * 100.0
                quality_score = provider.service_quality_score or 100.0
                fallback_score = (rating_score * 0.45) + (exp_score * 0.25) + (quality_score * 0.30)
                fallback_candidates.append({
                    "provider": provider,
                    "score": round(fallback_score, 2),
                    "distance_km": dist,
                    "eta_mins": calculate_eta_minutes(dist)
                })

        if not fallback_candidates:
            return []

        fallback_candidates.sort(key=lambda c: (c["distance_km"], c["score"]), reverse=False)
        return fallback_candidates

    scored_candidates.sort(key=lambda c: c["score"], reverse=True)
    return scored_candidates
