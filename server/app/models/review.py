from datetime import datetime
from app.extensions import db


class Review(db.Model):
    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True)

    rating = db.Column(
        db.Integer,
        nullable=False
    )

    comment = db.Column(
        db.Text,
        nullable=True
    )

    client_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    worker_id = db.Column(
        db.Integer,
        db.ForeignKey("workers.id"),
        nullable=False
    )

    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id"),
        nullable=False,
        unique=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )