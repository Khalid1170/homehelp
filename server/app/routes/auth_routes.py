from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

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

    token = create_access_token(identity={
        "id": user.id,
        "role": user.role
    })

    return jsonify({
        "token": token,
        "role": user.role
    })