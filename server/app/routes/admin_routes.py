from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, Worker, Job, Review
from app.extensions import db
from sqlalchemy import func

admin_bp = Blueprint("admin_bp", __name__)

# =========================
# ADMIN ROLE CHECK DECORATOR
# =========================
def admin_required(fn):
    """Helper to ensure only admins can access these routes."""
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper

# =========================
# 1. THE OVERVIEW (Executive Stats)
# =========================
@admin_bp.route("/admin/stats", methods=["GET"])
@jwt_required()
@admin_required
def get_admin_stats():
    total_revenue = db.session.query(func.sum(Job.amount_paid)).scalar() or 0.0
    # Platform usually takes 15% - let's calculate that for the god view
    platform_earnings = round(total_revenue * 0.15, 2)

    return jsonify({
        "counters": {
            "total_users": User.query.count(),
            "total_workers": Worker.query.count(),
            "total_jobs": Job.query.count(),
            "total_reviews": Review.query.count()
        },
        "finance": {
            "total_gross_volume": round(total_revenue, 2),
            "estimated_platform_fees": platform_earnings,
            "net_worker_payouts": round(total_revenue - platform_earnings, 2)
        }
    }), 200

# =========================
# 2. DETAILED CLIENTS VIEW
# =========================
@admin_bp.route("/admin/clients/detailed", methods=["GET"])
@jwt_required()
@admin_required
def get_detailed_clients():
    clients = User.query.filter_by(role="client").all()
    output = []
    
    for client in clients:
        jobs = Job.query.filter_by(client_id=client.id).all()
        total_spent = sum(j.amount_paid for j in jobs if j.payment_status == "paid" and j.amount_paid)
        
        job_history = []
        for j in jobs:
            worker_name = "Unassigned"
            if j.worker_id:
                w_profile = Worker.query.get(j.worker_id)
                worker_name = w_profile.user.full_name if (w_profile and w_profile.user) else "Unknown Worker"
                
            job_history.append({
                "job_id": j.id,
                "title": j.title,
                "status": j.status,
                "worker": worker_name,
                "budget": j.budget,
                "paid": j.amount_paid or 0.0
            })

        output.append({
            "id": client.id,
            "name": client.full_name,
            "email": client.email,
            "is_suspended": client.is_suspended,
            "stats": {
                "jobs_posted": len(jobs),
                "total_spent": round(total_spent, 2)
            },
            "recent_activity": job_history
        })
        
    return jsonify(output), 200

# =========================
# 3. DETAILED WORKERS VIEW
# =========================
@admin_bp.route("/admin/workers/detailed", methods=["GET"])
@jwt_required()
@admin_required
def get_detailed_workers():
    workers = Worker.query.all()
    output = []
    
    for w in workers:
        jobs = Job.query.filter_by(worker_id=w.id).all()
        completed = [j for j in jobs if j.status == "completed"]
        
        # Calculate true earnings
        total_earned = sum(j.amount_paid for j in completed if j.amount_paid)
        
        output.append({
            "worker_id": w.id,
            "name": w.user.full_name,
            "email": w.user.email,
            "rating": round(w.average_rating, 1) if w.average_rating else 0.0,
            "is_suspended": w.user.is_suspended,
            "verification": w.verification_status,
            "performance": {
                "total_jobs": len(jobs),
                "completed": len(completed),
                "gross_earnings": round(total_earned, 2)
            }
        })
        
    return jsonify(output), 200

# =========================
# 4. FULL JOB LIFECYCLE (THE FEED)
# =========================
@admin_bp.route("/admin/jobs/full", methods=["GET"])
@jwt_required()
@admin_required
def get_full_jobs_details():
    jobs = Job.query.order_by(Job.created_at.desc()).all()
    output = []
    
    for j in jobs:
        client = User.query.get(j.client_id)
        worker_user = None
        if j.worker_id:
            w_profile = Worker.query.get(j.worker_id)
            worker_user = User.query.get(w_profile.user_id) if w_profile else None

        output.append({
            "job_id": j.id,
            "title": j.title,
            "status": j.status,
            "financials": {
                "budget": j.budget,
                "paid_amount": j.amount_paid,
                "payment_status": j.payment_status
            },
            "participants": {
                "client": {"id": j.client_id, "name": client.full_name if client else "Deleted"},
                "worker": {"id": j.worker_id, "name": worker_user.full_name if worker_user else "Unassigned"}
            },
            "created_at": j.created_at.isoformat() if j.created_at else None
        })
        
    return jsonify(output), 200

# =========================
# 5. ADMIN CONTROL ACTIONS
# =========================
@admin_bp.route("/admin/users/<int:user_id>/suspend", methods=["POST"])
@jwt_required()
@admin_required
def toggle_user_suspension(user_id):
    user = User.query.get_or_404(user_id)
    user.is_suspended = not user.is_suspended
    db.session.commit()
    return jsonify({"message": f"User status updated. Suspended: {user.is_suspended}"}), 200

@admin_bp.route("/admin/workers/<int:worker_id>/verify", methods=["POST"])
@jwt_required()
@admin_required
def verify_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    worker.verification_status = "verified"
    db.session.commit()
    return jsonify({"message": f"Worker {worker.user.full_name} verified"}), 200

@admin_bp.route("/admin/jobs/<int:job_id>/force-status", methods=["PATCH"])
@jwt_required()
@admin_required
def admin_force_job_status(job_id):
    data = request.get_json()
    new_status = data.get("status")
    job = Job.query.get_or_404(job_id)
    job.status = new_status
    db.session.commit()
    return jsonify({"message": f"Job status overridden to {new_status}"}), 200