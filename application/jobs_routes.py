# application/jobs_routes.py
import os
from flask import jsonify, request, send_file
from celery.result import AsyncResult
from flask_login import current_user
from application.tasks import export_patient_history, monthly_report, daily_reminder  # adjust path if needed

def register_job_routes(app):
    # -------------------------------
    #  Trigger async CSV export
    # -------------------------------
    @app.route("/api/export-history", methods=["POST"])
    def export_history():
        if not current_user.is_authenticated:
            return jsonify({"error": "User not authenticated"}), 401

        try:
            # Start Celery async job
            result = export_patient_history.delay(current_user.id)
            return jsonify({
                "job_id": result.id,
                "message": "Export started. You'll be notified once it's ready."
            }), 202
        except Exception as celery_error:
            # If Celery/Redis not available, run synchronously
            try:
                # Run with Flask app context
                with app.app_context():
                    filename = export_patient_history(current_user.id)
                return jsonify({
                    "job_id": "sync",
                    "message": "Export completed.",
                    "file_path": filename,
                    "ready": True,
                    "successful": True
                }), 200
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                print(f"Export error: {error_trace}")
                return jsonify({"error": str(e)}), 500

    # -------------------------------
    #  Check job status
    # -------------------------------
    @app.route("/api/history_result/<job_id>", methods=["GET"])
    def history_result(job_id):
        result = AsyncResult(job_id)

        if result.ready():
            if result.successful():
                # Task returns just the filename
                filename = result.result
                return jsonify({
                    "ready": True,
                    "successful": True,
                    "file_path": filename
                }), 200
            else:
                # Task failed
                error_msg = str(result.result) if result.result else "Export failed"
                return jsonify({
                    "ready": True,
                    "successful": False,
                    "error": error_msg
                }), 200

        return jsonify({
            "ready": False,
            "status": result.status
        }), 200

    # -------------------------------
    #  Download exported CSV
    # -------------------------------
    @app.route("/api/download/<path:filename>", methods=["GET"])
    def download_export(filename):
        file_path = os.path.join("exports", filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        return jsonify({"error": "File not found"}), 404


    @app.route("/api/mail")
    def send_monthly_report():
        res = monthly_report.delay()
        return jsonify({"task_id": res.id, "status": "Monthly report task started."})


    @app.route("/api/reminder", methods=["GET"])
    def send_daily_reminder():
        res = daily_reminder.delay()
        return jsonify({"task_id": res.id, "status": "Daily reminder task started."})