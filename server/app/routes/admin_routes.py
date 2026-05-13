from flask import Blueprint, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from app.extensions import db
from app.models import User, Worker, Job

admin_bp = Blueprint("admin_bp", __name__)


# =========================
# VERIFY WORKER
# =========================
@admin_bp.route(
    "/admin/workers/<int:worker_id>/verify",
    methods=["PATCH"]
)
@jwt_required()
def verify_worker(worker_id):

    current_user_id = get_jwt_identity()

    admin = User.query.get(current_user_id)

    if admin.role != "admin":
        return jsonify({
            "error": "Admins only"
        }), 403

    worker = Worker.query.get(worker_id)

    if not worker:
        return jsonify({
            "error": "Worker not found"
        }), 404

    worker.verification_status = "verified"

    db.session.commit()

    return jsonify({
        "message": "Worker verified"
    })


# =========================
# SUSPEND USER
# =========================
@admin_bp.route(
    "/admin/users/<int:user_id>/suspend",
    methods=["PATCH"]
)
@jwt_required()
def suspend_user(user_id):

    current_user_id = get_jwt_identity()

    admin = User.query.get(current_user_id)

    if admin.role != "admin":
        return jsonify({
            "error": "Admins only"
        }), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    user.is_suspended = True

    db.session.commit()

    return jsonify({
        "message": "User suspended"
    })


# =========================
# UNSUSPEND USER
# =========================
@admin_bp.route(
    "/admin/users/<int:user_id>/unsuspend",
    methods=["PATCH"]
)
@jwt_required()
def unsuspend_user(user_id):

    current_user_id = get_jwt_identity()

    admin = User.query.get(current_user_id)

    if admin.role != "admin":
        return jsonify({
            "error": "Admins only"
        }), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    user.is_suspended = False

    db.session.commit()

    return jsonify({
        "message": "User unsuspended"
    })


# =========================
# GET ALL JOBS
# =========================
@admin_bp.route("/admin/jobs", methods=["GET"])
@jwt_required()
def get_all_jobs():

    current_user_id = get_jwt_identity()

    admin = User.query.get(current_user_id)

    if admin.role != "admin":
        return jsonify({
            "error": "Admins only"
        }), 403

    jobs = Job.query.all()

    return jsonify([
        {
            "id": job.id,
            "title": job.title,
            "status": job.status,
            "budget": job.budget
        }
        for job in jobs
    ])


# =========================
# DELETE JOB
# =========================
@admin_bp.route(
    "/admin/jobs/<int:job_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_job(job_id):

    current_user_id = get_jwt_identity()

    admin = User.query.get(current_user_id)

    if admin.role != "admin":
        return jsonify({
            "error": "Admins only"
        }), 403

    job = Job.query.get(job_id)

    if not job:
        return jsonify({
            "error": "Job not found"
        }), 404

    db.session.delete(job)

    db.session.commit()

    return jsonify({
        "message": "Job deleted"
    })