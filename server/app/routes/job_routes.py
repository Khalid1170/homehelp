
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


## =========================
# GET OPEN PAID JOBS
# =========================
@job_bp.route("/jobs/open", methods=["GET"])
def get_open_jobs():
    jobs = (
        # Use .filter() instead of .filter_by() for complex inequality logic
        Job.query.filter(
            Job.status != "accepted",   # 🚀 Filters out jobs that have been accepted by a worker
            Job.status != "assigned",   # Keeps historically assigned jobs hidden
            Job.status != "completed",  # Keeps historically completed jobs hidden
            Job.payment_status == "paid"
        )
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

    job = application.associated_job
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

    user = db.session.get(User, get_jwt_identity())

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role != "client":
        return jsonify({"error": "Only clients can confirm completion"}), 403

    job = db.session.get(Job, job_id)

    if not job:
        return jsonify({"error": "Job not found"}), 404

    if job.client_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    if job.status != "pending_confirmation":
        return jsonify({"error": "Job is not pending confirmation"}), 400

    worker = db.session.get(Worker, job.worker_id)

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

    # Fallback to budget if amount_paid is empty
    gross_amount = float(
        job.amount_paid if job.amount_paid is not None else job.budget or 0.0
    )

    platform_fee = round(gross_amount * 0.15, 2)

    worker_payout = round(
        gross_amount - platform_fee,
        2
    )

    # =====================================
    # DEBUG LOGS
    # =====================================
    print("JOB AMOUNT PAID:", job.amount_paid)
    print("JOB BUDGET:", job.budget)
    print("GROSS AMOUNT:", gross_amount)
    print("PLATFORM FEE:", platform_fee)
    print("WORKER PAYOUT:", worker_payout)

    print("AVAILABLE BEFORE UPDATE:", worker.available_balance)
    print("PENDING BEFORE UPDATE:", worker.pending_balance)

    # =====================================
    # WORKER LIFETIME TRACKING
    # =====================================
    worker.total_gross_earnings = round(
        (worker.total_gross_earnings or 0.0) + gross_amount,
        2
    )

    worker.total_net_earnings = round(
        (worker.total_net_earnings or 0.0) + worker_payout,
        2
    )

    # =====================================
    # INTERNAL WALLET SYSTEM
    # =====================================

    # Add payout to available balance
    worker.available_balance = round(
        (worker.available_balance or 0.0) + worker_payout,
        2
    )

    # Reduce pending balance safely
    current_pending = worker.pending_balance or 0.0

    if current_pending >= worker_payout:
        worker.pending_balance = round(
            current_pending - worker_payout,
            2
        )
    else:
        worker.pending_balance = 0.0

    # =====================================
    # OPTIONAL LIFETIME METRIC
    # =====================================
    worker.total_lifetime_earnings = round(
        (worker.total_lifetime_earnings or 0.0) + worker_payout,
        2
    )

    # =====================================
    # PLATFORM REVENUE TRACKING
    # =====================================
    current_platform_revenue = getattr(
        current_app,
        "platform_revenue",
        0.0
    )

    current_app.platform_revenue = round(
        current_platform_revenue + platform_fee,
        2
    )

    print("AVAILABLE AFTER UPDATE:", worker.available_balance)
    print("PENDING AFTER UPDATE:", worker.pending_balance)

    # =====================================
    # SAVE CHANGES
    # =====================================
    try:
        db.session.commit()

        print("AVAILABLE AFTER COMMIT:", worker.available_balance)
        print("PENDING AFTER COMMIT:", worker.pending_balance)

    except Exception as e:
        db.session.rollback()

        print("COMMIT ERROR:", str(e))

        return jsonify({
            "error": "Financial ledger update failed to persist to database."
        }), 500

    return jsonify({
        "message": "Job completed successfully",

        "financial_summary": {
            "total_client_paid": gross_amount,
            "platform_fee_15_percent": platform_fee,
            "worker_take_home": worker_payout
        },

        "worker_wallet": {
            "available_balance": worker.available_balance,
            "pending_balance": worker.pending_balance,
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
# =========================================
# WORKER DASHBOARD
# =========================================
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
        # DETERMINE DATABASE-DRIVEN PAYOUT STATUS FOR FRONTEND
        # -------------------------------------------------------------
        payout_req = PayoutRequest.query.filter_by(job_id=job.id).order_by(PayoutRequest.id.desc()).first()
        
        if payout_req:
            if payout_req.status in ["pending", "pending_admin"]:
                payout_status = "pending"
            elif payout_req.status == "rejected":
                payout_status = "rejected"
            elif payout_req.status == "completed":
                payout_status = "completed"
            else:
                payout_status = "idle"
        else:
            payout_status = "idle"

        if getattr(job, 'payment_status', None) != 'paid':
            derived_payment_status = "unpaid"
        elif job.status == "completed" and payout_status == "completed":
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
            
            "description": getattr(job, 'description', 'No details provided.'),
            "location_text": getattr(job, 'location_text', 'Remote / On-Site'),
            "category": getattr(job, 'category', 'General Support'),
            "payment_status": derived_payment_status,
            "payout_status": payout_status
        }

        if job.status == "completed":
            completed_jobs.append(job_data)
        else:
            active_jobs.append(job_data)

    # -------------------------------------------------------------
    # CALCULATE METRICS & AGGREGATE PAYOUT STATS
    # -------------------------------------------------------------
    total_gross = sum(j["budget"] for j in completed_jobs)
    total_fees = round(total_gross * 0.15, 2)
    total_net = round(total_gross - total_fees, 2)

    # Gather all job IDs assigned to this worker to count their specific payout logs
    worker_job_ids = [j.id for j in jobs]
    
    if worker_job_ids:
        payout_requests_pending = PayoutRequest.query.filter(
            PayoutRequest.job_id.in_(worker_job_ids),
            PayoutRequest.status.in_(["pending", "pending_admin"])
        ).count()

        payouts_completed = PayoutRequest.query.filter(
            PayoutRequest.job_id.in_(worker_job_ids),
            PayoutRequest.status == "completed"
        ).count()
    else:
        payout_requests_pending = 0
        payouts_completed = 0

    return jsonify({
        "worker_info": {
            "worker_id": worker.id,
            "name": user.full_name,
            "stripe_account_id": worker.stripe_account_id,
            "rating": worker.average_rating or 0.0,
            "verification_status": worker.verification_status
        },
        "stats": {
            "jobs_completed": len(completed_jobs),
            "gross_earnings": total_gross,
            "platform_fees": total_fees,
            "net_earnings": total_net,
            
            # 🚀 FIXED: Keys added to directly power your React 6-column stats component
            "payout_requests_pending": payout_requests_pending,
            "payouts_completed": payouts_completed
        },
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs
    }), 200


# # =========================
# # CLIENT DASHBOARD
# # =========================
# @job_bp.route("/client/dashboard", methods=["GET"])
# @jwt_required()
# def get_client_dashboard():
#     user = User.query.get(get_jwt_identity())

#     if not user or user.role != "client":
#         return jsonify({"error": "Unauthorized"}), 403

#     # Optimization: pre-fetch relationships to prevent database thrashing
#     jobs = Job.query.filter_by(client_id=user.id).options(
#         joinedload(Job.applications).joinedload(JobApplication.worker).joinedload(Worker.user)
#     ).all()

#     active_jobs = []
#     completed_jobs = []
#     total_spent = 0.0

#     for job in jobs:
#         if job.amount_paid:
#             total_spent += float(job.amount_paid)

#         worker_data = None
#         if job.worker_id:
#             worker = Worker.query.get(job.worker_id)
#             if worker and worker.user:
#                 worker_data = {
#                     "worker_id": worker.id,
#                     "name": worker.user.full_name,
#                     "rating": worker.average_rating
#                 }

#         # Build application profiles array for candidate evaluation
#         apps_list = []
#         for app in job.applications:
#             if app.status == "pending" and app.worker and app.worker.user:
#                 apps_list.append({
#                     "application_id": app.id,
#                     "worker_id": app.worker.id,
#                     "name": app.worker.user.full_name,
#                     "rating": app.worker.average_rating,
#                     "worker_message": app.worker_message
#                 })

#         review = Review.query.filter_by(job_id=job.id).first()
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
#             "incoming_applications": apps_list,  # Front-end feeds candidate cards directly from here
#             "awaiting_worker_approval": job.status == "pending_client_acceptance",
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
#             "total_spent": round(total_spent, 2),
#             "total_jobs": len(jobs),
#             "completed_jobs": len(completed_jobs),
#             "active_jobs": len(active_jobs)
#         },
#         "active_jobs": active_jobs,
#         "completed_jobs": completed_jobs
#     }), 200


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
# CONNECT STRIPE ACCOUNT
# =========================
@job_bp.route("/worker/connect-stripe", methods=["POST"])
@jwt_required()
def connect_stripe():

    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

    user = User.query.get(get_jwt_identity())

    if not user or user.role != "worker":
        return jsonify({"error": "Unauthorized"}), 403

    worker = Worker.query.filter_by(user_id=user.id).first()

    if not worker:
        return jsonify({"error": "Worker profile not found"}), 404

    # Create account if worker does not yet have one
    if not worker.stripe_account_id:

        account = stripe.Account.create(
            type="express",
            country="GB",
            email=user.email,
            capabilities={
                "transfers": {"requested": True}
            }
        )

        worker.stripe_account_id = account.id
        db.session.commit()

    # Generate onboarding link
    account_link = stripe.AccountLink.create(
        account=worker.stripe_account_id,
        refresh_url="http://localhost:5173/worker/dashboard",
        return_url="http://localhost:5173/stripe-callback",
        type="account_onboarding"
    )

    return jsonify({
        "onboarding_url": account_link.url
    }), 200


# =========================
# GET STRIPE STATUS
# =========================
@job_bp.route("/worker/stripe-status", methods=["GET"])
@jwt_required()
def stripe_status():

    stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

    user = User.query.get(get_jwt_identity())

    if not user or user.role != "worker":
        return jsonify({"error": "Unauthorized"}), 403

    worker = Worker.query.filter_by(user_id=user.id).first()

    if not worker:
        return jsonify({"error": "Worker profile not found"}), 404

    if not worker.stripe_account_id:
        return jsonify({
            "connected": False,
            "charges_enabled": False,
            "payouts_enabled": False
        }), 200

    account = stripe.Account.retrieve(worker.stripe_account_id)

    return jsonify({
        "connected": True,
        "charges_enabled": account.charges_enabled,
        "payouts_enabled": account.payouts_enabled
    }), 200


# # =========================
# # WORKER REQUEST PAYOUT
# # =========================
# @job_bp.route("/worker/request-payout", methods=["POST"])
# @jwt_required()
# def request_payout():

#     user = User.query.get(get_jwt_identity())

#     if not user:
#         return jsonify({
#             "error": "User not found"
#         }), 404

#     if user.role != "worker":
#         return jsonify({
#             "error": "Only workers can request payouts"
#         }), 403

#     worker = Worker.query.filter_by(
#         user_id=user.id
#     ).first()

#     if not worker:
#         return jsonify({
#             "error": "Worker profile not found"
#         }), 404

#     data = request.get_json() or {}

#     amount = data.get("amount")

#     if not amount:
#         return jsonify({
#             "error": "Amount is required"
#         }), 400

#     try:
#         amount = float(amount)
#     except:
#         return jsonify({
#             "error": "Invalid payout amount"
#         }), 400

#     if amount <= 0:
#         return jsonify({
#             "error": "Amount must be greater than 0"
#         }), 400

#     available_balance = worker.available_balance or 0.0

#     if amount > available_balance:
#         return jsonify({
#             "error": "Insufficient balance"
#         }), 400

#     if not worker.stripe_account_id:
#         return jsonify({
#             "error": "Stripe payout account not connected"
#         }), 400

#     payout_request = PayoutRequest(
#         worker_id=worker.id,
#         amount=amount,
#         stripe_account_id=worker.stripe_account_id,
#         status="pending"
#     )

#     # Hold funds immediately
#     worker.available_balance -= amount

#     worker.pending_balance = (
#         worker.pending_balance or 0.0
#     ) + amount

#     db.session.add(payout_request)

#     db.session.commit()

#     return jsonify({
#         "message": "Payout request submitted",
#         "request_id": payout_request.id,
#         "amount": amount
#     }), 201


# # =========================
# # ADMIN GET ALL PAYOUT REQUESTS
# # =========================
# @job_bp.route("/admin/payout-requests", methods=["GET"])
# @jwt_required()
# def get_all_payout_requests():

#     user = User.query.get(get_jwt_identity())

#     if not user:
#         return jsonify({
#             "error": "User not found"
#         }), 404

#     # Change this logic later if you build proper admin roles
#     if user.role != "admin":
#         return jsonify({
#             "error": "Unauthorized"
#         }), 403

#     payout_requests = PayoutRequest.query.order_by(
#         PayoutRequest.created_at.desc()
#     ).all()

#     results = []

#     for payout in payout_requests:

#         worker = Worker.query.get(
#             payout.worker_id
#         )

#         worker_name = "Unknown Worker"

#         if worker and worker.user:
#             worker_name = worker.user.full_name

#         results.append({
#             "id": payout.id,
#             "worker_id": payout.worker_id,
#             "worker_name": worker_name,
#             "amount": payout.amount,
#             "status": payout.status,
#             "payout_method": payout.payout_method,
#             "stripe_account_id": payout.stripe_account_id,
#             "stripe_transfer_id": payout.stripe_transfer_id,
#             "admin_notes": payout.admin_notes,
#             "created_at": (
#                 payout.created_at.isoformat()
#                 if payout.created_at
#                 else None
#             ),
#             "processed_at": (
#                 payout.processed_at.isoformat()
#                 if payout.processed_at
#                 else None
#             )
#         })

#     return jsonify(results), 200

# # =========================
# # REQUEST PAYOUT
# # =========================
# @job_bp.route("/worker/request-payout", methods=["POST"])
# @jwt_required()
# def request_payout():
#     # Modernized SQLAlchemy query execution pattern
#     user = db.session.get(User, get_jwt_identity())

#     if not user or user.role != "worker":
#         return jsonify({"error": "Unauthorized"}), 403

#     worker = Worker.query.filter_by(user_id=user.id).first()

#     if not worker:
#         return jsonify({"error": "Worker profile not found"}), 404

#     # Worker must connect Stripe first
#     if not worker.stripe_account_id:
#         return jsonify({
#             "error": "You must connect a Stripe account before requesting payouts"
#         }), 400

#     stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

#     try:
#         account = stripe.Account.retrieve(worker.stripe_account_id)
#         if not account.payouts_enabled:
#             return jsonify({
#                 "error": "Stripe onboarding is incomplete or payouts are restricted for this account"
#             }), 400
#     except stripe.error.StripeError as e:
#         return jsonify({"error": f"Stripe communication failed: {str(e)}"}), 500

#     data = request.get_json() or {}
#     amount = data.get("amount")

#     if amount is None:
#         return jsonify({"error": "Amount required"}), 400

#     try:
#         amount = float(amount)
#     except (ValueError, TypeError):
#         return jsonify({"error": "Invalid amount payload structure"}), 400

#     if amount <= 0:
#         return jsonify({"error": "Amount must be greater than zero"}), 400

#     # Sanitizing NoneType values from the DB columns into valid floats
#     current_available = worker.available_balance if worker.available_balance is not None else 0.0
#     current_pending = worker.pending_balance if worker.pending_balance is not None else 0.0

#     if amount > current_available:
#         return jsonify({"error": "Insufficient available balance"}), 400

#     # Execute math mutations safely using local sanitized values
#     worker.available_balance = current_available - amount
#     worker.pending_balance = current_pending + amount

#     payout_request = PayoutRequest(
#         worker_id=worker.id,
#         amount=amount,
#         status="pending",
#         payout_method="stripe"
#     )

#     try:
#         db.session.add(payout_request)
#         db.session.commit()
#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Database error persisting payout state transaction"}), 500

#     return jsonify({
#         "message": "Payout request submitted successfully",
#         "available_balance": worker.available_balance,
#         "pending_balance": worker.pending_balance
#     }), 201


# # =========================
# # REQUEST PAYOUT (ADMIN QUEUE SYSTEM)
# # =========================
# @job_bp.route("/worker/request-payout", methods=["POST"])
# @jwt_required()
# def request_payout():

#     user = db.session.get(User, get_jwt_identity())

#     if not user or user.role != "worker":
#         return jsonify({"error": "Unauthorized"}), 403

#     worker = Worker.query.filter_by(user_id=user.id).first()

#     if not worker:
#         return jsonify({"error": "Worker profile not found"}), 404

#     # Stripe still required (you want this)
#     if not worker.stripe_account_id:
#         return jsonify({
#             "error": "You must connect a Stripe account before requesting payouts"
#         }), 400

#     stripe.api_key = current_app.config["STRIPE_SECRET_KEY"]

#     try:
#         account = stripe.Account.retrieve(worker.stripe_account_id)

#         if not account.payouts_enabled:
#             return jsonify({
#                 "error": "Stripe onboarding incomplete or payouts disabled"
#             }), 400

#     except stripe.error.StripeError as e:
#         return jsonify({"error": f"Stripe communication failed: {str(e)}"}), 500

#     data = request.get_json() or {}

#     amount = data.get("amount")
#     job_id = data.get("job_id")

#     if amount is None:
#         return jsonify({"error": "Amount required"}), 400

#     try:
#         amount = float(amount)
#     except (ValueError, TypeError):
#         return jsonify({"error": "Invalid amount"}), 400

#     if amount <= 0:
#         return jsonify({"error": "Amount must be greater than zero"}), 400

#     # ❌ REMOVED:
#     # - available_balance check
#     # - pending_balance mutation
#     # - wallet logic completely removed

#     payout_request = PayoutRequest(
#         worker_id=worker.id,
#         job_id=job_id,
#         amount=amount,
#         status="pending_admin",   # NEW FLOW
#         payout_method="stripe"
#     )

#     try:
#         db.session.add(payout_request)
#         db.session.commit()

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Failed to create payout request"}), 500

#     return jsonify({
#         "message": "Payout request sent to admin",
#         "status": "pending_admin"
#     }), 201


# @job_bp.route("/worker/request-payout", methods=["POST"])
# @jwt_required()
# def request_payout():

#     user = db.session.get(User, get_jwt_identity())

#     if not user or user.role != "worker":
#         return jsonify({"error": "Unauthorized"}), 403

#     worker = Worker.query.filter_by(user_id=user.id).first()

#     data = request.get_json() or {}

#     amount = float(data.get("amount", 0))
#     job_id = data.get("job_id")

#     if amount <= 0:
#         return jsonify({"error": "Invalid amount"}), 400

#     payout_request = PayoutRequest(
#         worker_id=worker.id,
#         job_id=job_id,
#         amount=amount,
#         status="pending_admin"
#     )

#     db.session.add(payout_request)
#     db.session.commit()

#     return jsonify({
#         "message": "Payout request sent to admin",
#         "status": "pending_admin"
#     }), 201

@job_bp.route("/worker/request-payout", methods=["POST"])
@jwt_required()
def request_payout():

    user = db.session.get(User, get_jwt_identity())

    if not user or user.role != "worker":
        return jsonify({"error": "Unauthorized"}), 403

    worker = Worker.query.filter_by(user_id=user.id).first()

    data = request.get_json() or {}

    amount = float(data.get("amount", 0))
    job_id = data.get("job_id")

    if amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400

    # =========================
    # PREVENT DUPLICATE REQUESTS
    # =========================
    existing_request = PayoutRequest.query.filter_by(
        worker_id=worker.id,
        job_id=job_id,
        status="pending_admin"
    ).first()

    if existing_request:
        return jsonify({
            "error": "Payout already requested for this job",
            "status": "already_requested"
        }), 409

    payout_request = PayoutRequest(
        worker_id=worker.id,
        job_id=job_id,
        amount=amount,
        status="pending_admin"
    )

    db.session.add(payout_request)
    db.session.commit()

    return jsonify({
        "message": "Payout request sent to admin",
        "status": "pending_admin"
    }), 201

# =========================================================
# ADMIN CONTROLLERS: APPROVE OR REJECT REQUESTS (BATCH & SINGLE)
# =========================================================
@job_bp.route("/admin/process-payouts", methods=["PATCH"])
@jwt_required()
def admin_process_payouts():
    user = db.session.get(User, get_jwt_identity())
    
    # Simple Admin role protection check
    if not user or user.role != "admin":
        return jsonify({"error": "Access denied. Administrative privileges required."}), 403

    data = request.get_json() or {}
    payout_ids = data.get("payout_ids", [])  # Expects a list of numbers: [1, 2, 3]
    action = data.get("action")  # Expects either: "approve", "reject", or "fail"

    if not payout_ids or action not in ["approve", "reject", "fail"]:
        return jsonify({"error": "Invalid payload format or action parameter missing."}), 400

    processed_logs = []

    # Iterate through the list of requests to support full batch actions
    for payout_id in payout_ids:
        payout = db.session.get(PayoutRequest, payout_id)
        if not payout or payout.status != "pending":
            continue  # Skip rows that don't exist or are already completed

        worker = db.session.get(Worker, payout.worker_id)
        if not worker:
            continue

        current_pending = round(worker.pending_balance or 0.0, 2)
        current_available = round(worker.available_balance or 0.0, 2)

        if action == "approve":
            # Admin says they will manually send the wire: clear it from their pending escrow profile
            payout.status = "approved"
            if current_pending >= payout.amount:
                worker.pending_balance = round(current_pending - payout.amount, 2)
            else:
                worker.pending_balance = 0.0

        elif action in ["reject", "fail"]:
            # Rollback event: return money securely back to available balance pool
            payout.status = action
            if current_pending >= payout.amount:
                worker.pending_balance = round(current_pending - payout.amount, 2)
            
            worker.available_balance = round(current_available + payout.amount, 2)

        processed_logs.append({"payout_id": payout_id, "status": payout.status})

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Database error processing bulk execution logs."}), 500

    return jsonify({
        "message": f"Successfully batch processed {len(processed_logs)} requests.",
        "results": processed_logs
    }), 200


# ==========================================
# FETCH ALL SYSTEMIC PAYOUT REQUESTS (GET)
# ==========================================
# @job_bp.route("/admin/payout-requests", methods=["GET", "OPTIONS"])
# @jwt_required(optional=True)  # Lets tokenless browser preflight checks pass smoothly
# def get_all_payout_requests():
#     # 1. Handle browser preflight checks immediately
#     if request.method == "OPTIONS":
#         return "", 200

#     # 2. Enforce JWT manually for the actual GET request
#     jwt_identity = get_jwt_identity()
#     if not jwt_identity:
#         return jsonify({"error": "Missing Authorization Header"}), 401

#     # 3. Verify user identity and admin role clearance
#     user = User.query.get(jwt_identity)
#     if not user or user.role != "admin":
#         return jsonify({"error": "Unauthorized. Administrator clearance mandatory."}), 403

#     # 4. Query the ledger database and join tables to get worker profiles
#     # This matches the frontend keys: worker_name, worker_id, amount, payout_method, stripe_account_id, created_at
#     payout_logs = db.session.query(
#         PayoutRequest, 
#         User.name.label("worker_name"),
#         Worker.stripe_account_id.label("stripe_account_id")
#     ).join(
#         Worker, PayoutRequest.worker_id == Worker.id
#     ).join(
#         User, Worker.user_id == User.id
#     ).order_by(PayoutRequest.created_at.desc()).all()

#     # 5. Serialize data stream into JSON structure matching React state map
#     ledger_payload = []
#     for req, worker_name, stripe_id in payout_logs:
#         ledger_payload.append({
#             "id": req.id,
#             "worker_id": req.worker_id,
#             "worker_name": worker_name,
#             "amount": float(req.amount),
#             "payout_method": req.payout_method or "Stripe Connect",
#             "stripe_account_id": stripe_id or "",
#             "status": req.status,
#             "created_at": req.created_at.isoformat() if req.created_at else None,
#             "processed_at": req.processed_at.isoformat() if req.processed_at else None
#         })

#     return jsonify(ledger_payload), 200

# @job_bp.route("/admin/payout-requests", methods=["GET", "OPTIONS"])
# @jwt_required(optional=True)
# def get_payout_requests():
#     if request.method == "OPTIONS":
#         return "", 200

#     jwt_identity = get_jwt_identity()
#     if not jwt_identity:
#         return jsonify({"error": "Missing Authorization Header"}), 401

#     user = User.query.get(jwt_identity)
#     if not user or user.role != "admin":
#         return jsonify({"error": "Access denied. Administrator clearance mandatory."}), 403

#     try:
#         # Fetch every payout request entry
#         all_requests = PayoutRequest.query.order_by(PayoutRequest.created_at.desc()).all()
#         payload = []

#         for req in all_requests:
#             # 1. Fetch matching worker info safely
#             worker = Worker.query.get(req.worker_id)
            
#             # 2. Extract corresponding user profile metrics
#             # If your app connects PayoutRequest directly to User, adjust this lookup!
#             worker_user = User.query.get(worker.user_id) if worker else None
            
#             # Fallback if name strings or models are detached
#             # 👉 Change 'worker_user.name' below if your column is called 'username' or 'first_name'
#             worker_name = worker_user.name if worker_user else f"Worker #{req.worker_id}"
#             stripe_id = worker.stripe_account_id if worker else ""

#             payload.append({
#                 "id": req.id,
#                 "worker_id": req.worker_id,
#                 "worker_name": worker_name,
#                 "payout_method": getattr(req, 'payout_method', 'Stripe Connect') or 'Stripe Connect',
#                 "stripe_account_id": stripe_id or getattr(req, 'stripe_account_id', ''),
#                 "amount": float(req.amount),
#                 "status": req.status,
#                 "created_at": req.created_at.isoformat() if req.created_at else None,
#                 "processed_at": req.processed_at.isoformat() if req.processed_at else None
#             })

#         return jsonify(payload), 200

#     except Exception as e:
#         # This will print the exact reason for any remaining 500 error directly to your backend terminal logs
#         print(f"--- DETAILED LEDGER CRASH LOG: {str(e)} ---")
#         return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# # =========================
# # ADMIN APPROVE PAYOUT
# # =========================
# @job_bp.route("/admin/payout-requests/<int:request_id>/approve", methods=["PATCH"])
# @jwt_required()
# def approve_payout_request(request_id):

#     user = User.query.get(get_jwt_identity())

#     if not user:
#         return jsonify({
#             "error": "User not found"
#         }), 404

#     if user.role != "admin":
#         return jsonify({
#             "error": "Unauthorized"
#         }), 403

#     payout_request = PayoutRequest.query.get(
#         request_id
#     )

#     if not payout_request:
#         return jsonify({
#             "error": "Payout request not found"
#         }), 404

#     if payout_request.status != "pending":
#         return jsonify({
#             "error": "Payout already processed"
#         }), 400

#     worker = Worker.query.get(
#         payout_request.worker_id
#     )

#     if not worker:
#         return jsonify({
#             "error": "Worker not found"
#         }), 404

#     # =========================================
#     # FUTURE STRIPE PAYOUT LOGIC GOES HERE
#     # =========================================
#     #
#     # Example:
#     #
#     # transfer = stripe.Transfer.create(
#     #     amount=int(payout_request.amount * 100),
#     #     currency="gbp",
#     #     destination=worker.stripe_account_id
#     # )
#     #
#     # payout_request.stripe_transfer_id = transfer.id
#     #
#     # =========================================

#     payout_request.status = "completed"

#     payout_request.processed_at = datetime.utcnow()

#     worker.pending_balance -= payout_request.amount

#     db.session.commit()

#     return jsonify({
#         "message": "Payout approved successfully",
#         "request_id": payout_request.id,
#         "amount": payout_request.amount,
#         "status": payout_request.status
#     }), 200


# # ==========================================
# # 1. FETCH ALL PAYOUT REQUESTS (GET)
# # ==========================================
# @job_bp.route("/admin/payout-requests", methods=["GET", "OPTIONS"])
# @jwt_required(optional=True)
# def get_payout_requests():
#     if request.method == "OPTIONS":
#         return "", 200

#     jwt_identity = get_jwt_identity()
#     if not jwt_identity:
#         return jsonify({"error": "Missing Authorization Header"}), 401

#     user = User.query.get(jwt_identity)
#     if not user or user.role != "admin":
#         return jsonify({"error": "Access denied. Administrator clearance mandatory."}), 403

#     try:
#         # Join PayoutRequest -> Worker -> User using your defined explicit foreign keys
#         payout_data = db.session.query(
#             PayoutRequest,
#             User.name.label("worker_name"),
#             Worker.stripe_account_id.label("stripe_account_id")
#         ).join(
#             Worker, PayoutRequest.worker_id == Worker.id
#         ).join(
#             User, Worker.user_id == User.id
#         ).order_by(PayoutRequest.created_at.desc()).all()

#         payload = []
#         for req, worker_name, stripe_account_id in payout_data:
#             # Map your DB statuses to the frontend keys ("pending" vs "completed")
#             # DB states: "pending_admin" -> "approved" -> "paid"
#             frontend_status = "pending" if req.status == "pending_admin" else "completed"

#             payload.append({
#                 "id": req.id,
#                 "worker_id": req.worker_id,
#                 "worker_name": worker_name,
#                 "payout_method": req.payout_method or "Stripe Connect",
#                 "stripe_account_id": stripe_account_id or "",
#                 "amount": float(req.amount),
#                 "status": frontend_status, 
#                 "created_at": req.created_at.isoformat() if req.created_at else None,
#                 # Fallback value if no explicit tracking column exists in schema
#                 "processed_at": None 
#             })

#         return jsonify(payload), 200

#     except Exception as e:
#         print(f"--- DB ERROR: {str(e)} ---")
#         return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# @job_bp.route("/admin/payout-requests", methods=["GET", "OPTIONS"])
# @jwt_required(optional=True)
# def get_payout_requests():
#     if request.method == "OPTIONS":
#         return "", 200

#     jwt_identity = get_jwt_identity()
#     if not jwt_identity:
#         return jsonify({"error": "Missing Authorization Header"}), 401

#     user = User.query.get(jwt_identity)
#     if not user or user.role != "admin":
#         return jsonify({"error": "Access denied. Administrator clearance mandatory."}), 403

#     try:
#         # Step 1: Safely pull all request rows independently
#         all_requests = PayoutRequest.query.order_by(PayoutRequest.created_at.desc()).all()
#         payload = []

#         # Step 2: Manually loop and resolve properties to pinpoint errors cleanly
#         for req in all_requests:
#             worker = Worker.query.get(req.worker_id)
            
#             # Extract corresponding user credentials safely if profile exists
#             worker_user = User.query.get(worker.user_id) if worker else None
            
#             # --- FAIL-SAFE PROPERTY RESOLUTION ---
#             # Automatically scans your User model to find an available text identifier
#             if worker_user:
#                 if hasattr(worker_user, 'name'):
#                     worker_name = worker_user.name
#                 elif hasattr(worker_user, 'username'):
#                     worker_name = worker_user.username
#                 elif hasattr(worker_user, 'email'):
#                     worker_name = worker_user.email
#                 else:
#                     worker_name = f"User #{worker_user.id}"
#             else:
#                 worker_name = f"Worker #{req.worker_id}"

#             stripe_id = worker.stripe_account_id if worker else ""
            
#             # Map database state string keys ("pending_admin") to frontend matrix expectations
#             frontend_status = "pending" if req.status == "pending_admin" else "completed"

#             payload.append({
#                 "id": req.id,
#                 "worker_id": req.worker_id,
#                 "worker_name": worker_name,
#                 "payout_method": getattr(req, 'payout_method', 'Stripe Connect') or 'Stripe Connect',
#                 "stripe_account_id": stripe_id,
#                 "amount": float(req.amount) if req.amount else 0.0,
#                 "status": frontend_status,
#                 "created_at": req.created_at.isoformat() if req.created_at else None,
#                 "processed_at": None
#             })

#         return jsonify(payload), 200

#     except Exception as e:
#         # 💡 This will print the exact line code error inside your Flask server terminal
#         print("\n" + "="*60)
#         print(f"🚨 CRITICAL PAYOUT LEDGER EXCEPTION: {str(e)}")
#         print("="*60 + "\n")
#         return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


# # ==========================================
# # 2. ADMIN APPROVE PAYOUT (PATCH)
# # ==========================================
# @job_bp.route("/admin/payout-requests/<int:request_id>/approve", methods=["PATCH", "OPTIONS"])
# @jwt_required(optional=True)
# def approve_payout_request(request_id):
#     if request.method == "OPTIONS":
#         return "", 200

#     jwt_identity = get_jwt_identity()
#     if not jwt_identity:
#         return jsonify({"error": "Missing Authorization Header"}), 401

#     user = User.query.get(jwt_identity)
#     if not user or user.role != "admin":
#         return jsonify({"error": "Unauthorized"}), 403

#     payout_request = PayoutRequest.query.get(request_id)
#     if not payout_request:
#         return jsonify({"error": "Payout request not found"}), 404

#     # MATCHES MODEL: check against your real DB string 'pending_admin'
#     if payout_request.status != "pending_admin":
#         return jsonify({"error": "Payout already processed or invalid state"}), 400

#     worker = Worker.query.get(payout_request.worker_id)
#     if not worker:
#         return jsonify({"error": "Worker profile not found"}), 404

#     try:
#         # =========================================
#         # FUTURE STRIPE PAYOUT LOGIC GOES HERE
#         # =========================================
#         # transfer = stripe.Transfer.create(...)
#         # payout_request.stripe_payout_id = transfer.id 👈 MATCHES MODEL
#         # =========================================

#         # Update tracking fields to your explicit database structures
#         payout_request.status = "approved" 
#         worker.pending_balance -= payout_request.amount

#         db.session.commit()

#         return jsonify({
#             "message": "Payout approved successfully",
#             "request_id": payout_request.id,
#             "amount": payout_request.amount,
#             "status": "completed" # Tells React to hot-swap row presentation instantly
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": "Execution failure during state commit", "details": str(e)}), 500

@job_bp.route("/worker/verify-stripe", methods=["POST"])
@jwt_required()
def verify_stripe():
    current_user_id = get_jwt_identity()
    
    # 1. Fetch worker info from your database
    # (Adapt this query line to match your SQLAlchemy/database setup)
    worker = Worker.query.filter_by(user_id=current_user_id).first()
    
    if not worker or not worker.stripe_account_id:
        return jsonify({"error": "No associated Stripe account found initialization."}), 400

    try:
        # 2. Query Stripe directly using the stored account ID
        stripe_account = stripe.Account.retrieve(worker.stripe_account_id)
        
        # 3. Check if they completed onboarding and can receive payouts
        if stripe_account.details_submitted and stripe_account.payouts_enabled:
            # Update their status in your database
            worker.stripe_email = stripe_account.email
            # worker.has_stripe_setup = True (or update whatever boolean/status flags you use)
            
            db.session.commit()
            return jsonify({"status": "success", "message": "Stripe account verification finalized."}), 200
        else:
            return jsonify({"error": "Stripe onboarding was not completed entirely."}), 400

    except stripe.error.StripeError as e:
        return jsonify({"error": str(e)}), 500
    

# ==========================================
# 1. FETCH ALL SYSTEMIC PAYOUT REQUESTS (GET)
# ==========================================
@job_bp.route("/admin/payout-requests", methods=["GET", "OPTIONS"])
@jwt_required(optional=True)
def get_payout_requests():
    # Instantly resolve browser preflight checks
    if request.method == "OPTIONS":
        return "", 200

    jwt_identity = get_jwt_identity()
    if not jwt_identity:
        return jsonify({"error": "Missing Authorization Header"}), 401

    try:
        # Resolve identity safely if it's nested inside a dictionary payload
        user_id = jwt_identity.get("id") if isinstance(jwt_identity, dict) else jwt_identity
        user = User.query.get(int(user_id))
        
        if not user or user.role != "admin":
            return jsonify({"error": "Access denied. Administrator clearance mandatory."}), 403

        # Join explicit database schemas matching your model structures perfectly
        payout_data = db.session.query(
            PayoutRequest,
            User.full_name.label("worker_full_name"), # 👈 FIXED: Uses your exact full_name column
            Worker.stripe_account_id.label("stripe_account_id")
        ).join(
            Worker, PayoutRequest.worker_id == Worker.id
        ).join(
            User, Worker.user_id == User.id
        ).order_by(PayoutRequest.created_at.desc()).all()

        payload = []
        for req, worker_full_name, stripe_account_id in payout_data:
            # Map database state keys ("pending_admin") to match React's layout logic
            frontend_status = "pending" if req.status == "pending_admin" else "completed"

            payload.append({
                "id": req.id,
                "worker_id": req.worker_id,
                "worker_name": worker_full_name, # 👈 Bridges 'full_name' directly to React state mappings
                "payout_method": req.payout_method or "Stripe Connect",
                "stripe_account_id": stripe_account_id or "",
                "amount": float(req.amount) if req.amount else 0.0,
                "status": frontend_status, 
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "processed_at": None 
            })

        return jsonify(payload), 200

    except Exception as e:
        # Prints runtime failures directly into your active backend terminal console
        print(f"\n🚨 SYSTEM LEDGER CRASH LOG: {str(e)}\n")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


# # ==========================================
# # 2. ADMIN APPROVE PAYOUT REQUEST (PATCH)
# # ==========================================
# @job_bp.route("/admin/payout-requests/<int:request_id>/approve", methods=["PATCH", "OPTIONS"])
# @jwt_required(optional=True)
# def approve_payout_request(request_id):
#     if request.method == "OPTIONS":
#         return "", 200

#     jwt_identity = get_jwt_identity()
#     if not jwt_identity:
#         return jsonify({"error": "Missing Authorization Header"}), 401

#     try:
#         user_id = jwt_identity.get("id") if isinstance(jwt_identity, dict) else jwt_identity
#         user = User.query.get(int(user_id))
        
#         if not user or user.role != "admin":
#             return jsonify({"error": "Unauthorized"}), 403

#         payout_request = PayoutRequest.query.get(request_id)
#         if not payout_request:
#             return jsonify({"error": "Payout request not found"}), 404

#         # Validate against your exact model default: 'pending_admin'
#         if payout_request.status != "pending_admin":
#             return jsonify({"error": "Payout already processed or invalid state"}), 400

#         worker = Worker.query.get(payout_request.worker_id)
#         if not worker:
#             return jsonify({"error": "Worker profile not found"}), 404

#         # Update database schema flags
#         payout_request.status = "approved" 
#         worker.pending_balance -= payout_request.amount

#         db.session.commit()

#         return jsonify({
#             "message": "Payout approved successfully",
#             "request_id": payout_request.id,
#             "amount": payout_request.amount,
#             "status": "completed" # Notifies React frontend to instantly update UI row states
#         }), 200

#     except Exception as e:
#         db.session.rollback()
#         print(f"\n🚨 APPROVAL PROCESSING FAILURE: {str(e)}\n")
#         return jsonify({"error": "Execution engine failure", "details": str(e)}), 500

# ==========================================
# ADMIN APPROVE PAYOUT REQUEST (PATCH)
# ==========================================
@job_bp.route("/admin/payout-requests/<int:request_id>/approve", methods=["PATCH", "OPTIONS"])
@jwt_required(optional=True)
def approve_payout_request(request_id):
    if request.method == "OPTIONS":
        return "", 200

    jwt_identity = get_jwt_identity()
    if not jwt_identity:
        return jsonify({"error": "Missing Authorization Header"}), 401

    try:
        user_id = jwt_identity.get("id") if isinstance(jwt_identity, dict) else jwt_identity
        user = User.query.get(int(user_id))
        
        if not user or user.role != "admin":
            return jsonify({"error": "Unauthorized Access"}), 403

        payout_request = PayoutRequest.query.get(request_id)
        if not payout_request:
            return jsonify({"error": "Payout request not found"}), 404

        if payout_request.status != "pending_admin":
            return jsonify({"error": "Payout already processed"}), 400

        # 1. Update the Payout Request record state
        payout_request.status = "completed"
        payout_request.processed_at = db.func.now()

        # 2. 🚀 NEW: Update the associated Job status and track the payout status
        # Assumes your PayoutRequest model has a 'job_id' foreign key relationship
        if hasattr(payout_request, 'job_id') and payout_request.job_id:
            job = Job.query.get(payout_request.job_id)
            if job:
                job.status = "completed"  # Hard-set the job entity status as completed
                
                # If your database model explicitly tracks a string status for payouts on the job row:
                if hasattr(job, 'payout_status'):
                    job.payout_status = "completed"

        db.session.commit()

        return jsonify({
            "message": "Payout approved and job status finalized successfully.",
            "request_id": payout_request.id,
            "status": "completed"
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"\n🚨 APPROVAL PIPELINE CRASH: {str(e)}\n")
        return jsonify({"error": "Execution engine failure", "details": str(e)}), 500
    

# ==========================================
# 3. ADMIN REJECT PAYOUT REQUEST (PATCH)
# ==========================================
@job_bp.route("/admin/payout-requests/<int:request_id>/reject", methods=["PATCH", "OPTIONS"])
@jwt_required(optional=True)
def reject_payout_request(request_id):
    if request.method == "OPTIONS":
        return "", 200

    jwt_identity = get_jwt_identity()
    if not jwt_identity:
        return jsonify({"error": "Missing Authorization Header"}), 401

    try:
        user_id = jwt_identity.get("id") if isinstance(jwt_identity, dict) else jwt_identity
        user = User.query.get(int(user_id))
        
        if not user or user.role != "admin":
            return jsonify({"error": "Unauthorized"}), 403

        payout_request = PayoutRequest.query.get(request_id)
        if not payout_request:
            return jsonify({"error": "Payout request not found"}), 404

        # Validate against your exact model default: 'pending_admin'
        if payout_request.status != "pending_admin":
            return jsonify({"error": "Payout already processed or invalid state"}), 400

        # Update database schema flags to rejected
        payout_request.status = "rejected" 
        
        # NOTE: If your system separates 'available_balance' and 'pending_balance' 
        # and you want to move the money back into 'available_balance' upon rejection,
        # you can query the worker here and adjust balances. Otherwise, we just mark it rejected.

        db.session.commit()

        return jsonify({
            "message": "Payout request rejected successfully",
            "request_id": payout_request.id,
            "status": "rejected" # Notifies React frontend to update UI states
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"\n🚨 REJECTION PROCESSING FAILURE: {str(e)}\n")
        return jsonify({"error": "Execution engine failure", "details": str(e)}), 500