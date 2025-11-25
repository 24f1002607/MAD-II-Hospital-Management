import TopBar from './TopBar.js';

export default {
  name: "Register",
  components: { TopBar },
  template: `
  <div>
    <top-bar></top-bar>
    <div class="auth-page d-flex justify-content-center" style="min-height: calc(100vh -60px); padding-top: 2rem;">
      <div class="card p-4 shadow-lg glass-card w-100" style="max-width: 400px;">
        
        <h2 class="text-center mb-3">Patient Registration Form</h2>

        <p v-if="message" class="text-danger text-center">{{ message }}</p>

        <div class="mb-2">
          <label for="full_name" class="form-label">Full Name</label>
          <input type="text" id="full_name" v-model="formData.full_name" class="form-control" required />
        </div>

        <div class="mb-2">
          <label for="email" class="form-label">Email</label>
          <input type="email" id="email" v-model="formData.email" class="form-control" required />
        </div>

        <div class="mb-2">
          <label for="username" class="form-label">Username</label>
          <input type="text" id="username" v-model="formData.username" class="form-control" required />
        </div>

        <div class="mb-2">
          <label for="dob" class="form-label">Date of Birth</label>
          <input type="date" id="dob" v-model="formData.dob" class="form-control" />
        </div>

        <div class="mb-2">
          <label for="gender" class="form-label">Gender</label>
          <select id="gender" v-model="formData.gender" class="form-control">
            <option disabled value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        <div class="mb-2">
          <label for="contact_number" class="form-label">Contact Number</label>
          <input type="text" id="contact_number" v-model="formData.contact_number" class="form-control" />
        </div>

        <div class="mb-2">
          <label for="address" class="form-label">Address</label>
          <textarea id="address" v-model="formData.address" class="form-control" rows="3"></textarea>
        </div>

        <div class="mb-2">
          <label for="password" class="form-label">Password</label>
          <input type="password" id="password" v-model="formData.password" class="form-control" required />
        </div>

        <div class="d-grid mb-2">
          <button class="btn btn-primary" @click="addUser">Register</button>
        </div>

        <div class="text-center">
          <button class="btn btn-link text-decoration-none" @click="$router.push('/')">← Back to Home</button>
        </div>
      </div>
    </div>
  </div>
  `,

  data() {
    return {
      formData: {
        full_name: '',
        email: '',
        username: '',
        dob: '',
        gender: '',
        contact_number: '',
        address: '',
        password: '',
        role: 'patient'  // Fixed role to "patient"
      },
      message: ''
    };
  },

  methods: {
    async addUser() {
      this.message = "";

      const { full_name, email, username, password, role, dob, gender, contact_number, address } = this.formData;

      if (!full_name || !email || !username || !password || !dob || !gender || !contact_number || !address) {
        this.message = "All fields are required.";
        return;
      }

      try {
        const payload = { full_name, email, username, password, role, dob, gender, contact_number, address };

        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          this.message = data.error || "Registration failed.";
          return;
        }

        alert(data.message || "Registration successful!");
        this.$router.push('/login');

      } catch (error) {
        console.error(error);
        this.message = "An unexpected error occurred.";
      }
    }
  }
};
