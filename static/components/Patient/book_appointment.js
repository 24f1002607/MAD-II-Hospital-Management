import TopBar from "../Common/TopBar.js";

export default {
  name: "BookAppointment",
  components: { TopBar },

  data() {
    return {
      doctor: null,
      availability: {},  // always default to object
      selectedDay: "",
      selectedSlot: "",
      weekDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      loading: true,
      error: null,       // new error state
    };
  },

  async mounted() {
    const doctorId = this.$route.params.id;
    try {
      const res = await fetch(`/api/patient/doctor_availability/${doctorId}`);
      if (!res.ok) {
        throw new Error(`Failed to load: ${res.status}`);
      }
      const data = await res.json();

      // Ensure doctor object exists
      this.doctor = data.doctor || {};
      // Ensure availability is always an object
      this.availability = this.doctor.availability
        ? (typeof this.doctor.availability === "string" ? JSON.parse(this.doctor.availability) : this.doctor.availability)
        : {};
    } catch (err) {
      console.error("Error loading doctor availability:", err);
      this.error = "Could not load doctor availability. Please try again later.";
      this.availability = {};  // reset to avoid undefined errors
    } finally {
      this.loading = false;
    }
  },

  methods: {
    isAvailable(day, slot) {
      const slotData = this.availability[day]?.[slot];
      return slotData?.available && !slotData?.booked;
    },

    isBooked(day, slot) {
      const slotData = this.availability[day]?.[slot];
      return slotData?.booked === true;
    },

    selectSlot(day, slot) {
      if (!this.isAvailable(day, slot)) return;
      this.selectedDay = day;
      this.selectedSlot = slot;
    },

    isSelected(day, slot) {
      return this.selectedDay === day && this.selectedSlot === slot;
    },

    async confirmBooking() {
      if (!this.selectedDay || !this.selectedSlot) {
        alert("Please select a valid available slot.");
        return;
      }

      const date = this.getUpcomingDate(this.selectedDay);
      const slotData = this.availability[this.selectedDay][this.selectedSlot];
      const time = slotData?.start ? slotData.start + ":00" : "00:00:00";

      const payload = {
        doctor_id: this.doctor.id,
        date,
        time,
      };

      try {
        const res = await fetch("/api/patient/book_appointment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
          alert("Appointment booked successfully!");
          this.$router.push("/patient/patient_dashboard");
        } else {
          alert(data.message || "Failed to book appointment.");
        }
      } catch (err) {
        console.error("Booking error:", err);
        alert("Failed to book appointment. Please try again.");
      }
    },

    getUpcomingDate(dayName) {
      const today = new Date();
      const jsDayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
      const currentDay = today.getDay();
      const targetDay = jsDayMap[dayName];
      let diff = targetDay - currentDay;
      if (diff <= 0) diff += 7;
      const nextDate = new Date(today.getTime() + diff * 24 * 60 * 60 * 1000);
      return nextDate.toISOString().split("T")[0];
    },

    logout() {
      fetch("/api/logout", { method: "POST" }).then(() => {
        this.$router.push("/login");
      });
    },
  },

  template: `
    <div>
      <top-bar />
      <div class="bg-light py-2 px-4 d-flex justify-content-between align-items-center border-bottom">
        <div><strong>Welcome, Patient</strong></div>
        <div>
          <button class="btn btn-outline-primary btn-sm me-2" @click="$router.push('/patient/patient_dashboard')">← Back to Dashboard</button>
          <button class="btn btn-outline-danger btn-sm" @click="logout">Logout</button>
        </div>
      </div>

      <div class="container mt-4">
        <h3>Book Appointment with Dr. {{ doctor?.full_name || "Unknown" }}</h3>

        <div v-if="loading" class="text-center mt-5">
          <div class="spinner-border" role="status"></div>
          <p class="mt-2">Loading availability...</p>
        </div>

        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>

        <div v-else>
          <table class="table table-bordered mt-3">
            <thead>
              <tr>
                <th>Day</th>
                <th>Morning</th>
                <th>Evening</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="day in weekDays" :key="day">
                <td>{{ day }}</td>

                <td>
                  <button
                    :class="[
                      'btn w-100',
                      isSelected(day, 'morning') ? 'btn-primary' :
                      isAvailable(day, 'morning') ? 'btn-success' :
                      isBooked(day, 'morning') ? 'btn-danger' : 'btn-secondary'
                    ]"
                    @click="selectSlot(day, 'morning')"
                  >
                    {{
                      isSelected(day, 'morning') ? 'Selected' :
                      isAvailable(day, 'morning') ? 'Available' :
                      isBooked(day, 'morning') ? 'Booked Already' : 'Unavailable'
                    }}
                    <small class="d-block text-muted">
                      {{ availability[day]?.morning?.start || "--" }} - {{ availability[day]?.morning?.end || "--" }}
                    </small>
                  </button>
                </td>

                <td>
                  <button
                    :class="[
                      'btn w-100',
                      isSelected(day, 'evening') ? 'btn-primary' :
                      isAvailable(day, 'evening') ? 'btn-success' :
                      isBooked(day, 'evening') ? 'btn-danger' : 'btn-secondary'
                    ]"
                    @click="selectSlot(day, 'evening')"
                  >
                    {{
                      isSelected(day, 'evening') ? 'Selected' :
                      isAvailable(day, 'evening') ? 'Available' :
                      isBooked(day, 'evening') ? 'Booked Already' : 'Unavailable'
                    }}
                    <small class="d-block text-muted">
                      {{ availability[day]?.evening?.start || "--" }} - {{ availability[day]?.evening?.end || "--" }}
                    </small>
                  </button>
                </td>

              </tr>
            </tbody>
          </table>

          <div class="text-end mt-3">
            <button class="btn btn-primary" @click="confirmBooking" :disabled="!selectedDay || !selectedSlot">
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  `
};
