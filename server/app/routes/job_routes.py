from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
import stripe

from app.extensions import db
from app.models import Job, Worker, User, Review

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
        return jsonify({
            "error": "Only clients can create jobs"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Missing JSON body"
        }), 400

    title = data.get("title")
    description = data.get("description")
    budget = data.get("budget")
    category = data.get("category")
    location_text = data.get("location_text")

    if not all([title, description, budget, category]):
        return jsonify({
            "error": "Missing required fields"
        }), 400

    try:
        budget = float(budget)
    except (ValueError, TypeError):
        return jsonify({
            "error": "Budget must be a valid number"
        }), 400

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

from sqlalchemy.orm import joinedload

# =========================
# GET OPEN PAID JOBS
# =========================
@job_bp.route("/jobs/open", methods=["GET"])
def get_open_jobs():
    # Use joinedload to eager-load the client relationship in a single query
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
            # Uses the pre-loaded relationship instead of triggering new queries
            "client_name": job.client.full_name if job.client else "Unknown Client",
            "created_at": (
                job.created_at.isoformat()
                if getattr(job, "created_at", None)
                else None
            )
        }
        # A clean, single-pass iteration
        for job in jobs
    ]), 200

# =========================
# GET SINGLE JOB
# =========================
@job_bp.route("/jobs/<int:job_id>", methods=["GET"])
def get_single_job(job_id):

    job = Job.query.get(job_id)

    if not job:
        return jsonify({
            "error": "Job not found"
        }), 404

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

    requested_worker_data = None

    if job.requested_worker_id:
        requested_worker = Worker.query.get(
            job.requested_worker_id
        )

        if requested_worker and requested_worker.user:
            requested_worker_data = {
                "worker_id": requested_worker.id,
                "name": requested_worker.user.full_name,
                "rating": requested_worker.average_rating,
                "verification_status": requested_worker.verification_status
            }

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
        "requested_worker": requested_worker_data,
        "created_at": (
            job.created_at.isoformat()
            if getattr(job, "created_at", None)
            else None
        )
    }), 200


# =========================
# ACCEPT JOB (WORKER REQUEST)
# =========================
@job_bp.route("/jobs/<int:job_id>/accept", methods=["PATCH"])
@jwt_required()
def accept_job(job_id):

    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

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

    # PREVENT SELF ACCEPTANCE
    if job.client_id == user.id:
        return jsonify({
            "error": "You cannot accept your own job"
        }), 400

    # PAYMENT REQUIRED
    if job.payment_status != "paid":
        return jsonify({
            "error": "Job must be paid before acceptance"
        }), 400

    # JOB MUST BE OPEN
    if job.status != "open":
        return jsonify({
            "error": "Job is not available"
        }), 400

    # NO DOUBLE ASSIGNMENT
    if job.worker_id is not None:
        return jsonify({
            "error": "Job already assigned"
        }), 400

    # VERIFIED WORKERS ONLY
    if worker.verification_status != "verified":
        return jsonify({
            "error": "Worker not verified"
        }), 403

    # ONE ACTIVE JOB LIMIT
    active_job = Job.query.filter_by(
        worker_id=worker.id,
        status="accepted"
    ).first()

    if active_job:
        return jsonify({
            "error": "Worker already has an active job"
        }), 400

    # PREVENT MULTIPLE PENDING REQUESTS
    if job.requested_worker_id is not None:
        return jsonify({
            "error": "Another worker request is already pending"
        }), 400

    # PREVENT SAME WORKER DUPLICATE REQUEST
    if job.requested_worker_id == worker.id:
        return jsonify({
            "error": "You already requested this job"
        }), 400

    # SEND REQUEST TO CLIENT
    job.requested_worker_id = worker.id
    job.status = "pending_client_acceptance"

    db.session.commit()

    return jsonify({
        "message": "Worker request sent to client",
        "job_id": job.id,
        "requested_worker_id": worker.id
    }), 200


# =========================
# CLIENT APPROVES WORKER
# =========================
@job_bp.route("/jobs/<int:job_id>/approve-worker", methods=["PATCH"])
@jwt_required()
def approve_worker(job_id):

    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if user.role != "client":
        return jsonify({
            "error": "Only clients can approve workers"
        }), 403

    job = Job.query.get(job_id)

    if not job:
        return jsonify({
            "error": "Job not found"
        }), 404

    if job.client_id != user.id:
        return jsonify({
            "error": "Unauthorized"
        }), 403

    if job.status != "pending_client_acceptance":
        return jsonify({
            "error": "Job is not awaiting worker approval"
        }), 400

    if not job.requested_worker_id:
        return jsonify({
            "error": "No worker request found"
        }), 400

    worker = Worker.query.get(job.requested_worker_id)

    if not worker:
        return jsonify({
            "error": "Worker not found"
        }), 404

    active_job = Job.query.filter_by(
        worker_id=worker.id,
        status="accepted"
    ).first()

    if active_job:
        return jsonify({
            "error": "Worker already has an active job"
        }), 400

    job.worker_id = worker.id
    job.requested_worker_id = None
    job.status = "accepted"

    db.session.commit()

    return jsonify({
        "message": "Worker approved successfully",
        "job_id": job.id,
        "worker_id": worker.id
    }), 200


