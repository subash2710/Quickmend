from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db, socketio
from app.models.booking import Booking, ServiceRequest
from app.models.provider import ProviderProfile
from app.services.matching import find_best_provider
from app.services.notification_service import send_notification
from app.auth.helpers import role_required

bookings_bp = Blueprint("bookings", __name__)

@bookings_bp.route("", methods=["GET"])
@role_required("CUSTOMER")
def get_user_bookings(current_user):
    if current_user.role == "PROVIDER":
        provider = current_user.provider_profile
        if not provider:
            return jsonify({"bookings": []}), 200
        bookings = Booking.query.filter_by(provider_id=provider.id).order_by(Booking.created_at.desc()).all()
    elif current_user.role == "ADMIN":
        bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    else: # CUSTOMER
        bookings = Booking.query.filter_by(customer_id=current_user.id).order_by(Booking.created_at.desc()).all()

    return jsonify({"bookings": [b.to_dict() for b in bookings]}), 200


@bookings_bp.route("/provider-active", methods=["GET"])
@role_required("PROVIDER")
def get_provider_active_booking(current_user):
    provider = current_user.provider_profile
    if not provider:
        return jsonify({"error": "Provider profile not found"}), 404

    active_booking = Booking.query.filter(
        Booking.provider_id == provider.id,
        Booking.status.in_([
            "PROVIDER_ASSIGNED", "PROVIDER_ACCEPTED", "PROVIDER_ON_THE_WAY",
            "PROVIDER_ARRIVED", "SERVICE_STARTED", "PAYMENT_PENDING"
        ])
    ).order_by(Booking.created_at.desc()).first()

    return jsonify({"booking": active_booking.to_dict() if active_booking else None}), 200


