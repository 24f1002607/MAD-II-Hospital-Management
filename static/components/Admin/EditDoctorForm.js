import TopBar from "../Common/TopBar.js";
export default {
  name: "EditDoctorForm",
    components: { TopBar },

  data() {
    return {
      doctor: null,
      specializations: [],
      form: {
        full_name: "",
        specialization_id: null,
        experience_years: 0,
        bio: "",  
      }
    };
  },
  async mounted() {
    const doctorId = this.$route.params.id;

    // Fetch doctor data
    const res = await fetch(`/api/admin/doctor/${doctorId}`);
    const data = await res.json();
    this.doctor = data.doctor;

    // Pre-fill form
    this.form.full_name = data.doctor.full_name;
    this.form.specialization_id = data.doctor.specialization_id;
    this.form.experience_years = data.doctor.experience_years || 0;
    this.form.bio = data.doctor.bio || "";

    // Fetch specializations
    const specRes = await fetch("/api/specializations");
    this.specializations = await specRes.json();
  },
  methods: {
    async submitEdit() {
      const doctorId = this.$route.params.id;

      const res = await fetch(`/api/admin/doctor/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.form)
      });

      if (res.ok) {
        alert("Doctor updated successfully");
        this.$router.push("/admin/admin_dashboard");
      } else {
        const data = await res.json();
        alert(data.message || "Update failed");
      }
    }
  },
  template: `
    <div class="container mt-4">
      <h3>Edit Doctor</h3>
      <div v-if="doctor">
        <div class="mb-3">
          <label class="form-label">Full Name</label>
          <input class="form-control" v-model="form.full_name" />
        </div>

        <div class="mb-3">
          <label class="form-label">Specialization</label>
          <select class="form-select" v-model="form.specialization_id">
            <option disabled value="">Select Specialization</option>
            <option v-for="spec in specializations" :key="spec.id" :value="spec.id">
              {{ spec.name }}
            </option>
          </select>
        </div>

        <div class="mb-3">
          <label class="form-label">Experience (Years)</label>
          <input type="number" class="form-control" v-model="form.experience_years" />
        </div>

        <div class="mb-3">
            <label class="form-label">Bio</label>
            <textarea class="form-control" v-model="form.bio" rows="3" placeholder="Doctor's short bio (optional)"></textarea>
        </div>


        

        <button class="btn btn-primary" @click="submitEdit">Save Changes</button>
      </div>
      <div v-else>
        Loading doctor data...
      </div>
    </div>
  `
};
