export default {
  name: "EditPatientTreatment",
  props: ["patientId", "onClose"], // Only need patientId
  data() {
    return {
      patient: null, // Will hold full patient info
      appointments: [],
      selectedAppointmentId: null,
      form: {
        diagnosis: "",
        prescription: "",
        notes: "",
        next_visit: ""
      },
      loading: true,
      error: null
    };
  },
  async mounted() {
    try {
      // Fetch all patients assigned to this doctor
      const patientsRes = await fetch(`/api/doctor/patients`);
      if (!patientsRes.ok) throw new Error("Failed to fetch patients");

      const patientsData = await patientsRes.json();
      this.patient = patientsData.patients.find(p => p.id === this.patientId);

      if (!this.patient) {
        this.error = "Patient not found.";
        return;
      }

      // Fetch appointments for this patient
      const apptRes = await fetch(`/api/doctor/patient/${this.patientId}/appointments`);
      if (!apptRes.ok) throw new Error("Failed to fetch appointments");

      const apptData = await apptRes.json();
      this.appointments = apptData.appointments || [];

      if (this.appointments.length > 0) {
        const latest = this.appointments[0];
        this.selectedAppointmentId = latest.id;

        if (latest.treatment) {
          this.form = { ...latest.treatment };
        }
      }
    } catch (err) {
      console.error("Failed to load patient or appointments:", err);
      this.error = "Failed to load data. Please try again.";
    } finally {
      this.loading = false;
    }
  },
  watch: {
    selectedAppointmentId(newId) {
      const selected = this.appointments.find(appt => appt.id === newId);
      if (selected && selected.treatment) {
        this.form = { ...selected.treatment };
      } else {
        this.form = {
          diagnosis: "",
          prescription: "",
          notes: "",
          next_visit: ""
        };
      }
    }
  },
  methods: {
    async saveTreatment() {
      if (!this.selectedAppointmentId) return;

      try {
        const res = await fetch(`/api/doctor/appointment/${this.selectedAppointmentId}/treatment`, {
          method: "POST", // Use POST since your Flask route is @app.route(..., methods=["POST"])
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.form)
        });

        if (res.ok) {
          alert("Treatment updated successfully.");
          this.onClose();
        } else {
          const err = await res.json();
          alert(err.message || "Error updating treatment.");
        }
      } catch (err) {
        console.error("Error saving treatment:", err);
        alert("An unexpected error occurred.");
      }
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    },
    formatTime(timeStr) {
      const time = new Date(`1970-01-01T${timeStr}`);
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  },
  template: `
    <div class="modal-overlay" v-if="!loading">
      <div class="modal-card" v-if="patient">
        <h4>Edit Treatment for {{ patient.full_name }}</h4>

        <div class="mb-2">
          <label>Select Appointment</label>
          <select class="form-select" v-model="selectedAppointmentId">
            <option v-for="appt in appointments" :value="appt.id" :key="appt.id">
              {{ formatDate(appt.date) }} @ {{ formatTime(appt.time) }}
            </option>
          </select>
        </div>

        <label>Diagnosis</label>
        <textarea class="form-control" v-model="form.diagnosis" rows="2"></textarea>

        <label class="mt-2">Prescription</label>
        <textarea class="form-control" v-model="form.prescription" rows="2"></textarea>

        <label class="mt-2">Notes</label>
        <textarea class="form-control" v-model="form.notes" rows="2"></textarea>

        <label class="mt-2">Next Visit Date</label>
        <input type="date" class="form-control" v-model="form.next_visit" />

        <div class="mt-3 d-flex justify-content-end">
          <button class="btn btn-secondary me-2" @click="onClose">Cancel</button>
          <button class="btn btn-success" @click="saveTreatment">Save</button>
        </div>
      </div>

      <div v-else>
        <p>{{ error || "Patient not found." }}</p>
        <button class="btn btn-secondary" @click="onClose">Close</button>
      </div>
    </div>

    <div v-else>
      <p>Loading patient data...</p>
    </div>
  `
};
