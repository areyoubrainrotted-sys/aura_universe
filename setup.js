// Supabase Configuration (direct from frontend)
const SUPABASE_URL = 'https://ernuzdqipshbltuvbhtk.supabase.co';  // Replace with your URL
const SUPABASE_KEY = 'sb_publishable_emybAteRrn7PjZsJ2KV7qw_o3P6npxN';  // Replace with your anon key (safe for frontend)

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.currentStep = 1;
    window.selectedCategory = null;

    // Category selection
    const categoryOptions = document.querySelectorAll('.server-option');
    categoryOptions.forEach(option => {
        option.addEventListener('click', () => {
            categoryOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            window.selectedCategory = option.getAttribute('data-type');
        });
    });

    // Check if returning from Discord OAuth (after bot invite)
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guild_id');
    
    if (guildId) {
        // Bot was added! Save to Supabase
        saveToSupabase(guildId);
    }

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
        // Save to sessionStorage temporarily
        sessionStorage.setItem('setup_serverName', name);
        sessionStorage.setItem('setup_serverDesc', desc);
        sessionStorage.setItem('setup_category', window.selectedCategory);
        sessionStorage.setItem('setup_serverSize', document.getElementById('serverSize').value);
        sessionStorage.setItem('setup_inviteCode', document.getElementById('inviteCode').value);
        if (document.getElementById('contactEmail')) {
            sessionStorage.setItem('setup_email', document.getElementById('contactEmail').value);
        }
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
    const name = sessionStorage.getItem('setup_serverName') || 'Not set';
    const category = sessionStorage.getItem('setup_category') || 'Not selected';
    const serverSize = sessionStorage.getItem('setup_serverSize') || 'medium';
    
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
const DISCORD_REDIRECT_URI = encodeURIComponent(window.location.href.split('?')[0]);
const DISCORD_SCOPES = 'bot applications.commands';
const DISCORD_PERMISSIONS = '8';

function redirectToDiscordInvite() {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=${DISCORD_PERMISSIONS}&scope=${DISCORD_SCOPES}&redirect_uri=${DISCORD_REDIRECT_URI}&response_type=code`;
    window.location.href = inviteUrl;
}

// Save to Supabase (direct, no Flask needed)
async function saveToSupabase(guildId) {
    const loader = document.getElementById('loadingOverlay');
    loader.classList.add('active');
    loader.style.display = 'flex';

    const selectedPlan = document.querySelector('input[name="plan"]:checked?.value || 'free')
    const selectedFeatures = Array.from(document.querySelectorAll('input[name="feature"]:checked')).map(cb => cb.value);

    const setupData = {
        guild_id: guildId,
        server_name: sessionStorage.getItem('setup_serverName'),
        description: sessionStorage.getItem('setup_serverDesc'),
        category: sessionStorage.getItem('setup_category'),
        server_size: sessionStorage.getItem('setup_serverSize'),
        invite_code: sessionStorage.getItem('setup_inviteCode'),
        contact_email: sessionStorage.getItem('setup_email'),
        plan: selectedPlan,
        features:selectedFeatures,
        registered_at: new Date().toISOString(),
        status: 'pending'  // Bot will update to 'active' once configured
    };

    try {
        // Direct Supabase insert
        const response = await fetch(`${SUPABASE_URL}/rest/v1/aura_servers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify(setupData)
        });

        if (response.ok) {
            // Clear session storage
            sessionStorage.removeItem('setup_serverName');
            sessionStorage.removeItem('setup_serverDesc');
            sessionStorage.removeItem('setup_category');
            sessionStorage.removeItem('setup_serverSize');
            sessionStorage.removeItem('setup_inviteCode');
            sessionStorage.removeItem('setup_email');
            
            alert(`✅ Server registered! Bot will auto-configure your server shortly.\n\nServer ID: ${guildId}`);
            window.location.href = "index.html";
        } else {
            const error = await response.json();
            alert("Error saving to database: " + JSON.stringify(error));
        }
    } catch (error) {
        console.error("Save error:", error);
        alert("Failed to save. Please try again.");
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

    // Save to sessionStorage
    sessionStorage.setItem('setup_serverName', document.getElementById('serverName').value);
    sessionStorage.setItem('setup_serverDesc', document.getElementById('serverDesc').value);
    sessionStorage.setItem('setup_category', window.selectedCategory);
    sessionStorage.setItem('setup_serverSize', document.getElementById('serverSize').value);
    sessionStorage.setItem('setup_inviteCode', document.getElementById('inviteCode').value);
    if (document.getElementById('contactEmail')) {
        sessionStorage.setItem('setup_email', document.getElementById('contactEmail').value);
    }

    // Redirect to Discord to add bot
    redirectToDiscordInvite();
}

function notifyMe() {
    const email = prompt("Enter your email to get notified when Premium launches:", "");
    if (email && email.includes('@')) {
        // Save to Supabase waitlist
        fetch(`${SUPABASE_URL}/rest/v1/premium_waitlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify({ email: email, subscribed_at: new Date().toISOString() })
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
