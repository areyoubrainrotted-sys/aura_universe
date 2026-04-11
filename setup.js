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

    // 3. INITIAL PROGRESS BAR
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
    }
    // Validation for Step 2
    if (window.currentStep === 2) {
        const plan = document.querySelector('input[name="plan"]:checked');
        if (!plan) {
            alert("⚠️ Please select a plan.");
            return;
        }
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
    const name = document.getElementById('serverName').value;
    const category = window.selectedCategory ? window.selectedCategory.toUpperCase() : 'Not Selected';
    const plan = document.querySelector('input[name="plan"]:checked')?.value || 'None';
    
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
            <span class="review-label">Selected Plan</span>
            <span class="review-value" style="color: var(--aura-green)">${escapeHtml(plan)}</span>
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

async function submitSetup() {
    const agree = document.getElementById('agreeTerms').checked;
    if (!agree) {
        alert("❌ You must agree to the terms before launching!");
        return;
    }

    const loader = document.getElementById('loadingOverlay');
    loader.classList.add('active');
    loader.style.display = 'flex';

    const setupData = {
        serverName: document.getElementById('serverName').value,
        serverDesc: document.getElementById('serverDesc').value,
        inviteCode: document.getElementById('inviteCode').value,
        category: window.selectedCategory,
        serverSize: document.getElementById('serverSize').value,
        plan: document.querySelector('input[name="plan"]:checked')?.value,
        extras: Array.from(document.querySelectorAll('input[name="feature"]:checked')).map(cb => cb.value),
        email: document.getElementById('contactEmail').value
    };

    try {
        const response = await fetch('http://127.0.0.1:5000/launch-server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setupData)
        });
        const result = await response.json();
        if (result.status === "success") {
            alert("🚀 CORE INITIALIZED! Welcome to the Universe.");
            window.location.href = "index.html";
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Connection failed:", error);
        alert("Backend connection failed. Is your Python app running?");
    } finally {
        loader.classList.remove('active');
        loader.style.display = 'none';
    }
}
