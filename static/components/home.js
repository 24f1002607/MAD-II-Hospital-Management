import TopBar from "./Common/TopBar.js";   
export default {
    name: "Home",
    components: { TopBar },
    template: `
        <div class="d-flex flex-column vh-100 home-page"> 

        <!-- Top Bar -->
        <top-bar></top-bar>
        

        <!-- Hero Section -->
        <div class="d-flex flex-column align-items-center justify-content-center text-center flex-grow-1 px-3">
            <img src="/static/Images/hospitalart.png" alt="Hospital Illustration" class="mb-3" style="max-width: 400px; height: auto; filter: brightness(1.3); margin-top: -40px;" />
            
            <h1 class="mb-2" style="font-size: 2rem; font-weight: bold; color: #000; margin-top: -10px;">Welcome to Healix Care</h1>
            <p class="lead text-dark mb-2" style="margin-top: -8px;"><strong>Manage appointments, patients, doctors, and more with ease.</strong></p>

            <div class="d-flex flex-column flex-md-row gap-3 justify-content-center" style="margin-top: -5px;">
            <router-link class="btn btn-warning btn-lg" to="/login">Login</router-link>
            <router-link class="btn btn-primary btn-lg" to="/register?role=patient">Register as Patient</router-link>
            </div>
        </div>

        <!-- Footer -->
        <footer class="text-center p-2 bg-white bg-opacity-50" style="flex-shrink: 0; font-size: 0.9rem;">
            <p class="mb-0">&copy; 2025 Healix Care. All rights reserved.</p>
        </footer>
        </div>
    `
    };
