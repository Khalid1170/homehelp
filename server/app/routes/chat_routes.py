from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.job import Job
from app.models.message import JobMessage
from app.models.user import User

chat_bp = Blueprint("chat_bp", __name__)

# ==========================================
# FETCH ALL MESSAGES FOR A JOB CHAT
# ==========================================
@chat_bp.route("/api/jobs/<int:job_id>/messages", methods=["GET"])
@jwt_required()
def get_chat_history(job_id):

    identity = get_jwt_identity()
    print("JWT IDENTITY RAW:", identity)

    if isinstance(identity, dict):
        print("JWT IDENTITY IS DICT:", identity)

    current_user_id = identity
    current_user_id = int(get_jwt_identity())

    job = Job.query.get_or_404(job_id)

    # ==========================================
    # ACCESS CONTROL
    # Only assigned worker OR client can access
    # ==========================================
    worker_user_id = None

    if job.worker:
        worker_user_id = job.worker.user_id

    if (
        job.client_id != current_user_id
        and worker_user_id != current_user_id
    ):
        return jsonify({
            "message": "You are not authorized to access this chat."
        }), 403

    messages = (
        JobMessage.query
        .filter_by(job_id=job_id)
        .order_by(JobMessage.created_at.asc())
        .all()
    )

    return jsonify([
        {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": msg.sender.full_name if msg.sender else "Unknown User",
            "message_text": msg.message_text,
            "created_at": msg.created_at.isoformat()
        }
        for msg in messages
    ]), 200


# ==========================================
# SEND MESSAGE
# ==========================================
@chat_bp.route("/api/jobs/<int:job_id>/messages", methods=["POST"])
@jwt_required()
def send_chat_message(job_id):
    print("POST CHAT JWT:", get_jwt_identity()) 

    current_user_id = int(get_jwt_identity())

    job = Job.query.get_or_404(job_id)

    data = request.get_json() or {}

    text = data.get("message_text", "").strip()

    if not text:
        return jsonify({
            "message": "Message cannot be empty."
        }), 400

    # ==========================================
    # ACCESS CONTROL
    # Only assigned worker OR client can send
    # ==========================================
    worker_user_id = None

    if job.worker:
        worker_user_id = job.worker.user_id

    if (
        job.client_id != current_user_id
        and worker_user_id != current_user_id
    ):
        return jsonify({
            "message": "You are not authorized to send messages in this chat."
        }), 403

    new_msg = JobMessage(
        job_id=job_id,
        sender_id=current_user_id,
        message_text=text
    )

    db.session.add(new_msg)
    db.session.commit()

    return jsonify({
        "id": new_msg.id,
        "sender_id": new_msg.sender_id,
        "sender_name": new_msg.sender.full_name if new_msg.sender else "Unknown User",
        "message_text": new_msg.message_text,
        "created_at": new_msg.created_at.isoformat()
    }), 201