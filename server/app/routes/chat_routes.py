from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.job import Job
from app.models.message import JobMessage
from app.models.user import User

chat_bp = Blueprint("chat_bp", __name__)

def get_clean_user_id():
    """
    Helper function to safely extract and parse the current user's integer ID
    regardless of whether get_jwt_identity() returns a raw ID or a JWT claims dictionary.
    """
    identity = get_jwt_identity()
    if isinstance(identity, dict):
        return int(identity.get("id") or identity.get("user_id"))
    return int(identity)


# ==========================================
# FETCH ALL MESSAGES FOR A JOB CHAT
# ==========================================
@chat_bp.route("/api/jobs/<int:job_id>/messages", methods=["GET"])
@jwt_required()
def get_chat_history(job_id):
    try:
        current_user_id = get_clean_user_id()
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user identity format."}), 422

    job = Job.query.get_or_404(job_id)

    # Access Control: Verify if current user matches contract parameters
    worker_user_id = job.worker.user_id if job.worker else None

    if job.client_id != current_user_id and worker_user_id != current_user_id:
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
    try:
        current_user_id = get_clean_user_id()
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user identity format."}), 422

    job = Job.query.get_or_404(job_id)
    data = request.get_json() or {}
    text = data.get("message_text", "").strip()

    if not text:
        return jsonify({
            "message": "Message cannot be empty."
        }), 400

    # Access Control: Verify if sender matches contract parameters
    worker_user_id = job.worker.user_id if job.worker else None

    if job.client_id != current_user_id and worker_user_id != current_user_id:
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


# ==========================================
# FETCH ALL CHAT THREADS FOR USER INBOX
# ==========================================
@chat_bp.route('/api/chats', methods=['GET'])
@jwt_required()
def get_user_chats():
    try:
        current_user_id = get_clean_user_id()
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid user identity format."}), 422
    
    all_jobs = Job.query.all()
    chat_list = []
    
    for job in all_jobs:
        worker_user_id = None
        if job.worker and hasattr(job.worker, 'user_id'):
            worker_user_id = job.worker.user_id

        # Skip this job if the user isn't part of it
        if job.client_id != current_user_id and worker_user_id != current_user_id:
            continue

        latest_msg = (
            JobMessage.query
            .filter_by(job_id=job.id)
            .order_by(JobMessage.created_at.desc())
            .first()
        )
        
        # Pull alternative display values based on active perspective role
        if job.client_id == current_user_id:
            if job.worker:
                other_party_name = getattr(job.worker, 'full_name', getattr(job.worker, 'name', 'Worker'))
            else:
                other_party_name = "Awaiting Worker Assignment"
        else:
            other_party_name = job.client.full_name if job.client else "Platform Client"

        chat_list.append({
            "job_id": job.id,
            "job_title": job.title,
            "job_status": job.status,
            "other_party_name": other_party_name,
            "last_message": latest_msg.message_text if latest_msg else "No messages yet",
            "last_message_time": latest_msg.created_at.isoformat() if latest_msg else None,
            "is_active": job.status in ['accepted', 'in_progress', 'pending']
        })
        
    # Sort threads cleanly: push active engagements with ongoing notes directly to the top
    chat_list.sort(key=lambda x: x['last_message_time'] or '', reverse=True)
    return jsonify(chat_list), 200