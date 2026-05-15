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

    # 1. ROLE CHECK
    if user.role != "worker":
        return jsonify({"error": "Only workers can accept jobs"}), 403

    # 2. LOAD DATA
    worker = Worker.query.filter_by(user_id=user.id).first()
    job = Job.query.get(job_id)

    if not worker:
        return jsonify({"error": "Worker not found"}), 404

    if not job:
        return jsonify({"error": "Job not found"}), 404

    # 3. ESCROW PAYMENT CHECK (NEW CORE RULE)
    if job.payment_status != "paid":
        return jsonify({
            "error": "Job must be paid before acceptance"
        }), 400

    # 4. JOB STATE CHECK
    if job.status != "open":
        return jsonify({
            "error": "Job is not available"
        }), 400

    # 5. PREVENT DOUBLE ASSIGNMENT (IMPORTANT FIX)
    if job.worker_id is not None:
        return jsonify({
            "error": "Job already assigned to a worker"
        }), 400

    # 6. WORKER VERIFICATION CHECK
    if worker.verification_status != "verified":
        return jsonify({
            "error": "Worker not verified"
        }), 403

    # 7. PREVENT WORKER TAKING MULTIPLE ACTIVE JOBS
    active_job = Job.query.filter_by(
        worker_id=worker.id,
        status="accepted"
    ).first()

    if active_job:
        return jsonify({
            "error": "Worker already has an active job"
        }), 400

    # 8. ASSIGN JOB
    job.worker_id = worker.id
    job.status = "accepted"

    db.session.commit()

    return jsonify({
        "message": "Job accepted successfully",
        "job_id": job.id,
        "worker_id": worker.id
    }), 200


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
        return jsonify({"error": "Only clients can confirm completion"}), 403

    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.client_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if job.status != "pending_confirmation":
        return jsonify({"error": "Job is not pending confirmation"}), 400

    # Fetch the worker assigned to this specific job
    worker = Worker.query.get(job.worker_id)

    # 🛡️ SAFETY CHECK: Verify a worker is actually attached to this job
    if not worker:
        return jsonify({"error": "No worker is currently assigned to this job"}), 400

    # 1. Update status metrics
    job.status = "completed"
    worker.total_jobs_completed = (worker.total_jobs_completed or 0) + 1

    # 2. Calculate the 15% platform deduction split
    # Safe fallback if amount_paid is somehow missing/None
    gross_amount = job.amount_paid or 0.0             
    deduction = round(gross_amount * 0.15, 2)          
    net_amount = round(gross_amount - deduction, 2)    

    # 3. Increment lifetime stats on worker profile securely
    worker.total_gross_earnings = (worker.total_gross_earnings or 0.0) + gross_amount
    worker.total_net_earnings = (worker.total_net_earnings or 0.0) + net_amount

    db.session.commit()

    return jsonify({
        "message": "Job completed successfully",
        "gross_earned": gross_amount,
        "platform_fee_15pct": deduction,
        "net_earned": net_amount
    }), 200

# =========================
# CREATE STRIPE CHECKOUT
# =========================
@job_bp.route("/jobs/<int:job_id>/pay", methods=["POST"])
@jwt_required()
def pay_job(job_id):

    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

    user = User.query.get(get_jwt_identity())
    job = Job.query.get(job_id)
    # print(session)

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


# import stripe
# from flask import request, current_app, jsonify
# from app.models import Job
# from app.extensions import db
# from flask import Blueprint

# job_bp = Blueprint("job_bp", __name__)

# @job_bp.route("/stripe/webhook", methods=["POST"])
# def stripe_webhook():

#     payload = request.data
#     sig_header = request.headers.get("Stripe-Signature")

#     endpoint_secret = current_app.config["STRIPE_WEBHOOK_SECRET"]

#     try:
#         event = stripe.Webhook.construct_event(
#             payload,
#             sig_header,
#             endpoint_secret
#         )
#     except Exception as e:
#         return jsonify({"error": str(e)}), 400

