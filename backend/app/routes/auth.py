from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.provider import ProviderProfile
from app.models.service import Service, ProviderService
from app.models.booking import Booking, ServiceRequest
from app.models.payment import Payment, ProviderEarning
from app.models.review import Review
from app.models.notification import Notification
from app.models.ai_request import AIRequest

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    role = data.get("role", "CUSTOMER").upper()
    address = data.get("address", "")
    language = data.get("language", "en")
    lat = data.get("latitude", 12.9716) # Default location (Bangalore)
    lng = data.get("longitude", 77.5946)

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if role not in ["CUSTOMER", "PROVIDER"]:
        return jsonify({"error": "Invalid role specified"}), 400

    existing_user = User.query.filter_by(email=email.lower().strip()).first()
    if existing_user:
        return jsonify({"error": "Email is already registered"}), 400

    user = User(
        name=name,
        email=email.lower().strip(),
        phone=phone,
        role=role,
        address=address,
        language=language,
        latitude=float(lat) if lat else 12.9716,
        longitude=float(lng) if lng else 77.5946,
        profile_image=data.get("profile_image")
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush() # Populate user.id

    # If role is PROVIDER, create ProviderProfile & register selected services
    if role == "PROVIDER":
        exp_years = int(data.get("experience_years", 1))
        skills = data.get("skills", "")
        service_area = data.get("service_area", address or "City")
        service_radius = float(data.get("service_radius", 15.0))

        provider_profile = ProviderProfile(
            user_id=user.id,
            experience_years=exp_years,
            skills=skills,
            service_area=service_area,
            service_radius=service_radius,
            duty_status="OFF_DUTY",
            availability_status="UNAVAILABLE",
            latitude=user.latitude,
            longitude=user.longitude
        )
        db.session.add(provider_profile)
        db.session.flush()

        # Save selected service IDs or names
        service_ids = data.get("selected_service_ids", [])
        if not service_ids and data.get("selected_services"): # Array of service names
            service_names = data.get("selected_services")
            matched_svcs = Service.query.filter(Service.name.in_(service_names)).all()
            service_ids = [s.id for s in matched_svcs]

        for s_id in service_ids:
            ps = ProviderService(
                provider_id=provider_profile.id,
                service_id=s_id,
                experience_years=exp_years,
                is_active=True
            )
            db.session.add(ps)

    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "token": token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/admin-login", methods=["POST"])
def admin_login():
    """Authenticate the platform owner without exposing admin in public role selection."""
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    password = data.get("password", "")

    if not name or not password:
        return jsonify({"error": "Name and password are required"}), 400

    user = User.query.filter_by(name=name, role="ADMIN").first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid platform owner credentials"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        "token": token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/profile", methods=["PUT", "PATCH"])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    if "name" in data and data["name"]:
        user.name = data["name"].strip()
    if "phone" in data:
        user.phone = data["phone"]
    if "address" in data:
        user.address = data["address"]
    if "language" in data:
        user.language = data["language"]

    if "latitude" in data:
        try:
            user.latitude = float(data["latitude"])
        except (TypeError, ValueError):
            return jsonify({"error": "Latitude must be a valid number"}), 400
    if "longitude" in data:
        try:
            user.longitude = float(data["longitude"])
        except (TypeError, ValueError):
            return jsonify({"error": "Longitude must be a valid number"}), 400

    if user.role == "PROVIDER":
        profile = user.provider_profile or ProviderProfile(user_id=user.id)
        if "service_area" in data and data["service_area"] is not None:
            profile.service_area = data["service_area"]
        if "service_radius" in data:
            try:
                profile.service_radius = float(data["service_radius"])
            except (TypeError, ValueError):
                return jsonify({"error": "Service radius must be a valid number"}), 400
        if "experience_years" in data:
            try:
                profile.experience_years = int(data["experience_years"])
            except (TypeError, ValueError):
                return jsonify({"error": "Experience years must be a valid number"}), 400
        if "skills" in data:
            profile.skills = data["skills"]
        if "latitude" in data:
            try:
                profile.latitude = float(data["latitude"])
            except (TypeError, ValueError):
                return jsonify({"error": "Latitude must be a valid number"}), 400
        if "longitude" in data:
            try:
                profile.longitude = float(data["longitude"])
            except (TypeError, ValueError):
                return jsonify({"error": "Longitude must be a valid number"}), 400
        db.session.add(profile)

    db.session.commit()
    return jsonify({"message": "Profile updated successfully", "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/profile", methods=["DELETE"])
@jwt_required()
def delete_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role == "ADMIN":
        return jsonify({"error": "Admin profiles cannot be deleted from this endpoint"}), 403

    provider_profile_id = user.provider_profile.id if user.provider_profile else None
    active_statuses = {
        "SEARCHING_PROVIDER",
        "PROVIDER_ASSIGNED",
        "PROVIDER_ACCEPTED",
        "PROVIDER_ON_THE_WAY",
        "PROVIDER_ARRIVED",
        "SERVICE_STARTED",
        "PAYMENT_PENDING",
    }
    active_booking_query = Booking.query.filter(Booking.status.in_(active_statuses))
    if user.role == "CUSTOMER":
        active_booking_query = active_booking_query.filter_by(customer_id=user.id)
    elif provider_profile_id:
        active_booking_query = active_booking_query.filter_by(provider_id=provider_profile_id)

    if active_booking_query.first():
        return jsonify({"error": "Complete or cancel active bookings before deleting your profile"}), 409

    booking_query = Booking.query.filter(
        db.or_(
            Booking.customer_id == user.id,
            Booking.provider_id == provider_profile_id if provider_profile_id else False,
        )
    )
    booking_ids = [booking.id for booking in booking_query.all()]

    if booking_ids:
        Notification.query.filter(Notification.booking_id.in_(booking_ids)).delete(synchronize_session=False)
        Payment.query.filter(Payment.booking_id.in_(booking_ids)).delete(synchronize_session=False)
        ProviderEarning.query.filter(ProviderEarning.booking_id.in_(booking_ids)).delete(synchronize_session=False)
        Review.query.filter(Review.booking_id.in_(booking_ids)).delete(synchronize_session=False)
        Booking.query.filter(Booking.id.in_(booking_ids)).delete(synchronize_session=False)

    if user.role == "CUSTOMER":
        ServiceRequest.query.filter_by(customer_id=user.id).delete(synchronize_session=False)
        AIRequest.query.filter_by(customer_id=user.id).delete(synchronize_session=False)
    elif provider_profile_id:
        ServiceRequest.query.filter_by(assigned_provider_id=provider_profile_id).update(
            {ServiceRequest.assigned_provider_id: None}, synchronize_session=False
        )
        Payment.query.filter_by(provider_id=provider_profile_id).delete(synchronize_session=False)
        ProviderEarning.query.filter_by(provider_id=provider_profile_id).delete(synchronize_session=False)
        Review.query.filter_by(provider_id=provider_profile_id).delete(synchronize_session=False)

    Notification.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Profile and all associated data deleted successfully"}), 200
