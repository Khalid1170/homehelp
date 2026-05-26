from datetime import datetime
from app.extensions import db

class JobMessage(db.Model):
    __tablename__ = "job_messages"

    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships for eager parsing
    sender = db.relationship("User", backref="sent_messages")
    job = db.relationship("Job", backref="chat_messages")