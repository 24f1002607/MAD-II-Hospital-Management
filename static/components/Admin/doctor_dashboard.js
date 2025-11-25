import DoctorAvailability from "./DoctorAvailability.js";
import TopBar from "../Common/TopBar.js";

export default {
  name: "DoctorDashboard",
  components: {
    DoctorAvailability,
    TopBar,
  },

  data() {
    return {
      doctor: null,
      appointments: [],
      patients: [],
    };
  },

  async mounted() {
    const res = await fetch("/api/doctor/me");
    const data = await res.json();
    this.doctor = data.doctor;

    const apptRes = await fetch("/api/doctor/appointments");
    const apptData = await apptRes.json();
    this.appointments = apptData || []; // All appointments

    const patRes = await fetch("/api/doctor/patients");
    const patData = await patRes.json();
    this.patients = patData.patients || [];
  },

  methods: {
    async markComplete(appointmentId) {
      await fetch(`/api/doctor/appointment/${appointmentId}/complete`, { method: "POST" });
      location.reload();
    },
    async cancelAppointment(appointmentId) {
      await fetch(`/api/doctor/appointment/${appointmentId}/cancel`, { method: "POST" });
      location.reload();
    },
    logout() {
      window.location.href = "/logout";
    },
    goToEditHistory(patientId, appointmentId) {
      this.$router.push(`/doctor/edit_history/${patientId}/${appointmentId}`);
    },
    goToPatientHistory(patientId) {
      this.$router.push(`/doctor/patient_history/${patientId}`);
    },
    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return "-";
      const dt = new Date(dateTimeStr);
      return dt.toLocaleString();
    }
  },

  template: `
    <div>
      <top-bar></top-bar>

      <div class="sub-bar d-flex justify-content-between align-items-center p-3 bg-primary border-bottom text-white">
        <h4 class="mb-0">Welcome, {{ doctor?.full_name }}</h4>
        <button class="btn btn-danger btn-sm" @click="logout">Logout</button>
      </div>

      <div class="dashboard-container p-4">

        <!-- All Appointments Card -->
        <div class="card mb-4 shadow-sm">
          <div class="card-header">
            <h5 class="mb-0">All Appointments</h5>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>S.No</th>
                  <th>Patient Name</th>
                  <th>Appointment Date/Time</th> 
                  <th>Status</th>
                  <th>Updated On</th>
                  <th>Patient History</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(appt, index) in appointments" :key="appt.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ appt.patient_name }}</td>
                  <td>{{ formatDateTime(appt.date + 'T' +appt.time) }}</td>
                  <td>
                    <span 
                      :class="{
                        'text-success': appt.status === 'Completed',
                        'text-danger': appt.status === 'Cancelled',
                        'text-primary': appt.status === 'Booked'
                      }">
                      {{ appt.status }}
                    </span>
                  </td>
                  <td>{{ formatDateTime(appt.updated_at) }}</td>
                  <td>
                    <button class="btn btn-sm btn-warning" @click="goToEditHistory(appt.patient_id, appt.id)">Update</button>
                  </td>
                  <td class="action-buttons">
                    <button v-if="appt.status === 'Booked'" class="btn btn-sm btn-success me-2" @click="markComplete(appt.id)">Mark Complete</button>
                    <button v-if="appt.status === 'Booked'" class="btn btn-sm btn-danger" @click="cancelAppointment(appt.id)">Cancel</button>
                  </td>
                </tr>
                <tr v-if="appointments.length === 0">
                  <td colspan="6" class="text-center">No appointments found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Assigned Patients Card -->
        <div class="card mb-4 shadow-sm">
          <div class="card-header">
            <h5 class="mb-0">Assigned Patients</h5>
          </div>
          <div class="card-body">
            <div class="row row-cols-1 row-cols-md-2 g-4">
              <div v-for="patient in patients" :key="patient.id" class="col">
                <div class="card h-100">
                  <div class="card-body d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">{{ patient.full_name }}</h5>
                    <button class="btn btn-outline-primary btn-sm" @click="goToPatientHistory(patient.id)">
                      View History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Provide Availability Button -->
        <div class="text-center mt-4">
          <button class="btn btn-warning" @click="$router.push('/doctor/availability')">
            Provide Availability
          </button>
        </div>

      </div>
    </div>
  `
};
