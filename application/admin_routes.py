from flask import request, jsonify
from flask_security import roles_required, logout_user
from flask_login import login_required
from application.database import db
from application.models import Doctor, Patient, Appointment, Specialization, User
from datetime import datetime
from flask_security.utils import hash_password

def register_admin_routes(app, user_datastore):

    @app.route("/api/admin/admin_dashboard", methods=["GET"])
    @roles_required("admin")
    def admin_dashboard():
        
        doctors = Doctor.query.all()
        patients = Patient.query.all()
        
        now = datetime.utcnow().date()  # compare only date part

        # Fetch all appointments that are either upcoming or past
        all_appointments = (
            Appointment.query
            .order_by(Appointment.date.asc(), Appointment.time.asc())
            .all()
        )

        upcoming_appointments = []
        past_appointments = []

        for appt in all_appointments:
            if appt.status == 'Booked' and appt.date >= now:
                upcoming_appointments.append(appt)
            else:  # Completed, Cancelled, or past date
                past_appointments.append(appt)

        # Optional: sort past_appointments in descending order
        past_appointments.sort(key=lambda x: (x.date, x.time), reverse=True)

        return jsonify({
            "doctors": [doc.to_dict() for doc in doctors],
            "patients": [pat.to_dict() for pat in patients],
            "upcoming_appointments": [appt.to_dict() for appt in upcoming_appointments],
            "past_appointments": [appt.to_dict() for appt in past_appointments]
        })



    @app.route('/api/admin/logout', methods=['POST'])
    @login_required
    def logout():
        logout_user()
        return jsonify({"message": "Logged out successfully"}), 200

    @app.route("/api/admin/search", methods=["GET"])
    @roles_required("admin")
    def admin_search():
        query = request.args.get("q", "").strip()

        doctors = Doctor.query.filter(Doctor.full_name.ilike(f"%{query}%")).all()
        patients = Patient.query.filter(Patient.full_name.ilike(f"%{query}%")).all()
        departments = Specialization.query.filter(Specialization.name.ilike(f"%{query}%")).all()

        return jsonify({
            "doctors": [doc.to_dict() for doc in doctors],
            "patients": [pat.to_dict() for pat in patients],
            "departments": [dept.to_dict() for dept in departments]
        })

    @app.route("/api/admin/doctor/<int:doctor_id>", methods=["DELETE"])
    @roles_required("admin")
    def delete_doctor(doctor_id):
        doctor = Doctor.query.get_or_404(doctor_id)
        user = doctor.user
        db.session.delete(doctor)
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Doctor deleted successfully."}), 200

    @app.route("/api/admin/doctor/<int:doctor_id>/block", methods=["POST"])
    @roles_required("admin")
    def block_doctor(doctor_id):
        doctor = Doctor.query.get_or_404(doctor_id)
        user = doctor.user
        user.active = False
        db.session.commit()
        return jsonify({"message": "Doctor has been blocked."}), 200

    @app.route("/api/admin/doctor/<int:doctor_id>/unblock", methods=["POST"])
    @roles_required("admin")
    def unblock_doctor(doctor_id):
        doctor = Doctor.query.get_or_404(doctor_id)
        user = doctor.user
        user.active = True
        db.session.commit()
        return jsonify({"message": "Doctor has been unblocked."}), 200

    @app.route("/api/admin/patient/<int:patient_id>/block", methods=["POST"])
    @roles_required("admin")
    def block_patient(patient_id):
        patient = Patient.query.get_or_404(patient_id)
        user = patient.user
        user.active = False
        db.session.commit()
        return jsonify({"message": "Patient has been blocked."}), 200

    @app.route("/api/admin/patient/<int:patient_id>", methods=["DELETE"])
    @roles_required("admin")
    def delete_patient(patient_id):
        patient = Patient.query.get_or_404(patient_id)
        user = patient.user
        db.session.delete(patient)
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Patient deleted successfully."}), 200

    @app.route("/api/admin/patient/<int:patient_id>/unblock", methods=["POST"])
    @roles_required("admin")
    def unblock_patient(patient_id):
        patient = Patient.query.get_or_404(patient_id)
        user = patient.user
        user.active = True
        db.session.commit()
        return jsonify({"message": "Patient has been unblocked."}), 200


    @app.route("/api/admin/patient/<int:patient_id>/doctor/<int:doctor_id>/appointments", methods=["GET"])
    @roles_required("admin")
    def get_patient_doctor_visits(patient_id, doctor_id):
        visits = Appointment.query.filter_by(patient_id=patient_id, doctor_id=doctor_id).all()

        result = []
        for v in visits:
            result.append({
                "id": v.id,
                "date": v.date.strftime("%Y-%m-%d") if v.date else None,
                "time": v.time.strftime("%H:%M") if v.time else "",
                "doctor_name": v.doctor.full_name if v.doctor else "N/A",
                "department": v.doctor.specialization.name if v.doctor and v.doctor.specialization else "N/A",
                "visit_type": v.treatment.visit_type if v.treatment else "",
                "tests_done": v.treatment.tests_done if v.treatment else "",
                "diagnosis": v.treatment.diagnosis if v.treatment else "",
                "prescription": v.treatment.prescription if v.treatment else "",
                "medicines": v.treatment.medicines if v.treatment else "",
                "treatment_created_at": v.treatment.created_at.isoformat() if v.treatment and v.treatment.created_at else None,
                "treatment_updated_at": v.treatment.updated_at.isoformat() if v.treatment and v.treatment.updated_at else None,
            })

        return jsonify({"appointments": result}), 200
    
    @app.route("/api/patient/<int:patient_id>", methods=["GET"])
    @roles_required("admin")
    def get_patient_public(patient_id):
        """Fetch patient info for viewing history (used in admin dashboard)."""
        patient = Patient.query.get_or_404(patient_id)
        return jsonify({
            "patient": {
                "id": patient.id,
                "full_name": patient.full_name,
                "dob": patient.dob.isoformat() if patient.dob else None,
                "gender": patient.gender,
                "address": patient.address,
                "contact_number": patient.contact_number
            }
        })



    @app.route("/api/admin/new_doctor", methods=["POST"])
    @roles_required("admin")
    def add_doctor():
        data = request.get_json()
        full_name = data.get("full_name")
        email = data.get("email")
        specialization = data.get("specialization")
        experience_years = data.get("experience_years", 0)
        password = data.get("password")
        bio = data.get("bio")

        if not all([full_name, email, specialization, password]):
            return jsonify({"message": "Missing required fields"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"message": "Email already exists"}), 400

        spec_obj = Specialization.query.filter_by(name=specialization).first()
        if not spec_obj:
            return jsonify({"message": "Invalid specialization"}), 400  

        new_user = user_datastore.create_user(
            email=email,
            username=email.split("@")[0],
            password=hash_password(password)
        )
        db.session.flush()

        doctor = Doctor(
            user_id=new_user.id,
            full_name=full_name,
            specialization_id=spec_obj.id,
            experience_years=experience_years,
            bio=bio
        )
        db.session.add(doctor)
        user_datastore.add_role_to_user(new_user, "doctor")
        db.session.commit()

        return jsonify({
            "message": "Doctor added successfully",
            "doctor": doctor.to_dict()
        }), 201

    @app.route("/api/specializations", methods=["GET"])
    @roles_required("admin")
    def get_specializations():
        specializations = Specialization.query.all()
        return jsonify([spec.to_dict() for spec in specializations])


    @app.route("/api/admin/patient/<int:patient_id>", methods=["GET"])
    @roles_required("admin")
    def get_patient_info(patient_id):
        patient = Patient.query.get_or_404(patient_id)
        return jsonify({
            "patient": {
                "id": patient.id,
                "full_name": patient.full_name,
                "dob": patient.dob.isoformat() if patient.dob else "",
                "gender": patient.gender,
                "contact_number": patient.contact_number,
                "address": patient.address
            }
        })


    @app.route("/api/admin/patient/<int:patient_id>", methods=["PUT"])
    @roles_required("admin")
    def update_patient_info(patient_id):
        data = request.get_json()
        patient = Patient.query.get_or_404(patient_id)
        patient.full_name = data.get("full_name", patient.full_name)
        patient.contact_number = data.get("contact_number", patient.contact_number)
        patient.address = data.get("address", patient.address)
        dob_str = data.get("dob")  # Expecting format 'YYYY-MM-DD'
        if dob_str:
            try:
                patient.dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"message": "Invalid date format for dob. Use YYYY-MM-DD."}), 400
        db.session.commit()
        return jsonify({"message": "Patient updated successfully."}), 200


    @app.route("/api/admin/doctor/<int:doctor_id>", methods=["GET"])
    @roles_required("admin")
    def get_doctor(doctor_id):
        doctor = Doctor.query.get_or_404(doctor_id)
        return jsonify({"doctor": doctor.to_dict()})


    @app.route("/api/admin/doctor/<int:doctor_id>", methods=["PUT"])
    @roles_required("admin")
    def update_doctor_info(doctor_id):
        data = request.get_json()
        doctor = Doctor.query.get_or_404(doctor_id)

        doctor.full_name = data.get("full_name", doctor.full_name)
        doctor.specialization_id = data.get("specialization_id", doctor.specialization_id)
        doctor.experience_years = data.get("experience_years", doctor.experience_years)
        doctor.bio = data.get("bio", doctor.bio)

        db.session.commit()
        return jsonify({"message": "Doctor updated successfully."}), 200


    # Add this near your other admin API routes
    @app.route("/api/admin/patient/<int:patient_id>/appointments", methods=["GET"])
    def get_patient_appointments_admin(patient_id):
        """
        Returns all appointments (past & upcoming) for a specific patient,
        with doctor and treatment details, for admin use.
        """
        from application.models import Appointment  # adjust imports to your structure

        appointments = Appointment.query.filter_by(patient_id=patient_id).all()

        result = []
        for appt in appointments:
            result.append({
                "id": appt.id,
                "date": appt.date.strftime("%Y-%m-%d") if appt.date else None,
                "doctor_name": appt.doctor.full_name if appt.doctor else "N/A",
                "department": appt.doctor.specialization.name if appt.doctor and appt.doctor.specialization else "N/A",
                "diagnosis": appt.treatment.diagnosis if appt.treatment else "",
                "prescription": appt.treatment.prescription if appt.treatment else "",
                "visit_type": appt.treatment.visit_type if appt.treatment else "",
                "tests_done": appt.treatment.tests_done if appt.treatment else "",
                "medicines": appt.treatment.medicines if appt.treatment else "",
                "treatment_created_at": appt.treatment.created_at.isoformat() if appt.treatment and appt.treatment.created_at else None,
                "treatment_updated_at": appt.treatment.updated_at.isoformat() if appt.treatment and appt.treatment.updated_at else None,
            })


        return jsonify({"appointments": result}), 200



