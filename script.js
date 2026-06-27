// =========================
// Global State
// =========================

let isLoggedIn = false;
let currentUser = null;
const adminUsername = "Duke_Scratch56";

// Backend URL
const BACKEND = "https://scratch-stats-backend.onrender.com";

// Local storage data
let appData = {
    verifiedUsers: [],
    featuredProjects: [],
    featuredStudios: [],
    featuredUsers: [],
    pendingVerify: [],
    pendingAdmin: [],
    adminAccounts: []
};

// =========================
// Load & Save
// =========================

function loadData() {
    const saved = localStorage.getItem("scratchStatsData");
    if (saved) {
        appData = JSON.parse(saved);
        appData.pendingVerify ||= [];
        appData.pendingAdmin ||= [];
        appData.adminAccounts ||= [];
        appData.verifiedUsers ||= [];
        appData.featuredProjects ||= [];
        appData.featuredStudios ||= [];
        appData.featuredUsers ||= [];
    }
}

function saveData() {
    localStorage.setItem("scratchStatsData", JSON.stringify(appData));
}

// =========================
// Init
// =========================

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupEventListeners();
    loadPublicStats();
    loadFeaturedContent();
    checkSession();
});

// =========================
// Event Listeners
// =========================

function setupEventListeners() {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginModal = document.getElementById("loginModal");
    const closeBtn = document.querySelector(".close");
    const loginForm = document.getElementById("loginForm");

    if (loginBtn) loginBtn.addEventListener("click", () => loginModal.style.display = "block");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    if (closeBtn) closeBtn.addEventListener("click", () => loginModal.style.display = "none");

    window.addEventListener("click", (e) => {
        if (e.target === loginModal) loginModal.style.display = "none";
    });

    if (loginForm) loginForm.addEventListener("submit", handleLogin);

    // Tabs
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", switchTab);
    });

    // Search
    const searchInput = document.getElementById("searchInput");
    const searchFilterToggle = document.querySelector(".search-filter-toggle");
    const searchFilters = document.querySelector(".search-filters");
    const searchWrapper = document.querySelector(".search-wrapper");

    if (searchFilterToggle) {
        searchFilterToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            searchFilters.style.display =
                searchFilters.style.display === "none" ? "block" : "none";
        });
    }

    document.addEventListener("click", (e) => {
        if (!searchWrapper.contains(e.target)) {
            searchFilters.style.display = "none";
            const suggestionsDiv = document.getElementById("searchSuggestions");
            if (suggestionsDiv) suggestionsDiv.style.display = "none";
        }
    });

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(updateSearchSuggestions, 300);
        });

        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                performSearch();
            }
        });

        searchInput.addEventListener("focus", () => {
            const suggestionsDiv = document.getElementById("searchSuggestions");
            if (suggestionsDiv && searchInput.value.length > 0) {
                updateSearchSuggestions();
            }
        });
    }

    // Request modal buttons (if present)
    const closeRequest = document.querySelector(".close-request");
    const requestVerifyBtn = document.getElementById("requestVerifyBtn");
    const requestAdminBtn = document.getElementById("requestAdminBtn");
    const requestForm = document.getElementById("requestForm");

    if (closeRequest) {
        closeRequest.addEventListener("click", () => {
            document.getElementById("requestModal").style.display = "none";
        });
    }

    if (requestVerifyBtn) {
        requestVerifyBtn.addEventListener("click", () => openRequestModal("verify"));
    }

    if (requestAdminBtn) {
        requestAdminBtn.addEventListener("click", () => openRequestModal("admin"));
    }

    if (requestForm) {
        requestForm.addEventListener("submit", handleRequestForm);
    }
}

// =========================
// Search Suggestions
// =========================

