from .database import db
from datetime import datetime
from flask_security import RoleMixin, UserMixin
from sqlalchemy import Enum 
import uuid
import enum

roles_users = db.Table('roles_users',
    db.Column('user_id', db.Integer(), db.ForeignKey('user.id')),
    db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))
)

#Role model for Flask-Security
class Role(db.Model, RoleMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description
        } 

#USER MODEL
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    active = db.Column(db.Boolean, default=True)
    fs_uniquifier = db.Column(db.String(255), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    last_login = db.Column(db.DateTime, nullable=True)
    roles= db.relationship('Role', secondary=roles_users, backref=db.backref('users', lazy='dynamic'))
    
    doctor = db.relationship('Doctor', backref='user', uselist=False)
    patient = db.relationship('Patient', backref='user', uselist=False)

    def __repr__(self):
        return f"<User {self.username} | Email: {self.email}>"

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "active": self.active,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "roles": [role.name for role in self.roles]
        }

    
# SPECIALIZATION / DEPARTMENT MODEL
class Specialization(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)

    doctors = db.relationship('Doctor', backref='specialization')

    @classmethod
    def seed_defaults(cls):
        specializations = [
            {"name": "Cardiology", "description": "Heart-related specialization"},
            {"name": "Orthopedics", "description": "Bone and muscle specialization"},
            {"name": "Gynecology", "description": "Women health specialization"},
            {"name": "Neurology", "description": "Nervous system specialization"},
            {"name": "Oncology", "description": "Cancer specialization"},
            {"name": "Pediatrics", "description": "Child healthcare specialization"},
            {"name": "General Medicine", "description": "General health and medicine"},
        ]

        for spec in specializations:
            existing = cls.query.filter_by(name=spec['name']).first()
            if not existing:
                new_spec = cls(name=spec['name'], description=spec['description'])
                db.session.add(new_spec)

        db.session.commit()

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description
        }



# DOCTOR MODEL
class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False, index=True)
    specialization_id = db.Column(db.Integer, db.ForeignKey('specialization.id'))
    availability_json = db.Column(db.Text)  # JSON stringified availability
    experience_years = db.Column(db.Integer)
    bio = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    appointments = db.relationship('Appointment', backref='doctor', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Doctor {self.full_name} | Specialization: {self.specialization.name if self.specialization else 'None'}>"

    def to_dict(self):
        import json
        availability = {}
        if self.availability_json:
            try:
                availability = json.loads(self.availability_json)
            except Exception as e:
                availability = {}
                
        return {
            "id": self.id,
            "full_name": self.full_name,
            "specialization": self.specialization.name if self.specialization else None,
            "availability": self.availability_json,
            "bio": self.bio,
            "email": self.user.email if self.user else None,
            "active": self.user.active if self.user else None,
            "experience_years": self.experience_years,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# PATIENT MODEL
class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False, index=True)
    dob = db.Column(db.Date)
    gender = db.Column(db.String(10))
    contact_number = db.Column(db.String(20), index=True)
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    appointments = db.relationship('Appointment', backref='patient', lazy='dynamic', cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Patient {self.full_name} | Contact: {self.contact_number}>"

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "dob": self.dob.isoformat() if self.dob else None,
            "gender": self.gender,
            "contact_number": self.contact_number,
            "address": self.address,
            "email": self.user.email if self.user else None,
            "active": self.user.active if self.user else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# APPOINTMENT MODEL
class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)

    status = db.Column(Enum('Booked', 'Completed', 'Cancelled', name='appointment_status'), nullable=False, default='Booked')  # Booked, Completed, Cancelled
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    treatment = db.relationship('Treatment', backref='appointment', uselist=False)
    


    __table_args__ = (db.UniqueConstraint('doctor_id', 'date', 'time', 'status', name='unique_doctor_appointment'),)
    

    def update_status(self, new_status):
        allowed_statuses = ['Booked', 'Completed', 'Cancelled']
        if new_status not in allowed_statuses:
            raise ValueError(f"Invalid status: {new_status}")
        self.status = new_status
        self.updated_at = datetime.utcnow()
    
    def is_currently_booked(self):
        return self.status == 'Booked'

    def is_completed(self):
        return self.status == 'Completed'

    def is_cancelled(self):
        return self.status == 'Cancelled'

    def __repr__(self):
        return f"<Appointment {self.id} | Doctor {self.doctor_id} | Patient {self.patient_id} | {self.date} {self.time} | Status: {self.status}>"
        
    def to_dict(self):
        treatment_dict = {}
        if self.treatment:
            treatment_dict = {
                "diagnosis": self.treatment.diagnosis,
                "prescription": self.treatment.prescription,
                "visit_type": self.treatment.visit_type.name if self.treatment.visit_type else None,
                "tests_done": self.treatment.tests_done,
                "medicines": self.treatment.medicines,
                "treatment_created_at": self.treatment.created_at.isoformat() if self.treatment.created_at else None,
                "treatment_updated_at": self.treatment.updated_at.isoformat() if self.treatment.updated_at else None
            }
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_name": self.patient.full_name if self.patient else None,
            "doctor_id": self.doctor_id,
            "doctor_name": self.doctor.full_name if self.doctor else None,
            "specialization": self.doctor.specialization.name if self.doctor and self.doctor.specialization else None,
            "date": self.date.isoformat(),
            "time": self.time.isoformat(),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            **treatment_dict
        }        

class VisitTypeEnum(enum.Enum):
    ROUTINE_CHECKUP = "Routine Checkup"
    EMERGENCY = "Emergency"
    FOLLOW_UP = "Follow-up"
    CONSULTATION = "Consultation"
    OTHER = "Other"

# TREATMENT MODEL
class Treatment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointment.id'), nullable=False, unique=True)
    visit_type = db.Column(db.Enum(VisitTypeEnum), default=VisitTypeEnum.ROUTINE_CHECKUP)
    tests_done = db.Column(db.Text)
    diagnosis = db.Column(db.Text)
    prescription = db.Column(db.Text)
    medicines = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    def to_dict(self):
        data = {
            "id": self.id,
            
            "appointment_id": self.appointment_id,
            "visit_type": self.visit_type.value,
            "tests_done": self.tests_done,
            "diagnosis": self.diagnosis,
            "prescription": self.prescription,
            "medicines": self.medicines,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }



