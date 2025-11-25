import TopBar from '../Common/TopBar.js';
export default {
    name: "New_doctor",
    components: {
        TopBar
    },
    template: `
    <div>
        <top-bar></top-bar>
        <div class="modal-overlay">
            <div class="modal-card">
                <h3 class="mb-3">Add New Doctor</h3>

                <form @submit.prevent="submitForm">
                    <div class="mb-2">
                        <label class="form-label">Full Name</label>
                        <input v-model="form.full_name" type="text" class="form-control" required />
                    </div>

                    <div class="mb-2">
                        <label class="form-label">Email</label>
                        <input v-model="form.email" type="email" class="form-control" required />
                    </div>

                    <div class="mb-2">
                        <label class="form-label">Specialization</label>
                        <select v-model="form.specialization" class="form-control" required>
                            <option value="" disabled>Select specialization</option>
                            <option v-for="spec in specializations" :key="spec.id" :value="spec.name">{{ spec.name }}</option>
                        </select>
                    </div>
                    

                    <div class="mb-2">
                        <label class="form-label">Experience (Years)</label>
                        <input v-model="form.experience_years" type="number" class="form-control" min="0" required />
                    </div>

                    <div class="mb-2">
                        <label class="form-label">Bio</label>
                        <textarea v-model="form.bio" class="form-control" rows="3" placeholder="Doctor's short bio (optional)"></textarea>
                    </div>

                    <div class="mb-2">
                        <label class="form-label">Password</label>
                        <input v-model="form.password" type="password" class="form-control" required />
                    </div>

                    <div v-if="error" class="text-danger mb-2">{{ error }}</div>

                    <div class="d-flex justify-content-center mt-3">
                        <button type="submit" class="btn btn-primary" :disabled="loading">
                            {{ loading ? 'Adding...' : 'Add Doctor' }}
                        </button>
                    </div>
                    <div class="mt-3 text-center">
                        <button type="button" class="btn btn-link text-decoration-none" @click="$router.push('/admin/admin_dashboard')">← Back to Admin Dashboard</button>
                    </div>
                    
                </form>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            form: {
                full_name: "",
                email: "",
                specialization: "",
                experience_years: 0,
                password: "",
                bio: ""
            },
            specializations: [],
            loading: false,
            error: ""
        };
    },
    mounted() {
        fetch("/api/specializations", {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
                .then(data => {
                this.specializations = data;
            })
                .catch(err => {
                console.error("Failed to fetch specializations:", err);
                this.error = "Failed to load specializations. Please try again later.";
            })
    },
    methods: {
        async submitForm() {
            this.loading = true;
            this.error = "";

            try {
                const response = await fetch("/api/admin/new_doctor", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(this.form)
                });

                const data = await response.json();

                if (!response.ok) {
                    this.error = data.message || "Failed to add doctor.";
                    this.loading = false;
                    return;
                }

                alert("Doctor added successfully!");
                this.$router.push("/admin/admin_dashboard");
                
            } catch (err) {
                console.error("Add doctor error:", err);
                this.error = "Something went wrong. Please try again.";
            } finally {
                this.loading = false;
            }
        }
    }
};