async function updateSearchSuggestions() {
    const query = document.getElementById("searchInput").value.trim();
    const suggestionsDiv = document.getElementById("searchSuggestions");

    if (!query || query.length < 2) {
        suggestionsDiv.style.display = "none";
        return;
    }

    try {
        const res = await fetch(`${BACKEND}/api/search/projects?q=${encodeURIComponent(query)}&limit=3`);
        const data = await res.json();

        let html = "";
        data.slice(0, 3).forEach(project => {
            const title = project.title || "Untitled";
            html += `
                <div class="suggestion-item" onclick="selectSuggestion('${title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-project-diagram"></i> ${title}
                </div>`;
        });

        suggestionsDiv.innerHTML = html;
        suggestionsDiv.style.display = html ? "block" : "none";

    } catch (err) {
        console.error("Error fetching suggestions:", err);
        suggestionsDiv.style.display = "none";
    }
}

function selectSuggestion(s) {
    document.getElementById("searchInput").value = s;
    document.getElementById("searchSuggestions").style.display = "none";
    performSearch();
}

// =========================
// Search
// =========================

async function performSearch() {
    const query = document.getElementById("searchInput").value.trim();
    if (!query) return alert("Please enter a search term");

    const searchResults = document.getElementById("searchResults");
    searchResults.innerHTML = "<p class='loading'>🔍 Searching...</p>";
    document.getElementById("searchModal").style.display = "block";

    try {
        const [projectsRes, usersRes] = await Promise.all([
            fetch(`${BACKEND}/api/search/projects?q=${encodeURIComponent(query)}&limit=5`),
            fetch(`${BACKEND}/api/search/users?q=${encodeURIComponent(query)}&limit=5`)
        ]);

        const projects = await projectsRes.json();
        const users = await usersRes.json();

        let html = "";

        // Projects
        if (projects.length > 0) {
            html += `<h3>🎮 Projects</h3><div class="search-results-list">`;
            projects.forEach(p => {
                html += `
                    <div class="search-result-item">
                        <h4>${p.title || "Untitled"}</h4>
                        <p>By <strong>@${p.creator?.username || "Unknown"}</strong></p>
                        <p>❤️ ${p.stats?.favorites || 0} | 💬 ${p.stats?.comments || 0}</p>
                        <a href="https://scratch.mit.edu/projects/${p.id}/" target="_blank" class="result-link">View Project →</a>
                    </div>`;
            });
            html += `</div>`;
        }

        // Users
        if (users.length > 0) {
            html += `<h3>👥 Users</h3><div class="search-results-list">`;
            users.forEach(u => {
                html += `
                    <div class="search-result-item">
                        <h4>@${u.username}</h4>
                        <p>ID: ${u.id}</p>
                        <a href="https://scratch.mit.edu/users/${u.username}/" target="_blank" class="result-link">View Profile →</a>
                    </div>`;
            });
            html += `</div>`;
        }

        searchResults.innerHTML = html || `<p class="no-results">No results found for "${query}"</p>`;

    } catch (err) {
        console.error("Search error:", err);
        searchResults.innerHTML = "<p class='error'>❌ Error performing search.</p>";
    }
}

function closeSearchModal() {
    document.getElementById("searchModal").style.display = "none";
}

// =========================
// Login
// =========================

function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("loginError");

    // 🔥 Insert your real password HERE safely:
    const ADMIN_PASSWORD = "ScratchStats!!!2026is-the-best";

    if (username === adminUsername && password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        currentUser = username;
        createSession();
        document.getElementById("loginModal").style.display = "none";
        updateUIState();
        loadAdminPanel();
        errorDiv.style.display = "none";
    } else {
        errorDiv.textContent = "Invalid username or password";
        errorDiv.style.display = "block";
    }
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    clearSession();
    updateUIState();
    document.getElementById("adminPanel").style.display = "none";
}

function updateUIState() {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const adminPanel = document.getElementById("adminPanel");

    if (loginBtn) loginBtn.style.display = isLoggedIn ? "none" : "block";
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? "block" : "none";
    if (adminPanel) adminPanel.style.display = isLoggedIn ? "block" : "none";
}

function checkSession() {
    const session = sessionStorage.getItem("adminSession");
    if (!session) return;

    const data = JSON.parse(session);
    if (new Date(data.expiry) > new Date()) {
        isLoggedIn = true;
        currentUser = data.username;
        updateUIState();
        loadAdminPanel();
    } else {
        clearSession();
    }
}

// =========================
// Stats
// =========================

