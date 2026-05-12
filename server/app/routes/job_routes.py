from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Job, Worker, User
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

job_bp = Blueprint("job_bp", __name__)


# =========================
# CREATE JOB (CLIENT)
# =========================
@job_bp.route("/jobs", methods=["POST"])
@jwt_required()
def create_job():

    current_user_id = get_jwt_identity()

    user = User.query.get(current_user_id)

    # Only clients can create jobs
    if user.role != "client":
        return jsonify({
            "error": "Only clients can create jobs"
        }), 403

    data = request.get_json()

    job = Job(
        title=data["title"],
        description=data["description"],
        budget=data["budget"],
        category=data["category"],
        location_text=data.get("location_text"),
        client_id=user.id
    )

    db.session.add(job)
    db.session.commit()

    return jsonify({
        "message": "Job created"
    }), 201

# =========================
# GET ALL OPEN JOBS
# =========================
@job_bp.route("/jobs/open", methods=["GET"])
def get_open_jobs():

    jobs = Job.query.filter_by(status="open").all()

    return jsonify([
        {
            "id": j.id,
            "title": j.title,
            "description": j.description,
            "budget": j.budget,
            "category": j.category,
            "location": j.location_text
        }
        for j in jobs
    ])


# =========================
# ACCEPT JOB (WORKER)
# =========================
@job_bp.route("/jobs/<int:job_id>/accept", methods=["PATCH"])
@jwt_required()
def accept_job(job_id):

    current_user_id = get_jwt_identity()

    user = User.query.get(current_user_id)

    # Must be worker
    if user.role != "worker":
        return jsonify({
            "error": "Only workers can accept jobs"
        }), 403

    worker = Worker.query.filter_by(
        user_id=user.id
    ).first()

    if not worker:
        return jsonify({
            "error": "Worker profile not found"
        }), 404

    job = Job.query.get(job_id)

    if not job:
        return jsonify({
            "error": "Job not found"
        }), 404

    if job.status != "open":
        return jsonify({
            "error": "Job already taken"
        }), 400

    if worker.verification_status != "verified":
        return jsonify({
            "error": "Worker not verified"
        }), 403

    active_job = Job.query.filter(
        Job.worker_id == worker.id,
        Job.status == "accepted"
    ).first()

    if active_job:
        return jsonify({
            "error": "Worker already has active job"
        }), 400

    job.worker_id = worker.id
    job.status = "accepted"

    db.session.commit()

    return jsonify({
        "message": "Job accepted"
    }), 200

# =========================
# COMPLETE JOB
# =========================
@job_bp.route("/jobs/<int:job_id>/complete", methods=["PATCH"])
@jwt_required()
def complete_job(job_id):

    current_user_id = get_jwt_identity()

    user = User.query.get(current_user_id)

    # Must be worker
    if user.role != "worker":
        return jsonify({
            "error": "Only workers can complete jobs"
        }), 403

    worker = Worker.query.filter_by(
        user_id=user.id
    ).first()

    if not worker:
        return jsonify({
            "error": "Worker profile not found"
        }), 404

    job = Job.query.get(job_id)

    if not job:
        return jsonify({
            "error": "Job not found"
        }), 404

    if job.status != "accepted":
        return jsonify({
            "error": "Job is not active"
        }), 400

    if job.worker_id != worker.id:
        return jsonify({
            "error": "Unauthorized worker"
        }), 403

    job.status = "completed"

    worker.total_jobs_completed += 1

    db.session.commit()

    return jsonify({
        "message": "Job completed successfully"
    }), 200