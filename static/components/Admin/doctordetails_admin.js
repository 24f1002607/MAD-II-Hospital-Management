import TopBar from "../Common/TopBar.js";

export default {
  name: "DoctorDetailsAdmin",
  components: { TopBar },
  data() {
    return {
      doctor: null,
      loading: true,
    };
  },
  async mounted() {
    const doctorId = this.$route.params.id;
    try {
      const res = await fetch(`/api/admin/doctor/${doctorId}`);
      if (!res.ok) throw new Error("Doctor not found");
      const data = await res.json();
      this.doctor = data.doctor; // admin GET returns { "doctor": {...} }
    } catch (err) {
      console.error("Error fetching doctor details:", err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    logout() {
      fetch("/api/admin/logout", { method: "POST" }).then(() => {
        localStorage.clear();
        this.$router.push("/login");
      });
    },
    goToDashboard() {
      this.$router.push("/admin/admin_dashboard");
    },
  },
  template: `
    <div>
      <top-bar />
      
      <div class="sub-bar bg-success text-white p-3 d-flex justify-content-between align-items-center">
        <h4>Welcome, Admin</h4>
        <div>
          <button class="btn btn-light me-2" @click="goToDashboard">Back to Dashboard</button>
          <button class="btn btn-danger" @click="logout">Logout</button>
        </div>
      </div>

      <div class="container mt-5" v-if="!loading && doctor">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h3>Dr. {{ doctor.full_name }}</h3>
          </div>
          <div class="card-body">
            <p><strong>Specialization:</strong> {{ doctor.specialization || 'N/A' }}</p>
            <p><strong>Experience:</strong> {{ doctor.experience_years }} years</p>
            <p><strong>Email:</strong> {{ doctor.email }}</p>
            <p><strong>Bio:</strong></p>
            <p>{{ doctor.bio || 'No bio provided.' }}</p>
          </div>
        </div>
      </div>

      <div v-else class="text-center mt-5">
        <div class="spinner-border"></div>
        <p>Loading doctor profile...</p>
      </div>
    </div>
  `
};
