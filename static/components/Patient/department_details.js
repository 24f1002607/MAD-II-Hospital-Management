import TopBar from "../Common/TopBar.js";

export default {
  name: "DepartmentDetails",
  components: { TopBar },
  data() {
    return {
      department: null,
      doctors: [],
      loading: true,
      patientName: localStorage.getItem("username") || "Patient"
    };
  },
  async mounted() {
    const deptId = this.$route.params.id;
    try {
      const deptRes = await fetch(`/api/departments/${deptId}`);
      this.department = await deptRes.json();

      const docRes = await fetch(`/api/departments/${deptId}/doctors`);
      this.doctors = await docRes.json();
    } catch (err) {
      console.error("Error loading department details:", err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    viewDoctorDetails(docId) {
      this.$router.push(`/patient/doctor/${docId}`);
    },
    logout() {
      fetch("/api/logout", { method: "POST" }).then(() => {
        localStorage.clear();
        this.$router.push("/login");
      });
    },
    goToDashboard() {
      this.$router.push("/patient/patient_dashboard");
    }
  },
  template: `
    <div>
      <top-bar />
      <div class="sub-bar bg-success text-white p-3 d-flex justify-content-between align-items-center">
        <h4>Welcome, {{ patientName }}</h4>
        <div>
          <button class="btn btn-light me-2" @click="goToDashboard">Back to Dashboard</button>
          <button class="btn btn-danger" @click="logout">Logout</button>
        </div>
      </div>

      <div class="container mt-4" v-if="!loading && department">
        <div class="card mb-4">
          <div class="card-header bg-info text-white">
            <h4 class="mb-0">Department of {{ department.name }}</h4>
          </div>
          <div class="card-body">
            <p>{{ department.description }}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-header bg-secondary text-white">
            <h5 class="mb-0">Available Doctors</h5>
          </div>
          <div class="card-body p-0">
            <table class="table table-striped mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Experience</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in doctors" :key="doc.id">
                  <td>{{ doc.full_name }}</td>
                  <td>{{ doc.experience_years }} yrs</td>
                  <td>{{ doc.email }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary" @click="viewDoctorDetails(doc.id)">View Details</button>
                  </td>
                </tr>
                <tr v-if="doctors.length === 0">
                  <td colspan="4" class="text-center">No doctors found in this department.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else class="text-center mt-5">
        <div class="spinner-border" role="status"></div>
        <p class="mt-2">Loading department info...</p>
      </div>
    </div>
  `
};
