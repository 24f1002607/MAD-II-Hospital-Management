import TopBar from '../Common/TopBar.js';

export default {
  name: "EditPatientHistory",
  components: { TopBar },

  data() {
    return {
      patient: null,
      appointment: null,
      form: {
        visit_type: "",
        tests_done: "",
        diagnosis: "",
        prescription: "",
        medicines: ""
      },
      visitTypes: [
        "Routine Checkup",
        "Emergency",
        "Follow-up",
        "Consultation",
        "Other"
      ],
      treatmentDates: {
        created_at: null,
        updated_at: null
      },
      loading: true,
    };
  },

  async mounted() {
    const patientId = this.$route.params.patientId;
    const appointmentId = parseInt(this.$route.params.appointmentId);

    try {
      const patientRes = await fetch(`/api/doctor/patient/${patientId}`);
      if (!patientRes.ok) throw new Error("Failed to fetch patient info");
      const patientData = await patientRes.json();
      this.patient = patientData.patient;

      const apptRes = await fetch(`/api/doctor/patient/${patientId}/appointments`);
      if (!apptRes.ok) throw new Error("Failed to fetch appointments");
      const apptData = await apptRes.json();

      this.appointment = apptData.appointments.find(a => a.id === appointmentId);
      if (!this.appointment) throw new Error("Appointment not found");

      if (this.appointment.treatment) {
        const t = this.appointment.treatment;
        this.form.visit_type = t.visit_type || "";
        this.form.tests_done = t.tests_done || "";
        this.form.diagnosis = t.diagnosis || "";
        this.form.prescription = t.prescription || "";
        this.form.medicines = t.medicines || "";

        this.treatmentDates = {
          created_at: t.created_at ? new Date(t.created_at) : null,
          updated_at: t.updated_at ? new Date(t.updated_at) : null
        };

      }
    } catch (err) {
      alert(err.message);
    } finally {
      this.loading = false;
    }
  },

  methods: {
    async save() {
      const appointmentId = this.$route.params.appointmentId;
      try {
        const res = await fetch(`/api/doctor/appointment/${appointmentId}/treatment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.form),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || "Failed to update patient history");
        }
        alert("Patient history updated successfully");
        this.$router.go(-1);
      } catch (err) {
        alert(err.message);
      }
    },
    goBack() {
      this.$router.go(-1);
    }
  },

  template: `
    <div>
      <!-- TopBar Component -->
      <TopBar></TopBar>

      <!-- Sub-bar / Navbar -->
      <div class="sub-bar d-flex justify-content-between align-items-center p-3 bg-primary border-bottom text-white">
        <h4 class="mb-0">Update Patient History</h4>
        <button class="btn btn-light btn-sm" @click="goBack">
          <i class="fas fa-arrow-left"></i> Back
        </button>
      </div>

      <!-- Main Container -->
      <div class="container mt-4">
        <div v-if="loading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div v-else-if="patient && appointment">
          <!-- Patient Details -->
          <div class="card mb-4 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">{{ patient.full_name }}</h5>
              <p class="card-text mb-1"><strong>Date of Birth:</strong> {{ patient.dob || "N/A" }}</p>
              <p class="card-text mb-0"><strong>Department:</strong> {{ appointment.department || "N/A" }}</p>
            </div>
          </div>

          <!-- Treatment Form -->
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">Treatment Details</h5>

              <div v-if="treatmentDates.updated_at || treatmentDates.created_at" class="mb-3 text-muted">
                <small>
                  <div v-if="treatmentDates.created_at">Created: {{ treatmentDates.created_at.toLocaleString() }}</div>
                  <div v-if="treatmentDates.updated_at">Last Updated: {{ treatmentDates.updated_at.toLocaleString() }}</div>
                </small>
              </div>


              <div class="mb-3">
                <label class="form-label"><strong>Visit Type</strong></label>
                <select class="form-select form-select-lg" v-model="form.visit_type">
                  <option disabled value="">Select visit type</option>
                  <option v-for="type in visitTypes" :key="type" :value="type">{{ type }}</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label"><strong>Tests Done</strong></label>
                <textarea class="form-control form-control-lg" rows="2" v-model="form.tests_done" placeholder="Tests performed"></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label"><strong>Diagnosis</strong></label>
                <textarea class="form-control form-control-lg" rows="2" v-model="form.diagnosis" placeholder="Diagnosis details"></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label"><strong>Prescription</strong></label>
                <textarea class="form-control form-control-lg" rows="2" v-model="form.prescription" placeholder="Prescribed treatment"></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label"><strong>Medicines</strong></label>
                <textarea class="form-control form-control-lg" rows="2" v-model="form.medicines" placeholder="Medicines prescribed"></textarea>
              </div>

              <button class="btn btn-primary btn-lg" @click="save">Save</button>
            </div>
          </div>
        </div>

        <div v-else class="alert alert-warning mt-4">
          Unable to load patient or appointment data.
        </div>
      </div>
    </div>
  `
};
