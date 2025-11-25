import TopBar from '../Common/TopBar.js';

export default {
  name: "PatientHistory",
  components: { TopBar },

  props: ['patientId', 'doctorId'],

  data() {
    return {
      patient: null,
      doctorName: "",
      department: "",
      visits: [],
      loading: true,
      isAdmin: false
    };
  },

  async mounted() {
    this.isAdmin = this.$route.path.startsWith("/admin");

    const patientId = this.patientId || this.$route.params.patientId || this.$route.params.id;
    const doctorId = this.doctorId || this.$route.params.doctorId || null;

    try {
      // Fetch patient info
      const patientRes = await fetch(
        this.isAdmin
          ? `/api/admin/patient/${patientId}`
          : `/api/doctor/patient/${patientId}`,
        { credentials: "include" }
      );

      if (!patientRes.ok) throw new Error(`Failed to fetch patient info: ${patientRes.status}`);
      const patientData = await patientRes.json();

      this.patient = { ...patientData.patient, gender: patientData.patient.gender || "N/A" };

      // Fetch visits
      let visitsUrl;
      if (this.isAdmin) {
        visitsUrl = doctorId
          ? `/api/admin/patient/${patientId}/doctor/${doctorId}/appointments`
          : `/api/admin/patient/${patientId}/appointments`;
      } else {
        visitsUrl = `/api/doctor/patient/${patientId}/appointments`;
      }

      const visitsRes = await fetch(visitsUrl, { credentials: "include" });
      if (!visitsRes.ok) throw new Error(`Failed to fetch visits: ${visitsRes.status}`);
      const visitsData = await visitsRes.json();

      const visits = visitsData.visits || visitsData.appointments || [];
      if (visits.length > 0) {
        const firstAppt = visits[0];
        this.doctorName = firstAppt.doctor_name || "N/A";
        this.department = firstAppt.department || "N/A";
      }

      // Map visits
      this.visits = visits.map(appt => ({
        id: appt.id,
        date: appt.date,
        visit_type: appt.visit_type || "",
        tests_done: appt.tests_done || "",
        diagnosis: appt.diagnosis || "",
        prescription: appt.prescription || "",
        medicines: appt.medicines || "",
        created_at: appt.treatment_created_at ? new Date(appt.treatment_created_at) : null,
        updated_at: appt.treatment_updated_at ? new Date(appt.treatment_updated_at) : null
      }));

    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      this.loading = false;
    }
  },

  methods: {
    goBack() {
      this.$router.go(-1);
    }
  },

  template: `
    <div>
      <top-bar></top-bar>

      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid d-flex justify-content-between align-items-center">
          <span class="navbar-brand mb-0 h4">Patient History</span>
          <button class="btn btn-light btn-sm" @click="goBack">
            <i class="fas fa-arrow-left"></i> Back
          </button>
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
                <div class="col-md-6 mb-2"><strong>Doctor:</strong> {{ doctorName || "N/A" }}</div>
                <div class="col-md-6 mb-2"><strong>Department:</strong> {{ department || "N/A" }}</div>
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
                    <td>{{ visit.visit_type || "N/A" }}</td>
                    <td>{{ visit.tests_done || "N/A" }}</td>
                    <td>{{ visit.diagnosis || "N/A" }}</td>
                    <td>{{ visit.prescription || "N/A" }}</td>
                    <td>{{ visit.medicines || "N/A" }}</td>
                    <td>{{ visit.created_at ? visit.created_at.toLocaleString() : "N/A" }}</td>
                    <td>{{ visit.updated_at ? visit.updated_at.toLocaleString() : "N/A" }}</td>
                  </tr>
                  <tr v-if="visits.length === 0">
                    <td colspan="9" class="text-center text-muted py-3">
                      No past appointments found for this patient.
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
