// API Base URL
const API_BASE = 'http://localhost:3000';

// DOM Elements
const longUrlInput = document.getElementById('longUrl');
const shortenBtn = document.getElementById('shortenBtn');
const resultSection = document.getElementById('resultSection');
const shortUrlInput = document.getElementById('shortUrl');
const copyBtn = document.getElementById('copyBtn');
const logoutBtn = document.getElementById('logoutBtn');
const linksTableBody = document.getElementById('linksTableBody');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');

// Load links on page load
document.addEventListener('DOMContentLoaded', () => {
    loadLinks();
});

// Shorten URL
shortenBtn.addEventListener('click', async () => {
    const longUrl = longUrlInput.value.trim();
    
    if (!longUrl) {
        showNotification('Please enter a URL', 'error');
        return;
    }

    // Validate URL
    try {
        new URL(longUrl);
    } catch {
        showNotification('Please enter a valid URL', 'error');
        return;
    }

    // Disable button and show loading
    shortenBtn.disabled = true;
    shortenBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

    try {
        const response = await fetch(`${API_BASE}/api/shorten`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ longUrl })
        });

        const data = await response.json();

        if (response.ok) {
            // Show result
            shortUrlInput.value = data.short;
            resultSection.classList.remove('hidden');
            
            // Clear input
            longUrlInput.value = '';
            
            // Reload links table
            await loadLinks();
            
            // Show success notification
            showNotification('Link shortened successfully!', 'success');
        } else {
            showNotification(data.error || 'Failed to shorten link', 'error');
        }
    } catch (error) {
        showNotification('Network error. Please try again.', 'error');
    } finally {
        // Re-enable button
        shortenBtn.disabled = false;
        shortenBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Short Link';
    }
});

// Copy to clipboard
copyBtn.addEventListener('click', () => {
    const shortUrl = shortUrlInput.value;
    
    if (shortUrl) {
        navigator.clipboard.writeText(shortUrl).then(() => {
            // Show copy notification
            const notification = document.getElementById('copyNotification');
            notification.classList.remove('translate-y-20', 'opacity-0');
            
            setTimeout(() => {
                notification.classList.add('translate-y-20', 'opacity-0');
            }, 2000);
        });
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    window.location.href = '/login.html';
});

// Load links from API
async function loadLinks() {
    try {
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        linksTableBody.innerHTML = '';

        const response = await fetch(`${API_BASE}/api/links`);
        const links = await response.json();

        loadingState.classList.add('hidden');

        if (links.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        // Render links
        links.forEach(link => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-700/50 hover:bg-white/5 transition-colors';
            
            // Truncate long URLs
            const displayUrl = link.original.length > 50 
                ? link.original.substring(0, 50) + '...' 
                : link.original;

            row.innerHTML = `
                <td class="py-3 pr-4">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-link text-cyan-400/50 text-xs"></i>
                        <span class="text-sm text-gray-300" title="${link.original}">${displayUrl}</span>
                    </div>
                </td>
                <td class="py-3 pr-4">
                    <span class="text-sm text-cyan-400 font-mono">${link.short}</span>
                </td>
                <td class="py-3 pr-4">
                    <button onclick="copyToClipboard('${link.short}')" 
                        class="text-cyan-400 hover:text-cyan-300 transition-colors">
                        <i class="fas fa-copy"></i>
                    </button>
                </td>
                <td class="py-3">
                    <span class="text-sm text-gray-500">${link.created}</span>
                </td>
            `;
            
            linksTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading links:', error);
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        emptyState.innerHTML = `
            <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-3"></i>
            <p class="text-red-400">Failed to load links. Please refresh.</p>
        `;
    }
}

// Global copy function for table buttons
window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    });
};

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 ${
        type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
    } text-white px-4 py-2 rounded-lg shadow-lg transform transition-all animate-slide-up z-50`;
    
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Enter key support
longUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        shortenBtn.click();
    }
});
