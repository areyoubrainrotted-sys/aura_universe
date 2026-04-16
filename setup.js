// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // 1. TRACKING STATE
    window.currentStep = 1;
    window.selectedCategory = null;

    // 2. CATEGORY SELECTION LOGIC
    const categoryOptions = document.querySelectorAll('.server-option');
    categoryOptions.forEach(option => {
        option.addEventListener('click', () => {
            categoryOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            window.selectedCategory = option.getAttribute('data-type');
        });
    });

    // 3. Check if returning from Discord OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guild_id');
    if (guildId) {
        // Successfully added bot to server, complete setup
        completeServerSetup(guildId);
    }

    // 4. INITIAL PROGRESS BAR
    updateProgressBar(1);
});

// 4. NAVIGATION FUNCTIONS (global)
function nextStep(step) {
    // Validation for Step 1
    if (window.currentStep === 1) {
        const name = document.getElementById('serverName').value.trim();
        const desc = document.getElementById('serverDesc').value.trim();
        if (!name || !desc || !window.selectedCategory) {
            alert("⚠️ Please fill in all fields and select a category.");
            return;
        }
        // Save server info to localStorage
        localStorage.setItem('setup_serverName', name);
        localStorage.setItem('setup_serverDesc', desc);
        localStorage.setItem('setup_category', window.selectedCategory);
        localStorage.setItem('setup_serverSize', document.getElementById('serverSize').value);
        localStorage.setItem('setup_inviteCode', document.getElementById('inviteCode').value);
    }
    // Validation for Step 2
    if (window.currentStep === 2) {
        prepareReview();
    }

    // Hide all sections
    document.querySelectorAll('.form-section').forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });

    // Show target section
    const target = document.getElementById(`section${step}`);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        window.currentStep = step;
        updateProgressBar(step);
        window.scrollTo(0, 0);
    } else {
        console.error(`Section ${step} not found`);
    }
}

function prevStep(step) {
    document.querySelectorAll('.form-section').forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });
    
    const target = document.getElementById(`section${step}`);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        window.currentStep = step;
        updateProgressBar(step);
    }
}

function updateProgressBar(step) {
    const fill = document.getElementById('progressFill');
    if (fill) {
        fill.style.width = ((step - 1) / 2 * 100) + "%";
    }
    
    // Update step bubbles
    document.querySelectorAll('.step').forEach((el, index) => {
        if (index + 1 <= step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

function prepareReview() {
    const card = document.getElementById('reviewCard');
    const name = localStorage.getItem('setup_serverName') || document.getElementById('serverName').value;
    const category = window.selectedCategory ? window.selectedCategory.toUpperCase() : (localStorage.getItem('setup_category') || 'Not Selected');
    const serverSize = localStorage.getItem('setup_serverSize') || document.getElementById('serverSize').value;
    
    const sizeNames = {
        small: '🌱 Small (Under 100 members)',
        medium: '🌿 Medium (100-500 members)',
        large: '🔥 Large (500-2000 members)',
        huge: '💀 Huge (2000+ members)'
    };
    
    card.innerHTML = `
        <div class="review-item">
            <span class="review-label">Server Name</span>
            <span class="review-value">${escapeHtml(name)}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Category</span>
            <span class="review-value">${escapeHtml(category)}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Server Size</span>
            <span class="review-value">${sizeNames[serverSize] || serverSize}</span>
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Discord OAuth2 Configuration
const DISCORD_CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; // Replace with your bot's Client ID
const DISCORD_REDIRECT_URI = encodeURIComponent(`${window.location.origin}/setup.html`);
const DISCORD_SCOPES = 'bot applications.commands';
const DISCORD_PERMISSIONS = '8'; // Administrator permissions (you can adjust this)

function redirectToDiscordInvite() {
    // Get the server ID from selection or let user choose
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=${DISCORD_PERMISSIONS}&scope=${DISCORD_SCOPES}&redirect_uri=${DISCORD_REDIRECT_URI}&response_type=code`;
    window.location.href = inviteUrl;
}

async function completeServerSetup(guildId) {
    const loader = document.getElementById('loadingOverlay');
    loader.classList.add('active');
    loader.style.display = 'flex';

    const setupData = {
        serverId: guildId,
        serverName: localStorage.getItem('setup_serverName') || document.getElementById('serverName')?.value || 'Unknown Server',
        serverDesc: localStorage.getItem('setup_serverDesc') || document.getElementById('serverDesc')?.value || '',
        inviteCode: localStorage.getItem('setup_inviteCode') || document.getElementById('inviteCode')?.value || '',
        category: localStorage.getItem('setup_category') || window.selectedCategory,
        serverSize: localStorage.getItem('setup_serverSize') || document.getElementById('serverSize')?.value || 'medium',
        email: document.getElementById('contactEmail')?.value || '',
        registeredAt: new Date().toISOString()
    };

    try {
        const response = await fetch('/api/register-server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setupData)
        });
        const result = await response.json();
        if (result.status === "success") {
            // Clear stored setup data
            localStorage.removeItem('setup_serverName');
            localStorage.removeItem('setup_serverDesc');
            localStorage.removeItem('setup_category');
            localStorage.removeItem('setup_serverSize');
            localStorage.removeItem('setup_inviteCode');
            
            alert("✅ Server successfully registered! Bot has been added to your server.");
            window.location.href = "index.html";
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Registration failed:", error);
        alert("Failed to register server. Please try again.");
    } finally {
        loader.classList.remove('active');
        loader.style.display = 'none';
    }
}

async function submitSetup() {
    const agree = document.getElementById('agreeTerms').checked;
    if (!agree) {
        alert("❌ You must agree to the terms before launching!");
        return;
    }

    // Save any remaining data to localStorage
    localStorage.setItem('setup_serverName', document.getElementById('serverName').value);
    localStorage.setItem('setup_serverDesc', document.getElementById('serverDesc').value);
    localStorage.setItem('setup_category', window.selectedCategory);
    localStorage.setItem('setup_serverSize', document.getElementById('serverSize').value);
    localStorage.setItem('setup_inviteCode', document.getElementById('inviteCode').value);
    if (document.getElementById('contactEmail')) {
        localStorage.setItem('setup_email', document.getElementById('contactEmail').value);
    }

    // Redirect to Discord OAuth for bot invite
    redirectToDiscordInvite();
}

function notifyMe() {
    const email = prompt("Enter your email to get notified when Premium launches:", "");
    if (email && email.includes('@')) {
        // Send to backend
        fetch('/api/notify-premium', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        }).catch(console.error);
        
        let notifyList = JSON.parse(localStorage.getItem('premium_notify') || '[]');
        if (!notifyList.includes(email)) {
            notifyList.push(email);
            localStorage.setItem('premium_notify', JSON.stringify(notifyList));
            alert("✅ You'll be notified when Premium launches!");
        } else {
            alert("📧 You're already on the waitlist!");
        }
    } else if (email) {
        alert("❌ Please enter a valid email address.");
    }
}
