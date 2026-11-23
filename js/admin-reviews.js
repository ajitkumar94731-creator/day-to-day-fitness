// js/admin-reviews.js
// Admin interface for managing customer reviews
import { getAllReviews, updateReview, deleteReview } from './database.js';

function renderStars(rating) {
  const full = '★'.repeat(rating);
  const empty = '☆'.repeat(5 - rating);
  return `<span style="color: var(--red); font-size:1.2rem;">${full}${empty}</span>`;
}

function createCard(review) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = review.id;
  card.dataset.status = review.status;
  card.innerHTML = `
    <div class="card-body">
      <h3>${review.name}</h3>
      ${renderStars(Number(review.rating))}
      <p>${review.comment}</p>
      <p>Status: <strong>${review.status}</strong></p>
      <button class="btn-primary" data-action="approve" style="margin-right:0.5rem;">Approve</button>
      <button class="btn-primary" data-action="reject" style="margin-right:0.5rem; background:#c00;">Reject</button>
      <button class="btn-primary" data-action="delete" style="background:#555;">Delete</button>
    </div>`;
  return card;
}

let allReviews = [];

async function loadReviews() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;
  allReviews = await getAllReviews();
  renderList();
}

function renderList() {
  const container = document.getElementById('reviewsContainer');
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const filter = document.getElementById('filterStatus').value;
  container.innerHTML = '';
  const filtered = allReviews.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm) || r.comment.toLowerCase().includes(searchTerm);
    const matchesStatus = filter === 'all' || r.status === filter;
    return matchesSearch && matchesStatus;
  });
  filtered.forEach(r => container.appendChild(createCard(r)));
}

async function handleAction(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const card = btn.closest('.card');
  const id = card.dataset.id;
  if (action === 'delete') {
    if (!confirm('Delete this review permanently?')) return;
    await deleteReview(id);
    allReviews = allReviews.filter(r => r.id !== id);
    renderList();
    return;
  }
  // approve or reject
  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  await updateReview(id, { status: newStatus });
  const rev = allReviews.find(r => r.id === id);
  if (rev) rev.status = newStatus;
  renderList();
}

document.addEventListener('DOMContentLoaded', () => {
  loadReviews();
  document.getElementById('search').addEventListener('input', renderList);
  document.getElementById('filterStatus').addEventListener('change', renderList);
  document.getElementById('reviewsContainer').addEventListener('click', handleAction);
});
