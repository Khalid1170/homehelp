from datetime import datetime
from app.extensions import db


# =========================
# WORKER MODEL
# =========================
class Worker(db.Model):
    __tablename__ = "workers"

    id = db.Column(db.Integer, primary_key=True)

    # =========================
    # USER LINK
    # =========================
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    profile_image = db.Column(db.String)
    bio = db.Column(db.Text)
    skills = db.Column(db.String)

    location_text = db.Column(db.String(255))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)

    # =========================
    # EARNINGS (READ ONLY / HISTORY ONLY)
    # =========================
    total_gross_earnings = db.Column(db.Float, default=0.0)
    total_net_earnings = db.Column(db.Float, default=0.0)
    total_lifetime_earnings = db.Column(db.Float, default=0.0)

    # ⚠️ NOT USED FOR LOGIC ANYMORE (kept for UI if needed)
    available_balance = db.Column(db.Float, default=0.0, nullable=False)
    pending_balance = db.Column(db.Float, default=0.0, nullable=False)

    # =========================
    # STATUS
    # =========================
    availability_status = db.Column(db.String(20), default="available")
    verification_status = db.Column(db.String(20), default="pending")

    total_jobs_completed = db.Column(db.Integer, default=0)
    average_rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)

    # =========================
    # STRIPE
    # =========================
    stripe_account_id = db.Column(db.String, nullable=True)
    stripe_onboarding_complete = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # =========================
    # RELATIONSHIP
    # =========================
    user = db.relationship(
        "User",
        backref=db.backref("worker_profile", uselist=False)
    )


# =========================
# PAYOUT REQUEST MODEL
# =========================
class PayoutRequest(db.Model):
    __tablename__ = "payout_requests"

    id = db.Column(db.Integer, primary_key=True)

    # Worker reference
    worker_id = db.Column(
        db.Integer,
        db.ForeignKey("workers.id"),
        nullable=False
    )

    # Job reference (FIXED: must match "jobs")
    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id"),
        nullable=False
    )

    amount = db.Column(db.Float, nullable=False)

    # =========================
    # WORKFLOW STATUS
    # =========================
    status = db.Column(
        db.String(50),
        default="pending_admin"
        # pending_admin → approved → paid → rejected
    )

    payout_method = db.Column(db.String(50), default="stripe")

    stripe_payout_id = db.Column(db.String, nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )