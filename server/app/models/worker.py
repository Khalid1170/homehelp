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

    stripe_account_id = db.Column(db.String)

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