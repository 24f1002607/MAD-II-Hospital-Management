import Home from './components/home.js';
import Login from './components/Common/Login.js';
import Register from './components/Common/Register.js';
import admin_dashboard from './components/Admin/admin_dashboard.js';
import doctordetails_admin from './components/Admin/doctordetails_admin.js';
import New_doctor from './components/Admin/New_doctor.js';  
import EditDoctorForm from './components/Admin/EditDoctorForm.js';
import doctor_dashboard from './components/Admin/doctor_dashboard.js';
import DoctorAvailability from './components/Admin/DoctorAvailability.js';
import EditPatientInfo from './components/Admin/EditPatientInfo.js';
import PatientHistory from './components/Admin/PatientHistory.js';
import EditPatientHistory from './components/Admin/EditPatientHistory.js';
import EditPatientTreatment from './components/Admin/EditPatientTreatment.js';  
import patient_dashboard from './components/Patient/patient_dashboard.js';  
import BookAppointment from './components/Patient/book_appointment.js';
import department_details from './components/Patient/department_details.js';
import doctor_details from './components/Patient/doctor_details.js';
import department_view from './components/Patient/department_view.js';
import edit_profile from './components/Patient/edit_profile.js';
import view_patienthistory from './components/Patient/view_patienthistory.js';

// Define routes
const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  
  // Admin routes
  { path: '/admin/admin_dashboard', component: admin_dashboard },
  { path: '/admin/doctor/:id', component: doctordetails_admin },
  { path: '/admin/new_doctor', component: New_doctor },
  { path: '/admin/edit_doctor/:id', component: EditDoctorForm },
  { path: '/admin/patient/:id/history', component: PatientHistory }, // Admin search history
  { 
    path: '/admin/patient/:patientId/doctor/:doctorId/history', 
    name: 'admin_patient_history', 
    component: PatientHistory, 
    props: true 
  }, // Admin table view history
  { path: '/admin/patient/:patientId/edit_info', component: EditPatientInfo },
  { path: '/admin/patient/:patientId/edit_treatment', name:'EditPatientTreatment', component: EditPatientTreatment, props: true },

  // Doctor routes
  { path: '/doctor/doctor_dashboard', component: doctor_dashboard },
  { path: '/doctor/availability', component: DoctorAvailability },
  { path: '/doctor/patient_history/:patientId', component: PatientHistory },
  { path: '/doctor/edit_history/:patientId/:appointmentId', component: EditPatientHistory },

  // Patient routes
  { path: '/patient/patient_dashboard', component: patient_dashboard, meta: { requiresAuth: true, role: 'patient' } },
  { path: '/patient/book/:id', component: BookAppointment },
  { path: '/patient/departments/:id', component: department_details },
  { path: '/patient/doctor/:id', component: doctor_details },
  { path: '/patient/departments', component: department_view },
  { path: '/patient/profile', component: edit_profile, meta: { requiresAuth: true, role: 'patient' } },
  { path: '/patient/:patientId/history', name: 'view_patienthistory', component: view_patienthistory, props: true }
];

// Create the router
const router = new VueRouter({
  mode: 'history',
  routes
});

// Mount the Vue app
new Vue({
  el: '#app',
  router
});
