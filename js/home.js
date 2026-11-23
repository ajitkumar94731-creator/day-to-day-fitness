// js/home.js
// Load approved reviews onto the homepage and display summary
import { getApprovedReviews, getAverageRating, getApprovedReviewCount } from './database.js';

function renderStars(rating) {
  const full = '★'.repeat(rating);
  const empty = '☆'.repeat(5 - rating);
  return `<span style="color: var(--red); font-size:1.2rem;">${full}${empty}</span>`;
}

async function loadReviews() {
  const reviews = await getApprovedReviews();
  const container = document.getElementById('review-cards');
  const summary = document.getElementById('review-summary');
  if (!container || !summary) return;
  container.innerHTML = '';
  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-body">
        <h3>${r.name}</h3>
        ${renderStars(Number(r.rating))}
        <p>${r.comment}</p>
      </div>`;
    container.appendChild(card);
  });
  const avg = await getAverageRating();
  const count = await getApprovedReviewCount();
  summary.textContent = `Average rating: ${avg} ⭐ (${count} review${count===1?'':'s'})`;
}

document.addEventListener('DOMContentLoaded', loadReviews);
