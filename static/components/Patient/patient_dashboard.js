
import TopBar from "../Common/TopBar.js";


export default {
  name: "PatientDashboard",
  components: { TopBar },
  data() {
    return {
      departments: [],
      appointments: [],
      patient: null,
      // 🔍 Search-related state
      searchSpecialization: "",
      searchDate: "",
      searchResults: [],
      loadingSearch: false,
    };
  },
  async mounted() {
    const res = await fetch("/api/patient/me");
    const data = await res.json();
    this.patient = data.patient;

    const deptRes = await fetch("/api/patient/departments");
    this.departments = await deptRes.json();

    const apptRes = await fetch("/api/patient/patient_dashboard");
    const apptData = await apptRes.json();
    this.appointments = apptData.appointments || [];
  },
  methods: {
    viewDepartment(dept) {
      this.$router.push(`/patient/departments/${dept.id}`);
    },
    async cancelAppointment(id) {
      if (confirm("Are you sure you want to cancel this appointment?")) {
        await fetch(`/api/appointments/${id}/cancel`, { method: "POST" });
        const res = await fetch("/api/patient/patient_dashboard");
        const data = await res.json();
        this.appointments = data.appointments || [];
      }
    },
    logout() {
      fetch("/api/logout", { method: "POST" }).then(() => {
        this.$router.push("/login");
      });
    },
    goToHistory(patientId) {
      this.$router.push({ name: "view_patienthistory", params: { patientId } });
    },

    // Search doctors by specialization and date
    async searchDoctors() {
      if (!this.searchDate) return alert("Please select a date for availability.");
      this.loadingSearch = true;

      const params = new URLSearchParams();
      if (this.searchSpecialization) params.append("specialization", this.searchSpecialization);
      params.append("date", this.searchDate);

      try {
        const res = await fetch(`/api/patient/search_doctors?${params.toString()}`);
        const data = await res.json();
        // data should return an array of doctors with their slots
        this.searchResults = data; // each doctor: { doctor_id, name, specialization, slots: next available date }
      } catch (err) {
        console.error(err);
        this.searchResults = [];
      } finally {
        this.loadingSearch = false;
      }
    },

    // Book appointment with selected doctor
    bookDoctor(doctorId, slot) {
      // slot: next available date
      this.$router.push(`/patient/book/${doctorId}?slot=${slot}&date=${this.searchDate}`);
    }
  },
  template: `
    <div>
      <top-bar />
      <div class="sub-bar bg-success text-white p-3 d-flex justify-content-between align-items-center">
        <div v-if="patient">
          <h4>Welcome, {{ patient.full_name }}</h4>
        </div>
        <div v-if="patient">
          <button class="btn btn-warning me-2" @click="$router.push('/patient/profile')">Edit Profile</button>
          <button class="btn btn-primary me-2" @click="goToHistory(patient?.id)">History</button>
          <button class="btn btn-danger" @click="logout">Logout</button>
        </div>
        <div v-else>
          <h4>Loading patient info...</h4>
        </div>
      </div>

      <div class="container mt-4">

        <!-- Search Doctors Section -->
        <div class="card mb-4">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0">Search Doctors</h5>
          </div>
          <div class="card-body">
            <div class="row g-3 align-items-end">
              <div class="col-md-5">
                <label class="form-label">Specialization</label>
                <select v-model="searchSpecialization" class="form-select">
                  <option value="">All Specializations</option>
                  <option v-for="dept in departments" :key="dept.id" :value="dept.name">{{ dept.name }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Available On</label>
                <input type="date" v-model="searchDate" class="form-control" />
              </div>
              <div class="col-md-3">
                <button class="btn btn-primary w-100" @click="searchDoctors">Search</button>
              </div>
            </div>
          </div>

          <div v-if="loadingSearch" class="text-center p-3">Searching...</div>

          <div v-else-if="searchResults.length > 0" class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Doctor Name</th>
                  <th>Specialization</th>
                  <th>Next Available</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in searchResults" :key="doc.doctor_id">
                  <td>{{ doc.name }}</td>
                  <td>{{ doc.specialization }}</td>
                  <td>
                    <span v-if="doc.next_available_date" class="text-success">
                      {{ doc.next_available_date }}
                    </span>
                    <span v-else class="text-danger">
                      Fully booked
                    </span>
                  </td>
                  <td>
                    <button
                      v-if="doc.next_available_date"
                      class="btn btn-primary btn-sm"
                      @click="bookDoctor(doc.doctor_id)"
                    >
                      Book
                    </button>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="text-center p-3 text-muted">
            No doctors found. Try adjusting your search.
          </div>
        </div>

        <!-- Departments -->
        <div class="card mb-4">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Departments</h5>
          </div>
          <div class="card-body p-0">
            <table class="table table-striped mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dept in departments" :key="dept.id">
                  <td>{{ dept.name }}</td>
                  <td>{{ dept.description }}</td>
                  <td>
                    <button class="btn btn-outline-primary btn-sm" @click="viewDepartment(dept)">View Details</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- All Appointments -->
        <div class="card">
          <div class="card-header bg-secondary text-white">
            <h5 class="mb-0">All Appointments</h5>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th>S No.</th>
                  <th>Doctor Name</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(appt, index) in appointments" :key="appt.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ appt.doctor_name }}</td>
                  <td>{{ appt.specialization }}</td>
                  <td>{{ appt.date }}</td>
                  <td>{{ appt.time }}</td>
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
                  <td>
                    <button class="btn btn-danger btn-sm" 
                      @click="cancelAppointment(appt.id)" 
                      :disabled="appt.status !== 'Booked'">
                      Cancel
                    </button>
                  </td>
                </tr>
                <tr v-if="appointments.length === 0">
                  <td colspan="7" class="text-center">No appointments found</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `
};
