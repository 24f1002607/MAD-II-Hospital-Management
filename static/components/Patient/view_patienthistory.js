import TopBar from '../Common/TopBar.js';

export default {
  name: "ViewPatientHistory",
  components: { TopBar },

  data() {
    return {
      patient: null,
      visits: [],
      loading: true,
      exporting: false,
      jobId: null,
      toasts: []
    };
  },

  async mounted() {
    try {
      const res = await fetch("/api/patient/history");
      if (!res.ok) throw new Error(`Failed to fetch patient history: ${res.status}`);
      const data = await res.json();

      if (data.appointments?.length > 0) {
        const firstAppt = data.appointments[0];
        this.patient = {
          full_name: firstAppt.patient_name || "N/A",
          dob: firstAppt.patient_dob || "N/A",
          gender: firstAppt.patient_gender || "N/A"
        };
      } else {
        this.patient = { full_name: "N/A", dob: "N/A", gender: "N/A" };
      }

      this.visits = (data.appointments || []).map(appt => {
        const treatment = appt.treatment || {};
        return {
          id: appt.id,
          date: appt.date,
          doctorName: appt.doctor_name || "N/A",
          department: appt.department || "N/A",
          visit_type: treatment.visit_type || "",
          tests_done: treatment.tests_done || "",
          diagnosis: treatment.diagnosis || "",
          prescription: treatment.prescription || "",
          medicines: treatment.medicines || "",
          created_at: treatment.created_at ? new Date(treatment.created_at) : null,
          updated_at: treatment.updated_at ? new Date(treatment.updated_at) : null
        };
      });

    } catch (err) {
      console.error("Error loading patient history:", err);
      this.patient = { full_name: "N/A", dob: "N/A", gender: "N/A" };
      this.visits = [];
    } finally {
      this.loading = false;
    }
  },

  methods: {
    goBack() { this.$router.go(-1); },

    addToast(title, message, bgClass = "bg-info") {
      this.toasts.push({ title, message, bgClass });
      setTimeout(() => { this.toasts.shift(); }, 5000);
    },

    removeToast(index) { this.toasts.splice(index, 1); },

    async exportCSV() {
      try {
        this.exporting = true;
        const res = await fetch("/api/export-history", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start export.");

        // Check if export completed synchronously (Celery not available)
        if (data.ready && data.successful) {
          this.exporting = false;
          const fileName = data.file_path.split("/").pop();
          window.open(`/api/download/${fileName}`, "_blank");
          this.addToast("Export Complete", `CSV ready for download: ${fileName}`, "bg-success");
          return;
        }

        this.jobId = data.job_id;
        this.addToast("Export Started", "Your CSV export has started.", "bg-info");

        const poll = setInterval(async () => {
          const statusRes = await fetch(`/api/history_result/${this.jobId}`);
          const statusData = await statusRes.json();

          if (statusData.ready) {
            clearInterval(poll);
            this.exporting = false;

            if (statusData.successful) {
              const fileName = statusData.file_path.split("/").pop();
              window.open(`/api/download/${fileName}`, "_blank");
              this.addToast("Export Complete", `CSV ready for download: ${fileName}`, "bg-success");
            } else {
              const errorMsg = statusData.error || "Error generating CSV.";
              this.addToast("Export Failed", errorMsg, "bg-danger");
            }
          }
        }, 3000);

      } catch (err) {
        console.error("Error triggering export:", err);
        this.exporting = false;
        this.addToast("Error", err.message || "Failed to start export.", "bg-danger");
      }
    }
  },


  template: `
    <div>
      <top-bar></top-bar>

      <!-- Toast container -->
      <div class="position-fixed top-0 end-0 p-3" style="z-index: 1055;">
        <div
          v-for="(toast, index) in toasts"
          :key="index"
          class="toast align-items-center text-white border-0 show"
          :class="toast.bgClass"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div class="d-flex">
            <div class="toast-body">
              <strong>{{ toast.title }}</strong> - {{ toast.message }}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="removeToast(index)"></button>
          </div>
        </div>
      </div>




      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid d-flex justify-content-between align-items-center">
          <span class="navbar-brand mb-0 h4">Patient History</span>
          
          <div>
            <button 
              class="btn btn-light btn-sm me-2" 
              @click="exportCSV" 
              :disabled="exporting"
            >
              <i class="fas fa-file-csv"></i>
              <span v-if="!exporting">Export CSV</span>
              <span v-else>
                <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                Exporting...
              </span>
            </button>
            
            <button class="btn btn-light btn-sm" @click="goBack">
              <i class="fas fa-arrow-left"></i> Back
            </button>
          </div>
        </div>
      </nav>

      <div class="container mt-4">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3">Loading patient history...</p>
        </div>

        <div v-else>
          <!-- Patient Info -->
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title text-primary mb-3">
                <i class="fas fa-user-circle"></i> {{ patient.full_name }}
              </h5>
              <div class="row">
                <div class="col-md-6 mb-2"><strong>Date of Birth:</strong> {{ patient.dob || "N/A" }}</div>
                <div class="col-md-6 mb-2"><strong>Gender:</strong> {{ patient.gender || "N/A" }}</div>
              </div>
            </div>
          </div>

          <!-- Visit History Table -->
          <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
              <strong>Visit History</strong>
            </div>
            <div class="card-body p-0">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Doctor</th>
                    <th>Department</th>
                    <th>Visit Type</th>
                    <th>Tests Done</th>
                    <th>Diagnosis</th>
                    <th>Prescription</th>
                    <th>Medicines</th>
                    <th>Created At</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(visit, index) in visits" :key="visit.id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ visit.date ? new Date(visit.date).toLocaleDateString() : "N/A" }}</td>
                    <td>{{ visit.doctorName }}</td>
                    <td>{{ visit.department }}</td>
                    <td>{{ visit.visit_type || "N/A" }}</td>
                    <td>{{ visit.tests_done || "N/A" }}</td>
                    <td>{{ visit.diagnosis || "N/A" }}</td>
                    <td>{{ visit.prescription || "N/A" }}</td>
                    <td>{{ visit.medicines || "N/A" }}</td>
                    <td>{{ visit.created_at ? visit.created_at.toLocaleString() : "N/A" }}</td>
                    <td>{{ visit.updated_at ? visit.updated_at.toLocaleString() : "N/A" }}</td>
                  </tr>
                  <tr v-if="visits.length === 0">
                    <td colspan="11" class="text-center text-muted py-3">
                      No past appointments found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
