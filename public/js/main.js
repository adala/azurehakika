// Font Awesome icon loading helper
document.addEventListener('DOMContentLoaded', function () {
    // Check if Font Awesome loaded successfully
    function checkFontAwesome() {
        const testIcon = document.createElement('i');
        testIcon.className = 'fas fa-check';
        testIcon.style.position = 'absolute';
        testIcon.style.left = '-9999px';
        document.body.appendChild(testIcon);

        setTimeout(() => {
            const computedStyle = window.getComputedStyle(testIcon);
            const fontFamily = computedStyle.fontFamily;

            if (!fontFamily.includes('Font Awesome')) {
                console.warn('Font Awesome not loaded, using fallback icons');
                // You could implement a fallback strategy here
            }

            document.body.removeChild(testIcon);
        }, 100);
    }

    // Initialize icon animations
    function initIconAnimations() {
        const icons = document.querySelectorAll('.fas, .fab, .far, .fal');
        icons.forEach((icon, index) => {
            // Stagger animation for better visual effect
            setTimeout(() => {
                icon.style.opacity = '1';
                icon.style.transform = 'scale(1)';
            }, index * 50);
        });
    }

    // Smooth scrolling for all anchor links
    function initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Initialize all functions
    checkFontAwesome();
    initIconAnimations();
    initSmoothScrolling();

    console.log('Hakika - Icons and animations initialized');
});

const AuthService = {
    getToken() {
        return localStorage.getItem('token') || this.getCookie('token');
    },

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    },

    isAuthenticated() {
        const token = this.getToken();
        return !!token;
    },

    async checkAuth() {
        const token = this.getToken();
        if (!token) {
            this.redirectToLogin();
            return false;
        }
        return true;
    },

    redirectToLogin() {
        showToast('error', 'Authentication required. Redirecting to login...');
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 1500);
    }
};