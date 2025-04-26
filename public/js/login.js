document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();

        if (username) {
            const sessionToken = btoa(`${username}:${new Date().toISOString()}`);

            localStorage.setItem('username', username);
            localStorage.setItem('sessionToken', sessionToken);

            window.location.href = 'index.html';
        }
    });
});