function loadPublicStats() {
    try {
        const stats = {
            users: 250000000 + Math.floor(Math.random() * 50000000),
            projects: 180000000 + Math.floor(Math.random() * 30000000),
            studios: 8000000 + Math.floor(Math.random() * 2000000),
            comments: 580000000 + Math.floor(Math.random() * 100000000)
        };

        document.getElementById("totalUsers").textContent = stats.users.toLocaleString();
        document.getElementById("totalProjects").textContent = stats.projects.toLocaleString();
        document.getElementById("totalStudios").textContent = stats.studios.toLocaleString();
        document.getElementById("totalComments").textContent = stats.comments.toLocaleString();

    } catch {
        loadMockStats();
    }
}

function loadMockStats() {
    loadPublicStats();
}

// =========================
// Featured Content
// =========================

function loadFeaturedContent() {
    const projectsDiv = document.getElementById("featuredProjects");
    const studiosDiv = document.getElementById("featuredStudios");
    const usersDiv = document.getElementById("featuredUsers");

    if (projectsDiv) {
        projectsDiv.innerHTML =
            appData.featuredProjects.map(p =>
                `<a href="https://scratch.mit.edu/projects/${p.id}/" target="_blank" class="featured-item featured-link">
                    <strong>${p.title}</strong>
                    <p>ID: ${p.id}</p>
                </a>`
            ).join("") || `<p style="color:#999;">No featured projects yet</p>`;
    }

    if (studiosDiv) {
        studiosDiv.innerHTML =
            appData.featuredStudios.map(s =>
                `<a href="https://scratch.mit.edu/studios/${s.id}/" target="_blank" class="featured-item featured-link">
                    <strong>${s.title}</strong>
                    <p>ID: ${s.id}</p>
                </a>`
            ).join("") || `<p style="color:#999;">No featured studios yet</p>`;
    }

    if (usersDiv) {
        usersDiv.innerHTML =
            appData.featuredUsers.map(u =>
                `<a href="https://scratch.mit.edu/users/${u.username}/" target="_blank" class="featured-item featured-link">
                    <strong>@${u.username} <i class="fas fa-check-circle verified-icon"></i></strong>
                    <p>Verified User</p>
                </a>`
            ).join("") || `<p style="color:#999;">No featured users yet</p>`;
    }
}

// =========================
// Admin Panel
// =========================

function loadAdminPanel() {
    loadVerifiedUsers();
    loadManagedFeatured();
    loadPendingRequests();
}

// =========================
// Rank Helpers
// =========================

function getCurrentRank() {
    if (!currentUser) return null;
    if (currentUser === adminUsername) return "Owner";

    const admin = appData.adminAccounts.find(a => a.username === currentUser);
    return admin?.rank || null;
}

function requireRank(allowedRanks, actionName) {
    const rank = getCurrentRank();
    if (!rank || !allowedRanks.includes(rank)) {
        alert(`You do not have permission to ${actionName}.`);
        return false;
    }
    return true;
}

// =========================
// Verified Users
// =========================

function verifyUser() {
    if (!requireRank(["Owner", "Admin", "Moderator"], "verify users")) return;

    const username = document.getElementById("verifyUsername").value.trim();
    if (!username) return alert("Enter a username");

    if (!appData.verifiedUsers.includes(username)) {
        appData.verifiedUsers.push(username);
        saveData();
        loadVerifiedUsers();
        alert(`✓ @${username} verified`);
    } else {
        alert("Already verified");
    }
}

function loadVerifiedUsers() {
    const list = document.getElementById("verifiedUsersList");
    if (!list) return;

    list.innerHTML =
        appData.verifiedUsers.map(user =>
            `<div class="list-item">
                <span>✓ @${user}</span>
                <button class="btn btn-danger" onclick="unverifyUser('${user}')">Remove</button>
            </div>`
        ).join("") || `<p style="color:#999;">No verified users yet</p>`;
}

function unverifyUser(username) {
    if (!requireRank(["Owner", "Admin"], "remove verified users")) return;

    appData.verifiedUsers = appData.verifiedUsers.filter(u => u !== username);
    saveData();
    loadVerifiedUsers();
}

