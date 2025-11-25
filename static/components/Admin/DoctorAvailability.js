import TopBar from "../Common/TopBar.js";

export default {
  name: "DoctorAvailability",
  components: { TopBar },

  data() {
    const defaultAvailability = {
      Monday: { 
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Tuesday: {
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Wednesday: {
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Thursday: {    
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },

      Friday: {    
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Saturday: {    
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Sunday: {    
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
    };

    return {
      weekDays: Object.keys(defaultAvailability),
      availability: defaultAvailability,
      loading: true,
      doctor: null, // ✅ added
    };
  },

  async mounted() {
    // Fetch current availability and doctor info
    const res = await fetch("/api/doctor/me");
    const data = await res.json();
    this.doctor = data.doctor; // ✅ added

    const defaultAvailability = {
      Monday: { 
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Tuesday: {
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Wednesday: {
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Thursday: {    
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },

      Friday: {    
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Saturday: {    
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      Sunday: {    
        morning: { available: false, start: "08:00", end: "12:00" },
        evening: { available: false, start: "16:00", end: "21:00" },
      },
      
    };

    // Merge fetched availability
    if (data.doctor && data.doctor.availability) {
      const fetched = data.doctor.availability;
      for (const day of Object.keys(defaultAvailability)) {
        if (fetched[day]) {
          if (fetched[day].morning) {
            defaultAvailability[day].morning.available = fetched[day].morning.available ?? false;
            defaultAvailability[day].morning.start = fetched[day].morning.start ?? "08:00";
            defaultAvailability[day].morning.end = fetched[day].morning.end ?? "12:00";
          }
          if (fetched[day].evening) {
            defaultAvailability[day].evening.available = fetched[day].evening.available ?? false;
            defaultAvailability[day].evening.start = fetched[day].evening.start ?? "16:00";
            defaultAvailability[day].evening.end = fetched[day].evening.end ?? "21:00";
          }
        }
      }
    }

    

    this.availability = defaultAvailability;
    this.loading = false;
  },

  methods: {
    toggleSlot(day, slot) {
      this.availability[day][slot].available = !this.availability[day][slot].available;
    },

    async saveAvailability() {
      const res = await fetch("/api/doctor/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: this.availability }),
      });

      if (res.ok) {
        alert("Availability saved successfully.");
        this.$router.push("/doctor/doctor_dashboard");
      } else {
        const err = await res.json();
        alert(err.message || "Failed to save availability.");
      }
    },

    logout() {
      window.location.href = "/logout";
    }
  },

  template: `
    <div>
      <top-bar />
      <div class="bg-light py-2 px-4 d-flex justify-content-between align-items-center border-bottom">
        <div><strong>Welcome, {{ doctor?.full_name }}</strong></div>
        <button class="btn btn-outline-danger btn-sm" @click="logout">Logout</button>
      </div>
      <div class="container mt-5">
        <h3>Set Your Weekly Availability</h3>

        <div v-if="loading">Loading...</div>

        <div v-else>
          <table class="table table-bordered mt-3">
            <thead>
              <tr>
                <th>Day</th>
                <th>8am - 12pm</th>
                <th>4pm - 9pm</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in weekDays" :key="day" v-if="availability[day]">
                <td>{{ day }}</td>
                <td>
                  <button
                    :class="['btn', availability[day].morning.available ? 'btn-success' : 'btn-danger']"
                    @click="toggleSlot(day, 'morning')"
                  >
                    {{ availability[day].morning.available ? 'Available' : 'Unavailable' }}
                    <small class="d-block text-muted">
                      {{ availability[day].morning.start }} - {{ availability[day].morning.end }}
                    </small>
                  </button>
                </td>
                <td>
                  <button
                    :class="['btn', availability[day].evening.available ? 'btn-success' : 'btn-danger']"
                    @click="toggleSlot(day, 'evening')"
                  >
                    {{ availability[day].evening.available ? 'Available' : 'Unavailable' }}
                    <small class="d-block text-muted">
                      {{ availability[day].evening.start }} - {{ availability[day].evening.end }}
                    </small>
                  </button>


                  
                </td>
              </tr>
            </tbody>
          </table>

          <div class="text-end mt-3">
            <button class="btn btn-secondary me-2" @click="$router.push('/doctor/doctor_dashboard')">Cancel</button>
            <button class="btn btn-primary" @click="saveAvailability">Save</button>
          </div>
        </div>
      </div>
    </div>
  `
};