@bookings_bp.route("/<int:booking_id>", methods=["GET"])
def get_booking_by_id(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    return jsonify({"booking": booking.to_dict()}), 200


@bookings_bp.route("/<int:booking_id>/accept", methods=["POST"])
@role_required("PROVIDER")
def accept_booking(current_user, booking_id):
    provider = current_user.provider_profile
    if not provider:
        return jsonify({"error": "Provider profile not found"}), 404

    # Double-acceptance protection using row lock
    booking = Booking.query.with_for_update().get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if booking.provider_id != provider.id:
        return jsonify({"error": "You are not the assigned provider for this booking"}), 403

    if booking.status not in ["PROVIDER_ASSIGNED", "SEARCHING_PROVIDER"]:
        return jsonify({"error": f"Booking cannot be accepted (current status: {booking.status})"}), 400

    # Lock booking to this provider
    booking.status = "PROVIDER_ACCEPTED"
    booking.accepted_at = datetime.utcnow()
    provider.availability_status = "BUSY"

    db.session.commit()

    # Notify Customer
    send_notification(
        user_id=booking.customer_id,
        notif_type="BOOKING_ACCEPTED",
        title="Provider Accepted Your Request!",
        message=f"{current_user.name} has accepted your request and will be on the way soon.",
        booking_id=booking.id
    )

    # Socket event to customer & booking room
    socket_data = {"booking": booking.to_dict()}
    try:
        socketio.emit("booking_accepted", socket_data, to=f"user_{booking.customer_id}")
        socketio.emit("booking_updated", socket_data, to=f"booking_{booking.id}")
    except Exception as e:
        print(f"Socket emit error: {e}")

    return jsonify({
        "message": "Booking accepted successfully!",
        "booking": booking.to_dict()
    }), 200


@bookings_bp.route("/<int:booking_id>/reject", methods=["POST"])
@role_required("PROVIDER")
def reject_booking(current_user, booking_id):
    provider = current_user.provider_profile
    if not provider:
        return jsonify({"error": "Provider profile not found"}), 404

    booking = Booking.query.get_or_404(booking_id)
    if booking.provider_id != provider.id:
        return jsonify({"error": "You are not assigned to this booking"}), 403

    # Reassignment logic: try next provider
    rejected_provider_id = provider.id

    # Find next eligible provider excluding already tried
    next_provider, score, dist_km, eta_mins = find_best_provider(
        service_id=booking.service_id,
        customer_lat=booking.customer_latitude,
        customer_lng=booking.customer_longitude,
        exclude_provider_ids=[rejected_provider_id]
    )

    if next_provider:
        booking.provider_id = next_provider.id
        booking.status = "PROVIDER_ASSIGNED"
        booking.estimated_distance = dist_km
        booking.estimated_arrival = eta_mins
        booking.provider_latitude = next_provider.latitude
        booking.provider_longitude = next_provider.longitude

        db.session.commit()

        # Notify Next Provider
        send_notification(
            user_id=next_provider.user_id,
            notif_type="NEW_JOB_REQUEST",
            title="New Service Request Reassigned to You!",
            message=f"Service request nearby ({dist_km} km away).",
            booking_id=booking.id
        )
        try:
            socketio.emit("new_provider_request", {"booking": booking.to_dict()}, to=f"user_{next_provider.user_id}")
        except Exception as e:
            print(f"Socket emit error: {e}")

        return jsonify({"message": "Booking rejected and reassigned to next nearby provider."}), 200
    else:
        booking.status = "CANCELLED"
        booking.cancelled_at = datetime.utcnow()
        db.session.commit()

        send_notification(
            user_id=booking.customer_id,
            notif_type="NO_PROVIDER_AVAILABLE",
            title="No Provider Available",
            message="No active providers were available at this time. Please try again shortly.",
            booking_id=booking.id
        )
        try:
            socketio.emit("booking_cancelled", {"booking": booking.to_dict()}, to=f"user_{booking.customer_id}")
        except Exception as e:
            print(f"Socket error: {e}")

        return jsonify({"message": "Booking rejected. No alternative provider available."}), 200


@bookings_bp.route("/<int:booking_id>/on-the-way", methods=["POST"])
@role_required("PROVIDER")
def set_on_the_way(current_user, booking_id):
    booking = Booking.query.get_or_404(booking_id)
    booking.status = "PROVIDER_ON_THE_WAY"
    db.session.commit()

    send_notification(
        user_id=booking.customer_id,
        notif_type="PROVIDER_ON_THE_WAY",
        title="Provider is on the way!",
        message=f"{current_user.name} is on the way to your location.",
        booking_id=booking.id
    )
    try:
        socketio.emit("booking_updated", {"booking": booking.to_dict()}, to=f"booking_{booking.id}")
        socketio.emit("booking_updated", {"booking": booking.to_dict()}, to=f"user_{booking.customer_id}")
    except Exception as e:
        print(f"Socket error: {e}")

    return jsonify({"message": "Status updated to ON_THE_WAY", "booking": booking.to_dict()}), 200


@bookings_bp.route("/<int:booking_id>/arrived", methods=["POST"])
@role_required("PROVIDER")
def set_arrived(current_user, booking_id):
    booking = Booking.query.get_or_404(booking_id)
    booking.status = "PROVIDER_ARRIVED"
    booking.arrived_at = datetime.utcnow()
    db.session.commit()

    send_notification(
        user_id=booking.customer_id,
        notif_type="PROVIDER_ARRIVED",
        title="Provider Arrived!",
        message=f"{current_user.name} has arrived at your location.",
        booking_id=booking.id
    )
    try:
        socketio.emit("booking_updated", {"booking": booking.to_dict()}, to=f"booking_{booking.id}")
        socketio.emit("booking_updated", {"booking": booking.to_dict()}, to=f"user_{booking.customer_id}")
    except Exception as e:
        print(f"Socket error: {e}")

    return jsonify({"message": "Status updated to ARRIVED", "booking": booking.to_dict()}), 200


@bookings_bp.route("/<int:booking_id>/start", methods=["POST"])
@role_required("PROVIDER")
def start_service(current_user, booking_id):
    booking = Booking.query.get_or_404(booking_id)
    booking.status = "SERVICE_STARTED"
    booking.started_at = datetime.utcnow()
    db.session.commit()

    send_notification(
        user_id=booking.customer_id,
        notif_type="SERVICE_STARTED",
        title="Service Work Started",
        message="The provider has started working on your service.",
        booking_id=booking.id
    )
    try:
        socketio.emit("booking_updated", {"booking": booking.to_dict()}, to=f"booking_{booking.id}")
        socketio.emit("booking_updated", {"booking": booking.to_dict()}, to=f"user_{booking.customer_id}")
    except Exception as e:
        print(f"Socket error: {e}")

    return jsonify({"message": "Service started", "booking": booking.to_dict()}), 200


@bookings_bp.route("/<int:booking_id>/complete", methods=["POST"])
@role_required("PROVIDER")
def complete_service(current_user, booking_id):
    booking = Booking.query.get_or_404(booking_id)
    data = request.get_json() or {}

    additional_charge = float(data.get("additional_charge", 0.0))
    booking.additional_charge = additional_charge
    booking.total_amount = booking.service_charge + additional_charge
    booking.status = "PAYMENT_PENDING"
    booking.completed_at = datetime.utcnow()

    db.session.commit()

    send_notification(
        user_id=booking.customer_id,
        notif_type="SERVICE_COMPLETED",
        title="Service Completed!",
        message=f"Service completed. Total bill: ₹{booking.total_amount:.2f}. Please complete payment.",
        booking_id=booking.id
    )
    try:
        socketio.emit("booking_updated", {"booking": booking.to_dict()}, to=f"booking_{booking.id}")
        socketio.emit("booking_updated", {"booking": booking.to_dict()}, to=f"user_{booking.customer_id}")
    except Exception as e:
        print(f"Socket error: {e}")

    return jsonify({"message": "Service completed. Payment pending.", "booking": booking.to_dict()}), 200


@bookings_bp.route("/<int:booking_id>/cancel", methods=["POST"])
@role_required("CUSTOMER")
def cancel_booking(current_user, booking_id):
    booking = Booking.query.with_for_update().get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
    if booking.customer_id != current_user.id:
        return jsonify({"error": "You can only cancel your own bookings"}), 403

    cancellable_statuses = {
        "SEARCHING_PROVIDER",
        "PROVIDER_ASSIGNED",
        "PROVIDER_ACCEPTED",
        "PROVIDER_ON_THE_WAY",
        "PROVIDER_ARRIVED",
    }
    if booking.status not in cancellable_statuses:
        return jsonify({"error": f"Booking cannot be cancelled (current status: {booking.status})"}), 400

    booking.status = "CANCELLED"
    booking.cancelled_at = datetime.utcnow()

    if booking.service_request_id:
        service_request = ServiceRequest.query.get(booking.service_request_id)
        if service_request:
            service_request.status = "CANCELLED"

    # Reset provider availability if set
    if booking.provider_user:
        prov = booking.provider_user
        other_active_booking = Booking.query.filter(
            Booking.provider_id == prov.id,
            Booking.id != booking.id,
            Booking.status.in_(cancellable_statuses | {"SERVICE_STARTED", "PAYMENT_PENDING"}),
        ).first()
        if prov.duty_status == "ON_DUTY" and not other_active_booking:
            prov.availability_status = "AVAILABLE"

    db.session.commit()

    if booking.provider_user:
        send_notification(
            user_id=booking.provider_user.user_id,
            notif_type="BOOKING_CANCELLED",
            title="Booking Cancelled",
            message="Customer has cancelled the booking request.",
            booking_id=booking.id
        )

    try:
        socketio.emit("booking_cancelled", {"booking": booking.to_dict()}, to=f"booking_{booking.id}")
        socketio.emit("booking_cancelled", {"booking": booking.to_dict()}, to=f"user_{current_user.id}")
    except Exception as e:
        print(f"Socket error: {e}")

    return jsonify({"message": "Booking cancelled", "booking": booking.to_dict()}), 200


@bookings_bp.route("/<int:booking_id>/provider-cancel", methods=["POST"])
@role_required("PROVIDER")
def provider_cancel_booking(current_user, booking_id):
    provider = current_user.provider_profile
    if not provider:
        return jsonify({"error": "Provider profile not found"}), 404

    booking = Booking.query.with_for_update().get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404
    if booking.provider_id != provider.id:
        return jsonify({"error": "You can only cancel bookings assigned to you"}), 403

    cancellable_statuses = {
        "PROVIDER_ASSIGNED",
        "PROVIDER_ACCEPTED",
        "PROVIDER_ON_THE_WAY",
        "PROVIDER_ARRIVED",
    }
    if booking.status not in cancellable_statuses:
        return jsonify({"error": f"Booking cannot be cancelled (current status: {booking.status})"}), 400

    booking.status = "CANCELLED"
    booking.cancelled_at = datetime.utcnow()

    if booking.service_request_id:
        service_request = ServiceRequest.query.get(booking.service_request_id)
        if service_request:
            service_request.status = "CANCELLED"

    if provider.duty_status == "ON_DUTY":
        provider.availability_status = "AVAILABLE"

    db.session.commit()

    send_notification(
        user_id=booking.customer_id,
        notif_type="BOOKING_CANCELLED",
        title="Provider Cancelled Booking",
        message=f"{current_user.name} cancelled the booking. Please request another provider.",
        booking_id=booking.id
    )

    try:
        socket_data = {"booking": booking.to_dict()}
        socketio.emit("booking_cancelled", socket_data, to=f"booking_{booking.id}")
        socketio.emit("booking_cancelled", socket_data, to=f"user_{booking.customer_id}")
    except Exception as e:
        print(f"Socket error: {e}")

    return jsonify({"message": "Booking cancelled", "booking": booking.to_dict()}), 200
