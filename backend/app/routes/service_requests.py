from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from app import db, socketio
from app.models.booking import ServiceRequest, Booking
from app.models.service import Service, ProviderService
from app.models.provider import ProviderProfile
from app.services.matching import find_best_provider, find_provider_options
from app.services.notification_service import send_notification
from app.auth.helpers import role_required

service_requests_bp = Blueprint("service_requests", __name__)

@service_requests_bp.route("/options", methods=["POST"])
@role_required("CUSTOMER")
def provider_options(current_user):
    data = request.get_json() or {}
    service_id = data.get("service_id")
    lat = float(data.get("latitude", current_user.latitude or 12.9716))
    lng = float(data.get("longitude", current_user.longitude or 77.5946))

    if not service_id:
        return jsonify({"error": "Service is required"}), 400

    providers = find_provider_options(int(service_id), lat, lng)
    options = []
    for candidate in providers:
        provider = candidate["provider"]
        service = ProviderService.query.filter_by(
            provider_id=provider.id, service_id=int(service_id), is_active=True
        ).first()
        base_charge = service.base_charge if service and service.base_charge else (
            Service.query.get(int(service_id)).base_price
        )
        options.append({
            "provider": provider.to_dict(include_services=False),
            "distance_km": round(candidate["distance_km"], 2),
            "estimated_arrival": candidate["eta_mins"],
            "service_charge": base_charge,
            "match_score": candidate["score"],
        })
    return jsonify({"providers": options}), 200

@service_requests_bp.route("", methods=["POST"])
@role_required("CUSTOMER")
def create_service_request(current_user):
    data = request.get_json() or {}

    problem_desc = data.get("problem_description")
    service_id = data.get("service_id")
    service_name = data.get("service_name")
    severity = data.get("severity", "Medium")
    lat = float(data.get("latitude", current_user.latitude or 12.9716))
    lng = float(data.get("longitude", current_user.longitude or 77.5946))
    ai_classification = data.get("ai_classification", service_name or "")
    selected_provider_id = data.get("provider_id")

    if not problem_desc:
        return jsonify({"error": "Problem description is required"}), 400

    # Resolve service_id if only service_name provided
    svc = None
    if service_id:
        svc = Service.query.get(service_id)
    elif service_name:
        svc = Service.query.filter_by(name=service_name).first()

    if not svc:
        svc = Service.query.filter_by(name="Other Home Services").first()
        if not svc:
            svc = Service.query.first()

    service_id = svc.id

    # Create ServiceRequest record
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    s_req = ServiceRequest(
        customer_id=current_user.id,
        service_id=service_id,
        problem_description=problem_desc,
        ai_classification=ai_classification,
        severity=severity,
        latitude=lat,
        longitude=lng,
        status="PENDING",
        expires_at=expires_at
    )
    db.session.add(s_req)
    db.session.flush()

    # Find best eligible ON-DUTY provider automatically
    provider_candidates = find_provider_options(
        service_id=service_id,
        customer_lat=lat,
        customer_lng=lng
    )
    best_candidate = next(
        (candidate for candidate in provider_candidates
         if selected_provider_id and candidate["provider"].id == int(selected_provider_id)),
        None
    ) if selected_provider_id else (provider_candidates[0] if provider_candidates else None)

    if not best_candidate:
        db.session.commit()
        return jsonify({
            "message": "Service request created, but no ON-DUTY provider is currently available nearby.",
            "status": "SEARCHING_PROVIDER",
            "service_request": s_req.to_dict()
        }), 200

    best_provider = best_candidate["provider"]
    dist_km = best_candidate["distance_km"]
    eta_mins = best_candidate["eta_mins"]

    # Retrieve provider's base charge or service default
    prov_svc = ProviderService.query.filter_by(
        provider_id=best_provider.id,
        service_id=service_id
    ).first()

    service_charge = prov_svc.base_charge if (prov_svc and prov_svc.base_charge) else svc.base_price

    # Create Booking in PROVIDER_ASSIGNED status
    booking = Booking(
        customer_id=current_user.id,
        provider_id=best_provider.id,
        service_id=service_id,
        service_request_id=s_req.id,
        problem_description=problem_desc,
        ai_classification=ai_classification,
        severity=severity,
        customer_latitude=lat,
        customer_longitude=lng,
        provider_latitude=best_provider.latitude,
        provider_longitude=best_provider.longitude,
        status="PROVIDER_ASSIGNED",
        estimated_distance=dist_km,
        estimated_arrival=eta_mins,
        service_charge=service_charge,
        total_amount=service_charge
    )
    db.session.add(booking)
    s_req.status = "ASSIGNED"
    s_req.assigned_provider_id = best_provider.id

    db.session.commit()

    # Send Notification and Socket Event to Provider
    prov_user_id = best_provider.user_id
    send_notification(
        user_id=prov_user_id,
        notif_type="NEW_JOB_REQUEST",
        title="New Service Request Received!",
        message=f"New {svc.name} job request nearby ({dist_km} km, ~{eta_mins} mins away).",
        booking_id=booking.id
    )

    try:
        socketio.emit(
            "new_provider_request",
            {
                "booking": booking.to_dict(),
                "customer": {
                    "name": current_user.name,
                    "phone": current_user.phone
                }
            },
            to=f"user_{prov_user_id}"
        )
    except Exception as e:
        print(f"Socket emit error: {e}")

    return jsonify({
        "message": "Provider found and request sent successfully!",
        "booking": booking.to_dict(),
        "assigned_provider": best_provider.to_dict()
    }), 201
