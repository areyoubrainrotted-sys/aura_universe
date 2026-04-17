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

    // 3. Check if returning from Discord OAuth (after bot invite)
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guild_id');
    
    if (guildId) {
        // Bot was successfully added! Now save to database
        completeServerSetup(guildId);
    }

    // 4. INITIAL PROGRESS BAR
    updateProgressBar(1);
});

// Navigation Functions
function nextStep(step) {
    if (window.currentStep === 1) {
        const name = document.getElementById('serverName').value.trim();
        const desc = document.getElementById('serverDesc').value.trim();
        if (!name || !desc || !window.selectedCategory) {
            alert("⚠️ Please fill in all fields and select a category.");
            return;
        }
        // Save to localStorage temporarily
        localStorage.setItem('setup_serverName', name);
        localStorage.setItem('setup_serverDesc', desc);
        localStorage.setItem('setup_category', window.selectedCategory);
        localStorage.setItem('setup_serverSize', document.getElementById('serverSize').value);
        localStorage.setItem('setup_inviteCode', document.getElementById('inviteCode').value);
    }
    if (window.currentStep === 2) {
        prepareReview();
    }

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
        window.scrollTo(0, 0);
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
    const name = localStorage.getItem('setup_serverName') || document.getElementById('serverName')?.value || 'Not set';
    const category = localStorage.getItem('setup_category') || window.selectedCategory || 'Not selected';
    const serverSize = localStorage.getItem('setup_serverSize') || document.getElementById('serverSize')?.value || 'medium';
    
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
const DISCORD_CLIENT_ID = '1478261487670657177';
const DISCORD_REDIRECT_URI = encodeURIComponent('https://aurauniverses.github.io/setup.html');
const DISCORD_SCOPES = 'bot applications.commands';
const DISCORD_PERMISSIONS = '8';

function redirectToDiscordInvite() {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=${DISCORD_PERMISSIONS}&scope=${DISCORD_SCOPES}&redirect_uri=${DISCORD_REDIRECT_URI}&response_type=code`;
    window.location.href = inviteUrl;
}

// Called AFTER bot is added to server (Discord redirects back with guild_id)
async function completeServerSetup(guildId) {
    const loader = document.getElementById('loadingOverlay');
    loader.classList.add('active');
    loader.style.display = 'flex';

    const setupData = {
        guild_id: guildId,  // The actual Discord server ID!
        server_name: localStorage.getItem('setup_serverName') || 'Unknown Server',
        description: localStorage.getItem('setup_serverDesc') || '',
        category: localStorage.getItem('setup_category') || '',
        server_size: localStorage.getItem('setup_serverSize') || 'medium',
        invite_code: localStorage.getItem('setup_inviteCode') || '',
        email: localStorage.getItem('setup_email') || '',
        registered_at: new Date().toISOString()
    };

    try {
        // Save to your backend/database
        const response = await fetch('/api/register-server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setupData)
        });
        
        const result = await response.json();
        
        if (result.status === "success") {
            // Clear temporary storage
            localStorage.removeItem('setup_serverName');
            localStorage.removeItem('setup_serverDesc');
            localStorage.removeItem('setup_category');
            localStorage.removeItem('setup_serverSize');
            localStorage.removeItem('setup_inviteCode');
            localStorage.removeItem('setup_email');
            
            alert(`✅ Bot successfully added to your server!\n\nServer ID: ${guildId}\nSetup data saved to database.`);
            window.location.href = "index.html";
        } else {
            alert("Error saving to database: " + result.message);
        }
    } catch (error) {
        console.error("Registration failed:", error);
        
        // Fallback: Save to localStorage if backend is not available
        const allSetups = JSON.parse(localStorage.getItem('registered_servers') || '[]');
        allSetups.push(setupData);
        localStorage.setItem('registered_servers', JSON.stringify(allSetups));
        
        alert(`✅ Bot added to server! (Saved locally)\nServer ID: ${guildId}\n\nNote: Database connection failed. Data saved to browser localStorage.`);
        window.location.href = "index.html";
    } finally {
        loader.classList.remove('active');
        loader.style.display = 'none';
    }
}

// Called when user clicks "Launch Server" button
async function submitSetup() {
    const agree = document.getElementById('agreeTerms').checked;
    if (!agree) {
        alert("❌ You must agree to the terms before launching!");
        return;
    }

    // Save form data to localStorage
    localStorage.setItem('setup_serverName', document.getElementById('serverName').value);
    localStorage.setItem('setup_serverDesc', document.getElementById('serverDesc').value);
    localStorage.setItem('setup_category', window.selectedCategory);
    localStorage.setItem('setup_serverSize', document.getElementById('serverSize').value);
    localStorage.setItem('setup_inviteCode', document.getElementById('inviteCode').value);
    if (document.getElementById('contactEmail')) {
        localStorage.setItem('setup_email', document.getElementById('contactEmail').value);
    }

    // Redirect to Discord OAuth to add bot
    redirectToDiscordInvite();
}

function notifyMe() {
    const email = prompt("Enter your email to get notified when Premium launches:", "");
    if (email && email.includes('@')) {
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
