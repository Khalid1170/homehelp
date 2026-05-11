from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import Job, Worker, User

job_bp = Blueprint("job_bp", __name__)


# =========================
# CREATE JOB (CLIENT)
# =========================
@job_bp.route("/jobs", methods=["POST"])
def create_job():
    data = request.get_json()

    job = Job(
        title=data["title"],
        description=data["description"],
        budget=data["budget"],
        category=data["category"],
        location_text=data.get("location_text"),
        client_id=data["client_id"]
    )

    db.session.add(job)
    db.session.commit()

    return jsonify({"message": "Job created"}), 201


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
def accept_job(job_id):
    data = request.get_json()

    job = Job.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.status != "open":
        return jsonify({"error": "Job not available"}), 400

    job.worker_id = data["worker_id"]
    job.status = "accepted"

    db.session.commit()

    return jsonify({"message": "Job accepted"})


# =========================
# COMPLETE JOB
# =========================
@job_bp.route("/jobs/<int:job_id>/complete", methods=["PATCH"])
def complete_job(job_id):
    job = Job.query.get(job_id)

    if not job:
        return {"error": "Job not found"}, 404

    job.status = "completed"

    # 👇 THIS is what you were missing
    worker = Worker.query.get(job.worker_id)
    if worker:
        worker.total_jobs_completed += 1

    db.session.commit()

    return {"message": "Job completed"}