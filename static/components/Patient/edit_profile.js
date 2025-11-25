import TopBar from "../Common/TopBar.js";

export default {
  name: "EditProfile",
  components: { TopBar },
  data() {
    return {
      formData: {
        full_name: "",
        dob: "",
        gender: "",
        contact_number: "",
        address: "",
        // maybe email / username, but often not editable
      },
      message: "",
      loading: true,
    };
  },
  async mounted() {
    try {
      const res = await fetch("/api/patient/me");
      const data = await res.json();
      const patient = data.patient;

      // Pre-fill the form
      this.formData.full_name = patient.full_name;
      this.formData.dob = patient.dob;
      this.formData.gender = patient.gender;
      this.formData.contact_number = patient.contact_number;
      this.formData.address = patient.address;
    } catch (err) {
      console.error("Failed to fetch patient profile:", err);
      this.message = "Could not load profile data.";
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async saveProfile() {
      this.message = "";
      const { full_name, dob, gender, contact_number, address } = this.formData;

      // Basic validation
      if (!full_name || !dob || !gender || !contact_number || !address) {
        this.message = "All fields are required.";
        return;
      }

      try {
        const res = await fetch("/api/patient/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.formData),
        });
        const data = await res.json();
        if (!res.ok) {
          this.message = data.error || "Failed to update profile.";
        } else {
          alert("Profile updated successfully!");
          this.$router.push("/patient/patient_dashboard");
        }
      } catch (err) {
        console.error("Error updating profile:", err);
        this.message = "An unexpected error occurred.";
      }
    },
    cancelEdit() {
      this.$router.push("/patient/patient_dashboard");
    }
  },
  template: `
    <div>
      <top-bar />
      <div class="container mt-5">
        <div class="card mx-auto" style="max-width: 500px;">
          <div class="card-header bg-primary text-white">
            <h4 class="mb-0">Edit Profile</h4>
          </div>
          <div class="card-body">
            <p v-if="message" class="text-danger">{{ message }}</p>

            <div v-if="!loading">
              <div class="mb-3">
                <label for="full_name" class="form-label">Full Name</label>
                <input type="text" id="full_name" v-model="formData.full_name" class="form-control" />
              </div>

              <div class="mb-3">
                <label for="dob" class="form-label">Date of Birth</label>
                <input type="date" id="dob" v-model="formData.dob" class="form-control" />
              </div>

              <div class="mb-3">
                <label for="gender" class="form-label">Gender</label>
                <select id="gender" v-model="formData.gender" class="form-control">
                  <option disabled value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div class="mb-3">
                <label for="contact_number" class="form-label">Contact Number</label>
                <input type="text" id="contact_number" v-model="formData.contact_number" class="form-control" />
              </div>

              <div class="mb-3">
                <label for="address" class="form-label">Address</label>
                <textarea id="address" v-model="formData.address" class="form-control" rows="3"></textarea>
              </div>

              <div class="d-flex justify-content-end">
                <button class="btn btn-secondary me-2" @click="cancelEdit">Cancel</button>
                <button class="btn btn-primary" @click="saveProfile">Save</button>
              </div>
            </div>

            <div v-else class="text-center">
              <div class="spinner-border" role="status"></div>
              <p class="mt-2">Loading…</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
