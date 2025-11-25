import TopBar from './TopBar.js';
export default {
  name: "Login",
  components: { TopBar },
  template: `
  <div>
    <top-bar></top-bar>
    <div class="auth-page d-flex justify-content-center" style="min-height: calc(100vh -60px); padding-top: 2rem;">
      <div class="card p-4 shadow-lg glass-card w-100" style="max-width: 400px;">
        <h2 class="text-center mb-4">Login</h2>

        <p v-if="error" class="text-danger text-center">{{ error }}</p>

        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input type="email" id="email" v-model="email" class="form-control" required autocomplete="email" />
        </div>

        <div class="mb-4">
          <label for="password" class="form-label">Password</label>
          <input type="password" id="password" v-model="password" class="form-control" required autocomplete="current-password" />
        </div>

        <div class="d-grid">
          <button class="btn btn-warning" :disabled="loading" @click="loginUser">
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </div>

        <div class="mt-3 text-center">
          <button class="btn btn-link text-decoration-none" @click="$router.push('/')">← Back to Home</button>
        </div>
      </div>
    </div>
  </div>
  `,
  data() {
    return {
      email: "",
      password: "",
      error: "",
      loading: false,
    };
  },
  methods: {
    async loginUser() {
      this.error = "";
      this.loading = true;

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          this.error = data.message || "Login failed";
          this.loading = false;
          return;
        }

        const token = data.auth_token || data.token;
        if (!token) {
          this.error = "No token received from server.";
          this.loading = false;
          return;
        }

        // Store user info & token in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("user_id", data.id);

        const role = Array.isArray(data.roles) ? data.roles[0] : data.role;
        localStorage.setItem("role", role);

        // Redirect based on role
        if (role === "admin") {
          this.$router.push("/admin/admin_dashboard");
        } else if (role === "doctor") {
          this.$router.push("/doctor/doctor_dashboard");
        } else if (role === "patient") {
          this.$router.push("/patient/patient_dashboard");
        } else {
          this.error = "No valid role found.";
        }

      } catch (err) {
        console.error("Login error:", err);
        this.error = "An unexpected error occurred. Please try again.";
      } finally {
        this.loading = false;
      }
    }
  }
};
