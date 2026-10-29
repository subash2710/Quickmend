from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.models.user import User

def role_required(required_role):
    """
    Decorator to enforce backend role authorization (CUSTOMER, PROVIDER, ADMIN).
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user:
                return jsonify({"error": "User not found"}), 404

            # Super admin override if user role is ADMIN
            if user.role != required_role and user.role != "ADMIN":
                return jsonify({"error": f"Access denied. Requires {required_role} role."}), 403

            return fn(current_user=user, *args, **kwargs)
        return wrapper
    return decorator
