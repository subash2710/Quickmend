from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models.provider import ProviderProfile
from app.models.service import Service, ProviderService
from app.models.booking import Booking
from app.auth.helpers import role_required

providers_bp = Blueprint("providers", __name__)

@providers_bp.route("/duty-status", methods=["PUT"])
@role_required("PROVIDER")
def update_duty_status(current_user):
    provider = current_user.provider_profile
    if not provider:
        return jsonify({"error": "Provider profile not found"}), 404

    data = request.get_json() or {}
    duty_status = data.get("duty_status") # ON_DUTY or OFF_DUTY

    if duty_status not in ["ON_DUTY", "OFF_DUTY"]:
        return jsonify({"error": "duty_status must be ON_DUTY or OFF_DUTY"}), 400

    if duty_status == "OFF_DUTY":
        # Check if provider has active ongoing job
        active_job = Booking.query.filter(
            Booking.provider_id == provider.id,
            Booking.status.in_([
                "PROVIDER_ASSIGNED", "PROVIDER_ACCEPTED", "PROVIDER_ON_THE_WAY",
                "PROVIDER_ARRIVED", "SERVICE_STARTED"
            ])
        ).first()

        if active_job:
            return jsonify({
                "error": "Cannot go OFF DUTY while you have an active booking in progress.",
                "active_booking_id": active_job.id
            }), 400

        provider.duty_status = "OFF_DUTY"
        provider.availability_status = "UNAVAILABLE"
    else:
        provider.duty_status = "ON_DUTY"
        provider.availability_status = "AVAILABLE"

    db.session.commit()
    return jsonify({
        "message": f"Duty status updated to {provider.duty_status}",
        "provider": provider.to_dict()
    }), 200


@providers_bp.route("/location", methods=["PUT"])
@role_required("PROVIDER")
def update_location(current_user):
    provider = current_user.provider_profile
    if not provider:
        return jsonify({"error": "Provider profile not found"}), 404

    data = request.get_json() or {}
    lat = data.get("latitude")
    lng = data.get("longitude")

    if lat is None or lng is None:
        return jsonify({"error": "latitude and longitude required"}), 400

    provider.latitude = float(lat)
    provider.longitude = float(lng)
    provider.last_location_update = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "message": "Location updated successfully",
        "latitude": provider.latitude,
        "longitude": provider.longitude
    }), 200


@providers_bp.route("/my-services", methods=["GET"])
@role_required("PROVIDER")
def get_my_services(current_user):
    provider = current_user.provider_profile
    if not provider:
        return jsonify({"error": "Provider profile not found"}), 404

    services = [ps.to_dict() for ps in provider.provider_services.filter_by(is_active=True).all()]
    return jsonify({"services": services}), 200


@providers_bp.route("/services", methods=["POST"])
@role_required("PROVIDER")
def add_service(current_user):
    provider = current_user.provider_profile
    if not provider:
        return jsonify({"error": "Provider profile not found"}), 404

    data = request.get_json() or {}
    service_id = data.get("service_id")
    experience_years = int(data.get("experience_years", provider.experience_years or 1))
    service_description = data.get("service_description", "")
    base_charge = data.get("base_charge")

    if not service_id:
        return jsonify({"error": "service_id is required"}), 400

    svc = Service.query.get(service_id)
    if not svc:
        return jsonify({"error": "Service not found"}), 404

    existing = ProviderService.query.filter_by(
        provider_id=provider.id,
        service_id=service_id
    ).first()

    if existing:
        existing.is_active = True
        existing.experience_years = experience_years
        existing.service_description = service_description
        if base_charge is not None:
            existing.base_charge = float(base_charge)
    else:
        ps = ProviderService(
            provider_id=provider.id,
            service_id=service_id,
            experience_years=experience_years,
            service_description=service_description,
            base_charge=float(base_charge) if base_charge is not None else None,
            is_active=True
        )
        db.session.add(ps)

    db.session.commit()
    return jsonify({
        "message": "Service added successfully",
        "provider": provider.to_dict()
    }), 200


@providers_bp.route("/services/<int:provider_service_id>", methods=["DELETE"])
@role_required("PROVIDER")
def remove_service(current_user, provider_service_id):
    provider = current_user.provider_profile
    if not provider:
        return jsonify({"error": "Provider profile not found"}), 404

    ps = ProviderService.query.filter_by(
        id=provider_service_id,
        provider_id=provider.id
    ).first()

    if not ps:
        return jsonify({"error": "Provider service not found"}), 404

    ps.is_active = False
    db.session.commit()

    return jsonify({"message": "Service removed successfully"}), 200


@providers_bp.route("", methods=["GET"])
def list_providers():
    service_id = request.args.get("service_id", type=int)
    duty_status = request.args.get("duty_status")

    query = ProviderProfile.query

    if duty_status:
        query = query.filter_by(duty_status=duty_status)

    if service_id:
        query = query.join(ProviderService).filter(
            ProviderService.service_id == service_id,
            ProviderService.is_active == True
        )

    providers = query.all()
    return jsonify({"providers": [p.to_dict() for p in providers]}), 200


@providers_bp.route("/<int:provider_id>", methods=["GET"])
def get_provider_profile(provider_id):
    provider = ProviderProfile.query.get_or_404(provider_id)
    return jsonify({"provider": provider.to_dict()}), 200
