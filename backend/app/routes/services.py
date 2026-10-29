from flask import Blueprint, request, jsonify
from app import db
from app.models.service import Service
from app.auth.helpers import role_required

services_bp = Blueprint("services", __name__)

@services_bp.route("", methods=["GET"])
def get_services():
    """
    Returns all active services from the database.
    """
    services = Service.query.filter_by(is_active=True).all()
    return jsonify({"services": [s.to_dict() for s in services]}), 200

@services_bp.route("/<int:service_id>", methods=["GET"])
def get_service_detail(service_id):
    svc = Service.query.get_or_404(service_id)
    return jsonify({"service": svc.to_dict()}), 200

@services_bp.route("", methods=["POST"])
@role_required("ADMIN")
def create_service(current_user):
    data = request.get_json() or {}
    name = data.get("name")
    description = data.get("description", "")
    icon = data.get("icon", "Wrench")
    base_price = float(data.get("base_price", 299.0))

    if not name:
        return jsonify({"error": "Service name is required"}), 400

    existing = Service.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Service already exists"}), 400

    svc = Service(name=name, description=description, icon=icon, base_price=base_price)
    db.session.add(svc)
    db.session.commit()
    return jsonify({"message": "Service created", "service": svc.to_dict()}), 201
