# from flask import Blueprint, request, jsonify
# from app.extensions import db
# from app.models import Job, Worker, User
# from flask_jwt_extended import (
#     jwt_required,
#     get_jwt_identity
# )

# job_bp = Blueprint("job_bp", __name__)


# # =========================
# # CREATE JOB (CLIENT)
# # =========================
# @job_bp.route("/jobs", methods=["POST"])
# @jwt_required()
# def create_job():

#     current_user_id = get_jwt_identity()

#     user = User.query.get(current_user_id)

#     # Only clients can create jobs
#     if user.role != "client":
#         return jsonify({
#             "error": "Only clients can create jobs"
#         }), 403

#     data = request.get_json()

#     job = Job(
#         title=data["title"],
#         description=data["description"],
#         budget=data["budget"],
#         category=data["category"],
#         location_text=data.get("location_text"),
#         client_id=user.id
#     )

#     db.session.add(job)
#     db.session.commit()

#     return jsonify({
#         "message": "Job created"
#     }), 201

# # =========================
# # GET ALL OPEN JOBS
# # =========================
# @job_bp.route("/jobs/open", methods=["GET"])
# def get_open_jobs():

#     jobs = Job.query.filter_by(status="open").all()

#     return jsonify([
#         {
#             "id": j.id,
#             "title": j.title,
#             "description": j.description,
#             "budget": j.budget,
#             "category": j.category,
#             "location": j.location_text
#         }
#         for j in jobs
#     ])


# # =========================
# # ACCEPT JOB (WORKER)
# # =========================
# @job_bp.route("/jobs/<int:job_id>/accept", methods=["PATCH"])
# @jwt_required()
# def accept_job(job_id):

#     current_user_id = get_jwt_identity()

#     user = User.query.get(current_user_id)

#     # Must be worker
#     if user.role != "worker":
#         return jsonify({
#             "error": "Only workers can accept jobs"
#         }), 403

#     worker = Worker.query.filter_by(
#         user_id=user.id
#     ).first()

