from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.ai_request import AIRequest
from app.models.service import Service
from app.ai.service import analyze_user_input

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/chat", methods=["POST"])
@ai_bp.route("/analyze", methods=["POST"])
def analyze_ai():
    data = request.get_json() or {}
    input_text = data.get("text", "") or data.get("message", "")
    input_type = data.get("input_type", "text") # text, image, voice
    image_url = data.get("image_url")
    selected_service_id = data.get("selected_service_id")
    customer_id = data.get("customer_id")
    language = data.get("language") or data.get("locale") or "en"

    if not input_text and not image_url:
        return jsonify({"error": "Text or image input is required"}), 400

    # Build map of service IDs to service names for mismatch checking
    services = Service.query.filter_by(is_active=True).all()
    service_names_map = {s.id: s.name for s in services}

    analysis = analyze_user_input(
        text=input_text,
        input_type=input_type,
        image_url=image_url,
        selected_service_id=selected_service_id,
        service_names_map=service_names_map,
        language=language
    )

    # Save to AIRequest log in DB
    try:
        ai_req = AIRequest(
            customer_id=customer_id,
            input_type=input_type,
            input_text=input_text,
            image_url=image_url,
            detected_problem=analysis.get("detected_problem"),
            detected_service=analysis.get("detected_service"),
            severity=analysis.get("severity", "Medium"),
            requires_professional=analysis.get("requires_professional", True),
            ai_response=analysis.get("ai_response")
        )
        db.session.add(ai_req)
        db.session.commit()
    except Exception as e:
        print(f"Error logging AI request: {e}")

    return jsonify(analysis), 200
