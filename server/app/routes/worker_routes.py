from flask import Blueprint, jsonify
from app.extensions import db
from app.models import Worker, User, Job, JobApplication # Adjust your model package import as needed

workers_bp = Blueprint('workers_bp', __name__)

# @workers_bp.route('/api/workers', methods=['GET'])
# def get_public_workers_directory():
#     try:
#         # 1. Fetch only verified workers who have completed onboarding setup
#         active_workers = Worker.query.filter(
#             Worker.verification_status != "suspended",
#             Worker.stripe_onboarding_complete == True
#         ).all()

#         public_directory_payload = []

#         for worker in active_workers:
#             # Fallback to structural user record metadata
#             user_record = worker.user
#             if not user_record or user_record.is_suspended:
#                 continue

#             # 2. Extract verified historical completed job records
#             # Queries jobs directly assigned to this worker that are completed
#             completed_jobs = Job.query.filter_by(
#                 worker_id=worker.id, 
#                 status="completed"
#             ).all()

#             past_jobs_history = []
            
#             for job in completed_jobs:
#                 # Find the client's name from the backref relationship
#                 client_name = job.client.full_name if job.client else "Verified Client"
                
#                 past_jobs_history.append({
#                     "id": job.id,
#                     "title": job.title,
#                     "date": job.created_at.strftime('%B %Y') if job.created_at else "Recently",
#                     "client": client_name,
#                     # If your system handles standalone review text later, parse it here
#                     "rating": worker.average_rating if worker.average_rating > 0 else 5.0,
#                     "review": f"Successfully completed project within marketplace guidelines."
#                 })

#             # 3. Format comma-separated skills string cleanly into a clear array list
#             skills_array = []
#             if worker.skills:
#                 skills_array = [skill.strip() for skill in worker.skills.split(',') if skill.strip()]

#             # 4. Construct payload object matching your exact WorkersDirectory property keys
#             public_directory_payload.append({
#                 "worker_id": worker.id,
#                 "name": user_record.full_name,
#                 "rating": round(worker.average_rating, 1) if worker.average_rating else 0.0,
#                 "completed_jobs": worker.total_jobs_completed or len(completed_jobs),
#                 "skills": skills_array,
#                 "bio": worker.bio or "This local task professional has not written a custom description yet.",
#                 "joined_date": worker.created_at.strftime('%B %Y') if worker.created_at else "Recent Partner",
#                 "past_jobs": past_jobs_history
#             })

#         # 5. Return JSON + 200 OK to allow cross-origin preflights to resolve
#         return jsonify(public_directory_payload), 200

#     except Exception as e:
#         print(f"❌ [BACKEND DIRECTORY ERROR]: {str(e)}")
#         return jsonify({
#             "error": "Failed to compile the active marketplace worker registry directory."
#         }), 500


@workers_bp.route('/api/workers', methods=['GET'])
def get_public_workers_directory():
    try:
        # 🛠️ DEVELOPMENT SETUP: Fetch ALL workers regardless of onboarding status
        active_workers = Worker.query.all()
        
        # 🔒 PRODUCTION SETUP (Swap back when ready):
        # active_workers = Worker.query.filter(
        #     Worker.verification_status != "suspended",
        #     Worker.stripe_onboarding_complete == True
        #).all()

        public_directory_payload = []

        for worker in active_workers:
            user_record = worker.user
            if not user_record or user_record.is_suspended:
                continue

            # Extract completed jobs
            completed_jobs = Job.query.filter_by(
                worker_id=worker.id, 
                status="completed"
            ).all()

            past_jobs_history = []
            for job in completed_jobs:
                past_jobs_history.append({
                    "id": job.id,
                    "title": job.title,
                    "date": job.created_at.strftime('%B %Y') if job.created_at else "Recently",
                    "client": job.client.full_name if job.client else "Verified Client",
                    "rating": worker.average_rating if worker.average_rating > 0 else 5.0,
                    "review": "Successfully completed project within marketplace guidelines."
                })

            # Format comma-separated skills string cleanly
            skills_array = []
            if worker.skills:
                skills_array = [skill.strip() for skill in worker.skills.split(',') if skill.strip()]

            public_directory_payload.append({
                "worker_id": worker.id,
                "name": user_record.full_name,
                "rating": round(worker.average_rating, 1) if worker.average_rating else 0.0,
                "completed_jobs": worker.total_jobs_completed or len(completed_jobs),
                "skills": skills_array,
                "bio": worker.bio or "This local task professional has not written a custom description yet.",
                "joined_date": worker.created_at.strftime('%B %Y') if worker.created_at else "Recent Partner",
                "past_jobs": past_jobs_history
            })

        return jsonify(public_directory_payload), 200

    except Exception as e:
        print(f"❌ [BACKEND DIRECTORY ERROR]: {str(e)}")
        return jsonify({"error": "Failed to compile worker registry"}), 500