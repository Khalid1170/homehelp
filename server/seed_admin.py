from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # check if admin already exists
    existing_admin = User.query.filter_by(email="admin@homehelp.com").first()

    if existing_admin:
        print("Admin already exists")
        exit()

    admin = User(
        full_name="System Admin",
        email="admin@homehelp.com",
        password_hash=generate_password_hash("admin123"),
        phone_number="0000000000",
        role="admin",
        is_suspended=False
    )

    db.session.add(admin)
    db.session.commit()

    print("Admin created successfully")
    print("Email: admin@homehelp.com")
    print("Password: admin123")