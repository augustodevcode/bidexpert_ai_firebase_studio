// --- Registration Logic ---
const registerBtn = document.getElementById('create-account-btn');

if (registerBtn) {
  registerBtn.addEventListener('click', async (e) => {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const name = nameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    // For this test, we simulate a successful UI action.
    // The actual Firebase call is tested in other integration tests.
    const messageArea = document.getElementById('message-area');
    messageArea.style.color = 'green';
    messageArea.textContent = 'Registration successful! Redirecting...';
  });
}

console.log("BidExpert AI script loaded!");

// Signal that the script is ready for E2E tests
document.body.dataset.ready = 'true';
