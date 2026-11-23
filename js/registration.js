// js/registration.js
// Module handling the registration form
import { addRegistration } from './database.js';

function indianPhoneValid(num) {
  // Accept formats: +91XXXXXXXXXX or 0XXXXXXXXXX or XXXXXXXXXX (10 digits starting 6-9)
  const clean = num.replace(/\s|\-/g, '');
  const regex = /^(\+91|0)?[6-9]\d{9}$/;
  return regex.test(clean);
}

function getPlanFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('plan') || '';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const msgDiv = document.getElementById('msg');
  if (!form) return;
  // Pre‑select plan if provided in URL
  const planSelect = form.querySelector('select[name="membershipPlan"]');
  const planFromURL = getPlanFromURL();
  if (planSelect && planFromURL) {
    planSelect.value = planFromURL;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgDiv.textContent = '';
    const data = new FormData(form);
    const fullName = data.get('fullName').trim();
    const phone = data.get('phone').trim();
    const email = data.get('email').trim();
    const age = Number(data.get('age'));
    const gender = data.get('gender') || '';
    const membershipPlan = data.get('membershipPlan');
    const fitnessGoals = data.get('fitnessGoals').trim();
    const registrationDate = new Date().toISOString();

    // Basic validation
    if (!fullName || !phone || !email || !age || !membershipPlan) {
      msgDiv.textContent = 'Please fill in all required fields.';
      return;
    }
    if (!indianPhoneValid(phone)) {
      msgDiv.textContent = 'Please enter a valid Indian phone number.';
      return;
    }
    // Build registration object
    const reg = {
      fullName,
      phone,
      email,
      age,
      gender,
      membershipPlan,
      fitnessGoals,
      registrationDate,
    };
    try {
      const record = await addRegistration(reg);
      msgDiv.style.color = 'var(--red)';
      msgDiv.textContent = `Registration successful! Your temporary ID is ${record.id}. An admin will review your request.`;
      form.reset();
      // Reset plan selection after form reset (if URL had plan)
      if (planSelect && planFromURL) {
        planSelect.value = planFromURL;
      }
    } catch (err) {
      console.error(err);
      msgDiv.textContent = 'An error occurred while saving. Please try again.';
    }
  });
});

// Module handling the registration form
import { addRegistration } from './database.js';

function indianPhoneValid(num) {
  // Accept formats: +91XXXXXXXXXX or 0XXXXXXXXXX or XXXXXXXXXX (10 digits starting 6-9)
  const clean = num.replace(/\s|\-/g, '');
  const regex = /^(\+91|0)?[6-9]\d{9}$/;
  return regex.test(clean);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const msgDiv = document.getElementById('msg');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgDiv.textContent = '';
    const data = new FormData(form);
    const fullName = data.get('fullName').trim();
    const phone = data.get('phone').trim();
    const email = data.get('email').trim();
    const age = Number(data.get('age'));
    const gender = data.get('gender') || '';
    const membershipPlan = data.get('membershipPlan');
    const fitnessGoals = data.get('fitnessGoals').trim();
    const registrationDate = new Date().toISOString();

    // Basic validation
    if (!fullName || !phone || !email || !age || !membershipPlan) {
      msgDiv.textContent = 'Please fill in all required fields.';
      return;
    }
    if (!indianPhoneValid(phone)) {
      msgDiv.textContent = 'Please enter a valid Indian phone number.';
      return;
    }
    // Build registration object
    const reg = {
      fullName,
      phone,
      email,
      age,
      gender,
      membershipPlan,
      fitnessGoals,
      registrationDate,
    };
    try {
      const record = await addRegistration(reg);
      msgDiv.style.color = 'var(--red)';
      msgDiv.textContent = `Registration successful! Your Member ID will be assigned after approval. (Temp ID: ${record.id})`;
      form.reset();
    } catch (err) {
      console.error(err);
      msgDiv.textContent = 'An error occurred while saving. Please try again.';
    }
  });
});
