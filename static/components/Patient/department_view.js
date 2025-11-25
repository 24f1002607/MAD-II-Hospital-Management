export default {
  name: "DepartmentView",
  data() {
    return {
      department: null,
      doctors: [],
      loading: true,
    };
  },
  async mounted() {
    const deptId = this.$route.params.id;

    try {
      const res = await fetch(`/api/departments/${deptId}`);
      const data = await res.json();
      this.department = data.department;
      this.doctors = data.doctors;
    } catch (err) {
      console.error("Failed to fetch department info:", err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    checkAvailability(doctorId) {
      this.$router.push(`/patient/book/${doctorId}`);
    },
    viewDetails(doctorId) {
      this.$router.push(`/patient/doctor/${doctorId}`);
    }
  },
  template: `
    <div class="container mt-4" v-if="!loading && department">
      <h2>Department of {{ department.name }}</h2>
      <p class="text-muted">{{ department.description }}</p>

      <div v-if="doctors.length > 0" class="row mt-4">
        <div class="col-md-4 mb-3" v-for="doc in doctors" :key="doc.id">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">Dr. {{ doc.full_name }}</h5>
              <p class="card-text">
                <strong>Experience:</strong> {{ doc.experience_years }} yrs<br>
                <strong>Email:</strong> {{ doc.email }}<br>
                <strong>Status:</strong> 
                  <span :class="doc.active ? 'text-success' : 'text-danger'">
                    {{ doc.active ? 'Active' : 'Blocked' }}
                  </span>
              </p>
              <div class="d-flex justify-content-between">
                <button class="btn btn-primary btn-sm" @click="checkAvailability(doc.id)">
                  Check Availability
                </button>
                <button class="btn btn-outline-secondary btn-sm" @click="viewDetails(doc.id)">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="alert alert-info mt-4">
        No doctors found in this department.
      </div>
    </div>

    <div v-else class="text-center mt-5">
      <div class="spinner-border"></div>
      <p>Loading department information...</p>
    </div>
  `
};