# =========================
# CLIENT DECLINES WORKER
# =========================
@job_bp.route("/jobs/<int:job_id>/decline-worker", methods=["PATCH"])
@jwt_required()
def decline_worker(job_id):

    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if user.role != "client":
        return jsonify({
            "error": "Only clients can decline workers"
        }), 403

    job = Job.query.get(job_id)

    if not job:
        return jsonify({
            "error": "Job not found"
        }), 404

    if job.client_id != user.id:
        return jsonify({
            "error": "Unauthorized"
        }), 403

    if job.status != "pending_client_acceptance":
        return jsonify({
            "error": "Job is not awaiting approval"
        }), 400

    job.requested_worker_id = None
    job.status = "open"

    db.session.commit()

    return jsonify({
        "message": "Worker request declined"
    }), 200


# =========================
# WORKER MARK FINISHED
# =========================
@job_bp.route("/jobs/<int:job_id>/mark-finished", methods=["PATCH"])
@jwt_required()
def mark_job_finished(job_id):

    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if user.role != "worker":
        return jsonify({
            "error": "Only workers can mark jobs finished"
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

    if job.worker_id != worker.id:
        return jsonify({
            "error": "Unauthorized"
        }), 403

    if job.status != "accepted":
        return jsonify({
            "error": "Invalid job status"
        }), 400

    job.status = "pending_confirmation"

    db.session.commit()

    return jsonify({
        "message": "Job marked as finished"
    }), 200


# =========================
# CLIENT CONFIRMS COMPLETION
# =========================
@job_bp.route("/jobs/<int:job_id>/confirm", methods=["PATCH"])
@jwt_required()
def confirm_job_completion(job_id):

    user = User.query.get(get_jwt_identity())

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if user.role != "client":
        return jsonify({
            "error": "Only clients can confirm completion"
        }), 403

    job = Job.query.get(job_id)

    if not job:
        return jsonify({
            "error": "Job not found"
        }), 404

    if job.client_id != user.id:
        return jsonify({
            "error": "Unauthorized"
        }), 403

    if job.status != "pending_confirmation":
        return jsonify({
            "error": "Job is not pending confirmation"
        }), 400

    worker = Worker.query.get(job.worker_id)

    if not worker:
        return jsonify({
            "error": "Worker not found"
        }), 404

    job.status = "completed"
    job.requested_worker_id = None

    worker.total_jobs_completed = (
        worker.total_jobs_completed or 0
    ) + 1

    gross_amount = job.amount_paid or 0.0

    platform_fee = round(
        gross_amount * 0.15,
        2
    )

    worker_payout = round(
        gross_amount - platform_fee,
        2
    )

    worker.total_gross_earnings = (
        worker.total_gross_earnings or 0.0
    ) + gross_amount

    worker.total_net_earnings = (
        worker.total_net_earnings or 0.0
    ) + worker_payout

    db.session.commit()

    return jsonify({
        "message": "Job completed successfully",
        "total_client_paid": gross_amount,
        "platform_fee_15_percent": platform_fee,
        "worker_take_home": worker_payout
    }), 200


# =========================
# CREATE STRIPE CHECKOUT
# =========================
@job_bp.route("/jobs/<int:job_id>/pay", methods=["POST"])
@jwt_required()
def pay_job(job_id):

    stripe.api_key = current_app.config[
        "STRIPE_SECRET_KEY"
    ]

    user = User.query.get(
        get_jwt_identity()
    )

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    if user.role != "client":
        return jsonify({
            "error": "Only clients can pay"
        }), 403

    job = Job.query.get(job_id)

    if not job:
        return jsonify({
            "error": "Job not found"
        }), 404

    if job.client_id != user.id:
        return jsonify({
            "error": "Unauthorized"
        }), 403

    if job.status != "open":
        return jsonify({
            "error": "Only open jobs can be paid for"
        }), 400

    if job.payment_status == "paid":
        return jsonify({
            "error": "Job already paid"
        }), 400

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],

        line_items=[{
            "price_data": {
                "currency": "gbp",
                "product_data": {
                    "name": job.title
                },
                "unit_amount": int(
                    job.budget * 100
                ),
            },
            "quantity": 1,
        }],

        mode="payment",

        metadata={
            "job_id": job.id
        },

        success_url="http://localhost:3000/success",
        cancel_url="http://localhost:3000/cancel",
    )

    job.stripe_session_id = session.id
    job.payment_status = "pending"

    db.session.commit()

    return jsonify({
        "checkout_url": session.url
    }), 200

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
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
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

        # Fix: Convert the string metadata ID into an integer for SQLAlchemy
        try:
            job_id = int(raw_job_id)
        except ValueError:
            print(f"[-] Webhook Error: Job ID '{raw_job_id}' is not a valid integer.")
            return jsonify({"error": "Invalid job ID format"}), 400

        # Look up by primary key directly
        job = Job.query.get(job_id)

        if job:
            # Extra safety step: Ensure the session tokens match up perfectly
            if job.stripe_session_id != session.id:
                print(f"[-] Webhook Warning: Session ID mismatch for Job #{job_id}.")
                return jsonify({"error": "Stripe session mismatch"}), 400

            # Update the database
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

    user = User.query.get(
        get_jwt_identity()
    )

    if not user or user.role != "worker":
        return jsonify({
            "error": "Unauthorized"
        }), 403

    worker = Worker.query.filter_by(
        user_id=user.id
    ).first()

    if not worker:
        return jsonify({
            "error": "Worker profile not found"
        }), 404

    jobs = Job.query.filter_by(
        worker_id=worker.id
    ).all()

    active_jobs = []
    completed_jobs = []

    for job in jobs:

        client = User.query.get(
            job.client_id
        )

        review = Review.query.filter_by(
            job_id=job.id
        ).first()

        review_data = None

        if review:
            review_data = {
                "rating": review.rating,
                "comment": review.comment
            }

        job_data = {
            "job_id": job.id,
            "title": job.title,
            "budget": job.budget,
            "status": job.status,
            "client_name": (
                client.full_name
                if client
                else "Unknown Client"
            ),
            "review": review_data
        }

        if job.status == "completed":
            completed_jobs.append(job_data)
        else:
            active_jobs.append(job_data)

    total_gross = sum(
        j["budget"]
        for j in completed_jobs
    )

    total_fees = round(
        total_gross * 0.15,
        2
    )

    total_net = round(
        total_gross - total_fees,
        2
    )

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

    user = User.query.get(
        get_jwt_identity()
    )

    if not user or user.role != "client":
        return jsonify({
            "error": "Unauthorized"
        }), 403

    jobs = Job.query.filter_by(
        client_id=user.id
    ).all()

    active_jobs = []
    completed_jobs = []

    total_spent = 0.0

    for job in jobs:

        if job.amount_paid:
            total_spent += float(
                job.amount_paid
            )

        worker_data = None

        if job.worker_id:

            worker = Worker.query.get(
                job.worker_id
            )

            if worker and worker.user:
                worker_data = {
                    "worker_id": worker.id,
                    "name": worker.user.full_name,
                    "rating": worker.average_rating
                }

        requested_worker_data = None

        if job.requested_worker_id:

            requested_worker = Worker.query.get(
                job.requested_worker_id
            )

            if requested_worker and requested_worker.user:
                requested_worker_data = {
                    "worker_id": requested_worker.id,
                    "name": requested_worker.user.full_name,
                    "rating": requested_worker.average_rating
                }

        review = Review.query.filter_by(
            job_id=job.id
        ).first()

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
            "requested_worker": requested_worker_data,
            "awaiting_worker_approval": (
                job.status ==
                "pending_client_acceptance"
            ),
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
            "total_spent": round(
                total_spent,
                2
            ),
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
@job_bp.route(
    "/workers/<int:worker_id>/public",
    methods=["GET"]
)
def get_public_worker_profile(worker_id):

    worker = Worker.query.get(worker_id)

    if not worker:
        return jsonify({
            "error": "Worker not found"
        }), 404

    reviews = Review.query.filter_by(
        worker_id=worker.id
    ).all()

    return jsonify({
        "name": worker.user.full_name,
        "bio": worker.bio,
        "skills": (
            worker.skills.split(",")
            if worker.skills
            else []
        ),
        "location": worker.location_text,
        "rating": worker.average_rating,
        "completed_jobs": (
            worker.total_jobs_completed
        ),
        "reviews": [
            {
                "rating": r.rating,
                "comment": r.comment,
                "client": r.client_id
            }
            for r in reviews
        ]
    }), 200