document.addEventListener('DOMContentLoaded', function () {
    const navButtons = document.querySelectorAll('.nav-button');
    const mainContent = document.getElementById('main-content');

    loadPage('pages/diary.html');

    navButtons.forEach(button => {
        button.addEventListener('click', function () {
            const pageUrl = this.getAttribute('data-page');
            loadPage(pageUrl);

            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    function loadPage(pageUrl) {
        fetch(pageUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Page not found');
                }
                return response.text();
            })
            .then(html => {
                mainContent.innerHTML = html;

                if (pageUrl.includes('diary.html')) {
                    initializeDiaryPage();
                }
            })
            .catch(error => {
                mainContent.innerHTML = '<p>Error loading page.</p>';
                console.error(error);
            });
    }

    function initializeDiaryPage() {
        console.log('Diary page loaded');
    }
});