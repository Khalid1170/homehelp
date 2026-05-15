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
# HELPER FUNCTION
# =========================
def update_worker_stats(worker_id):

    worker = Worker.query.get(worker_id)

    if not worker:
        return

    reviews = Review.query.filter_by(
        worker_id=worker_id
    ).all()

    total_reviews = len(reviews)

    if total_reviews > 0:

        average = sum(
            review.rating for review in reviews
        ) / total_reviews

        worker.average_rating = round(
            average,
            1
        )

        worker.total_reviews = total_reviews

    else:

        worker.average_rating = 0.0
        worker.total_reviews = 0


# =========================
# CREATE REVIEW
# =========================
@review_bp.route(
    "/jobs/<int:job_id>/review",
    methods=["POST"]
)
@jwt_required()
def create_review(job_id):

    current_user_id = int(
        get_jwt_identity()
    )

    user = User.query.get(
        current_user_id
    )

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
    comment = data.get("comment", "")

    # Validate rating
    if (
        not isinstance(rating, int)
        or rating < 1
        or rating > 5
    ):
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

    # Update worker stats
    update_worker_stats(job.worker_id)

    db.session.commit()

    return jsonify({
        "message": "Review submitted successfully"
    }), 201


# =========================
# GET WORKER REVIEWS
# =========================
@review_bp.route(
    "/workers/<int:worker_id>/reviews",
    methods=["GET"]
)
def get_worker_reviews(worker_id):

    worker = Worker.query.get(worker_id)

    if not worker:
        return jsonify({
            "error": "Worker not found"
        }), 404

    reviews = Review.query.filter_by(
        worker_id=worker_id
    ).all()

    return jsonify([
        {
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "job_id": review.job_id,
            "client_id": review.client_id
        }
        for review in reviews
    ]), 200


# =========================
# EDIT REVIEW
# =========================
@review_bp.route(
    "/reviews/<int:review_id>",
    methods=["PUT"]
)
@jwt_required()
def edit_review(review_id):

    current_user_id = int(
        get_jwt_identity()
    )

    review = Review.query.get(
        review_id
    )

    if not review:
        return jsonify({
            "error": "Review not found"
        }), 404

    # Only owner can edit
    if review.client_id != current_user_id:
        return jsonify({
            "error": "Unauthorized"
        }), 403

    data = request.get_json()

    new_rating = data.get("rating")
    new_comment = data.get("comment")

    # Update rating
    if new_rating is not None:

        if (
            not isinstance(new_rating, int)
            or new_rating < 1
            or new_rating > 5
        ):
            return jsonify({
                "error": "Rating must be between 1 and 5"
            }), 400

        review.rating = new_rating

    # Update comment
    if new_comment is not None:
        review.comment = new_comment

    # Recalculate stats
    update_worker_stats(
        review.worker_id
    )

    db.session.commit()

    return jsonify({
        "message": "Review updated successfully"
    }), 200


# =========================
# DELETE REVIEW
# =========================
@review_bp.route(
    "/reviews/<int:review_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_review(review_id):

    current_user_id = int(
        get_jwt_identity()
    )

    review = Review.query.get(
        review_id
    )

    if not review:
        return jsonify({
            "error": "Review not found"
        }), 404

    # Only owner can delete
    if review.client_id != current_user_id:
        return jsonify({
            "error": "Unauthorized"
        }), 403

    worker_id = review.worker_id

    db.session.delete(review)

    # Recalculate worker stats
    update_worker_stats(worker_id)

    db.session.commit()

    return jsonify({
        "message": "Review deleted successfully"
    }), 200