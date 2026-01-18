// Flash messages functionality
class FlashMessages {
    constructor() {
        this.init();
    }

    init() {
        this.autoDismiss();
        this.setupCloseHandlers();
        this.setupProgressBars();
    }

    autoDismiss() {
        const flashMessages = document.querySelectorAll('.flash-message');

        flashMessages.forEach(message => {
            const type = message.classList.contains('alert-success') ? 'success' :
                message.classList.contains('alert-danger') ? 'error' :
                    message.classList.contains('alert-warning') ? 'warning' : 'info';

            let dismissTime = 5000; // 5 seconds default

            switch (type) {
                case 'success':
                    dismissTime = 4000; // 4 seconds
                    break;
                case 'error':
                    dismissTime = 8000; // 8 seconds
                    break;
                case 'warning':
                    dismissTime = 6000; // 6 seconds
                    break;
                case 'info':
                    dismissTime = 5000; // 5 seconds
                    break;
            }

            setTimeout(() => {
                this.dismissMessage(message);
            }, dismissTime);
        });
    }

    dismissMessage(message) {
        if (message && message.classList.contains('show')) {
            message.classList.remove('show');
            message.classList.add('fade');

            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);

                    // Remove container if no messages left
                    const container = document.querySelector('.flash-messages-container');
                    if (container && container.children.length === 0) {
                        container.remove();
                    }
                }
            }, 300);
        }
    }

    setupCloseHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-close')) {
                const alert = e.target.closest('.flash-message');
                if (alert) {
                    e.preventDefault();
                    this.dismissMessage(alert);
                }
            }
        });
    }

    setupProgressBars() {
        const flashMessages = document.querySelectorAll('.flash-message');

        flashMessages.forEach(message => {
            const progressBar = document.createElement('div');
            progressBar.className = 'flash-progress-bar';
            progressBar.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background: rgba(0,0,0,0.1);
                overflow: hidden;
            `;

            const progress = document.createElement('div');
            progress.className = 'flash-progress';
            progress.style.cssText = `
                height: 100%;
                width: 100%;
                background: currentColor;
                opacity: 0.3;
                animation: flashProgress 5s linear forwards;
            `;

            progressBar.appendChild(progress);
            message.style.position = 'relative';
            message.appendChild(progressBar);
        });
    }

    // Static method to show new flash messages dynamically
    static show(message, type = 'info', duration = 5000) {
        const container = document.querySelector('.flash-messages-container') || this.createContainer();

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show flash-message mb-2 shadow`;
        alert.style.cssText = 'min-width: 300px;';

        const icon = this.getIcon(type);

        alert.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="flash-icon me-2">${icon}</div>
                <div class="flash-content flex-grow-1">${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        container.appendChild(alert);

        // Trigger Bootstrap's fade in
        setTimeout(() => {
            alert.classList.add('show');
        }, 10);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                new FlashMessages().dismissMessage(alert);
            }, duration);
        }

        return alert;
    }

    static createContainer() {
        const container = document.createElement('div');
        container.className = 'flash-messages-container position-fixed top-0 start-50 translate-middle-x mt-3';
        container.style.cssText = 'z-index: 9999;';
        document.body.insertBefore(container, document.body.firstChild);
        return container;
    }

    static getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlashMessages();
});

// Add CSS for progress bar animation
const style = document.createElement('style');
style.textContent = `
    @keyframes flashProgress {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
    }
    
    .flash-message {
        transition: all 0.3s ease;
        border-left: 4px solid;
    }
    
    .flash-message.alert-success {
        border-left-color: #198754;
    }
    
    .flash-message.alert-danger {
        border-left-color: #dc3545;
    }
    
    .flash-message.alert-warning {
        border-left-color: #ffc107;
    }
    
    .flash-message.alert-info {
        border-left-color: #0dcaf0;
    }
    
    .flash-icon {
        font-size: 1.2em;
    }
    
    .flash-content {
        line-height: 1.4;
    }
`;
document.head.appendChild(style);

// Make FlashMessages available globally
window.FlashMessages = FlashMessages;