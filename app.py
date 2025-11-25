from flask import Flask
from application.database import db
from application.models import User, Role, Doctor, Patient, Specialization, Appointment, Treatment
from application.config import LocalDevelopmentConfig

from flask_security import Security, SQLAlchemyUserDatastore
from application.auth_routes import register_auth_routes
from application.admin_routes import register_admin_routes
from application.doctor_routes import register_doctor_routes
from application.patient_routes import register_patient_routes
import enum
from flask.json.provider import DefaultJSONProvider
from application.celery_init import celery_init_app
from celery.schedules import crontab
from application.tasks import monthly_report, daily_reminder

user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security()

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, enum.Enum):
            return obj.value
        return super().default(obj)

def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)

    # Initialize extensions
    db.init_app(app)
    security.init_app(app, user_datastore)

    with app.app_context():
        # Create all tables
        db.create_all()
        Specialization.seed_defaults()

        # Create default roles
        for role_name in ['admin', 'doctor', 'patient']:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(Role(name=role_name))
        db.session.commit()

        # Create default admin if it doesn't exist
        if not User.query.filter_by(email="admin@example.com").first():
            admin_user = user_datastore.create_user(
                username="admin01",
                email="admin@example.com",
                password="24F1002607"
            )
            user_datastore.add_role_to_user(admin_user, 'admin')
            db.session.commit()

    # Register authentication routes (login, register, etc)
    register_auth_routes(app, user_datastore)
    register_admin_routes(app, user_datastore)
    register_doctor_routes(app)
    register_patient_routes(app)

    from application.jobs_routes import register_job_routes
    register_job_routes(app)

    return app

app = create_app()

celery = celery_init_app(app)
celery.autodiscover_tasks(['application.tasks'])

app.json_provider_class = CustomJSONProvider
app.json = CustomJSONProvider(app)

@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    print("setup_periodic_tasks has been called!")
    # Daily Reminder (runs every minute for testing)
    sender.add_periodic_task(
        crontab(minute='*/1'),
        daily_reminder.s(),
        name='send daily reminder at 8am',
    )
    # Monthly Report (runs every minute for testing)
    sender.add_periodic_task(
        crontab(minute='*/1'),
        monthly_report.s(),
        name='send monthly report every minute (demo)',
    )

if __name__ == "__main__":
    app.run(debug=True)
