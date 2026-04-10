// 1. TRACKING STATE
let currentStep = 1;
let selectedCategory = "community"; // Default

// 2. CATEGORY SELECTION LOGIC
// This handles clicking those "Gaming", "Tech", "Anime" boxes
document.querySelectorAll('.server-option').forEach(option => {
    option.addEventListener('click', () => {
        // Remove 'active' class from all boxes
        document.querySelectorAll('.server-option').forEach(opt => opt.style.border = "1px solid #ddd");
        
        // Add highlight to the one we clicked
        option.style.border = "2px solid #007bff";
        selectedCategory = option.getAttribute('data-type');
    });
});

// 3. NAVIGATION LOGIC
function nextStep(step) {
    // Hide current section
    document.getElementById(`section${currentStep}`).style.display = 'none';
    // Show next section
    document.getElementById(`section${step}`).style.display = 'block';
    
    currentStep = step;
    updateProgressBar(step);
}

function prevStep(step) {
    document.getElementById(`section${currentStep}`).style.display = 'none';
    document.getElementById(`section${step}`).style.display = 'block';
    
    currentStep = step;
    updateProgressBar(step);
}

function updateProgressBar(step) {
    const fill = document.getElementById('progressFill');
    if (fill) {
        fill.style.width = ((step - 1) / 2 * 100) + "%";
    }
}

// 4. SUBMISSION LOGIC (The Bridge to Python/Supabase)
async function submitSetup() {
    // Basic Validation
    const agree = document.getElementById('agreeTerms').checked;
    if (!agree) {
        alert("You must agree to the terms before launching!");
        return;
    }

    // Show your loading spinner
    document.getElementById('loadingOverlay').style.display = 'flex';

    // Gather all the data from your HTML inputs
    const setupData = {
        serverName: document.getElementById('serverName').value,
        serverDesc: document.getElementById('serverDesc').value,
        inviteCode: document.getElementById('inviteCode').value,
        category: selectedCategory,
        serverSize: document.getElementById('serverSize').value,
        plan: document.querySelector('input[name="plan"]:checked').value,
        // Get all checked boxes for extras
        extras: Array.from(document.querySelectorAll('input[name="feature"]:checked')).map(cb => cb.value),
        email: document.getElementById('contactEmail').value
    };

    try {
        // CHANGE THIS URL to your Codespaces Forwarded Address later!
        const response = await fetch('http://127.0.0.1:5000/launch-server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setupData)
        });

        const result = await response.json();

        if (result.status === "success") {
            alert("Success! Aura Universe is initializing your server.");
            window.location.href = "index.html"; // Go back home
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Connection failed:", error);
        alert("Could not connect to the Aura Backend. Make sure app.py is running!");
    } finally {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}