#     # ✅ Payment successful event
#     if event["type"] == "checkout.session.completed":
#         session = event["data"]["object"]

#         job = Job.query.filter_by(
#             stripe_session_id=session.get("id")
#         ).first()

#         if job:
#             job.payment_status = "paid"
#             db.session.commit()

#     return jsonify({"status": "success"}), 200



# =========================
# STRIPE WEBHOOK
# =========================

# @job_bp.route("/stripe/webhook", methods=["POST"])
# def stripe_webhook():

#     payload = request.data
#     sig_header = request.headers.get("Stripe-Signature")
#     endpoint_secret = current_app.config["STRIPE_WEBHOOK_SECRET"]

#     print("🔔 Webhook hit")  # MUST appear in terminal

#     try:
#         event = stripe.Webhook.construct_event(
#             payload,
#             sig_header,
#             endpoint_secret
#         )

#     except ValueError:
#         print("❌ Invalid payload")
#         return jsonify({"error": "Invalid payload"}), 400

#     except stripe.error.SignatureVerificationError:
#         print("❌ Invalid signature")
#         return jsonify({"error": "Invalid signature"}), 400

#     # ✅ SUCCESS EVENT
#     if event["type"] == "checkout.session.completed":

#         session = event["data"]["object"]
#         stripe_session_id = session.get("id")

#         print("💰 Payment success for session:", stripe_session_id)

#         job = Job.query.filter_by(
#             stripe_session_id=stripe_session_id
#         ).first()

#         if job:
#             job.payment_status = "paid"
#             db.session.commit()
#             print("✅ Job marked as PAID")

#     return jsonify({"message": "Webhook received"}), 200
@job_bp.route("/stripe/webhook", methods=["POST"])
def stripe_webhook():

    print("🔥 WEBHOOK HIT")
    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

    print(f"Flask is using secret: {current_app.config.get('STRIPE_WEBHOOK_SECRET')}")

    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")

    endpoint_secret = current_app.config["STRIPE_WEBHOOK_SECRET"]

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            endpoint_secret
        )

        print("✅ EVENT VERIFIED")
        print(event["type"])

    except Exception as e:
        print("❌ WEBHOOK ERROR:", str(e))
        return jsonify({"error": str(e)}), 400

    if event["type"] == "checkout.session.completed":

        session = event["data"]["object"]

        stripe_session_id = session.id  # Proper Stripe object notation

        print("SESSION ID:", stripe_session_id)

        job = Job.query.filter_by(
            stripe_session_id=stripe_session_id
        ).first()

        if job:
            print("✅ JOB FOUND")
            job.payment_status = "paid"
            
            # Change job status to 'open' so workers can see it in the feed now
            job.status = "open" 
            
            # 💰 NEW: Extract amount from Stripe (convert pence to pounds)
            job.amount_paid = float(session.amount_total / 100)

            db.session.commit()
            print(f"✅ PAYMENT UPDATED: Stored £{job.amount_paid} on Job #{job.id}")

        else:
            print("❌ JOB NOT FOUND")

    return jsonify({"message": "Webhook received"}), 200


# =========================
# WORKER DASHBOARD STATS
# =========================
@job_bp.route("/worker/dashboard", methods=["GET"])
@jwt_required()
def get_worker_dashboard():
    user = User.query.get(get_jwt_identity())

    if user.role != "worker":
        return jsonify({"error": "Unauthorized access"}), 403

    worker = Worker.query.filter_by(user_id=user.id).first()
    
    if not worker:
        return jsonify({"error": "Worker profile not found"}), 404

    return jsonify({
        "worker_id": worker.id,
        "jobs_completed": worker.total_jobs_completed,
        "average_rating": worker.average_rating,
        
        # Financial breakdown metrics
        "total_gross_earnings": round(worker.total_gross_earnings or 0.0, 2),
        "total_net_take_home": round(worker.total_net_earnings or 0.0, 2),
        "total_platform_fees_paid": round((worker.total_gross_earnings or 0.0) - (worker.total_net_earnings or 0.0), 2)
    }), 200