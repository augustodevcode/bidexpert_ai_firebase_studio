import { app } from './firebase-init.js';
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const functions = getFunctions(app);
const auth = getAuth(app);

// --- Registration Logic ---
const registerForm = document.getElementById('register-form');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = registerForm.name.value;
    const email = registerForm.email.value;
    const password = registerForm.password.value;

    const registerUser = httpsCallable(functions, 'registerUser');

    try {
      const result = await registerUser({ name, email, password });
      console.log('User registered successfully!', result.data);
      alert(`Success! User ${result.data.uid} created.`);

      // In a real app, you would also sign the user in and then redirect.
      // For the test, we just need to know it succeeded and redirect.
      window.location.href = 'dashboard.html';

    } catch (error) {
      console.error('Error during registration:', error);
      alert(`Registration failed: ${error.message}`);
    }
  });
}

console.log("BidExpert AI script loaded! Environment is set up for Firebase.");
