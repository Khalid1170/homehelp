# from flask import Blueprint, request, jsonify
# from werkzeug.security import generate_password_hash, check_password_hash
# from flask_jwt_extended import create_access_token , jwt_required, get_jwt_identity

# from app.extensions import db
# from app.models import User, Worker

# auth_bp = Blueprint("auth_bp", __name__)


# # =========================
# # CLIENT SIGNUP
# # =========================
# @auth_bp.route("/signup/client", methods=["POST"])
# def signup_client():
#     data = request.get_json()

#     user = User(
#         full_name=data["full_name"],
#         email=data["email"],
#         phone_number=data["phone_number"],
#         password_hash=generate_password_hash(data["password"]),
#         role="client"
#     )

#     db.session.add(user)
#     db.session.commit()

#     return jsonify({"message": "Client created"}), 201


# # =========================
# # WORKER SIGNUP
# # =========================
# @auth_bp.route("/signup/worker", methods=["POST"])
# def signup_worker():
#     data = request.get_json()

#     user = User(
#         full_name=data["full_name"],
#         email=data["email"],
#         phone_number=data["phone_number"],
#         password_hash=generate_password_hash(data["password"]),
#         role="worker"
#     )

#     db.session.add(user)
#     db.session.commit()

#     worker = Worker(
#         user_id=user.id,
#         bio=data.get("bio", ""),
#         skills=data.get("skills", ""),
#         location_text=data.get("location_text", ""),
#         verification_status="pending"
#     )

#     db.session.add(worker)
#     db.session.commit()

#     return jsonify({"message": "Worker created, pending approval"}), 201


# # =========================
# # LOGIN
# # =========================
# @auth_bp.route("/login", methods=["POST"])
# def login():
#     data = request.get_json()

#     user = User.query.filter_by(email=data["email"]).first()

#     if not user:
#         return jsonify({"error": "User not found"}), 404

#     if not check_password_hash(user.password_hash, data["password"]):
#         return jsonify({"error": "Invalid password"}), 401

#     token = create_access_token(
#     identity=str(user.id),
#     additional_claims={
#         "role": user.role
#     }
#     )

#     return jsonify({
#         "token": token,
#         "role": user.role
#     })

# @auth_bp.route("/me", methods=["GET"])
# @jwt_required()
# def get_current_user():
#     """
#     Returns the current user's data based on the JWT token.
#     Essential for React to maintain login state.
#     """
#     current_user_id = get_jwt_identity()
#     user = User.query.get(current_user_id)
    
#     if not user:
#         return jsonify({"error": "User not found"}), 404
        
#     # Check if they have an active worker profile
#     worker_profile = Worker.query.filter_by(user_id=user.id).first()
    
#     return jsonify({
#         "user": {
#             "id": user.id,
#             "full_name": user.full_name,
#             "email": user.email,
#             "role": user.role,
#             "is_suspended": user.is_suspended,
#             "has_worker_profile": bool(worker_profile),
#             "worker_id": worker_profile.id if worker_profile else None
#         }
#     }), 200

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Worker

# Prepend the blueprint URL prefix here so your paths naturally match the frontend 📦
auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


# ==========================================
# UNIFIED REGISTRATION ENDPOINT (CLIENT/WORKER)
# ==========================================
@auth_bp.route("/register", methods=["POST", "OPTIONS"])
def register_user():
    # Explicitly catch browser preflight options
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json()

    # Safely extract incoming keys from React's payload shape
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "client") # Fallback to client if undefined
    phone = data.get("phone_number", "") # Fallback to empty string if not gathered yet

    if not name or not email or not password:
        return jsonify({"error": "Missing mandatory registration fields (name, email, password)"}), 400

    # Ensure duplicate accounts are halted
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "An account profile with that email already exists."}), 400

    try:
        # 1. Create Core Platform User Entity
        user = User(
            full_name=name,
            email=email,
            phone_number=phone,
            password_hash=generate_password_hash(password),
            role=role
        )

        db.session.add(user)
        db.session.flush() # Flushes record to DB to grab the generated user.id safely

        # 2. If registration objective is a worker, instantiate secondary profile layout
        if role == "worker":
            worker = Worker(
                user_id=user.id,
                bio=data.get("bio", ""),
                skills=data.get("skills", ""),
                location_text=data.get("location_text", ""),
                verification_status="pending" # Kept in staging for your upcoming admin dashboards
            )
            db.session.add(worker)

        db.session.commit()
        return jsonify({"message": f"Account profile successfully created for {role}."}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database write failure", "message": str(e)}), 500


# ==========================================
# LOGIN ENDPOINT
# ==========================================
@auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing validation credentials"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "Invalid authorization credentials provided."}), 401

    if not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid authorization credentials provided."}), 401

    # Check if account is locked out by admin systems
    if getattr(user, 'is_suspended', False):
        return jsonify({"message": "This account profile has been locked out. Contact technical assistance."}), 403

    # Generate JWT Session Core
    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    # Secondary lookup for worker profile id context
    worker_profile = Worker.query.filter_by(user_id=user.id).first()

    return jsonify({
        "token": token,
        "user": {
            "id": user.id,
            "name": user.full_name,
            "full_name" : user.full_name,

            "email": user.email,
            "role": user.role,
            "worker_id": worker_profile.id if worker_profile else None
        }
    }), 200


# ==========================================
# LIVE PERSISTENCE RETRIEVAL ENDPOINT (/me)
# ==========================================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "User profile context unverified"}), 404
        
    worker_profile = Worker.query.filter_by(user_id=user.id).first()
    
    return jsonify({
        "user": {
            "id": user.id,
            "name": user.full_name,
            "full_name" : user.full_name,
            "email" : user.email,
            "role": user.role,
            "is_suspended": getattr(user, 'is_suspended', False),
            "has_worker_profile": bool(worker_profile),
            "worker_id": worker_profile.id if worker_profile else None
        }
    }), 200