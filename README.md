# MAD-II Hospital Management System (HMS)

A comprehensive Hospital Management System built with Flask, featuring role-based access control for Admin, Doctor, and Patient users. The system includes appointment booking, patient history management, treatment tracking, and automated email notifications.

## 🚀 Features

- **Role-Based Access Control**: Admin, Doctor, and Patient roles with different permissions
- **Appointment Management**: Book, view, and manage appointments
- **Patient History**: Track patient medical history and treatments
- **Doctor Management**: Admin can add, edit, and manage doctor profiles
- **Email Notifications**: Automated daily reminders and monthly reports using Celery
- **Email Testing**: MailHog integration for development email testing

## 📁 Project Structure

```
MAD-II-HMS/
│
├── app.py                          # Main Flask application entry point
├── celery_config.py                # Celery configuration
├── requirements.txt                # Python dependencies
├── README.md                       # Project documentation
├── MailHog                         # MailHog binary for email testing
│
├── application/                    # Main application package
│   ├── __init__.py
│   ├── config.py                   # Application configuration
│   ├── database.py                 # Database initialization
│   ├── models.py                   # SQLAlchemy models (User, Doctor, Patient, etc.)
│   ├── auth_routes.py              # Authentication routes (login, register)
│   ├── admin_routes.py             # Admin-specific routes
│   ├── doctor_routes.py            # Doctor-specific routes
│   ├── patient_routes.py           # Patient-specific routes
│   ├── jobs_routes.py              # Background job routes
│   ├── mail.py                     # Email sending functionality
│   ├── tasks.py                    # Celery background tasks
│   ├── celery_init.py              # Celery initialization
│   └── utils.py                    # Utility functions
│
├── static/                         # Static files (CSS, JS, Images)
│   ├── components/
│   │   ├── Admin/                  # Admin dashboard components
│   │   │   ├── admin_dashboard.js
│   │   │   ├── doctor_dashboard.js
│   │   │   ├── DoctorAvailability.js
│   │   │   ├── doctordetails_admin.js
│   │   │   ├── EditDoctorForm.js
│   │   │   ├── EditPatientHistory.js
│   │   │   ├── EditPatientInfo.js
│   │   │   ├── EditPatientTreatment.js
│   │   │   ├── New_doctor.js
│   │   │   └── PatientHistory.js
│   │   ├── Common/                 # Shared components
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── TopBar.js
│   │   ├── Patient/                # Patient dashboard components
│   │   │   ├── book_appointment.js
│   │   │   ├── department_details.js
│   │   │   ├── department_view.js
│   │   │   ├── doctor_details.js
│   │   │   ├── edit_profile.js
│   │   │   ├── patient_dashboard.js
│   │   │   └── view_patienthistory.js
│   │   └── home.js
│   ├── Images/                     # Image assets
│   │   ├── allpagebackground.jpg
│   │   ├── hospitalart.png
│   │   ├── landingpageart.jpg
│   │   └── medicalbackgroundart.jpg
│   ├── script.js
│   └── styles/
│       └── base.css
│
├── templates/                      # HTML templates
│   ├── index.html
│   └── mail_details.html
│
├── instance/                       # Instance-specific files
│   └── healixcare.db              # SQLite database
│
└── venv/                          # Python virtual environment
```

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.12+
- Redis server
- Virtual environment (recommended)

### Installation Steps

1. **Activate Virtual Environment**
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start Redis Server**
   ```bash
   redis-server
   # If you get a connection error, stop existing Redis:
   # sudo systemctl stop redis
   ```

4. **Start MailHog (for email testing)**
   ```bash
   ./MailHog
   # Or if installed system-wide:
   # mailhog
   ```
   - Web UI: http://localhost:8025
   - SMTP: localhost:1025

5. **Start Celery Worker** (in a new terminal)
   ```bash
   celery -A app.celery worker --loglevel=info
   ```

6. **Start Celery Beat** (in another terminal)
   ```bash
   celery -A app.celery beat --loglevel=debug
   ```

7. **Run Flask Application** (in another terminal)
   ```bash
   python app.py
   ```

## 🔐 Default Login Credentials

### Admin
- **Email**: `admin@example.com`
- **Password**: `24F1002607`

### Doctor
- **Email**: `suparna@abc.com`
- **Password**: `12345`

### Patient
- **Email**: `pinky@pqr.com`
- **Password**: `12345`

## 🌐 Port Configuration

- **Flask Application**: http://localhost:5000
- **MailHog Web UI**: http://localhost:8025
- **MailHog SMTP**: localhost:1025
- **Redis**: localhost:6379

## 📦 Key Dependencies

- **Flask 3.1.1** - Web framework
- **Flask-Security-Too 5.6.2** - Authentication and authorization
- **Flask-SQLAlchemy 3.1.1** - ORM
- **Celery 5.5.3** - Background task processing
- **Redis 6.2.0** - Message broker for Celery
- **SQLAlchemy 2.0.42** - Database toolkit