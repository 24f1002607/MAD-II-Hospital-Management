import os
import csv
import requests
from datetime import datetime, date, timedelta
from redis import Redis
from celery import shared_task
from application.models import db, User, Patient, Appointment, Treatment, Doctor, Specialization
from application.utils import format_report
from application.mail import send_email
from flask import current_app

# Connect to Redis (same Redis server; using db=2 for caching)
redis_cache = Redis(host="localhost", port=6379, db=2)

EXPORT_FOLDER = "exports"

@shared_task(name="export_patient_history")
def export_patient_history(user_id):
    user = User.query.get(user_id)
    if not user:
        print(f"User with ID {user_id} not found.")
        raise ValueError("User not found.")

    # Find the patient linked to this user
    patient = Patient.query.filter_by(user_id=user_id).first()
    if not patient:
        print(f"No patient profile found for user_id={user_id}.")
        raise ValueError("Patient profile not found.")

    # Create a Redis cache key for this patient's export
    cache_key = f"patient_csv_{user_id}"

    # Check if cached result already exists (only if Redis is available)
    try:
        cached_file = redis_cache.get(cache_key)
        if cached_file:
            cached_path = cached_file.decode()
            print(f"Using cached CSV for user_id={user_id}: {cached_path}")
            # Return just the filename
            return os.path.basename(cached_path)
    except Exception:
        # Redis not available, continue without cache
        pass

    print(f"Generating new CSV for user_id={user_id}...")

    # Generate a unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{user.username}_history_{timestamp}.csv"
    file_path = os.path.join(EXPORT_FOLDER, filename)
    os.makedirs(EXPORT_FOLDER, exist_ok=True)

    # Create CSV and write headers
    with open(file_path, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow([
            "Visit Date",
            "Doctor",
            "Department",
            "Visit Type",
            "Tests Done",
            "Diagnosis",
            "Prescription",
            "Medicines",
            "Created At",
            "Last Updated"
        ])

        # Fetch all appointments for this patient
        appointments = (
            db.session.query(Appointment, Doctor, Specialization)
            .join(Doctor, Appointment.doctor_id == Doctor.id)
            .join(Specialization, Doctor.specialization_id == Specialization.id)
            .filter(Appointment.patient_id == patient.id)
            .order_by(Appointment.date)
            .all()
        )

        for appointment, doctor, specialization in appointments:
            # Get treatment for this appointment (one-to-one relationship)
            treatment = Treatment.query.filter_by(appointment_id=appointment.id).first()
            
            if treatment:
                # Write row with treatment data
                writer.writerow([
                    appointment.date.strftime("%Y-%m-%d %H:%M") if appointment.date else "N/A",
                    doctor.full_name if doctor else "N/A",
                    specialization.name if specialization else "N/A",
                    treatment.visit_type.value if treatment.visit_type else "N/A",
                    treatment.tests_done or "N/A",
                    treatment.diagnosis or "N/A",
                    treatment.prescription or "N/A",
                    treatment.medicines or "N/A",
                    treatment.created_at.strftime("%Y-%m-%d %H:%M") if treatment.created_at else "N/A",
                    treatment.updated_at.strftime("%Y-%m-%d %H:%M") if treatment.updated_at else "N/A",
                ])
            else:
                # If no treatment, write a row with N/A for treatment columns
                writer.writerow([
                    appointment.date.strftime("%Y-%m-%d %H:%M") if appointment.date else "N/A",
                    doctor.full_name if doctor else "N/A",
                    specialization.name if specialization else "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                    "N/A",
                ])

    # Cache the file path for 10 minutes (600 seconds) - only if Redis is available
    try:
        redis_cache.setex(cache_key, 600, file_path)
        print(f"Cached new export for user_id={user_id} (expires in 10 minutes).")
    except Exception:
        # Redis not available, skip caching
        pass

    # Return just the filename
    return filename


@shared_task(ignore_results=False, name="monthly_report")
def monthly_report():
    """Send monthly appointment reports to all doctors."""

    # Use current UTC datetime
    today = datetime.utcnow()

    # Compute first and last day of current month
    first_day = datetime(today.year, today.month, 1)
    if today.month == 12:
        last_day = datetime(today.year + 1, 1, 1)
    else:
        last_day = datetime(today.year, today.month + 1, 1)

    doctors = Doctor.query.all()

    for doctor in doctors:
        # Fetch appointments for this doctor in current month
        appointments = (
            Appointment.query
            .filter(
                Appointment.doctor_id == doctor.id,
                Appointment.date >= first_day,
                Appointment.date < last_day
            )
            .order_by(Appointment.date, Appointment.time)
            .all()
        )

        # Build a list of appointment dictionaries
        appointments_list = []
        for appt in appointments:
            patient_name = appt.patient.full_name if appt.patient else "N/A"
            # Get treatment info if exists
            treatment = Treatment.query.filter_by(appointment_id=appt.id).first()
            appointments_list.append({
                "id": appt.id,
                "patient_name": patient_name,
                "date": appt.date.strftime("%Y-%m-%d") if appt.date else "N/A",
                "time": appt.time.strftime("%H:%M") if appt.time else "N/A",
                "status": appt.status or "N/A",
                "treatment": {
                    "visit_type": treatment.visit_type.value if treatment and treatment.visit_type else "N/A",
                    "diagnosis": treatment.diagnosis if treatment else "N/A",
                    "prescription": treatment.prescription if treatment else "N/A",
                    "medicines": treatment.medicines if treatment else "N/A"
                } if treatment else None
            })

        # Prepare template data
        data = {
            "generation_date": today.strftime("%Y-%m-%d %H:%M:%S"),
            "doctor_name": doctor.full_name,
            "appointments": appointments_list
        }

        # Render HTML with correct data
        message = format_report("templates/mail_details.html", data)

        # Send email if doctor has a registered email
        if doctor.user and doctor.user.email:
            send_email(
                to_address=doctor.user.email,
                subject=f"Monthly Appointment Report - {today.strftime('%B %Y')}",
                message=message,
                content="html"
            )

    return "Monthly reports sent"



@shared_task(name="daily_reminder")
def daily_reminder():
    """
    Send daily appointment reminders for the next day via Google Chat.
    """

    # Calculate tomorrow's date
    tomorrow = date.today() + timedelta(days=1)

    # Fetch appointments for tomorrow that are booked
    appointments = Appointment.query.filter_by(date=tomorrow, status="Booked").all()

    # Get webhook URL from Flask config
    webhook_url = current_app.config.get("GOOGLE_CHAT_WEBHOOK_URL")
    if not webhook_url:
        print("Google Chat webhook URL is not configured.")
        return "Webhook not configured."

    reminders_sent = 0

    for appt in appointments:
        patient_name = appt.patient.full_name if appt.patient else "Patient"
        doctor_name = appt.doctor.full_name if appt.doctor else "Doctor"
        time_str = appt.time.strftime("%H:%M") if appt.time else "N/A"

        message = (
            f"👋 Hello {patient_name},\n"
            f"This is a reminder for your appointment with Dr. {doctor_name} tomorrow at {time_str}.\n"
            f"Please arrive on time."
        )

        try:
            response = requests.post(webhook_url, json={"text": message})
            if response.status_code == 200:
                reminders_sent += 1
            else:
                print(f"Failed to send reminder for appointment {appt.id}: {response.text}")
        except Exception as e:
            print(f"Error sending reminder for appointment {appt.id}: {e}")

    print(f"Total reminders sent: {reminders_sent}")
    return f"Sent reminders for {reminders_sent} appointments."