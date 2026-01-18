// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Add real-time updates if needed
    setupRealTimeUpdates();
    
    // Add any client-side interactivity
    setupEventListeners();

    initializeTooltips();
}


function initializeTooltips() {
    // Initialize tooltips using Bootstrap 5 native method
    if (typeof bootstrap !== 'undefined') {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[title]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            // Add data-bs-toggle attribute if not present
            if (!tooltipTriggerEl.hasAttribute('data-bs-toggle')) {
                tooltipTriggerEl.setAttribute('data-bs-toggle', 'tooltip');
            }
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    } else {
        console.warn('Bootstrap not loaded, tooltips disabled');
    }
}


function setupRealTimeUpdates() {
    // Example: Refresh data every 30 seconds
    setInterval(() => {
        refreshDashboardData();
    }, 90000);
}

async function refreshDashboardData() {
    try {
        const response = await fetch('/dashboard', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateDashboardUI(data);
        }
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
    }
}

function updateDashboardUI(data) {
    // Update counts
    document.getElementById('pendingCount').textContent = data.pendingCount;
    document.getElementById('processingCount').textContent = data.processingCount;
    document.getElementById('completedCount').textContent = data.completedCount;
    
    // Update balance
    const formattedBalance = `$${data.walletBalance.toFixed(2)}`;
    document.getElementById('walletBalanceCard').textContent = formattedBalance;
    document.getElementById('quickBalance').textContent = formattedBalance;
    
    // Update balance status
    updateBalanceStatus(data.walletBalance);
}

function updateBalanceStatus(balance) {
    const statusElement = document.getElementById('balanceStatus');
    if (balance < 5) {
        statusElement.innerHTML = '<span class="text-danger"><i class="fas fa-exclamation-triangle"></i> Low balance</span>';
    } else if (balance < 20) {
        statusElement.innerHTML = '<span class="text-warning"><i class="fas fa-info-circle"></i> Balance OK</span>';
    } else {
        statusElement.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> Good balance</span>';
    }
}

function setupEventListeners() {
    // Add any client-side interactivity here
    console.log('Dashboard event listeners setup');
}

// Utility functions
function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'pending_assignment': 'Awaiting Assignment',
        'processing': 'Processing',
        'requires_review': 'Requires Review',
        'completed': 'Completed',
        'failed': 'Failed'
    };
    return statusMap[status] || status;
}