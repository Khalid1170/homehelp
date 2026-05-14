from flask import Blueprint, request, jsonify

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from app.extensions import db
from app.models import (
    User,
    Worker,
    Job,
    Review
)

review_bp = Blueprint(
    "review_bp",
    __name__
)


# =========================
# CREATE REVIEW
# =========================
@review_bp.route(
    "/jobs/<int:job_id>/review",
    methods=["POST"]
)
@jwt_required()
def create_review(job_id):

    current_user_id = get_jwt_identity()

    user = User.query.get(current_user_id)

    # Only clients can review
    if user.role != "client":
        return jsonify({
            "error": "Only clients can leave reviews"
        }), 403

    job = Job.query.get(job_id)

    if not job:
        return jsonify({
            "error": "Job not found"
        }), 404

    # Must own job
    if job.client_id != user.id:
        return jsonify({
            "error": "Unauthorized client"
        }), 403

    # Job must be completed
    if job.status != "completed":
        return jsonify({
            "error": "Job not completed"
        }), 400

    # Prevent duplicate reviews
    existing_review = Review.query.filter_by(
        job_id=job.id
    ).first()

    if existing_review:
        return jsonify({
            "error": "Review already exists"
        }), 400

    data = request.get_json()

    rating = data.get("rating")
    comment = data.get("comment")

    # Validate rating
    if not rating or rating < 1 or rating > 5:
        return jsonify({
            "error": "Rating must be between 1 and 5"
        }), 400

    review = Review(
        rating=rating,
        comment=comment,
        client_id=user.id,
        worker_id=job.worker_id,
        job_id=job.id
    )

    db.session.add(review)

    # =========================
    # UPDATE WORKER RATINGS
    # =========================

    worker = Worker.query.get(job.worker_id)

    worker.total_reviews = (worker.total_reviews or 0) + 1

    all_reviews = Review.query.filter_by(
        worker_id=worker.id
    ).all()

    total_rating = sum(r.rating for r in all_reviews)

    worker.average_rating = round(
        total_rating / worker.total_reviews,
        1
    )

    db.session.commit()

    return jsonify({
        "message": "Review submitted successfully"
    }), 201