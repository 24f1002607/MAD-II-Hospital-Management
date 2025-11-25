import New_doctor from './New_doctor.js';
import TopBar from '../Common/TopBar.js';

export default {
  name: "admin_dashboard",
  components: { 'new-doctor-form': New_doctor, TopBar },

  data() {
    return {
      doctors: [],
      patients: [],
      upcomingAppointments: [],
      pastAppointments: [],
      searchQuery: "",
      searchResults: [],
    };
  },

  mounted() {
    this.fetchDashboardData();
  },

  methods: {
    async fetchDashboardData() {
      try {
        const res = await fetch("/api/admin/admin_dashboard");
        const data = await res.json();
        this.upcomingAppointments = data.upcoming_appointments || [];
        this.pastAppointments = data.past_appointments || [];
        this.doctors = data.doctors || [];
        this.patients = data.patients || [];
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    },

    async performSearch() {
      if (!this.searchQuery.trim()) return;
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(this.searchQuery)}`, { credentials: "include" });
        const data = await res.json();
        this.searchResults = [
          ...(data.doctors || []).map(doc => ({ id: doc.id, name: doc.full_name, type: "doctor" })),
          ...(data.patients || []).map(pat => ({ id: pat.id, name: pat.full_name, type: "patient" })),
        ];
        const modalEl = document.getElementById("searchResultsModal");
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      } catch (err) {
        console.error("Search error:", err);
      }
    },

    navigateToResult(result) {
      const modalEl = document.getElementById("searchResultsModal");
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      if (result.type === "doctor") this.$router.push(`/admin/doctor/${result.id}`);
      else if (result.type === "patient") this.$router.push(`/admin/patient/${result.id}/history`);
    },

    editDoctor(doc) { this.$router.push(`/admin/edit_doctor/${doc.id}`); },
    editPatientInfo(id) { this.$router.push(`/admin/patient/${id}/edit_info`); },

    async deleteDoctor(id) {
      if (!confirm("Are you sure you want to delete this doctor?")) return;
      try {
        const res = await fetch(`/api/admin/doctor/${id}`, { method: "DELETE" });
        if (res.ok) this.fetchDashboardData();
        else alert((await res.json()).message || "Failed to delete doctor.");
      } catch (err) { console.error(err); }
    },

    async toggleDoctorBlock(doc) {
      const action = doc.active ? "block" : "unblock";
      try {
        const res = await fetch(`/api/admin/doctor/${doc.id}/${action}`, { method: "POST" });
        if (res.ok) this.fetchDashboardData();
      } catch (err) { console.error(err); }
    },

    viewPatientHistory(patientId, doctorId) {
      this.$router.push(`/admin/patient/${patientId}/doctor/${doctorId}/history`);
    },

    async deletePatient(id) {
      if (!confirm("Are you sure you want to delete this patient?")) return;
      try {
        const res = await fetch(`/api/admin/patient/${id}`, { method: "DELETE" });
        if (res.ok) this.fetchDashboardData();
        else alert((await res.json()).message || "Failed to delete patient.");
      } catch (err) { console.error(err); }
    },

    async togglePatientBlock(pat) {
      const action = pat.active ? "block" : "unblock";
      try {
        const res = await fetch(`/api/admin/patient/${pat.id}/${action}`, { method: "POST" });
        if (res.ok) this.fetchDashboardData();
      } catch (err) { console.error(err); }
    },

    async logout() {
      try {
        const res = await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
        if (res.ok) this.$router.push("/login");
        else alert("Logout failed.");
      } catch (err) { console.error(err); }
    }
  },

  template: `
  <div>
    <top-bar></top-bar>

    <div class="sub-bar d-flex justify-content-between align-items-center p-3 bg-primary border-bottom text-white">
      <h4 class="mb-0">Welcome, Admin!</h4>
      
      <div class="d-flex mb-3">
        <input
          type="text"
          class="form-control me-2"
          placeholder="Search doctors or patients"
          v-model="searchQuery"
          @keyup.enter="performSearch"
        />
        <button class="btn btn-warning text-primary" @click="performSearch">Search</button>
        <button class="btn btn-danger btn-sm ms-3" @click="logout">Logout</button>
      </div>
    </div>

    <!-- Search Results Modal -->
    <div class="modal fade" id="searchResultsModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Search Results</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <ul class="list-group">
              <li
                v-for="result in searchResults"
                :key="result.id"
                class="list-group-item d-flex justify-content-between align-items-center list-group-item-action"
                @click="navigateToResult(result)"
                style="cursor: pointer;"
              >
                {{ result.name }}
                <span class="badge bg-info text-white">{{ result.type }}</span>
              </li>
              <li v-if="searchResults.length === 0" class="list-group-item text-muted text-center">
                No results found.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-container p-4">
      <!-- Doctors Card -->
      <div class="card mb-4 shadow-sm">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Registered Doctors</h5>
          <button class="btn btn-sm btn-primary" @click="$router.push('/admin/new_doctor')">+ Add Doctor</button>
        </div>
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Name</th>
                <th>Specialization</th>
                <th>Experience (years)</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="doctors.length === 0">
                <td colspan="6" class="text-center text-muted py-3">No doctors found.</td>
              </tr>
              <tr v-for="doc in doctors" :key="doc.id">
                <td>{{ doc.full_name }}</td>
                <td>{{ doc.specialization }}</td>
                <td>{{ doc.experience_years }}</td>
                <td>{{ doc.email }}</td>
                <td>
                  <span v-if="!doc.active" class="text-danger">Blocked</span>
                  <span v-else class="text-success">Active</span>
                </td>
                <td class="action-buttons">
                  <button class="edit-btn" @click="editDoctor(doc)">Edit</button>
                  <button class="delete-btn" @click="deleteDoctor(doc.id)">Delete</button>
                  <button class="block-btn" @click="toggleDoctorBlock(doc)">
                    {{ doc.active ? "Block" : "Unblock" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Patients Card -->
      <div class="card mb-4 shadow-sm">
        <div class="card-header">
          <h5 class="mb-0">Registered Patients</h5>
        </div>
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Name</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Address</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pat in patients" :key="pat.id">
                <td>{{ pat.full_name }}</td>
                <td>{{ pat.dob }}</td>
                <td>{{ pat.gender }}</td>
                <td>{{ pat.address }}</td>
                <td>{{ pat.contact_number }}</td>
                <td>
                  <span v-if="!pat.active" class="text-danger">Blocked</span>
                  <span v-else class="text-success">Active</span>
                </td>
                <td class="action-buttons">
                  <button class="edit-btn" @click="editPatientInfo(pat.id)">Edit Info</button>
                  <button class="delete-btn" @click="deletePatient(pat.id)">Delete</button>
                  <button class="block-btn" @click="togglePatientBlock(pat)">
                    {{ pat.active ? "Block" : "Unblock" }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Appointments Cards -->
      <div class="card shadow-sm mb-4">
        <div class="card-header bg-success text-white">
          <h5 class="mb-0">Upcoming Appointments</h5>
        </div>
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Patient</th>
                <th>Patient History</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="upcomingAppointments.length === 0">
                <td colspan="7" class="text-center text-muted py-3">No upcoming appointments.</td>
              </tr>
              <tr v-for="appt in upcomingAppointments" :key="appt.id">
                <td>{{ appt.date }}</td>
                <td>{{ appt.time }}</td>
                <td>{{ appt.doctor_name }}</td>
                <td>{{ appt.specialization }}</td>
                <td>{{ appt.patient_name }}</td>
                <td>
                  <button class="btn btn-sm btn-primary" @click="viewPatientHistory(appt.patient_id, appt.doctor_id)">
                    View History
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-header bg-secondary text-white">
          <h5 class="mb-0">Past Appointments</h5>
        </div>
        <div class="card-body p-0">
          <table class="table table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Patient</th>
                <th>Patient History</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pastAppointments.length === 0">
                <td colspan="7" class="text-center text-muted py-3">No past appointments found.</td>
              </tr>
              <tr v-for="appt in pastAppointments" 
                  :key="'past-' + appt.id"
                  :class="{'table-danger': appt.status === 'Cancelled'}">
                <td>{{ appt.date }}</td>
                <td>{{ appt.time }}</td>
                <td>{{ appt.doctor_name }}</td>
                <td>{{ appt.specialization }}</td>
                <td>{{ appt.patient_name }}</td>
                <td>
                  <button class="btn btn-sm btn-info" @click="viewPatientHistory(appt.patient_id, appt.doctor_id)">
                    View History
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
  `
};
