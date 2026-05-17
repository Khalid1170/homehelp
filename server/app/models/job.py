from datetime import datetime
from app.extensions import db


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(255), nullable=False)

    description = db.Column(db.Text, nullable=False)

    budget = db.Column(db.Float, nullable=False)

    category = db.Column(db.String(100), nullable=False)

    location_text = db.Column(db.String(255))

    payment_status = db.Column(db.String(50), default="unpaid")
    stripe_session_id = db.Column(db.String(255), nullable=True)
    amount_paid = db.Column(db.Float, nullable=True)
    requested_worker_id = db.Column(db.Integer, nullable=True)
    client = db.relationship('User', backref='jobs')

    status = db.Column(
        db.String(50),
        default="open"
    )
    # open / accepted / completed / cancelled

    client_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    worker_id = db.Column(
        db.Integer,
        db.ForeignKey("workers.id"),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )