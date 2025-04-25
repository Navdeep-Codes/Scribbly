document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();

        if (username) {
            // Generate a unique session token
            const sessionToken = btoa(`${username}:${new Date().toISOString()}`);

            // Store username and session token in localStorage
            localStorage.setItem('username', username);
            localStorage.setItem('sessionToken', sessionToken);

            // Redirect to main app
            window.location.href = 'index.html';
        }
    });
});