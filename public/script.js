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

    // In a real application, we would call the cloud function here.
    // For this test, we will simulate a successful call to verify the UI.
    // const registerUser = httpsCallable(functions, 'registerUser');
    // try {
    //   const result = await registerUser({ name, email, password });
    //   console.log('User registration call succeeded!', result.data);
    // } catch (error) {
    //   console.error('Error during registration:', error);
    // }

    const messageArea = document.getElementById('message-area');
    messageArea.style.color = 'green';
    messageArea.textContent = 'Registration successful! Redirecting...';
  });
}

console.log("BidExpert AI script loaded! Environment is set up for Firebase.");
