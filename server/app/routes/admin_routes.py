from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, Worker, Job, Review
from app.extensions import db
from sqlalchemy import func
from sqlalchemy.orm import joinedload, subqueryload

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
    # Fix: Use subqueryload to pre-fetch all jobs related to these clients in 2 queries total
    clients = User.query.filter_by(role="client").options(subqueryload(User.jobs)).all()
    output = []
    
    for client in clients:
        total_spent = sum(j.amount_paid for j in client.jobs if j.payment_status == "paid" and j.amount_paid)
        
        job_history = []
        for j in client.jobs:
            worker_name = "Unassigned"
            # Accessing the backref relationship if available, safely falling back to lazy lookup 
            # to keep things simple or loading via joined options
            if j.worker_id:
                worker_name = j.worker.user.full_name if (j.worker and j.worker.user) else "Unknown Worker"
                
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
            "is_suspended": getattr(client, "is_suspended", False),
            "stats": {
                "jobs_posted": len(client.jobs),
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
    # Fix: Eager load User profile and linked jobs to keep query overhead to a minimum
    workers = Worker.query.options(joinedload(Worker.user), subqueryload(Worker.applications)).all()
    output = []
    
    for w in workers:
        if not w.user:
            continue
            
        # Querying jobs assigned to this worker
        jobs = Job.query.filter_by(worker_id=w.id).all()
        completed = [j for j in jobs if j.status == "completed"]
        total_earned = sum(j.amount_paid for j in completed if j.amount_paid)
        
        output.append({
            "worker_id": w.id,
            "name": w.user.full_name,
            "email": w.user.email,
            "rating": round(w.average_rating, 1) if w.average_rating else 0.0,
            "is_suspended": getattr(w.user, "is_suspended", False),
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
    # Fix: Single execution pass utilizing joinedload to grab Clients and Workers simultaneously
    jobs = Job.query.options(
        joinedload(Job.client),
        joinedload(Job.worker).joinedload(Worker.user)
    ).order_by(Job.created_at.desc()).all()
    
    output = []
    
    for j in jobs:
        client_name = j.client.full_name if j.client else "Deleted Client"
        worker_name = j.worker.user.full_name if (j.worker and j.worker.user) else "Unassigned"

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
                "client": {"id": j.client_id, "name": client_name},
                "worker": {"id": j.worker_id, "name": worker_name}
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
    user.is_suspended = not getattr(user, "is_suspended", False)
    db.session.commit()
    return jsonify({"message": f"User status updated. Suspended: {user.is_suspended}"}), 200

@admin_bp.route("/admin/workers/<int:worker_id>/verify", methods=["POST"])
@jwt_required()
@admin_required
def verify_worker(worker_id):
    worker = Worker.query.get_or_404(worker_id)
    worker.verification_status = "verified"
    db.session.commit()
    return jsonify({"message": f"Worker {worker.user.full_name if worker.user else 'Unknown'} verified"}), 200

@admin_bp.route("/admin/jobs/<int:job_id>/force-status", methods=["PATCH"])
@jwt_required()
@admin_required
def admin_force_job_status(job_id):
    data = request.get_json()
    new_status = data.get("status")
    
    if not new_status:
        return jsonify({"error": "Missing status value"}), 400
        
    job = Job.query.get_or_404(job_id)
    job.status = new_status
    db.session.commit()
    return jsonify({"message": f"Job status overridden to {new_status}"}), 200