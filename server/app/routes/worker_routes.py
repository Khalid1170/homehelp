from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models import Worker, User, Job, JobApplication 
from flask_jwt_extended import jwt_required, get_jwt_identity

workers_bp = Blueprint('workers_bp', __name__)


@workers_bp.route('/api/workers', methods=['GET'])
def get_public_workers_directory():
    try:
        active_workers = Worker.query.all()
        public_directory_payload = []

        for worker in active_workers:
            user_record = worker.user
            if not user_record or user_record.is_suspended:
                continue

            completed_jobs = Job.query.filter_by(
                worker_id=worker.id, 
                status="completed"
            ).all()

            past_jobs_history = []
            for job in completed_jobs:
                past_jobs_history.append({
                    "id": job.id,
                    "title": job.title,
                    "date": job.created_at.strftime('%B %Y') if job.created_at else "Recently",
                    "client": job.client.full_name if job.client else "Verified Client",
                    "rating": worker.average_rating if worker.average_rating > 0 else 5.0,
                    "review": "Successfully completed project within marketplace guidelines."
                })

            skills_array = []
            if worker.skills:
                skills_array = [skill.strip() for skill in worker.skills.split(',') if skill.strip()]

            public_directory_payload.append({
                "worker_id": worker.id,
                "name": user_record.full_name,
                "rating": round(worker.average_rating, 1) if worker.average_rating else 0.0,
                "completed_jobs": worker.total_jobs_completed or len(completed_jobs),
                "skills": skills_array,
                "bio": worker.bio or "This local task professional has not written a custom description yet.",
                "joined_date": worker.created_at.strftime('%B %Y') if worker.created_at else "Recent Partner",
                "past_jobs": past_jobs_history
            })

        return jsonify(public_directory_payload), 200

    except Exception as e:
        print(f"❌ [BACKEND DIRECTORY ERROR]: {str-e}")
        return jsonify({"error": "Failed to compile worker registry"}), 500
    

@workers_bp.route('/api/worker/profile', methods=['GET'])
@jwt_required() 
def get_current_worker_profile():
    try:
        current_user_id = get_jwt_identity()
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        
        if not worker:
            return jsonify({"message": "Worker profile record not found."}), 404

        user_record = worker.user # 👈 Fetching parent user record

        profile_payload = {
            "name": user_record.full_name if user_record else "Task Professional",
            "email": user_record.email if user_record else "",
            # 🖥️ Reads from User model fallback safely if it exists, otherwise empty string
            "phone_number": getattr(user_record, 'phone_number', '') or getattr(user_record, 'phone', '') or "",
            "location_text": worker.location_text or "",
            "skills": worker.skills or "", 
            "bio": worker.bio or "",
            "stripe_onboarding_complete": bool(worker.stripe_onboarding_complete),
            "stripe_account_id": worker.stripe_account_id or ""
        }

        return jsonify(profile_payload), 200

    except Exception as e:
        print(f"❌ [PROFILE FETCH ERROR]: {str(e)}")
        return jsonify({"message": "Server failed to load your profile."}), 500


@workers_bp.route('/api/worker/profile/update', methods=['PUT'])
@jwt_required()
def update_worker_profile():
    try:
        current_user_id = get_jwt_identity()
        worker = Worker.query.filter_by(user_id=current_user_id).first()
        
        if not worker:
            return jsonify({"message": "Worker profile record not found."}), 404

        user_record = worker.user
        data = request.get_json() or {}

        phone_number = data.get('phone_number', '').strip()
        location_text = data.get('location_text', '').strip()
        skills = data.get('skills', '').strip()
        bio = data.get('bio', '').strip()

        if not phone_number or not bio or not skills:
            return jsonify({"message": "Phone number, tasks, and bio are mandatory fields."}), 400

        # 🔄 Safely assign phone back to whichever attribute name exists on User model
        if user_record:
            if hasattr(user_record, 'phone_number'):
                user_record.phone_number = phone_number
            elif hasattr(user_record, 'phone'):
                user_record.phone = phone_number

        # Apply updates to worker database columns
        worker.location_text = location_text
        worker.skills = skills
        worker.bio = bio

        db.session.commit()
        return jsonify({"message": "Your profile changes were saved successfully!"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ [PROFILE UPDATE ERROR]: {str(e)}")
        return jsonify({"message": "Server could not process your modifications."}), 500