from flask import request, jsonify, session
from flask_security import roles_required, current_user
from flask_login import logout_user
from application.models import Appointment, Specialization, Doctor, Patient
from application.database import db
from datetime import datetime, timedelta
from sqlalchemy import and_
import json


def register_patient_routes(app):

    @app.route("/api/patient/me", methods=["GET"])
    @roles_required("patient")
    def get_logged_in_patient():
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({"message": "Patient profile not found"}), 404
        return jsonify({"patient": patient.to_dict()})



    @app.route("/api/patient/patient_dashboard", methods=["GET"])
    @roles_required("patient")
    def patient_dashboard():
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({"message": "Patient profile not found"}), 404

        appointments = Appointment.query.filter_by(patient_id=patient.id).order_by(Appointment.date.desc()).all()

        result = []
        for appt in appointments:
            result.append({
                "id": appt.id,
                "doctor_name": appt.doctor.full_name if appt.doctor else "N/A",
                "specialization": appt.doctor.specialization.name if appt.doctor and appt.doctor.specialization else "N/A",
                "date": appt.date.isoformat(),
                "time": appt.time.isoformat(),
                "status": appt.status
            })

        return jsonify({"appointments": result})

    @app.route("/api/patient/departments", methods=["GET"])
    @roles_required("patient")
    def get_departments():
        specializations = Specialization.query.all()
        return jsonify([spec.to_dict() for spec in specializations])

    @app.route("/api/patient/departments/<int:department_id>/doctors", methods=["GET"])
    @roles_required("patient")
    def get_doctors_by_department(department_id):
        doctors = Doctor.query.filter_by(specialization_id=department_id).all()
        return jsonify([doc.to_dict() for doc in doctors])

    # Department details
    @app.route("/api/departments/<int:department_id>", methods=["GET"])
    def get_department(department_id):
        dept = Specialization.query.get(department_id)
        if not dept:
            return jsonify({"message": "Department not found"}), 404
        return jsonify(dept.to_dict())

    # Doctors in department
    @app.route("/api/departments/<int:department_id>/doctors", methods=["GET"])
    def get_doctors_for_department(department_id):
        doctors = Doctor.query.filter_by(specialization_id=department_id).all()
        return jsonify([doc.to_dict() for doc in doctors])

    #Book appointment
    @app.route("/api/patient/book_appointment", methods=["POST"])
    @roles_required("patient")
    def book_appointment():
        data = request.get_json()
        doctor_id = data.get("doctor_id")
        date_str = data.get("date")
        time_str = data.get("time")

        if not doctor_id or not date_str or not time_str:
            return jsonify({"message": "Missing required fields"}), 400

        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"message": "Invalid date format"}), 400

        try:
            time_obj = datetime.strptime(time_str, "%H:%M:%S").time()
        except ValueError:
            return jsonify({"message": "Invalid time format"}), 400

        # Get patient
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({"message": "Patient profile not found"}), 404

        # Get doctor
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return jsonify({"message": "Doctor not found"}), 404

        # Parse doctor availability
        try:
            availability = json.loads(doctor.availability_json or "{}")
        except json.JSONDecodeError:
            return jsonify({"message": "Invalid doctor availability format"}), 400

        weekday = date.strftime("%A")  # e.g., "Monday"
        available_slots = availability.get(weekday, {})

        allowed = False

        # Iterate through each slot ("morning", "evening", etc.)
        for slot_name, slot_data in available_slots.items():
            if not isinstance(slot_data, dict):
                continue
            if not slot_data.get("available"):
                continue

            try:
                slot_start = datetime.strptime(slot_data["start"], "%H:%M").time()
                slot_end = datetime.strptime(slot_data["end"], "%H:%M").time()
            except Exception:
                continue

            if slot_start <= time_obj <= slot_end:
                allowed = True
                break

        if not allowed:
            return jsonify({
                "message": f"Doctor is not available on {weekday} at {time_str}"
            }), 400

        # Check for booking conflicts
        conflict = Appointment.query.filter_by(
            doctor_id=doctor_id,
            date=date,
            time=time_obj,
            status="Booked"
        ).first()
        if conflict:
            return jsonify({"message": "Slot already booked"}), 409

        # Create appointment
        new_appointment = Appointment(
            patient_id=patient.id,
            doctor_id=doctor_id,
            date=date,
            time=time_obj,
            status="Booked"
        )
        db.session.add(new_appointment)
        db.session.commit()

        return jsonify({
            "message": "Appointment booked successfully",
            "appointment": new_appointment.to_dict()
        }), 201


  

    
    @app.route("/api/patient/profile", methods=["GET"])
    @roles_required("patient")
    def get_patient_profile():
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({"message": "Patient profile not found"}), 404
        return jsonify(patient.to_dict())

    @app.route("/api/patient/profile", methods=["PUT"])
    @roles_required("patient")
    def update_patient_profile():
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({"message": "Patient profile not found"}), 404

        data = request.get_json()

        # Convert DOB string to Python date object
        dob_str = data.get("dob")
        if dob_str:
            try:
                patient.dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"error": "Invalid date format"}), 400

        patient.full_name = data.get("full_name", patient.full_name)
        patient.gender = data.get("gender", patient.gender)
        patient.contact_number = data.get("contact_number", patient.contact_number)
        patient.address = data.get("address", patient.address)

        db.session.commit()
        return jsonify({"message": "Profile updated successfully", "patient": patient.to_dict()})

    @app.route("/api/patient/appointments/history", methods=["GET"])
    @roles_required("patient")
    def appointment_history():
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        if not patient:
            return jsonify({"message": "Patient profile not found"}), 404

        past_appointments = Appointment.query.filter(
            Appointment.patient_id == patient.id,
            Appointment.date < datetime.today()
        ).order_by(Appointment.date.desc()).all()

        return jsonify([appt.to_dict() for appt in past_appointments])

    @app.route("/api/appointments/<int:appointment_id>/cancel", methods=["POST"])
    @roles_required("patient")
    def cancel_patient_appointment(appointment_id):
        patient = Patient.query.filter_by(user_id=current_user.id).first()
        appointment = Appointment.query.get_or_404(appointment_id)

        if appointment.patient_id != patient.id:
            return jsonify({"message": "Unauthorized"}), 403

        appointment.status = 'Cancelled'
        db.session.commit()
        return jsonify({"message": "Appointment cancelled"})

    @app.route("/api/doctors/<int:doctor_id>", methods=["GET"])
    def get_doctor_by_id(doctor_id):
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return jsonify({"message": "Doctor not found"}), 404
        return jsonify(doctor.to_dict())


    @app.route("/api/patient/history", methods=["GET"])
    @roles_required("patient")
    def patient_history():
        patient = Patient.query.filter_by(user_id=current_user.id).first_or_404()

        appointments = (
            Appointment.query.filter_by(patient_id=patient.id)
            .order_by(Appointment.date.desc())
            .all()
        )

        result = []
        for appt in appointments:
            treatment = appt.treatment
            result.append({
                "id": appt.id,
                "date": appt.date.isoformat() if appt.date else None,
                "doctor_name": appt.doctor.full_name if appt.doctor else "N/A",
                "department": (
                    appt.doctor.specialization.name
                    if appt.doctor and appt.doctor.specialization
                    else "N/A"
                ),
                "patient_name": patient.full_name,
                "patient_dob": patient.dob.isoformat() if patient.dob else None,
                "patient_gender": patient.gender,
                "treatment": {
                    "diagnosis": getattr(treatment, "diagnosis", ""),
                    "prescription": getattr(treatment, "prescription", ""),
                    "visit_type": getattr(treatment, "visit_type", ""),
                    "tests_done": getattr(treatment, "tests_done", ""),
                    "medicines": getattr(treatment, "medicines", ""),
                    "created_at": treatment.created_at.isoformat()
                    if getattr(treatment, "created_at", None)
                    else None,
                    "updated_at": treatment.updated_at.isoformat()
                    if getattr(treatment, "updated_at", None)
                    else None,
                } if treatment else None,
            })

        return jsonify({"appointments": result})



    @app.route("/api/logout", methods=["POST"])
    def logout_patient():
        if current_user.is_authenticated:
            logout_user()
            session.clear()
            return jsonify({"message": "Logged out successfully"})
        return jsonify({"message": "No user logged in"}), 400


    @app.route("/api/patient/doctor_availability/<int:doctor_id>", methods=["GET"])
    @roles_required("patient")
    def get_doctor_availability(doctor_id):
        try:
            doctor = Doctor.query.get(doctor_id)
            if not doctor:
                return jsonify({"message": "Doctor not found"}), 404

            # Parse availability - default to empty dict if None or invalid
            availability = {}
            if doctor.availability_json:
                try:
                    availability = json.loads(doctor.availability_json)
                except (json.JSONDecodeError, TypeError):
                    availability = {}
        except Exception as e:
            return jsonify({"message": f"Error loading doctor: {str(e)}"}), 500

        # Get all booked appointments for the next 7 days
        today = datetime.today().date()
        next_week = today + timedelta(days=7)
        upcoming_appointments = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.date >= today,
            Appointment.date <= next_week,
            Appointment.status == "Booked"
        ).all()

        # Convert appointments to a map for quick lookup
        booked_map = {}
        for appt in upcoming_appointments:
            day_name = appt.date.strftime("%A")
            if day_name not in booked_map:
                booked_map[day_name] = []
            booked_map[day_name].append(appt.time)

        # Mark slots as booked if an appointment time falls within start–end
        for day, slots in availability.items():
            for slot_name, slot_info in slots.items():
                slot_info["booked"] = False
                if not slot_info.get("available"):
                    continue
                try:
                    start = datetime.strptime(slot_info["start"], "%H:%M").time()
                    end = datetime.strptime(slot_info["end"], "%H:%M").time()
                except Exception:
                    continue

                for booked_day, booked_times in booked_map.items():
                    if booked_day == day:
                        for booked_time in booked_times:
                            if start <= booked_time <= end:
                                slot_info["booked"] = True
                                break

        return jsonify({
            "doctor": {
                "id": doctor.id,
                "full_name": doctor.full_name,
                "availability": availability
            }
        }), 200



    @app.route("/api/patient/search_doctors", methods=["GET"])
    @roles_required("patient")
    def search_doctors():
        specialization_name = request.args.get("specialization", "").strip()
        date_str = request.args.get("date", "").strip()

        # Default to today's date if not provided
        today = datetime.today().date()
        if date_str:
            try:
                today = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"message": "Invalid date format"}), 400

        # Filter by specialization
        query = Doctor.query
        if specialization_name:
            query = query.join(Doctor.specialization).filter(
                db.func.lower(Specialization.name) == specialization_name.lower()
            )

        doctors = query.all()
        results = []

        for doc in doctors:
            next_available_date = None

            # Load doctor's availability JSON
            try:
                availability = json.loads(doc.availability_json or "{}")
            except json.JSONDecodeError:
                availability = {}

            # Look ahead 14 days
            for i in range(14):
                date_to_check = today + timedelta(days=i)
                day_name = date_to_check.strftime("%A")
                day_slots = availability.get(day_name, {})

                for slot_name, slot_info in day_slots.items():
                    if not slot_info.get("available"):
                        continue

                    start = datetime.strptime(slot_info["start"], "%H:%M").time()
                    end = datetime.strptime(slot_info["end"], "%H:%M").time()

                    # Check if any appointment already booked within slot
                    conflict = Appointment.query.filter(
                        Appointment.doctor_id == doc.id,
                        Appointment.date == date_to_check,
                        Appointment.time >= start,
                        Appointment.time <= end,
                        Appointment.status == "Booked"
                    ).first()

                    if not conflict:
                        next_available_date = date_to_check
                        break
                if next_available_date:
                    break

            results.append({
                "doctor_id": doc.id,
                "name": doc.full_name,
                "specialization": doc.specialization.name if doc.specialization else None,
                "next_available_date": (
                    next_available_date.strftime("%Y-%m-%d")
                    if next_available_date else None
                )
            })

        return jsonify(results), 200
