let currentQuestNumber = 1;
let currentQuestionIndex = 0;
let surveyQuestions = [
    { text: "How did you find this server?", placeholder: "Friend, Discord discovery, Advertisement, etc.", type: "short", required: true },
    { text: "What's your favorite feature so far?", placeholder: "Mining, Fishing, Companies, Casino, etc.", type: "short", required: true },
    { text: "Any suggestions for improvement?", placeholder: "Share your ideas!", type: "paragraph", required: false }
];
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

function openQuestModal(questNum) {
    currentQuestNumber = questNum;
    const questInput = document.getElementById(`quest${questNum}`);
    const currentText = questInput.value;
    
    // Parse existing quest text
    const match = currentText.match(/(.+?) → \+(\d+) aura/);
    if (match) {
        document.getElementById('questTitle').value = match[1];
        document.getElementById('questReward').value = match[2];
    } else {
        document.getElementById('questTitle').value = currentText;
        document.getElementById('questReward').value = 50;
    }
    
    document.getElementById('questModal').classList.add('active');
}

function closeQuestModal() {
    document.getElementById('questModal').classList.remove('active');
}

function saveQuest() {
    const title = document.getElementById('questTitle').value;
    const reward = document.getElementById('questReward').value;
    const desc = document.getElementById('questDesc').value;
    
    const questText = `${title} → +${reward} aura`;
    document.getElementById(`quest${currentQuestNumber}`).value = questText;
    
    closeQuestModal();
}

function openSurveyModal(index) {
    currentQuestionIndex = index;
    const question = surveyQuestions[index];
    const modal = document.getElementById('surveyModal');

    if (modal && question) {
        document.getElementById('surveyQuestionText').value = question.text;
        document.getElementById('surveyPlaceholder').value = question.placeholder || '';
        document.getElementById('surveyType').value = question.type || 'short';
        document.getElementById('surveyRequired').checked = question.required !== false;
        
        // Handle Options display
        const optionsDiv = document.getElementById('multipleChoiceOptions');
        if (question.type === 'select') {
            document.getElementById('surveyOptions').value = question.options ? question.options.join(', ') : '';
            optionsDiv.style.display = 'block';
        } else {
            optionsDiv.style.display = 'none';
        }

        modal.classList.add('active');
    }
}

// 4. Initial call to populate list on load
document.addEventListener('DOMContentLoaded', () => {
    updateSurveyQuestionsList();
});

function updateSurveyQuestionsList() {
    const container = document.getElementById('surveyQuestionsList');
    if (!container) return;
    container.innerHTML = '';
    
    surveyQuestions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'survey-question-item';
        // FIXED: Using backticks and proper function calls
        div.innerHTML = `
            <span>${i+1}. ${q.text}</span>
            <div class="survey-btns">
                <button class="btn-config-small" onclick="openSurveyModal(${i})">Edit</button>
                <button class="btn-config-small" style="background: #dc3545;" onclick="removeQuestion(${i})">Remove</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function addQuestion() {
    surveyQuestions.push({
        text: "New Question",
        placeholder: "Type your answer...",
        type: "short",
        required: false
    });
    updateSurveyQuestionsList();
}

function removeQuestion(index) {
    surveyQuestions.splice(index, 1);
    updateSurveyQuestionsList();
}

// Update survey type display
document.getElementById('surveyType').addEventListener('change', function() {
    const multipleChoiceDiv = document.getElementById('multipleChoiceOptions');
    if (this.value === 'select') {
        multipleChoiceDiv.style.display = 'block';
    } else {
        multipleChoiceDiv.style.display = 'none';
    }
});

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
    
    const questEnabled = document.getElementById('questEnabled')?.checked ? '✅ Enabled' : '❌ Disabled';
    const surveyEnabled = document.getElementById('surveyEnabled')?.checked ? '✅ Enabled' : '❌ Disabled';
    
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
        <div class="review-item">
            <span class="review-label">Quest System</span>
            <span class="review-value">${questEnabled}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Survey System</span>
            <span class="review-value">${surveyEnabled}</span>
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
    if (loader) {
        loader.classList.add('active');
        loader.style.display = 'flex';
    }

    // Fix 1: Optional chaining on checked plan
    const planEl = document.querySelector('input[name="plan"]:checked');
    const selectedPlan = planEl ? planEl.value : 'free';
    
    const selectedFeatures = Array.from(document.querySelectorAll('input[name="feature"]:checked')).map(cb => cb.value);

    // Prepare data objects
    const quests = {
        quest1: document.getElementById('quest1')?.value || "",
        quest2: document.getElementById('quest2')?.value || "",
        quest3: document.getElementById('quest3')?.value || "",
        quest_enabled: document.getElementById('questEnabled')?.checked ? 1 : 0
    };
    
    const survey = {
        enabled: document.getElementById('surveyEnabled')?.checked ? 1 : 0,
        reward: parseInt(document.getElementById('surveyReward')?.value) || 250,
        questions: surveyQuestions
    };
    
    const setupData = {
        guild_id: guildId, // Make sure your DB column is BIGINT or TEXT
        server_name: sessionStorage.getItem('setup_serverName') || "Unknown",
        description: sessionStorage.getItem('setup_serverDesc') || "",
        category: sessionStorage.getItem('setup_category') || "community",
        server_size: sessionStorage.getItem('setup_serverSize') || "medium",
        invite_code: sessionStorage.getItem('setup_inviteCode') || "",
        contact_email: sessionStorage.getItem('setup_email') || "",
        plan: selectedPlan,
        features: selectedFeatures,
        quests: quests,   // Ensure column is jsonb in Supabase
        survey: survey,   // Ensure column is jsonb in Supabase
        registered_at: new Date().toISOString(),
        status: 'pending'
    };

    console.log("Attempting to save data:", setupData);

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/aura_servers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=representation' // Useful for debugging
            },
            body: JSON.stringify(setupData)
        });

        if (response.ok) {
            console.log("Success!");
            sessionStorage.clear(); // Clean up all setup data
            alert(`✅ Server registered successfully!\nServer ID: ${guildId}`);
            window.location.href = "index.html";
        } else {
            const errorText = await response.text();
            console.error("Supabase Error Response:", errorText);
            alert("Database Error: " + errorText);
        }
    } catch (error) {
        console.error("Network/Fetch error:", error);
        alert("Failed to connect to the database.");
    } finally {
        if (loader) {
            loader.classList.remove('active');
            loader.style.display = 'none';
        }
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
