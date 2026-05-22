# from flask import Blueprint, request, jsonify, current_app
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from sqlalchemy import func
# import stripe

# from app.extensions import db
# from app.models import Job, Worker, User, Review

# job_bp = Blueprint("job_bp", __name__)

# # =========================
# # CREATE JOB (CLIENT)
# # =========================
# @job_bp.route("/jobs", methods=["POST"])
# @jwt_required()
# def create_job():

#     user = User.query.get(get_jwt_identity())

#     if not user:
#         return jsonify({"error": "User not found"}), 404

#     if user.role != "client":
#         return jsonify({
#             "error": "Only clients can create jobs"
#         }), 403

#     data = request.get_json()

#     if not data:
#         return jsonify({
#             "error": "Missing JSON body"
#         }), 400

#     title = data.get("title")
#     description = data.get("description")
#     budget = data.get("budget")
#     category = data.get("category")
#     location_text = data.get("location_text")

#     if not all([title, description, budget, category]):
#         return jsonify({
#             "error": "Missing required fields"
#         }), 400

#     try:
#         budget = float(budget)
#     except (ValueError, TypeError):
#         return jsonify({
#             "error": "Budget must be a valid number"
#         }), 400

#     job = Job(
#         title=title,
#         description=description,
#         budget=budget,
#         category=category,
#         location_text=location_text,
#         client_id=user.id,
#         status="open",
#         payment_status="unpaid"
#     )

#     db.session.add(job)
#     db.session.commit()

#     return jsonify({
#         "message": "Job created successfully",
#         "job_id": job.id
#     }), 201

# from sqlalchemy.orm import joinedload

# # =========================
# # GET OPEN PAID JOBS
# # =========================
# @job_bp.route("/jobs/open", methods=["GET"])
# def get_open_jobs():
#     # Use joinedload to eager-load the client relationship in a single query
#     jobs = (
#         Job.query.filter_by(status="open", payment_status="paid")
#         .options(joinedload(Job.client))
#         .order_by(Job.created_at.desc())
#         .all()
#     )

#     return jsonify([
#         {
#             "id": job.id,
#             "title": job.title,
#             "description": job.description,
#             "budget": job.budget,
#             "category": job.category,
#             "location": job.location_text,
#             "payment_status": job.payment_status,
#             # Uses the pre-loaded relationship instead of triggering new queries
#             "client_name": job.client.full_name if job.client else "Unknown Client",
#             "created_at": (
#                 job.created_at.isoformat()
#                 if getattr(job, "created_at", None)
#                 else None
#             )
#         }
#         # A clean, single-pass iteration
#         for job in jobs
#     ]), 200

