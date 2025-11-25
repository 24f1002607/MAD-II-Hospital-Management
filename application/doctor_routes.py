from flask import request, jsonify, session
from flask_security import roles_required, current_user, logout_user
from flask_login import login_required
from application.models import Appointment, Treatment, Doctor, Patient, VisitTypeEnum
from application.database import db
from datetime import datetime
import json

def register_doctor_routes(app):
    
    @app.route("/api/doctor/appointments", methods=["GET"])
    @roles_required("doctor")
    def doctor_appointments():
        doctor = Doctor.query.filter_by(user_id=current_user.id).first()
        if not doctor:
            return jsonify({"message": "Doctor profile not found"}), 404

        appointments = Appointment.query.filter_by(doctor_id=doctor.id).all()
        return jsonify([appt.to_dict() for appt in appointments])

    @app.route("/api/doctor/appointment/<int:appointment_id>/treatment", methods=["POST"])
    @roles_required("doctor")
    def add_or_update_treatment(appointment_id):
        data = request.get_json()
        appointment = Appointment.query.get_or_404(appointment_id)

        # Verify the appointment belongs to current doctor
        doctor = Doctor.query.filter_by(user_id=current_user.id).first()
        if not doctor or appointment.doctor_id != doctor.id:
            return jsonify({"message": "Unauthorized or invalid appointment"}), 403

        treatment = appointment.treatment
        if not treatment:
            treatment = Treatment(appointment_id=appointment.id)
            db.session.add(treatment)
        
        #Update fields
        treatment.visit_type = VisitTypeEnum(data.get("visit_type")) if data.get("visit_type") else treatment.visit_type
        treatment.tests_done = data.get("tests_done")
        treatment.diagnosis = data.get("diagnosis")
        treatment.prescription = data.get("prescription")
        treatment.medicines = data.get("medicines")
        
            

        db.session.add(treatment)
        db.session.commit()

        return jsonify({"message": "Treatment saved successfully", "treatment": treatment.to_dict()})

    @app.route("/api/doctor/availability", methods=["PUT"])
    @roles_required("doctor")
    def update_availability():
        user = current_user
        doctor = Doctor.query.filter_by(user_id=user.id).first_or_404()
        data = request.get_json()

        availability = data.get("availability")
        if not availability:
            return jsonify({"message": "Availability data missing"}), 400

        doctor.availability_json = json.dumps(availability)
        db.session.commit()
        return jsonify({"message": "Availability updated"}), 200

    #Get current logged-in doctor details (including availability)
    @app.route("/api/doctor/me", methods=["GET"])
    @roles_required("doctor")
    def get_current_doctor():
        doctor = Doctor.query.filter_by(user_id=current_user.id).first()
        if not doctor:
            return jsonify({"message": "Doctor profile not found"}), 404

        doctor_dict = doctor.to_dict()

        # Parse availability JSON string into a Python dict
        availability = {}
        if doctor.availability_json:
            try:
                availability = json.loads(doctor.availability_json)
            except json.JSONDecodeError:
                availability = {}

        doctor_dict["availability"] = availability

        return jsonify({"doctor": doctor_dict})
    
    #Get assigned patients for the doctor (distinct patients with appointments)
    @app.route("/api/doctor/patients", methods=["GET"])
    @roles_required("doctor")
    def get_assigned_patients():
        doctor = Doctor.query.filter_by(user_id=current_user.id).first()
        if not doctor:
            return jsonify({"message": "Doctor profile not found"}), 404

        patient_ids = db.session.query(Appointment.patient_id).filter_by(doctor_id=doctor.id).distinct()
        patients = Patient.query.filter(Patient.id.in_(patient_ids)).all()

        return jsonify({"patients": [p.to_dict() for p in patients]})

    #Mark appointment as complete
    @app.route("/api/doctor/appointment/<int:appointment_id>/complete", methods=["POST"])
    @roles_required("doctor")
    def mark_appointment_complete(appointment_id):
        doctor = Doctor.query.filter_by(user_id=current_user.id).first()
        appointment = Appointment.query.get_or_404(appointment_id)

        if not doctor or appointment.doctor_id != doctor.id:
            return jsonify({"message": "Unauthorized"}), 403

        appointment.status = 'Completed'
        db.session.commit()
        return jsonify({"message": "Appointment marked as complete"})

    #Cancel an appointment
    @app.route("/api/doctor/appointment/<int:appointment_id>/cancel", methods=["POST"])
    @roles_required("doctor")
    def cancel_appointment(appointment_id):
        doctor = Doctor.query.filter_by(user_id=current_user.id).first()
        appointment = Appointment.query.get_or_404(appointment_id)

        if not doctor or appointment.doctor_id != doctor.id:
            return jsonify({"message": "Unauthorized"}), 403

        appointment.status = 'Cancelled'
        db.session.commit()
        return jsonify({"message": "Appointment cancelled"})


    #Endpoint to fetch a specific patient
    @app.route("/api/doctor/patient/<int:patient_id>", methods=["GET"])
    @roles_required("doctor")
    def get_patient(patient_id):
        doctor = Doctor.query.filter_by(user_id=current_user.id).first()
        if not doctor:
            return jsonify({"message": "Doctor profile not found"}), 404

        # Check if this patient is assigned to the doctor
        patient_ids = [appt.patient_id for appt in Appointment.query.filter_by(doctor_id=doctor.id).all()]
        if patient_id not in patient_ids:
            return jsonify({"message": "Patient not assigned to this doctor"}), 403

        patient = Patient.query.get_or_404(patient_id)
        return jsonify({"patient": patient.to_dict()})

    #Add endpoint to fetch appointments of a specific patient
    @app.route("/api/doctor/patient/<int:patient_id>/appointments", methods=["GET"])
    @roles_required("doctor")
    def get_patient_appointments(patient_id):
        doctor = Doctor.query.filter_by(user_id=current_user.id).first()
        if not doctor:
            return jsonify({"message": "Doctor profile not found"}), 404

        # Get appointments for this doctor and patient
        appointments = Appointment.query.filter_by(doctor_id=doctor.id, patient_id=patient_id).order_by(Appointment.date.desc()).all()

        result = []
        for appt in appointments:
            doc_name = appt.doctor.full_name if appt.doctor else "N/A"
            department = appt.doctor.specialization.name if appt.doctor and appt.doctor.specialization else "N/A"
            treatment = appt.treatment
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

        return jsonify({"appointments": result})

    
    # Get a specific doctor's public info (for patient view)
    @app.route("/api/doctors/<int:doctor_id>", methods=["GET"])
    def get_doctor_public(doctor_id):
        doctor = Doctor.query.get_or_404(doctor_id)

        doctor_data = doctor.to_dict()

        # Parse availability JSON safely
        availability = {}
        if doctor.availability_json:
            try:
                availability = json.loads(doctor.availability_json)
            except json.JSONDecodeError:
                availability = {}

        doctor_data["availability"] = availability

        return jsonify(doctor_data), 200

    @app.route("/api/logout", methods=["POST"])
    def api_logout():
        logout_user()
        session.clear()
        return jsonify({"message": "Logged out successfully"}), 200







