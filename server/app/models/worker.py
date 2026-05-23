from datetime import datetime
from app.extensions import db


class Worker(db.Model):
    __tablename__ = "workers"

    id = db.Column(db.Integer, primary_key=True)

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
    total_gross_earnings = db.Column(db.Float, default=0.0) # Before your 15% split
    total_net_earnings = db.Column(db.Float, default=0.0)   # What they actually take home
    # In your Worker model class:
    available_balance = db.Column(db.Float, default=0.0, server_default="0.0", nullable=False)
    pending_balance = db.Column(db.Float, default=0.0)
    total_lifetime_earnings = db.Column(db.Float, default=0.0)

    # requested_worker_id = db.Column(db.Integer, nullable=True)

    availability_status = db.Column(
        db.String(20),
        default="available"
    )

    verification_status = db.Column(
        db.String(20),
        default="pending"
    )

    total_jobs_completed = db.Column(
        db.Integer,
        default=0
    )

    average_rating = db.Column(
        db.Float,
        default=0.0
    )

    total_reviews = db.Column(
        db.Integer,
        default=0
    )

    stripe_account_id = db.Column(db.String)

    stripe_onboarding_complete = db.Column(
    db.Boolean,
    default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "worker_profile",
            uselist=False
        )
    )

class PayoutRequest(db.Model):
    __tablename__ = "payout_requests"

    id = db.Column(db.Integer, primary_key=True)

    worker_id = db.Column(
        db.Integer,
        db.ForeignKey("workers.id"),
        nullable=False
    )

    amount = db.Column(db.Float, nullable=False)

    status = db.Column(
        db.String(50),
        default="pending"
    )

    payout_method = db.Column(
        db.String(50),
        default="stripe"
    )

    stripe_payout_id = db.Column(db.String)

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )