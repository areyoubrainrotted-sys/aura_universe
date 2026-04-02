// script.js

const SUPABASE_URL = 'https://ernuzdqipshbltuvbhtk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_emybAteRrn7PjZsJ2KV7qw_o3P6npxN';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Fetch and Display Reviews
async function fetchReviews() {
    const { data, error } = await _supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Transmission Interrupted:", error);
        return;
    }

    const reviewContainer = document.querySelector('.review-scroll');
    reviewContainer.innerHTML = ''; // Clear existing reviews

    data.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <p>"${review.content}"</p>
            <span class="author">Admin: ${review.author_name || 'Voyager'}</span>
        `;
        reviewContainer.appendChild(card);
    });
}

// 2. Post a New Review
async function sendReview() {
    const input = document.getElementById('user-review');
    const msg = input.value.trim();

    if (!msg) {
        alert("The universe requires substance. Write something!");
        return;
    }

    const { error } = await _supabase
        .from('reviews')
        .insert([{ content: msg, author_name: 'Explorer' }]);

    if (error) {
        alert("System error. Transmission failed.");
    } else {
        input.value = '';
        fetchReviews(); // Refresh the list
    }
}

// Initialize page
window.addEventListener('DOMContentLoaded', fetchReviews);