// =========================
// Feature Content
// =========================

function featureProject() {
    if (!requireRank(["Owner", "Admin"], "feature projects")) return;

    const id = document.getElementById("projectId").value.trim();
    const title = document.getElementById("projectTitle").value.trim();
    if (!id || !title) return alert("Enter ID and title");

    appData.featuredProjects.unshift({ id, title });
    if (appData.featuredProjects.length > 6) appData.featuredProjects.pop();

    saveData();
    loadFeaturedContent();
    loadManagedFeatured();
}

function featureStudio() {
    if (!requireRank(["Owner", "Admin"], "feature studios")) return;

    const id = document.getElementById("studioId").value.trim();
    const title = document.getElementById("studioTitle").value.trim();
    if (!id || !title) return alert("Enter ID and title");

    appData.featuredStudios.unshift({ id, title });
    if (appData.featuredStudios.length > 6) appData.featuredStudios.pop();

    saveData();
    loadFeaturedContent();
    loadManagedFeatured();
}

function featureUser() {
    if (!requireRank(["Owner", "Admin"], "feature users")) return;

    const username = document.getElementById("userId").value.trim();
    if (!username) return alert("Enter username");

    appData.featuredUsers.unshift({ username });
    if (appData.featuredUsers.length > 6) appData.featuredUsers.pop();

    saveData();
    loadFeaturedContent();
    loadManagedFeatured();
}

function loadManagedFeatured() {
    const projectsDiv = document.getElementById("manageFeaturedProjects");
    const studiosDiv = document.getElementById("manageFeaturedStudios");
    const usersDiv = document.getElementById("manageFeaturedUsers");

    if (projectsDiv) {
        projectsDiv.innerHTML =
            appData.featuredProjects.map((p, i) =>
                `<div class="manage-item">
                    <span>${p.title}</span>
                    <button class="btn btn-danger" onclick="removeFeature('projects', ${i})">Remove</button>
                </div>`
            ).join("") || `<p style="color:#999;">No featured projects</p>`;
    }

    if (studiosDiv) {
        studiosDiv.innerHTML =
            appData.featuredStudios.map((s, i) =>
                `<div class="manage-item">
                    <span>${s.title}</span>
                    <button class="btn btn-danger" onclick="removeFeature('studios', ${i})">Remove</button>
                </div>`
            ).join("") || `<p style="color:#999;">No featured studios</p>`;
    }

    if (usersDiv) {
        usersDiv.innerHTML =
            appData.featuredUsers.map((u, i) =>
                `<div class="manage-item">
                    <span>@${u.username}</span>
                    <button class="btn btn-danger" onclick="removeFeature('users', ${i})">Remove</button>
                </div>`
            ).join("") || `<p style="color:#999;">No featured users</p>`;
    }
}

function removeFeature(type, index) {
    if (!requireRank(["Owner", "Admin"], "remove featured content")) return;

    if (type === "projects") appData.featuredProjects.splice(index, 1);
    if (type === "studios") appData.featuredStudios.splice(index, 1);
    if (type === "users") appData.featuredUsers.splice(index, 1);

    saveData();
    loadFeaturedContent();
    loadManagedFeatured();
}

// =========================
// Tabs
// =========================

function switchTab(e) {
    const tabName = e.target.getAttribute("data-tab");

    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

    e.target.classList.add("active");
    document.getElementById(tabName).classList.add("active");
}

// =========================
// Session
// =========================