#     if not worker:
#         return jsonify({
#             "error": "Worker profile not found"
#         }), 404

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({
#             "error": "Job not found"
#         }), 404

#     if job.status != "open":
#         return jsonify({
#             "error": "Job already taken"
#         }), 400

#     if worker.verification_status != "verified":
#         return jsonify({
#             "error": "Worker not verified"
#         }), 403

#     active_job = Job.query.filter(
#         Job.worker_id == worker.id,
#         Job.status == "accepted"
#     ).first()

#     if active_job:
#         return jsonify({
#             "error": "Worker already has active job"
#         }), 400

#     job.worker_id = worker.id
#     job.status = "accepted"

#     db.session.commit()

#     return jsonify({
#         "message": "Job accepted"
#     }), 200

# # # =========================
# # # COMPLETE JOB
# # # =========================
# # @job_bp.route("/jobs/<int:job_id>/complete", methods=["PATCH"])
# # @jwt_required()
# # def complete_job(job_id):

# #     current_user_id = get_jwt_identity()

# #     user = User.query.get(current_user_id)

# #     # Must be worker
# #     if user.role != "worker":
# #         return jsonify({
# #             "error": "Only workers can complete jobs"
# #         }), 403

# #     worker = Worker.query.filter_by(
# #         user_id=user.id
# #     ).first()

# #     if not worker:
# #         return jsonify({
# #             "error": "Worker profile not found"
# #         }), 404

# #     job = Job.query.get(job_id)

# #     if not job:
# #         return jsonify({
# #             "error": "Job not found"
# #         }), 404

# #     if job.status != "accepted":
# #         return jsonify({
# #             "error": "Job is not active"
# #         }), 400

# #     if job.worker_id != worker.id:
# #         return jsonify({
# #             "error": "Unauthorized worker"
# #         }), 403

# #     job.status = "completed"

# #     worker.total_jobs_completed += 1

# #     db.session.commit()

# #     return jsonify({
# #         "message": "Job completed successfully"
# #     }), 200

# # =========================
# # WORKER MARKS JOB FINISHED
# # =========================
# @job_bp.route(
#     "/jobs/<int:job_id>/mark-finished",
#     methods=["PATCH"]
# )
# @jwt_required()
# def mark_job_finished(job_id):

#     current_user_id = get_jwt_identity()

#     user = User.query.get(current_user_id)

#     if user.role != "worker":
#         return jsonify({
#             "error": "Only workers can mark jobs finished"
#         }), 403

#     worker = Worker.query.filter_by(
#         user_id=user.id
#     ).first()

#     if not worker:
#         return jsonify({
#             "error": "Worker profile not found"
#         }), 404

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({
#             "error": "Job not found"
#         }), 404

#     if job.status != "accepted":
#         return jsonify({
#             "error": "Job is not active"
#         }), 400

#     if job.worker_id != worker.id:
#         return jsonify({
#             "error": "Unauthorized worker"
#         }), 403

#     job.status = "pending_confirmation"

#     db.session.commit()

#     return jsonify({
#         "message": "Job marked as finished. Waiting for client confirmation."
#     }), 200


# # =========================
# # CLIENT CONFIRMS COMPLETION
# # =========================
# @job_bp.route(
#     "/jobs/<int:job_id>/confirm",
#     methods=["PATCH"]
# )
# @jwt_required()
# def confirm_job_completion(job_id):

#     current_user_id = get_jwt_identity()

#     user = User.query.get(current_user_id)

#     if user.role != "client":
#         return jsonify({
#             "error": "Only clients can confirm jobs"
#         }), 403

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({
#             "error": "Job not found"
#         }), 404

#     # Only job owner can confirm
#     if job.client_id != user.id:
#         return jsonify({
#             "error": "Unauthorized client"
#         }), 403

#     if job.status != "pending_confirmation":
#         return jsonify({
#             "error": "Job is not awaiting confirmation"
#         }), 400

#     worker = Worker.query.get(job.worker_id)

#     if not worker:
#         return jsonify({
#             "error": "Worker not found"
#         }), 404

#     job.status = "completed"

#     worker.total_jobs_completed += 1

#     db.session.commit()

#     return jsonify({
#         "message": "Job completed successfully"
#     }), 200


# import stripe
# from flask import current_app

# @job_bp.route("/jobs/<int:job_id>/pay", methods=["POST"])
# @jwt_required()
# def create_payment(job_id):

#     user_id = get_jwt_identity()
#     user = User.query.get(user_id)

#     job = Job.query.get(job_id)

#     if not job:
#         return {"error": "Job not found"}, 404

#     if job.client_id != user.id:
#         return {"error": "Unauthorized"}, 403

#     session = stripe.checkout.Session.create(
#         payment_method_types=["card"],
#         line_items=[{
#             "price_data": {
#                 "currency": "gbp",
#                 "product_data": {
#                     "name": job.title
#                 },
#                 "unit_amount": int(job.budget * 100)
#             },
#             "quantity": 1
#         }],
#         mode="payment",
#         success_url="http://localhost:3000/payment-success",
#         cancel_url="http://localhost:3000/payment-cancel"
#     )

#     job.stripe_session_id = session.id
#     job.payment_status = "pending"

#     db.session.commit()

#     return {"url": session.url}

# import stripe
# from flask import current_app
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from app.models import Job, User
# from app.extensions import db

# @job_bp.route("/jobs/<int:job_id>/pay", methods=["POST"])
# @jwt_required()
# def pay_job(job_id):

#     stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

#     user_id = get_jwt_identity()
#     user = User.query.get(user_id)

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({"error": "Job not found"}), 404

#     if user.role != "client":
#         return jsonify({"error": "Only clients can pay"}), 403

#     if job.client_id != user.id:
#         return jsonify({"error": "Unauthorized"}), 403

#     if job.status != "completed":
#         return jsonify({"error": "Job must be completed before payment"}), 400

#     if job.payment_status == "paid":
#         return jsonify({"error": "Job already paid"}), 400

#     session = stripe.checkout.Session.create(
#         payment_method_types=["card"],
#         line_items=[{
#             "price_data": {
#                 "currency": "gbp",
#                 "product_data": {
#                     "name": job.title,
#                 },
#                 "unit_amount": int(job.budget * 100),
#             },
#             "quantity": 1,
#         }],
#         mode="payment",
#         success_url="http://localhost:3000/success",
#         cancel_url="http://localhost:3000/cancel",
#     )

#     job.stripe_session_id = session.id
#     job.payment_status = "pending"

#     db.session.commit()

#     return jsonify({
#         "checkout_url": session.url
#     }), 200

from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models import Job, Worker, User
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe

job_bp = Blueprint("job_bp", __name__)


# =========================
# CREATE JOB (CLIENT)
# =========================
@job_bp.route("/jobs", methods=["POST"])
@jwt_required()
def create_job():

    user = User.query.get(get_jwt_identity())

    if user.role != "client":
        return jsonify({"error": "Only clients can create jobs"}), 403

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

    return jsonify({"message": "Job created"}), 201


# =========================
# GET OPEN JOBS
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

    user = User.query.get(get_jwt_identity())

    if user.role != "worker":
        return jsonify({"error": "Only workers can accept jobs"}), 403

    worker = Worker.query.filter_by(user_id=user.id).first()
    job = Job.query.get(job_id)

    if not worker:
        return jsonify({"error": "Worker not found"}), 404

    if not job:
        return jsonify({"error": "Job not found"}), 404

    # ✅ PAYMENT GATE (YOU ASKED THIS)
    if job.payment_status != "paid":
        return jsonify({"error": "Job must be paid before acceptance"}), 400

    if job.status != "open":
        return jsonify({"error": "Job already taken"}), 400

    if worker.verification_status != "verified":
        return jsonify({"error": "Worker not verified"}), 403

    job.worker_id = worker.id
    job.status = "accepted"

    db.session.commit()

    return jsonify({"message": "Job accepted"}), 200


# =========================
# WORKER MARK FINISHED
# =========================
@job_bp.route("/jobs/<int:job_id>/mark-finished", methods=["PATCH"])
@jwt_required()
def mark_job_finished(job_id):

    user = User.query.get(get_jwt_identity())

    if user.role != "worker":
        return jsonify({"error": "Only workers can mark finished"}), 403

    worker = Worker.query.filter_by(user_id=user.id).first()
    job = Job.query.get(job_id)

    if job.worker_id != worker.id:
        return jsonify({"error": "Unauthorized"}), 403

    if job.status != "accepted":
        return jsonify({"error": "Invalid status"}), 400

    job.status = "pending_confirmation"

    db.session.commit()

    return jsonify({"message": "Marked finished"}), 200


# =========================
# CLIENT CONFIRMS COMPLETION
# =========================
@job_bp.route("/jobs/<int:job_id>/confirm", methods=["PATCH"])
@jwt_required()
def confirm_job_completion(job_id):

    user = User.query.get(get_jwt_identity())
    job = Job.query.get(job_id)

    if user.role != "client":
        return jsonify({"error": "Only clients"}), 403

    if job.client_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if job.status != "pending_confirmation":
        return jsonify({"error": "Not ready"}), 400

    worker = Worker.query.get(job.worker_id)

    job.status = "completed"
    worker.total_jobs_completed += 1

    db.session.commit()

    return jsonify({"message": "Completed"}), 200


# =========================
# CREATE STRIPE CHECKOUT
# =========================
@job_bp.route("/jobs/<int:job_id>/pay", methods=["POST"])
@jwt_required()
def pay_job(job_id):

    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

    user = User.query.get(get_jwt_identity())
    job = Job.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    if user.role != "client":
        return jsonify({"error": "Only clients can pay"}), 403

    if job.client_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    # only allow payment before acceptance OR after completion (your choice)
    if job.payment_status == "paid":
        return jsonify({"error": "Already paid"}), 400

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "gbp",
                "product_data": {"name": job.title},
                "unit_amount": int(job.budget * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url="http://localhost:3000/success",
        cancel_url="http://localhost:3000/cancel",
    )

    job.stripe_session_id = session.id
    job.payment_status = "pending"

    db.session.commit()

    return jsonify({"checkout_url": session.url}), 200