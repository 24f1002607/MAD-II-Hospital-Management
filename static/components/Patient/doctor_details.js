import TopBar from "../Common/TopBar.js";

export default {
  name: "DoctorDetails",
  components: { TopBar },
  data() {
    return {
      doctor: null,
      loading: true,
      patientName: localStorage.getItem("username") || "Patient"
    };
  },
  async mounted() {
    const doctorId = this.$route.params.id;
    try {
      const res = await fetch(`/api/doctors/${doctorId}`);
      if (!res.ok) throw new Error("Doctor not found");
      this.doctor = await res.json();
    } catch (err) {
      console.error("Error fetching doctor details:", err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    bookNow() {
      this.$router.push(`/patient/book/${this.doctor.id}`);
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

      <div class="container mt-5" v-if="!loading && doctor">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h3>Dr. {{ doctor.full_name }}</h3>
          </div>
          <div class="card-body">
            <p><strong>Specialization:</strong> {{ doctor.specialization }}</p>
            <p><strong>Experience:</strong> {{ doctor.experience_years }} years</p>
            <p><strong>Email:</strong> {{ doctor.email }}</p>
            <p><strong>Bio:</strong></p>
            <p>{{ doctor.bio || 'No bio provided.' }}</p>

            <div class="text-end mt-3">
              <button class="btn btn-success" @click="bookNow">
                Book Appointment
              </button>
            </div>
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