# # =========================
# # GET SINGLE JOB
# # =========================
# @job_bp.route("/jobs/<int:job_id>", methods=["GET"])
# def get_single_job(job_id):

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({
#             "error": "Job not found"
#         }), 404

#     worker_data = None

#     if job.worker_id:
#         worker = Worker.query.get(job.worker_id)

#         if worker and worker.user:
#             worker_data = {
#                 "worker_id": worker.id,
#                 "name": worker.user.full_name,
#                 "rating": worker.average_rating,
#                 "verification_status": worker.verification_status
#             }

#     requested_worker_data = None

#     if job.requested_worker_id:
#         requested_worker = Worker.query.get(
#             job.requested_worker_id
#         )

#         if requested_worker and requested_worker.user:
#             requested_worker_data = {
#                 "worker_id": requested_worker.id,
#                 "name": requested_worker.user.full_name,
#                 "rating": requested_worker.average_rating,
#                 "verification_status": requested_worker.verification_status
#             }

#     return jsonify({
#         "id": job.id,
#         "title": job.title,
#         "description": job.description,
#         "budget": job.budget,
#         "category": job.category,
#         "location": job.location_text,
#         "status": job.status,
#         "payment_status": job.payment_status,
#         "client_id": job.client_id,
#         "worker": worker_data,
#         "requested_worker": requested_worker_data,
#         "created_at": (
#             job.created_at.isoformat()
#             if getattr(job, "created_at", None)
#             else None
#         )
#     }), 200


# # # =========================
# # # ACCEPT JOB (WORKER REQUEST)
# # # =========================
# # @job_bp.route("/jobs/<int:job_id>/accept", methods=["PATCH"])
# # @jwt_required()
# # def accept_job(job_id):

# #     user = User.query.get(get_jwt_identity())

# #     if not user:
# #         return jsonify({
# #             "error": "User not found"
# #         }), 404

# #     if user.role != "worker":
# #         return jsonify({
# #             "error": "Only workers can accept jobs"
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

# #     # PREVENT SELF ACCEPTANCE
# #     if job.client_id == user.id:
# #         return jsonify({
# #             "error": "You cannot accept your own job"
# #         }), 400

# #     # PAYMENT REQUIRED
# #     if job.payment_status != "paid":
# #         return jsonify({
# #             "error": "Job must be paid before acceptance"
# #         }), 400

# #     # JOB MUST BE OPEN
# #     if job.status != "open":
# #         return jsonify({
# #             "error": "Job is not available"
# #         }), 400

# #     # NO DOUBLE ASSIGNMENT
# #     if job.worker_id is not None:
# #         return jsonify({
# #             "error": "Job already assigned"
# #         }), 400

# #     # VERIFIED WORKERS ONLY
# #     if worker.verification_status != "verified":
# #         return jsonify({
# #             "error": "Worker not verified"
# #         }), 403

# #     # ONE ACTIVE JOB LIMIT
# #     active_job = Job.query.filter_by(
# #         worker_id=worker.id,
# #         status="accepted"
# #     ).first()

# #     if active_job:
# #         return jsonify({
# #             "error": "Worker already has an active job"
# #         }), 400

# #     # PREVENT MULTIPLE PENDING REQUESTS
# #     if job.requested_worker_id is not None:
# #         return jsonify({
# #             "error": "Another worker request is already pending"
# #         }), 400

# #     # PREVENT SAME WORKER DUPLICATE REQUEST
# #     if job.requested_worker_id == worker.id:
# #         return jsonify({
# #             "error": "You already requested this job"
# #         }), 400

# #     # SEND REQUEST TO CLIENT
# #     job.requested_worker_id = worker.id
# #     job.status = "pending_client_acceptance"

# #     db.session.commit()

# #     return jsonify({
# #         "message": "Worker request sent to client",
# #         "job_id": job.id,
# #         "requested_worker_id": worker.id
# #     }), 200

# # =========================
# # APPLY TO JOB (WORKER)
# # =========================
# @job_bp.route("/jobs/<int:job_id>/apply", methods=["POST"])
# @jwt_required()
# def apply_to_job(job_id):
#     user = User.query.get(get_jwt_identity())

#     if not user:
#         return jsonify({"error": "User not found"}), 404

#     if user.role != "worker":
#         return jsonify({"error": "Only workers can apply for jobs"}), 403

#     worker = Worker.query.filter_by(user_id=user.id).first()

#     if not worker:
#         return jsonify({"error": "Worker profile not found"}), 404

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({"error": "Job not found"}), 404

#     # PREVENT SELF APPLICATION
#     if job.client_id == user.id:
#         return jsonify({"error": "You cannot apply to your own job"}), 400

#     # PAYMENT REQUIRED
#     if job.payment_status != "paid":
#         return jsonify({"error": "Job must be paid before applying"}), 400

#     # JOB MUST BE OPEN
#     # Note: We now allow applications even if status is 'pending_client_acceptance'
#     if job.status not in ["open", "pending_client_acceptance"]:
#         return jsonify({"error": "Job is not available for applications"}), 400

#     # NO DOUBLE ASSIGNMENT (If a winner was already selected)
#     if job.worker_id is not None:
#         return jsonify({"error": "Job already assigned"}), 400

#     # VERIFIED WORKERS ONLY
#     if worker.verification_status != "verified":
#         return jsonify({"error": "Worker not verified"}), 403

#     # ONE ACTIVE JOB LIMIT
#     active_job = Job.query.filter_by(
#         worker_id=worker.id,
#         status="accepted"
#     ).first()

#     if active_job:
#         return jsonify({"error": "Worker already has an active job"}), 400

#     # PREVENT SAME WORKER DUPLICATE APPLICATION
#     existing_application = JobApplication.query.filter_by(
#         job_id=job.id,
#         worker_id=worker.id
#     ).first()

#     if existing_application:
#         return jsonify({"error": "You have already applied to this job"}), 400

#     # READ PITCH MESSAGE FROM REQUEST BODY
#     data = request.get_json() or {}
#     worker_message = data.get("worker_message")

#     # CREATE NEW APPLICATION ENTRY
#     application = JobApplication(
#         job_id=job.id,
#         worker_id=worker.id,
#         worker_message=worker_message,
#         status="pending"
#     )

#     # Update job state to show it has active applicant screening
#     job.status = "pending_client_acceptance"

#     db.session.add(application)
#     db.session.commit()

#     return jsonify({
#         "message": "Application submitted successfully",
#         "job_id": job.id,
#         "application_id": application.id
#     }), 201


# # =========================
# # CLIENT APPROVES WORKER
# # =========================
# @job_bp.route("/jobs/<int:job_id>/approve-worker", methods=["PATCH"])
# @jwt_required()
# def approve_worker(job_id):

#     user = User.query.get(get_jwt_identity())

#     if not user:
#         return jsonify({
#             "error": "User not found"
#         }), 404

#     if user.role != "client":
#         return jsonify({
#             "error": "Only clients can approve workers"
#         }), 403

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({
#             "error": "Job not found"
#         }), 404

#     if job.client_id != user.id:
#         return jsonify({
#             "error": "Unauthorized"
#         }), 403

#     if job.status != "pending_client_acceptance":
#         return jsonify({
#             "error": "Job is not awaiting worker approval"
#         }), 400

#     if not job.requested_worker_id:
#         return jsonify({
#             "error": "No worker request found"
#         }), 400

#     worker = Worker.query.get(job.requested_worker_id)

#     if not worker:
#         return jsonify({
#             "error": "Worker not found"
#         }), 404

#     active_job = Job.query.filter_by(
#         worker_id=worker.id,
#         status="accepted"
#     ).first()

#     if active_job:
#         return jsonify({
#             "error": "Worker already has an active job"
#         }), 400

#     job.worker_id = worker.id
#     job.requested_worker_id = None
#     job.status = "accepted"

#     db.session.commit()

#     return jsonify({
#         "message": "Worker approved successfully",
#         "job_id": job.id,
#         "worker_id": worker.id
#     }), 200


# # =========================
# # CLIENT DECLINES WORKER
# # =========================
# @job_bp.route("/jobs/<int:job_id>/decline-worker", methods=["PATCH"])
# @jwt_required()
# def decline_worker(job_id):

#     user = User.query.get(get_jwt_identity())

#     if not user:
#         return jsonify({
#             "error": "User not found"
#         }), 404

#     if user.role != "client":
#         return jsonify({
#             "error": "Only clients can decline workers"
#         }), 403

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({
#             "error": "Job not found"
#         }), 404

#     if job.client_id != user.id:
#         return jsonify({
#             "error": "Unauthorized"
#         }), 403

#     if job.status != "pending_client_acceptance":
#         return jsonify({
#             "error": "Job is not awaiting approval"
#         }), 400

#     job.requested_worker_id = None
#     job.status = "open"

#     db.session.commit()

#     return jsonify({
#         "message": "Worker request declined"
#     }), 200


# # =========================
# # WORKER MARK FINISHED
# # =========================
# @job_bp.route("/jobs/<int:job_id>/mark-finished", methods=["PATCH"])
# @jwt_required()
# def mark_job_finished(job_id):

#     user = User.query.get(get_jwt_identity())

#     if not user:
#         return jsonify({
#             "error": "User not found"
#         }), 404

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

#     if job.worker_id != worker.id:
#         return jsonify({
#             "error": "Unauthorized"
#         }), 403

#     if job.status != "accepted":
#         return jsonify({
#             "error": "Invalid job status"
#         }), 400

#     job.status = "pending_confirmation"

#     db.session.commit()

#     return jsonify({
#         "message": "Job marked as finished"
#     }), 200


# # =========================
# # CLIENT CONFIRMS COMPLETION
# # =========================
# @job_bp.route("/jobs/<int:job_id>/confirm", methods=["PATCH"])
# @jwt_required()
# def confirm_job_completion(job_id):

#     user = User.query.get(get_jwt_identity())

#     if not user:
#         return jsonify({
#             "error": "User not found"
#         }), 404

#     if user.role != "client":
#         return jsonify({
#             "error": "Only clients can confirm completion"
#         }), 403

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({
#             "error": "Job not found"
#         }), 404

#     if job.client_id != user.id:
#         return jsonify({
#             "error": "Unauthorized"
#         }), 403

#     if job.status != "pending_confirmation":
#         return jsonify({
#             "error": "Job is not pending confirmation"
#         }), 400

#     worker = Worker.query.get(job.worker_id)

#     if not worker:
#         return jsonify({
#             "error": "Worker not found"
#         }), 404

#     job.status = "completed"
#     job.requested_worker_id = None

#     worker.total_jobs_completed = (
#         worker.total_jobs_completed or 0
#     ) + 1

#     gross_amount = job.amount_paid or 0.0

#     platform_fee = round(
#         gross_amount * 0.15,
#         2
#     )

#     worker_payout = round(
#         gross_amount - platform_fee,
#         2
#     )

#     worker.total_gross_earnings = (
#         worker.total_gross_earnings or 0.0
#     ) + gross_amount

#     worker.total_net_earnings = (
#         worker.total_net_earnings or 0.0
#     ) + worker_payout

#     db.session.commit()

#     return jsonify({
#         "message": "Job completed successfully",
#         "total_client_paid": gross_amount,
#         "platform_fee_15_percent": platform_fee,
#         "worker_take_home": worker_payout
#     }), 200


# # =========================
# # CREATE STRIPE CHECKOUT
# # =========================
# @job_bp.route("/jobs/<int:job_id>/pay", methods=["POST"])
# @jwt_required()
# def pay_job(job_id):

#     stripe.api_key = current_app.config[
#         "STRIPE_SECRET_KEY"
#     ]

#     user = User.query.get(
#         get_jwt_identity()
#     )

#     if not user:
#         return jsonify({
#             "error": "User not found"
#         }), 404

#     if user.role != "client":
#         return jsonify({
#             "error": "Only clients can pay"
#         }), 403

#     job = Job.query.get(job_id)

#     if not job:
#         return jsonify({
#             "error": "Job not found"
#         }), 404

#     if job.client_id != user.id:
#         return jsonify({
#             "error": "Unauthorized"
#         }), 403

#     if job.status != "open":
#         return jsonify({
#             "error": "Only open jobs can be paid for"
#         }), 400

#     if job.payment_status == "paid":
#         return jsonify({
#             "error": "Job already paid"
#         }), 400

#     session = stripe.checkout.Session.create(
#         payment_method_types=["card"],

#         line_items=[{
#             "price_data": {
#                 "currency": "gbp",
#                 "product_data": {
#                     "name": job.title
#                 },
#                 "unit_amount": int(
#                     job.budget * 100
#                 ),
#             },
#             "quantity": 1,
#         }],

#         mode="payment",

#         metadata={
#             "job_id": job.id
#         },

#         success_url="http://localhost:3000/success",
#         cancel_url="http://localhost:3000/cancel",
#     )

#     job.stripe_session_id = session.id
#     job.payment_status = "pending"

#     db.session.commit()

#     return jsonify({
#         "checkout_url": session.url
#     }), 200

# # =========================
# # STRIPE WEBHOOK
# # =========================
# @job_bp.route("/stripe/webhook", methods=["POST"])
# def stripe_webhook():
#     stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]
#     payload = request.data
#     sig_header = request.headers.get("Stripe-Signature")
#     endpoint_secret = current_app.config["STRIPE_WEBHOOK_SECRET"]

#     try:
#         event = stripe.Webhook.construct_event(
#             payload, sig_header, endpoint_secret
#         )
#     except ValueError:
#         return jsonify({"error": "Invalid payload"}), 400
#     except stripe.error.SignatureVerificationError:
#         return jsonify({"error": "Invalid signature"}), 400

#     if event["type"] == "checkout.session.completed":
#         session = event["data"]["object"]
#         raw_job_id = session["metadata"]["job_id"] if "metadata" in session and "job_id" in session["metadata"] else None

#         if not raw_job_id:
#             print("[-] Webhook Error: Missing job_id in session metadata.")
#             return jsonify({"error": "Missing job metadata"}), 400

#         # Fix: Convert the string metadata ID into an integer for SQLAlchemy
#         try:
#             job_id = int(raw_job_id)
#         except ValueError:
#             print(f"[-] Webhook Error: Job ID '{raw_job_id}' is not a valid integer.")
#             return jsonify({"error": "Invalid job ID format"}), 400

#         # Look up by primary key directly
#         job = Job.query.get(job_id)

#         if job:
#             # Extra safety step: Ensure the session tokens match up perfectly
#             if job.stripe_session_id != session.id:
#                 print(f"[-] Webhook Warning: Session ID mismatch for Job #{job_id}.")
#                 return jsonify({"error": "Stripe session mismatch"}), 400

#             # Update the database
#             job.payment_status = "paid"
#             job.amount_paid = float(session.amount_total / 100)
#             db.session.commit()
#             print(f"[+] Webhook Success: Job #{job_id} updated to PAID.")
#         else:
#             print(f"[-] Webhook Error: Job #{job_id} not found in database.")
#             return jsonify({"error": "Job not found"}), 404

#     return jsonify({"message": "Webhook received"}), 200

# # =========================
# # WORKER DASHBOARD
# # =========================
# @job_bp.route("/worker/dashboard", methods=["GET"])
# @jwt_required()
# def get_worker_dashboard():

#     user = User.query.get(
#         get_jwt_identity()
#     )

#     if not user or user.role != "worker":
#         return jsonify({
#             "error": "Unauthorized"
#         }), 403

#     worker = Worker.query.filter_by(
#         user_id=user.id
#     ).first()

#     if not worker:
#         return jsonify({
#             "error": "Worker profile not found"
#         }), 404

#     jobs = Job.query.filter_by(
#         worker_id=worker.id
#     ).all()

#     active_jobs = []
#     completed_jobs = []

#     for job in jobs:

#         client = User.query.get(
#             job.client_id
#         )

#         review = Review.query.filter_by(
#             job_id=job.id
#         ).first()

#         review_data = None

#         if review:
#             review_data = {
#                 "rating": review.rating,
#                 "comment": review.comment
#             }

#         job_data = {
#             "job_id": job.id,
#             "title": job.title,
#             "budget": job.budget,
#             "status": job.status,
#             "client_name": (
#                 client.full_name
#                 if client
#                 else "Unknown Client"
#             ),
#             "review": review_data
#         }

#         if job.status == "completed":
#             completed_jobs.append(job_data)
#         else:
#             active_jobs.append(job_data)

#     total_gross = sum(
#         j["budget"]
#         for j in completed_jobs
#     )

#     total_fees = round(
#         total_gross * 0.15,
#         2
#     )

#     total_net = round(
#         total_gross - total_fees,
#         2
#     )

#     return jsonify({

#         "worker_info": {
#             "worker_id": worker.id,
#             "name": user.full_name,
#             "rating": worker.average_rating or 0.0,
#             "verification_status": worker.verification_status
#         },

#         "stats": {
#             "jobs_completed": len(completed_jobs),
#             "gross_earnings": total_gross,
#             "platform_fees": total_fees,
#             "net_earnings": total_net
#         },

#         "active_jobs": active_jobs,
#         "completed_jobs": completed_jobs

#     }), 200


# # =========================
# # CLIENT DASHBOARD
# # =========================
# @job_bp.route("/client/dashboard", methods=["GET"])
# @jwt_required()
# def get_client_dashboard():

#     user = User.query.get(
#         get_jwt_identity()
#     )

#     if not user or user.role != "client":
#         return jsonify({
#             "error": "Unauthorized"
#         }), 403

#     jobs = Job.query.filter_by(
#         client_id=user.id
#     ).all()

#     active_jobs = []
#     completed_jobs = []

#     total_spent = 0.0

#     for job in jobs:

#         if job.amount_paid:
#             total_spent += float(
#                 job.amount_paid
#             )

#         worker_data = None

#         if job.worker_id:

#             worker = Worker.query.get(
#                 job.worker_id
#             )

#             if worker and worker.user:
#                 worker_data = {
#                     "worker_id": worker.id,
#                     "name": worker.user.full_name,
#                     "rating": worker.average_rating
#                 }

#         requested_worker_data = None

#         if job.requested_worker_id:

#             requested_worker = Worker.query.get(
#                 job.requested_worker_id
#             )

#             if requested_worker and requested_worker.user:
#                 requested_worker_data = {
#                     "worker_id": requested_worker.id,
#                     "name": requested_worker.user.full_name,
#                     "rating": requested_worker.average_rating
#                 }

#         review = Review.query.filter_by(
#             job_id=job.id
#         ).first()

#         review_data = None

#         if review:
#             review_data = {
#                 "review_id": review.id,
#                 "rating": review.rating,
#                 "comment": review.comment
#             }

#         job_data = {
#             "job_id": job.id,
#             "title": job.title,
#             "budget": job.budget,
#             "status": job.status,
#             "payment_status": job.payment_status,
#             "amount_paid": job.amount_paid,
#             "worker": worker_data,
#             "requested_worker": requested_worker_data,
#             "awaiting_worker_approval": (
#                 job.status ==
#                 "pending_client_acceptance"
#             ),
#             "review": review_data
#         }

#         if job.status == "completed":
#             completed_jobs.append(job_data)
#         else:
#             active_jobs.append(job_data)

#     return jsonify({

#         "client_info": {
#             "name": user.full_name,
#             "email": user.email
#         },

#         "metrics": {
#             "total_spent": round(
#                 total_spent,
#                 2
#             ),
#             "total_jobs": len(jobs),
#             "completed_jobs": len(completed_jobs),
#             "active_jobs": len(active_jobs)
#         },

#         "active_jobs": active_jobs,
#         "completed_jobs": completed_jobs

#     }), 200


# # =========================
# # PUBLIC WORKER PROFILE
# # =========================
# @job_bp.route(
#     "/workers/<int:worker_id>/public",
#     methods=["GET"]
# )
# def get_public_worker_profile(worker_id):

#     worker = Worker.query.get(worker_id)

#     if not worker:
#         return jsonify({
#             "error": "Worker not found"
#         }), 404

#     reviews = Review.query.filter_by(
#         worker_id=worker.id
#     ).all()

#     return jsonify({
#         "name": worker.user.full_name,
#         "bio": worker.bio,
#         "skills": (
#             worker.skills.split(",")
#             if worker.skills
#             else []
#         ),
#         "location": worker.location_text,
#         "rating": worker.average_rating,
#         "completed_jobs": (
#             worker.total_jobs_completed
#         ),
#         "reviews": [
#             {
#                 "rating": r.rating,
#                 "comment": r.comment,
#                 "client": r.client_id
#             }
#             for r in reviews
#         ]
#     }), 200


from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from sqlalchemy.orm import joinedload
import stripe

from app.extensions import db
# 1. Added JobApplication to the model imports
from app.models import Job, Worker, User, Review, JobApplication, PayoutRequest

job_bp = Blueprint("job_bp", __name__)

# =========================
# CREATE JOB (CLIENT)
# =========================
@job_bp.route("/jobs", methods=["POST"])
@jwt_required()
def create_job():
    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != "client":
        return jsonify({"error": "Only clients can create jobs"}), 403

    data = request.get_json()

    if not data:
        return jsonify({"error": "Missing JSON body"}), 400

    title = data.get("title")
    description = data.get("description")
    budget = data.get("budget")
    category = data.get("category")
    location_text = data.get("location_text")

    if not all([title, description, budget, category]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        budget = float(budget)
    except (ValueError, TypeError):
        return jsonify({"error": "Budget must be a valid number"}), 400

    job = Job(
        title=title,
        description=description,
        budget=budget,
        category=category,
        location_text=location_text,
        client_id=user.id,
        status="open",
        payment_status="unpaid"
    )

    db.session.add(job)
    db.session.commit()

    return jsonify({
        "message": "Job created successfully",
        "job_id": job.id
    }), 201

# ==========================================
# 2. GET CLIENT'S OWN JOBS (DASHBOARD FEED)
# ==========================================
@job_bp.route("/jobs/my-postings", methods=["GET"])
@jwt_required()
def get_client_jobs():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != "client":
        return jsonify({"error": "Unauthorized Access"}), 403

    jobs = Job.query.filter_by(client_id=user_id).order_by(Job.created_at.desc()).all()
    
    return jsonify([
        {
            "id": job.id,
            "title": job.title,
            "budget": job.budget,
            "status": job.status,
            "payment_status": job.payment_status,
            "created_at": job.created_at.isoformat() if getattr(job, "created_at", None) else None
        } for job in jobs
    ]), 200


# =========================
# GET OPEN PAID JOBS
# =========================
@job_bp.route("/jobs/open", methods=["GET"])
def get_open_jobs():
    jobs = (
        Job.query.filter_by(status="open", payment_status="paid")
        .options(joinedload(Job.client))
        .order_by(Job.created_at.desc())
        .all()
    )

    return jsonify([
        {
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "budget": job.budget,
            "category": job.category,
            "location": job.location_text,
            "payment_status": job.payment_status,
            "client_name": job.client.full_name if job.client else "Unknown Client",
            "created_at": (
                job.created_at.isoformat()
                if getattr(job, "created_at", None)
                else None
            )
        }
        for job in jobs
    ]), 200


# =========================
# GET SINGLE JOB
# =========================
@job_bp.route("/jobs/<int:job_id>", methods=["GET"])
def get_single_job(job_id):
    job = Job.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    worker_data = None
    if job.worker_id:
        worker = Worker.query.get(job.worker_id)
        if worker and worker.user:
            worker_data = {
                "worker_id": worker.id,
                "name": worker.user.full_name,
                "rating": worker.average_rating,
                "verification_status": worker.verification_status
            }

    # Pull all active incoming applications for this job
    applications_data = []
    apps = JobApplication.query.filter_by(job_id=job.id).options(joinedload(JobApplication.worker)).all()
    for app in apps:
        if app.worker and app.worker.user:
            applications_data.append({
                "application_id": app.id,
                "worker_id": app.worker.id,
                "name": app.worker.user.full_name,
                "rating": app.worker.average_rating,
                "worker_message": app.worker_message,
                "status": app.status,
                "created_at": app.created_at.isoformat() if app.created_at else None
            })

    return jsonify({
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "budget": job.budget,
        "category": job.category,
        "location": job.location_text,
        "status": job.status,
        "payment_status": job.payment_status,
        "client_id": job.client_id,
        "worker": worker_data,
        "applications": applications_data,  # Now returns the complete array of applicants
        "created_at": (
            job.created_at.isoformat()
            if getattr(job, "created_at", None)
            else None
        )
    }), 200


# ==========================================
# 5. CANCEL / DELETE JOB (CLIENT)
# ==========================================
@job_bp.route("/jobs/<int:job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id):
    user_id = get_jwt_identity()
    job = Job.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    # Authorization guard: Ensure this posting belongs to the client attempting deletion
    if job.client_id != user_id:
        return jsonify({"error": "Unauthorized to cancel this job"}), 403

    if job.status == "in_progress":
        return jsonify({"error": "Cannot delete a job that is already active/in-progress"}), 400

    # Cascade-delete apps manually if relationships are not set up to cascade in models
    JobApplication.query.filter_by(job_id=job.id).delete()

    db.session.delete(job)
    db.session.commit()

    return jsonify({"message": "Job deleted and canceled successfully"}), 200


# =========================
# APPLY TO JOB (WORKER)
# =========================
@job_bp.route("/jobs/<int:job_id>/apply", methods=["POST"])
@jwt_required()
def apply_to_job(job_id):
    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != "worker":
        return jsonify({"error": "Only workers can apply for jobs"}), 403

    worker = Worker.query.filter_by(user_id=user.id).first()

    if not worker:
        return jsonify({"error": "Worker profile not found"}), 404

    job = Job.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.client_id == user.id:
        return jsonify({"error": "You cannot apply to your own job"}), 400

    if job.payment_status != "paid":
        return jsonify({"error": "Job must be paid before applying"}), 400

    if job.status not in ["open", "pending_client_acceptance"]:
        return jsonify({"error": "Job is not available for applications"}), 400

    if job.worker_id is not None:
        return jsonify({"error": "Job already assigned"}), 400

    if worker.verification_status != "verified":
        return jsonify({"error": "Worker not verified"}), 403

    active_job = Job.query.filter_by(worker_id=worker.id, status="accepted").first()
    if active_job:
        return jsonify({"error": "Worker already has an active job"}), 400

    existing_application = JobApplication.query.filter_by(
        job_id=job.id,
        worker_id=worker.id
    ).first()

    if existing_application:
        return jsonify({"error": "You have already applied to this job"}), 400

    data = request.get_json() or {}
    worker_message = data.get("worker_message")

    application = JobApplication(
        job_id=job.id,
        worker_id=worker.id,
        worker_message=worker_message,
        status="pending"
    )

    job.status = "pending_client_acceptance"

    db.session.add(application)
    db.session.commit()

    return jsonify({
        "message": "Application submitted successfully",
        "job_id": job.id,
        "application_id": application.id
    }), 201


# =========================
# CLIENT APPROVES APPLICATION
# =========================
@job_bp.route("/applications/<int:app_id>/approve", methods=["PATCH"])
@jwt_required()
def approve_worker(app_id):
    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != "client":
        return jsonify({"error": "Only clients can approve workers"}), 403

    application = JobApplication.query.get(app_id)
    if not application:
        return jsonify({"error": "Application not found"}), 404

    job = application.job
    if job.client_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if job.status != "pending_client_acceptance":
        return jsonify({"error": "Job is not awaiting worker approval"}), 400

    worker = application.worker
    if not worker:
        return jsonify({"error": "Worker profile linked to this application not found"}), 404

    active_job = Job.query.filter_by(worker_id=worker.id, status="accepted").first()
    if active_job:
        return jsonify({"error": "Worker already has an active job"}), 400

    # Assign worker and mark job accepted
    job.worker_id = worker.id
    job.status = "accepted"
    application.status = "approved"

    # Automatically decline all alternative candidates for this specific job
    JobApplication.query.filter(
        JobApplication.job_id == job.id,
        JobApplication.id != app_id
    ).update({"status": "declined"}, synchronize_session='fetch')

    db.session.commit()

    return jsonify({
        "message": "Worker approved successfully",
        "job_id": job.id,
        "worker_id": worker.id
    }), 200


# =========================
# CLIENT DECLINES APPLICATION
# =========================
@job_bp.route("/applications/<int:app_id>/decline", methods=["PATCH"])
@jwt_required()
def decline_worker(app_id):
    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != "client":
        return jsonify({"error": "Only clients can decline workers"}), 403

    application = JobApplication.query.get(app_id)
    if not application:
        return jsonify({"error": "Application not found"}), 404

    job = application.job
    if job.client_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if job.status != "pending_client_acceptance":
        return jsonify({"error": "Job is not awaiting approval"}), 400

    # Decline this single application
    application.status = "declined"
    db.session.commit()

    # If no other pending applications are left for this job, reset status to open
    still_has_applicants = JobApplication.query.filter_by(job_id=job.id, status="pending").first()
    if not still_has_applicants:
        job.status = "open"
        db.session.commit()

    return jsonify({"message": "Worker application declined successfully"}), 200


# =========================
# WORKER MARK FINISHED
# =========================
@job_bp.route("/jobs/<int:job_id>/mark-finished", methods=["PATCH"])
@jwt_required()
def mark_job_finished(job_id):
    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != "worker":
        return jsonify({"error": "Only workers can mark jobs finished"}), 403

    worker = Worker.query.filter_by(user_id=user.id).first()

    if not worker:
        return jsonify({"error": "Worker profile not found"}), 404

    job = Job.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.worker_id != worker.id:
        return jsonify({"error": "Unauthorized"}), 403

    if job.status != "accepted":
        return jsonify({"error": "Invalid job status"}), 400

    job.status = "pending_confirmation"
    db.session.commit()

    return jsonify({"message": "Job marked as finished"}), 200

# =========================
# CLIENT CONFIRMS COMPLETION
# =========================
@job_bp.route("/jobs/<int:job_id>/confirm", methods=["PATCH"])
@jwt_required()
def confirm_job_completion(job_id):
    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != "client":
        return jsonify({"error": "Only clients can confirm completion"}), 403

    job = Job.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.client_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if job.status != "pending_confirmation":
        return jsonify({"error": "Job is not pending confirmation"}), 400

    worker = Worker.query.get(job.worker_id)

    if not worker:
        return jsonify({"error": "Worker not found"}), 404

    # =====================================
    # MARK JOB COMPLETED
    # =====================================
    job.status = "completed"

    # =====================================
    # JOB COUNTERS
    # =====================================
    worker.total_jobs_completed = (
        worker.total_jobs_completed or 0
    ) + 1

    # =====================================
    # FINANCIAL CALCULATIONS
    # =====================================
    gross_amount = float(job.amount_paid or 0.0)

    platform_fee = round(gross_amount * 0.15, 2)

    worker_payout = round(
        gross_amount - platform_fee,
        2
    )

    # =====================================
    # WORKER LIFETIME TRACKING
    # =====================================
    worker.total_gross_earnings = (
        worker.total_gross_earnings or 0.0
    ) + gross_amount

    worker.total_net_earnings = (
        worker.total_net_earnings or 0.0
    ) + worker_payout

    # =====================================
    # INTERNAL WALLET SYSTEM
    # =====================================

    # Funds available for withdrawal
    worker.available_balance = (
        worker.available_balance or 0.0
    ) + worker_payout

    # Optional future metric
    worker.total_lifetime_earnings = (
        worker.total_lifetime_earnings or 0.0
    ) + worker_payout

    # =====================================
    # PLATFORM REVENUE TRACKING
    # =====================================

    current_platform_revenue = getattr(
        current_app,
        "platform_revenue",
        0.0
    )

    current_app.platform_revenue = (
        current_platform_revenue + platform_fee
    )

    db.session.commit()

    return jsonify({
        "message": "Job completed successfully",

        "financial_summary": {
            "total_client_paid": gross_amount,
            "platform_fee_15_percent": platform_fee,
            "worker_take_home": worker_payout
        },

        "worker_wallet": {
            "available_balance": worker.available_balance,
            "total_lifetime_earnings": worker.total_lifetime_earnings
        }
    }), 200

# =========================
# CREATE STRIPE CHECKOUT
# =========================
@job_bp.route("/jobs/<int:job_id>/pay", methods=["POST"])
@jwt_required()
def pay_job(job_id):
    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]
    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != "client":
        return jsonify({"error": "Only clients can pay"}), 403

    job = Job.query.get(job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.client_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if job.status != "open":
        return jsonify({"error": "Only open jobs can be paid for"}), 400

    if job.payment_status == "paid":
        return jsonify({"error": "Job already paid"}), 400

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
        metadata={"job_id": job.id},
        success_url="http://localhost:3000/success",
        cancel_url="http://localhost:3000/cancel",
    )

    job.stripe_session_id = session.id
    job.payment_status = "pending"
    db.session.commit()

    return jsonify({"checkout_url": session.url}), 200


# =========================
# STRIPE WEBHOOK
# =========================
@job_bp.route("/stripe/webhook", methods=["POST"])
def stripe_webhook():
    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]
    payload = request.data
    sig_header = request.headers.get("Stripe-Signature")
    endpoint_secret = current_app.config["STRIPE_WEBHOOK_SECRET"]

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError:
        return jsonify({"error": "Invalid signature"}), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        raw_job_id = session["metadata"]["job_id"] if "metadata" in session and "job_id" in session["metadata"] else None

        if not raw_job_id:
            print("[-] Webhook Error: Missing job_id in session metadata.")
            return jsonify({"error": "Missing job metadata"}), 400

        try:
            job_id = int(raw_job_id)
        except ValueError:
            print(f"[-] Webhook Error: Job ID '{raw_job_id}' is not a valid integer.")
            return jsonify({"error": "Invalid job ID format"}), 400

        job = Job.query.get(job_id)

        if job:
            if job.stripe_session_id != session.id:
                print(f"[-] Webhook Warning: Session ID mismatch for Job #{job_id}.")
                return jsonify({"error": "Stripe session mismatch"}), 400

            job.payment_status = "paid"
            job.amount_paid = float(session.amount_total / 100)
            db.session.commit()
            print(f"[+] Webhook Success: Job #{job_id} updated to PAID.")
        else:
            print(f"[-] Webhook Error: Job #{job_id} not found in database.")
            return jsonify({"error": "Job not found"}), 404

    return jsonify({"message": "Webhook received"}), 200


# =========================
# WORKER DASHBOARD
# =========================
@job_bp.route("/worker/dashboard", methods=["GET"])
@jwt_required()
def get_worker_dashboard():
    user = User.query.get(get_jwt_identity())

    if not user or user.role != "worker":
        return jsonify({"error": "Unauthorized"}), 403

    worker = Worker.query.filter_by(user_id=user.id).first()

    if not worker:
        return jsonify({"error": "Worker profile not found"}), 404

    jobs = Job.query.filter_by(worker_id=worker.id).all()

    active_jobs = []
    completed_jobs = []

    for job in jobs:
        client = User.query.get(job.client_id)
        review = Review.query.filter_by(job_id=job.id).first()

        review_data = None
        if review:
            review_data = {"rating": review.rating, "comment": review.comment}

        # -------------------------------------------------------------
        # DETERMINE WORKER-CENTRIC PAYOUT STATUS
        # -------------------------------------------------------------
        # If the client hasn't even paid the platform yet, it's unpaid.
        # If the client paid, but the job isn't sealed/completed, it's in escrow.
        # If the job is entirely closed and completed, the funds are settled and paid to worker.
        if getattr(job, 'payment_status', None) != 'paid':
            derived_payment_status = "unpaid"
        elif job.status == "completed":
            derived_payment_status = "paid"
        else:
            derived_payment_status = "escrow"

        job_data = {
            "job_id": job.id,
            "title": job.title,
            "budget": job.budget,
            "status": job.status,
            "client_name": client.full_name if client else "Unknown Client",
            "review": review_data,
            
            # FIXED: Added missing tracking variables requested by the UI components
            "description": getattr(job, 'description', 'No details provided.'),
            "location_text": getattr(job, 'location_text', 'Remote / On-Site'),
            "category": getattr(job, 'category', 'General Support'),
            "payment_status": derived_payment_status
        }

        if job.status == "completed":
            completed_jobs.append(job_data)
        else:
            active_jobs.append(job_data)

    total_gross = sum(j["budget"] for j in completed_jobs)
    total_fees = round(total_gross * 0.15, 2)
    total_net = round(total_gross - total_fees, 2)

    return jsonify({
        "worker_info": {
            "worker_id": worker.id,
            "name": user.full_name,
            "rating": worker.average_rating or 0.0,
            "verification_status": worker.verification_status
        },
        "stats": {
            "jobs_completed": len(completed_jobs),
            "gross_earnings": total_gross,
            "platform_fees": total_fees,
            "net_earnings": total_net
        },
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs
    }), 200


# =========================
# CLIENT DASHBOARD
# =========================
@job_bp.route("/client/dashboard", methods=["GET"])
@jwt_required()
def get_client_dashboard():
    user = User.query.get(get_jwt_identity())

    if not user or user.role != "client":
        return jsonify({"error": "Unauthorized"}), 403

    # Optimization: pre-fetch relationships to prevent database thrashing
    jobs = Job.query.filter_by(client_id=user.id).options(
        joinedload(Job.applications).joinedload(JobApplication.worker).joinedload(Worker.user)
    ).all()

    active_jobs = []
    completed_jobs = []
    total_spent = 0.0

    for job in jobs:
        if job.amount_paid:
            total_spent += float(job.amount_paid)

        worker_data = None
        if job.worker_id:
            worker = Worker.query.get(job.worker_id)
            if worker and worker.user:
                worker_data = {
                    "worker_id": worker.id,
                    "name": worker.user.full_name,
                    "rating": worker.average_rating
                }

        # Build application profiles array for candidate evaluation
        apps_list = []
        for app in job.applications:
            if app.status == "pending" and app.worker and app.worker.user:
                apps_list.append({
                    "application_id": app.id,
                    "worker_id": app.worker.id,
                    "name": app.worker.user.full_name,
                    "rating": app.worker.average_rating,
                    "worker_message": app.worker_message
                })

        review = Review.query.filter_by(job_id=job.id).first()
        review_data = None
        if review:
            review_data = {
                "review_id": review.id,
                "rating": review.rating,
                "comment": review.comment
            }

        job_data = {
            "job_id": job.id,
            "title": job.title,
            "budget": job.budget,
            "status": job.status,
            "payment_status": job.payment_status,
            "amount_paid": job.amount_paid,
            "worker": worker_data,
            "incoming_applications": apps_list,  # Front-end feeds candidate cards directly from here
            "awaiting_worker_approval": job.status == "pending_client_acceptance",
            "review": review_data
        }

        if job.status == "completed":
            completed_jobs.append(job_data)
        else:
            active_jobs.append(job_data)

    return jsonify({
        "client_info": {
            "name": user.full_name,
            "email": user.email
        },
        "metrics": {
            "total_spent": round(total_spent, 2),
            "total_jobs": len(jobs),
            "completed_jobs": len(completed_jobs),
            "active_jobs": len(active_jobs)
        },
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs
    }), 200


# =========================
# PUBLIC WORKER PROFILE
# =========================
@job_bp.route("/workers/<int:worker_id>/public", methods=["GET"])
def get_public_worker_profile(worker_id):
    worker = Worker.query.get(worker_id)

    if not worker:
        return jsonify({"error": "Worker not found"}), 404

    reviews = Review.query.filter_by(worker_id=worker.id).all()

    return jsonify({
        "name": worker.user.full_name if worker.user else "Unknown Worker",
        "bio": worker.bio,
        "skills": worker.skills.split(",") if worker.skills else [],
        "location": worker.location_text,
        "rating": worker.average_rating,
        "completed_jobs": worker.total_jobs_completed,
        "reviews": [
            {
                "rating": r.rating,
                "comment": r.comment,
                "client": r.client_id
            }
            for r in reviews
        ]
    }), 200

# =========================
# WORKER REQUEST PAYOUT
# =========================
@job_bp.route("/worker/request-payout", methods=["POST"])
@jwt_required()
def request_payout():

    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if user.role != "worker":
        return jsonify({
            "error": "Only workers can request payouts"
        }), 403

    worker = Worker.query.filter_by(
        user_id=user.id
    ).first()

    if not worker:
        return jsonify({
            "error": "Worker profile not found"
        }), 404

    data = request.get_json() or {}

    amount = data.get("amount")

    if not amount:
        return jsonify({
            "error": "Amount is required"
        }), 400

    try:
        amount = float(amount)
    except:
        return jsonify({
            "error": "Invalid payout amount"
        }), 400

    if amount <= 0:
        return jsonify({
            "error": "Amount must be greater than 0"
        }), 400

    available_balance = worker.available_balance or 0.0

    if amount > available_balance:
        return jsonify({
            "error": "Insufficient balance"
        }), 400

    if not worker.stripe_account_id:
        return jsonify({
            "error": "Stripe payout account not connected"
        }), 400

    payout_request = PayoutRequest(
        worker_id=worker.id,
        amount=amount,
        stripe_account_id=worker.stripe_account_id,
        status="pending"
    )

    # Hold funds immediately
    worker.available_balance -= amount

    worker.pending_balance = (
        worker.pending_balance or 0.0
    ) + amount

    db.session.add(payout_request)

    db.session.commit()

    return jsonify({
        "message": "Payout request submitted",
        "request_id": payout_request.id,
        "amount": amount
    }), 201


# =========================
# ADMIN GET ALL PAYOUT REQUESTS
# =========================
@job_bp.route("/admin/payout-requests", methods=["GET"])
@jwt_required()
def get_all_payout_requests():

    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    # Change this logic later if you build proper admin roles
    if user.role != "admin":
        return jsonify({
            "error": "Unauthorized"
        }), 403

    payout_requests = PayoutRequest.query.order_by(
        PayoutRequest.created_at.desc()
    ).all()

    results = []

    for payout in payout_requests:

        worker = Worker.query.get(
            payout.worker_id
        )

        worker_name = "Unknown Worker"

        if worker and worker.user:
            worker_name = worker.user.full_name

        results.append({
            "id": payout.id,
            "worker_id": payout.worker_id,
            "worker_name": worker_name,
            "amount": payout.amount,
            "status": payout.status,
            "payout_method": payout.payout_method,
            "stripe_account_id": payout.stripe_account_id,
            "stripe_transfer_id": payout.stripe_transfer_id,
            "admin_notes": payout.admin_notes,
            "created_at": (
                payout.created_at.isoformat()
                if payout.created_at
                else None
            ),
            "processed_at": (
                payout.processed_at.isoformat()
                if payout.processed_at
                else None
            )
        })

    return jsonify(results), 200

# =========================
# ADMIN APPROVE PAYOUT
# =========================
@job_bp.route("/admin/payout-requests/<int:request_id>/approve", methods=["PATCH"])
@jwt_required()
def approve_payout_request(request_id):

    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if user.role != "admin":
        return jsonify({
            "error": "Unauthorized"
        }), 403

    payout_request = PayoutRequest.query.get(
        request_id
    )

    if not payout_request:
        return jsonify({
            "error": "Payout request not found"
        }), 404

    if payout_request.status != "pending":
        return jsonify({
            "error": "Payout already processed"
        }), 400

    worker = Worker.query.get(
        payout_request.worker_id
    )

    if not worker:
        return jsonify({
            "error": "Worker not found"
        }), 404

    # =========================================
    # FUTURE STRIPE PAYOUT LOGIC GOES HERE
    # =========================================
    #
    # Example:
    #
    # transfer = stripe.Transfer.create(
    #     amount=int(payout_request.amount * 100),
    #     currency="gbp",
    #     destination=worker.stripe_account_id
    # )
    #
    # payout_request.stripe_transfer_id = transfer.id
    #
    # =========================================

    payout_request.status = "completed"

    payout_request.processed_at = datetime.utcnow()

    worker.pending_balance -= payout_request.amount

    db.session.commit()

    return jsonify({
        "message": "Payout approved successfully",
        "request_id": payout_request.id,
        "amount": payout_request.amount,
        "status": payout_request.status
    }), 200