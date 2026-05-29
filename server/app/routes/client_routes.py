from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, Job, JobApplication  # Ensure your Review model is imported below
from app.models.worker import Worker
# 🟢 CRITICAL: Import your Review model here if it's named differently (e.g., from app.models.review import Review)
# If Review is already inside app.models, just add it to the import list above.
from app.models import Review
from sqlalchemy.orm import joinedload

client_bp = Blueprint('client_bp', __name__)

@client_bp.route('/api/client/dashboard', methods=['GET'])
@jwt_required()
def get_client_dashboard():
    """
    Fetches core metrics, active jobs, completed jobs, basic user data,
    associated applications, and reviews to populate the frontend Client Dashboard.
    """
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user:
        return jsonify({"message": "User file account records context not found."}), 404

    if current_user.role != 'client':
        return jsonify({"message": "Unauthorized access. Client clearance required."}), 403

    try:
        # 1. Eagerly load relationship paths to avoid N+1 database drops.
        # 🟢 ADDED: joinedload(Job.review) to fetch review context seamlessly
        db_jobs = (
            Job.query.filter_by(client_id=current_user.id)
            .options(
                joinedload(Job.incoming_applications)
                .joinedload(JobApplication.worker)
                .joinedload(Worker.user),
                joinedload(Job.worker)
                .joinedload(Worker.user),
                joinedload(Job.review)  # 🟢 Pulls the review attached to this job
            )
            .order_by(Job.created_at.desc())
            .all()
        )
        
        active_jobs_list = [] 
        completed_jobs_list = []
        total_spent = 0.0

        # 2. Iterate and format database records to fit frontend's expected schema
        for job in db_jobs:
            
            # Map pending applications using exact attributes
            incoming_apps = [
                {
                    "application_id": app.id,
                    "worker_id": app.worker_id,
                    "worker_name": app.worker.user.full_name if app.worker and app.worker.user else "Unknown Worker",
                    "worker_avatar": app.worker.profile_image if app.worker else None,
                    "worker_rating": app.worker.average_rating if app.worker else 0.0,
                    "message": app.worker_message or "",  
                    "status": app.status,                 
                    "created_at": app.created_at.isoformat() if getattr(app, "created_at", None) else None
                }
                for app in job.incoming_applications if app.status == "pending"  
            ]

            # Create the appointed worker payload if a worker is attached to the job
            appointed_worker_info = None
            if getattr(job, 'worker', None) and job.worker.user:
                appointed_worker_info = {
                    "worker_id": job.worker.id,
                    "name": job.worker.user.full_name,
                    "avatar": job.worker.profile_image,
                    "rating": job.worker.average_rating
                }

            # 🟢 FIX: Handle formatting for the review data structure
            review_payload = None
            if getattr(job, 'review', None):
                review_payload = {
                    "comment": job.review.comment,
                    "rating": job.review.rating
                }
            else:
                # Direct lookup fallback block if relationship mapping isn't fully bound on your Job model:
                # fallback_review = Review.query.filter_by(job_id=job.id).first()
                # if fallback_review:
                #     review_payload = {"comment": fallback_review.comment, "rating": fallback_review.rating}
                pass

            job_payload = {
                "job_id": job.id,
                "title": job.title,
                "description": job.description,
                "budget": job.budget,
                "category": job.category,
                "location_text": job.location_text,
                "status": job.status,
                "payment_status": job.payment_status,
                "created_at": job.created_at.isoformat() if getattr(job, "created_at", None) else None,
                "incoming_applications": incoming_apps,  
                "appointed_worker": appointed_worker_info,
                "review": review_payload  # 🟢 Injected smoothly right here!
            }

            # 3. Route to the correct bucket based on operational status
            if job.status == "completed":
                completed_jobs_list.append(job_payload)
                total_spent += float(job.budget or 0)
            else:
                active_jobs_list.append(job_payload)
                if job.payment_status == "paid":
                    total_spent += float(job.budget or 0)

        total_jobs_count = len(db_jobs)

        dashboard_payload = {
            "client_info": {
                "name": current_user.full_name,
                "email": current_user.email,
                "phone": current_user.phone_number,
                "company": "FlyBoy Clothing"
            },
            "metrics": {
                "total_spent": total_spent,
                "total_jobs": total_jobs_count,
                "active_jobs": len(active_jobs_list),
                "completed_jobs": len(completed_jobs_list)
            },
            "active_jobs": active_jobs_list,
            "completed_jobs": completed_jobs_list
        }

        return jsonify(dashboard_payload), 200

    except Exception as e:
        return jsonify({"message": "Error pulling dashboard layout metrics.", "error": str(e)}), 500


@client_bp.route('/api/client/profile', methods=['PUT'])
@jwt_required()
def update_client_profile():
    """
    Updates the target Client's core context info based on 
    the incoming interactive UI state variables.
    """
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user:
        return jsonify({"message": "User context not found."}), 404

    if current_user.role != 'client':
        return jsonify({"message": "Unauthorized context action."}), 403

    data = request.get_json() or {}

    new_name = data.get('name')
    new_email = data.get('email')
    new_phone = data.get('phone')

    if not new_name or not new_email or not new_phone:
        return jsonify({"message": "Missing required fields: name, email, and phone are mandatory."}), 400

    if new_email != current_user.email:
        email_check = User.query.filter_by(email=new_email).first()
        if email_check:
            return jsonify({"message": "This email address is already claimed inside our database routing matrix."}), 400

    try:
        current_user.full_name = new_name
        current_user.email = new_email
        current_user.phone_number = new_phone

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "User account records saved safely.",
            "client_info": {
                "name": current_user.full_name,
                "email": current_user.email,
                "phone": current_user.phone_number
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": "Database transaction failure.", "error": str(e)}), 500