function createSession() {
    const session = {
        username: currentUser,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    sessionStorage.setItem("adminSession", JSON.stringify(session));
}

function clearSession() {
    sessionStorage.removeItem("adminSession");
}

// =========================
// Request Modal
// =========================

function openRequestModal(type) {
    const modal = document.getElementById("requestModal");
    const title = document.getElementById("requestTitle");
    const passwordField = document.getElementById("passwordField");

    modal.style.display = "block";

    if (type === "verify") {
        title.textContent = "Request Verification";
        passwordField.style.display = "none";
        modal.setAttribute("data-type", "verify");
    } else {
        title.textContent = "Request Admin Access";
        passwordField.style.display = "block";
        modal.setAttribute("data-type", "admin");
    }
}

// =========================
// Request Form Handling
// =========================

function handleRequestForm(e) {
    e.preventDefault();

    const type = document.getElementById("requestModal").getAttribute("data-type");
    const username = document.getElementById("requestUsername").value.trim();
    const reason = document.getElementById("requestReason").value.trim();
    const password = document.getElementById("requestPassword").value.trim();

    if (!username || !reason || (type === "admin" && !password)) {
        alert("Please fill out all required fields.");
        return;
    }

    if (type === "verify") {
        appData.pendingVerify.push({ username, reason });
        alert("Your verification request has been sent!");
    } else {
        appData.pendingAdmin.push({
            username,
            password: btoa(password),
            reason,
            rank: "Admin" // default rank for new admins
        });
        alert("Your admin request has been sent!");
    }

    saveData();
    document.getElementById("requestModal").style.display = "none";
    document.getElementById("requestForm").reset();
    loadPendingRequests();
}

// =========================
// Pending Requests (Cards)
// =========================

function loadPendingRequests() {
    const verifyDiv = document.getElementById("pendingVerifyList");
    const adminDiv = document.getElementById("pendingAdminList");

    if (!verifyDiv || !adminDiv) return;

    // Verification Requests
    verifyDiv.innerHTML = appData.pendingVerify.length > 0
        ? appData.pendingVerify.map((req, i) =>
            `<div class="pending-card">
                <div class="pending-info">
                    <strong>@${req.username}</strong>
                    <span class="pending-reason">"${req.reason}"</span>
                </div>
                <div class="pending-actions">
                    <button class="btn btn-approve" onclick="approveVerify(${i})">
                        Approve
                    </button>
                    <button class="btn btn-deny" onclick="denyVerify(${i})">
                        Deny
                    </button>
                </div>
            </div>`
        ).join("")
        : '<p style="color:#999;">No pending verification requests</p>';

    // Admin Requests
    adminDiv.innerHTML = appData.pendingAdmin.length > 0
        ? appData.pendingAdmin.map((req, i) =>
            `<div class="pending-card">
                <div class="pending-info">
                    <strong>@${req.username}</strong>
                    <span class="pending-reason">"${req.reason}"</span>
                </div>
                <div class="pending-actions">
                    <button class="btn btn-approve" onclick="approveAdmin(${i})">
                        Approve
                    </button>
                    <button class="btn btn-deny" onclick="denyAdmin(${i})">
                        Deny
                    </button>
                </div>
            </div>`
        ).join("")
        : '<p style="color:#999;">No pending admin requests</p>';
}

// =========================
// Approve / Deny Requests
// =========================

function approveVerify(i) {
    if (!requireRank(["Owner", "Admin", "Moderator"], "approve verification requests")) return;

    const user = appData.pendingVerify[i].username;
    if (!appData.verifiedUsers.includes(user)) {
        appData.verifiedUsers.push(user);
    }
    appData.pendingVerify.splice(i, 1);
    saveData();
    loadPendingRequests();
    loadVerifiedUsers();
    alert(`@${user} is now verified!`);
}

function denyVerify(i) {
    if (!requireRank(["Owner", "Admin", "Moderator"], "deny verification requests")) return;

    appData.pendingVerify.splice(i, 1);
    saveData();
    loadPendingRequests();
}

function approveAdmin(i) {
    if (!requireRank(["Owner"], "approve admin requests")) return;

    const req = appData.pendingAdmin[i];

    appData.adminAccounts.push({
        username: req.username,
        password: req.password,
        reason: req.reason,
        rank: req.rank || "Admin"
    });

    appData.pendingAdmin.splice(i, 1);
    saveData();
    loadPendingRequests();
    alert(`@${req.username} is now an admin!`);
}

function denyAdmin(i) {
    if (!requireRank(["Owner"], "deny admin requests")) return;

    appData.pendingAdmin.splice(i, 1);
    saveData();
    loadPendingRequests();
}

// =========================
// Auto-refresh stats
// =========================

setInterval(loadPublicStats, 5 * 60 * 1000);
