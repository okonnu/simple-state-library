/**
 * Example App
 * Demonstrates the SimpleStateLibrary
 */

import { user, settings } from './models.js';

// Demo function: Load from API
function simulateFetch() {
    const statusEl = document.getElementById("statusMessage");

    // Simulate API response
    setTimeout(() => {
        user.name = "Jane Doe";
        user.email = "jane.doe@example.com";
        user.role = "editor";

        statusEl.className = "status-message success";
        statusEl.textContent = "✓ Data loaded from API successfully!";

        setTimeout(() => {
            statusEl.className = "status-message";
        }, 3000);
    }, 500);
}

// Demo function: Save to API
function simulatePost() {
    const statusEl = document.getElementById("statusMessage");

    if (!user.name || !user.email) {
        statusEl.className = "status-message error";
        statusEl.textContent = "✗ Please fill in name and email first";
        return;
    }

    // Simulate API call
    setTimeout(() => {
        statusEl.className = "status-message success";
        statusEl.textContent = "✓ Data saved to API successfully!";

        setTimeout(() => {
            statusEl.className = "status-message";
        }, 3000);
    }, 500);
}

// Reset form to empty state
function resetForm() {
    user.name = "";
    user.email = "";
    user.role = "viewer";
    settings.theme = "light";
    settings.notifications = true;
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById("loadBtn").addEventListener("click", simulateFetch);
    document.getElementById("saveBtn").addEventListener("click", simulatePost);
    document.getElementById("resetBtn").addEventListener("click", resetForm);
}

// Initialize on page load
window.addEventListener("load", setupEventListeners);
