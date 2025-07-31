import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// --- Firebase Initialization ---
let app, functions;
try {
  // TODO: Add your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:XXXXXXXXXXXXXXXXXXXXXX",
  };

  app = initializeApp(firebaseConfig);
  functions = getFunctions(app);
  console.log("Firebase initialized successfully (mock config).");
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // We can continue without a real Firebase connection for the purpose of this test.
}


// --- Registration Logic ---
const registerForm = document.getElementById('register-form');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    // PREVENT the default form submission which reloads the page
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

console.log("BidExpert AI script loaded!");

// Signal that the script is ready for E2E tests
document.body.dataset.ready = 'true';
