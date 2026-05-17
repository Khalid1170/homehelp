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
    
    status = db.Column(
        db.String(50),
        default="open"
    )
    # open / pending_client_acceptance / accepted / completed / cancelled

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

    # Relationships
    client = db.relationship('User', backref='jobs')
    # ADDED THIS LINE HERE 🚀
    worker = db.relationship('Worker', backref='assigned_jobs') 


class JobApplication(db.Model):
    __tablename__ = 'job_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    worker_id = db.Column(db.Integer, db.ForeignKey('workers.id'), nullable=False)
    
    # The pitch text field 🚀
    worker_message = db.Column(db.Text, nullable=True) 
    
    status = db.Column(db.String(20), default="pending")  # pending, approved, declined
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    # Relationships for fast object access
    job = db.relationship('Job', backref='applications')
    worker = db.relationship('Worker', backref='applications')