// 1. TRACKING STATE
let currentStep = 1;
let selectedCategory = null; // Set to null to force selection

// 2. CATEGORY SELECTION LOGIC
document.querySelectorAll('.server-option').forEach(option => {
    option.addEventListener('click', () => {
        // Remove 'selected' class and reset borders for all
        document.querySelectorAll('.server-option').forEach(opt => {
            opt.classList.remove('selected');
            opt.style.border = "1px solid var(--glass-border)";
        });
        
        // Add highlight to the one we clicked
        option.classList.add('selected');
        option.style.border = "2px solid var(--aura-cyan)";
        selectedCategory = option.getAttribute('data-type');
    });
});

// 3. NAVIGATION LOGIC (With Compulsory Validation)
function nextStep(step) {
    // 1. VALIDATION (Keep your existing validation logic here)
    if (currentStep === 1) {
        const name = document.getElementById('serverName').value.trim();
        const desc = document.getElementById('serverDesc').value.trim();
        if (!name || !desc || !selectedCategory) {
            alert("⚠️ Please fill in all fields and select a category.");
            return;
        }
    }
    if (currentStep === 2) {
        const plan = document.querySelector('input[name="plan"]:checked');
        if (!plan) {
            alert("⚠️ Please select a Plan.");
            return;
        }
        prepareReview();
    }

    // 2. SWITCHING LOGIC
    // 2. Hide everything aggressively
    document.querySelectorAll('.form-section').forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none'; // Manual override
    });

    // 3. Show target aggressively
    const target = document.getElementById(`section${step}`);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block'; // Manual override
        
        currentStep = step;
        updateProgressBar(step);
        window.scrollTo(0, 0);
        
        console.log("Navigated to Section: " + step); // Check your console for this!
    } else {
        console.log("Error: Target id section" + step + " not found!");
    }
}

function prevStep(step) {
    document.querySelectorAll('.form-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    const target = document.getElementById(`section${step}`);
    if (target) {
        target.classList.add('active');
        currentStep = step;
        updateProgressBar(step);
    }
}

// 4. PREPARE REVIEW (Fills the Step 3 Card)
function prepareReview() {
    const card = document.getElementById('reviewCard');
    const nameInput = document.getElementById('serverName');
    const planInput = document.querySelector('input[name="plan"]:checked');

    // Prevent crash if elements are missing
    if (!card || !nameInput || !planInput) {
        console.error("Review elements missing!");
        return; 
    }

    const name = nameInput.value;
    const plan = planInput.value;
    
    card.innerHTML = `
        <div class="review-item">
            <span class="review-label">Server Name</span>
            <span class="review-value">${name}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Category</span>
            <span class="review-value">${(selectedCategory || 'Not Selected').toUpperCase()}</span>
        </div>
        <div class="review-item">
            <span class="review-label">Selected Plan</span>
            <span class="review-value" style="color: var(--aura-green)">${plan.toUpperCase()}</span>
        </div>
    `;
}

function updateProgressBar(step) {
    const fill = document.getElementById('progressFill');
    if (fill) {
        fill.style.width = ((step - 1) / 2 * 100) + "%";
    }
    
    // Update active class on step bubbles
    document.querySelectorAll('.step').forEach((el, index) => {
        if (index + 1 <= step) el.classList.add('active');
        else el.classList.remove('active');
    });
}

// 5. SUBMISSION LOGIC
async function submitSetup() {
    const agree = document.getElementById('agreeTerms').checked;
    if (!agree) {
        alert("❌ You must agree to the terms before launching!");
        return;
    }

    // Toggle loading overlay
    const loader = document.getElementById('loadingOverlay');
    loader.classList.add('active');
    loader.style.display = 'flex';

    const setupData = {
        serverName: document.getElementById('serverName').value,
        serverDesc: document.getElementById('serverDesc').value,
        inviteCode: document.getElementById('inviteCode').value,
        category: selectedCategory,
        serverSize: document.getElementById('serverSize').value,
        plan: document.querySelector('input[name="plan"]:checked').value,
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
