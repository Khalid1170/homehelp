from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token , jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Worker

auth_bp = Blueprint("auth_bp", __name__)


# =========================
# CLIENT SIGNUP
# =========================
@auth_bp.route("/signup/client", methods=["POST"])
def signup_client():
    data = request.get_json()

    user = User(
        full_name=data["full_name"],
        email=data["email"],
        phone_number=data["phone_number"],
        password_hash=generate_password_hash(data["password"]),
        role="client"
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Client created"}), 201


# =========================
# WORKER SIGNUP
# =========================
@auth_bp.route("/signup/worker", methods=["POST"])
def signup_worker():
    data = request.get_json()

    user = User(
        full_name=data["full_name"],
        email=data["email"],
        phone_number=data["phone_number"],
        password_hash=generate_password_hash(data["password"]),
        role="worker"
    )

    db.session.add(user)
    db.session.commit()

    worker = Worker(
        user_id=user.id,
        bio=data.get("bio", ""),
        skills=data.get("skills", ""),
        location_text=data.get("location_text", ""),
        verification_status="pending"
    )

    db.session.add(worker)
    db.session.commit()

    return jsonify({"message": "Worker created, pending approval"}), 201


# =========================
# LOGIN
# =========================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data["email"]).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid password"}), 401

    token = create_access_token(
    identity=str(user.id),
    additional_claims={
        "role": user.role
    }
    )

    return jsonify({
        "token": token,
        "role": user.role
    })

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    Returns the current user's data based on the JWT token.
    Essential for React to maintain login state.
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    # Check if they have an active worker profile
    worker_profile = Worker.query.filter_by(user_id=user.id).first()
    
    return jsonify({
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "is_suspended": user.is_suspended,
            "has_worker_profile": bool(worker_profile),
            "worker_id": worker_profile.id if worker_profile else None
        }
    }), 200