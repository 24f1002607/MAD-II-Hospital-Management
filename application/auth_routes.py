from flask import jsonify, render_template, request
from flask_security import login_user
from flask_security.utils import verify_password
from application.database import db
from application.models import User, Doctor, Patient, Specialization
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

def register_auth_routes(app, user_datastore):
    @app.route('/', methods=['GET'])
    def home():
        return render_template('index.html')

    @app.route('/api/login', methods=['POST'])
    def user_login():
        body = request.get_json()
        email = body.get('email')
        password = body.get('password')

        logger.info(f"Login attempt for email: {email}")

        if not email or not password:
            logger.warning("Email or password missing in login attempt")
            return jsonify({"message": "Email and password are required"}), 400

        user = user_datastore.find_user(email=email)

        if not user:
            logger.warning(f"Login failed: user not found with email {email}")
            return jsonify({"message": "Invalid credentials"}), 400

        if not user.active:
            logger.warning(f"Login blocked: user {email} is deactivated")
            return jsonify({"message": "Your account has been blocked. Please contact the administrator."}), 403


        if not verify_password(password, user.password):
            logger.warning(f"Login failed: invalid password for user {email}")
            return jsonify({"message": "Invalid credentials"}), 400

        login_user(user)

        # Update last_login timestamp if field exists on User model
        if hasattr(user, 'last_login'):
            user.last_login = datetime.now(timezone.utc)
            db.session.commit()

        roles = [role.name for role in user.roles]

        # Return user data and token (if applicable)
        return jsonify({
            "id": user.id,
            "username": user.username,
            "auth_token": user.get_auth_token() if hasattr(user, 'get_auth_token') else "",
            "roles": roles,
            "last_login": user.last_login.isoformat() if getattr(user, 'last_login', None) else None
        })

    @app.route('/api/register', methods=['POST'])
    def create_user():
        credentials = request.get_json()

        email = credentials.get("email")
        username = credentials.get("username")
        password = credentials.get("password")
        full_name = credentials.get("full_name")
        role = credentials.get("role", "patient").lower()

        if not all([email, username, password, full_name]):
            return jsonify({"error": "Missing required fields"}), 400

        if role in ["admin", "doctor"]:
            return jsonify({"error": f"Registration as {role} is not allowed. Please contact the administrator."}), 403

        if user_datastore.find_user(email=email) or User.query.filter_by(username=username).first():
            return jsonify({"error": "User with given email or username already exists"}), 400

        new_user = user_datastore.create_user(
            email=email,
            username=username,
            password=password  # Flask-Security will hash this
        )

        user_datastore.add_role_to_user(new_user, role)
        db.session.flush()  # Ensures new_user.id is available

        if role == "patient":
            dob_str = credentials.get("dob")
            gender = credentials.get("gender")
            contact_number = credentials.get("contact_number")
            address = credentials.get("address")

            dob = None
            if dob_str:
                try:
                    dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
                except ValueError:
                    return jsonify({"error": "Invalid date format for DOB. Use YYYY-MM-DD."}), 400

            new_patient = Patient(
                user_id=new_user.id,
                full_name=full_name,
                dob=dob,
                gender=gender,
                contact_number=contact_number,
                address=address
            )
            db.session.add(new_patient)

        db.session.commit()

        return jsonify({"message": f"{role.capitalize()} registered successfully"}), 201

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        if path.startswith('api'):
            return jsonify({"message": "API route not found"}), 404
        return render_template('index.html')
