import TopBar from '../Common/TopBar.js';

export default {
  name: "EditPatientInfo",
  components: { TopBar },

  data() {
    return {
      patientId: null,
      patient: null,
      form: {
        full_name: "",
        dob: "",
        contact_number: "",
        address: ""
      },
      loading: true,
      error: null
    };
  },

  async mounted() {
    // Get patientId from route
    this.patientId = this.$route.params.patientId;

    if (!this.patientId) {
      this.error = "No patient ID provided.";
      this.loading = false;
      return;
    }

    try {
      const res = await fetch(`/api/admin/patient/${this.patientId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      this.patient = data.patient;

      if (!this.patient) {
        this.error = "Patient not found.";
        return;
      }

      // Populate form fields
      this.form.full_name = this.patient.full_name || "";
      this.form.dob = this.patient.dob || "";
      this.form.contact_number = this.patient.contact_number || "";
      this.form.address = this.patient.address || "";
    } catch (err) {
      console.error("Failed to load patient data:", err);
      this.error = "Failed to load patient data.";
    } finally {
      this.loading = false;
    }
  },

  methods: {
    async savePatientInfo() {
      try {
        const res = await fetch(`/api/admin/patient/${this.patientId}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.form)
        });

        if (res.ok) {
          alert("✅ Patient info updated successfully.");
          this.$router.push("/admin/admin_dashboard"); // Redirect after saving
        } else {
          const err = await res.json();
          alert(err.message || "Error updating patient info.");
        }
      } catch (err) {
        console.error("Error updating patient info:", err);
        alert("An unexpected error occurred.");
      }
    },

    goBack() {
      this.$router.back(); // Navigate back
    }
  },

  template: `
    <div>
      <!-- Top Navbar -->
      <TopBar title="Edit Patient Information">
        <template v-slot:right>
          <button class="btn btn-light btn-sm" @click="goBack">
            <i class="fas fa-arrow-left"></i> Back
          </button>
        </template>
      </TopBar>

      <div class="container mt-4">
        <!-- Loading Spinner -->
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3">Loading patient details...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert alert-danger text-center">
          {{ error }}
          <div class="mt-3">
            <button class="btn btn-secondary" @click="goBack">Go Back</button>
          </div>
        </div>

        <!-- Edit Form -->
        <div v-else-if="patient" class="card shadow-sm mx-auto" style="max-width: 700px;">
          <div class="card-header bg-primary text-white">
            <strong>Update Details for {{ patient.full_name }}</strong>
          </div>
          <div class="card-body">
            <form @submit.prevent="savePatientInfo">
              <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" v-model="form.full_name" required />
              </div>

              <div class="mb-3">
                <label class="form-label">Date of Birth</label>
                <input type="date" class="form-control" v-model="form.dob" />
              </div>

              <div class="mb-3">
                <label class="form-label">Contact Number</label>
                <input type="text" class="form-control" v-model="form.contact_number" />
              </div>

              <div class="mb-3">
                <label class="form-label">Address</label>
                <textarea class="form-control" rows="3" v-model="form.address"></textarea>
              </div>

              <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-secondary me-2" @click="goBack">
                  Cancel
                </button>
                <button type="submit" class="btn btn-success">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- No Patient Case -->
        <div v-else class="text-center text-muted py-5">
          No patient information available.
        </div>
      </div>
    </div>
  `
};
