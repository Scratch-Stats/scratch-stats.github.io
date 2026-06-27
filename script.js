// Global state
let isLoggedIn = false;
let currentUser = null;
const adminUsername = 'Duke_Scratch56';

// Backend URL
const BACKEND = "https://scratch-stats-backend.onrender.com";

// Mock data storage
let appData = {
    verifiedUsers: [],
    featuredProjects: [],
    featuredStudios: [],
    featuredUsers: []
};

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('scratchStatsData');
    if (saved) {
        appData = JSON.parse(saved);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('scratchStatsData', JSON.stringify(appData));
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    loadPublicStats();
    loadFeaturedContent();
    checkSession();
});

// Setup event listeners
function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close');
    const loginForm = document.getElementById('loginForm');

    if (loginBtn) loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (closeBtn) closeBtn.addEventListener('click', () => loginModal.style.display = 'none');

    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
    });

    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    const searchFilterToggle = document.querySelector('.search-filter-toggle');
    const searchFilters = document.querySelector('.search-filters');
    const searchWrapper = document.querySelector('.search-wrapper');

    if (searchFilterToggle) {
        searchFilterToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            searchFilters.style.display =
                searchFilters.style.display === 'none' ? 'block' : 'none';
        });
    }

    document.addEventListener('click', (e) => {
        if (!searchWrapper.contains(e.target)) {
            searchFilters.style.display = 'none';
            const suggestionsDiv = document.getElementById('searchSuggestions');
            suggestionsDiv.style.display = 'none';
        }
    });

    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(updateSearchSuggestions, 300);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });

        searchInput.addEventListener('focus', () => {
            const suggestionsDiv = document.getElementById('searchSuggestions');
            if (suggestionsDiv && searchInput.value.length > 0) {
                updateSearchSuggestions();
            }
        });
    }
}

// Update search suggestions
async function updateSearchSuggestions() {
    const query = document.getElementById('searchInput').value.trim();
    const suggestionsDiv = document.getElementById('searchSuggestions');

    if (!query || query.length < 2) {
        suggestionsDiv.style.display = 'none';
        return;
    }

    try {
        const projectsResponse = await fetch(
            `${BACKEND}/api/search/projects?q=${encodeURIComponent(query)}&limit=3`
        );
        const projectsData = await projectsResponse.json();

        let html = '';
        if (projectsData.length > 0) {
            projectsData.slice(0, 3).forEach(project => {
                const title = project.title || "Untitled";
                html += `
                    <div class="suggestion-item" onclick="selectSuggestion('${title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-project-diagram"></i> ${title}
                    </div>`;
            });
        }

        suggestionsDiv.innerHTML = html;
        suggestionsDiv.style.display = html ? 'block' : 'none';
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        suggestionsDiv.style.display = 'none';
    }
}

function selectSuggestion(suggestion) {
    document.getElementById('searchInput').value = suggestion;
    document.getElementById('searchSuggestions').style.display = 'none';
    performSearch();
}

// Perform search
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        alert('Please enter a search term');
        return;
    }

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<p class="loading">🔍 Searching...</p>';
    document.getElementById('searchModal').style.display = 'block';

    try {
        const projectsResponse = await fetch(
            `${BACKEND}/api/search/projects?q=${encodeURIComponent(query)}&limit=5`
        );
        const projectsData = await projectsResponse.json();

        const usersResponse = await fetch(
            `${BACKEND}/api/search/users?q=${encodeURIComponent(query)}&limit=5`
        );
        const usersData = await usersResponse.json();

        let html = '';

        // Projects
        if (projectsData.length > 0) {
            html += '<h3>🎮 Projects</h3><div class="search-results-list">';
            projectsData.forEach(project => {
                const title = project.title || "Untitled";
                const creator = project.creator?.username || "Unknown";
                const favorites = project.stats?.favorites || 0;
                const comments = project.stats?.comments || 0;

                html += `
                    <div class="search-result-item">
                        <h4>${title}</h4>
                        <p>By <strong>@${creator}</strong></p>
                        <p>❤️ ${favorites} | 💬 ${comments}</p>
                        <a href="https://scratch.mit.edu/projects/${project.id}/" target="_blank" class="result-link">View Project →</a>
                    </div>`;
            });
            html += '</div>';
        }

        // Users
        if (usersData.length > 0) {
            html += '<h3>👥 Users</h3><div class="search-results-list">';
            usersData.forEach(user => {
                const username = user.username || "Unknown";
                const id = user.id || "N/A";

                html += `
                    <div class="search-result-item">
                        <h4>@${username}</h4>
                        <p>ID: ${id}</p>
                        <a href="https://scratch.mit.edu/users/${username}/" target="_blank" class="result-link">View Profile →</a>
                    </div>`;
            });
            html += '</div>';
        }

        if (!html) {
            html = `<p class="no-results">No results found for "${query}"</p>`;
        }

        searchResults.innerHTML = html;
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<p class="error">❌ Error performing search. Please try again.</p>';
    }
}

function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
}

// Login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');

    if (username === adminUsername && password === 'Scratch@Admin2024!Secure') {
        isLoggedIn = true;
        currentUser = username;
        createSession();
        document.getElementById('loginModal').style.display = 'none';
        updateUIState();
        loadAdminPanel();
        errorDiv.style.display = 'none';
    } else {
        errorDiv.textContent = 'Invalid username or password';
        errorDiv.style.display = 'block';
    }
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    clearSession();
    updateUIState();
    document.getElementById('adminPanel').style.display = 'none';
}

function updateUIState() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminPanel = document.getElementById('adminPanel');

    loginBtn.style.display = isLoggedIn ? 'none' : 'block';
    logoutBtn.style.display = isLoggedIn ? 'block' : 'none';
    adminPanel.style.display = isLoggedIn ? 'block' : 'none';
}

function checkSession() {
    const session = sessionStorage.getItem('adminSession');
    if (session) {
        const sessionData = JSON.parse(session);
        if (new Date(sessionData.expiry) > new Date()) {
            isLoggedIn = true;
            currentUser = sessionData.username;
            updateUIState();
            loadAdminPanel();
        } else {
            clearSession();
        }
    }
}

// Public stats
function loadPublicStats() {
    try {
        const stats = {
            users: 250000000 + Math.floor(Math.random() * 50000000),
            projects: 180000000 + Math.floor(Math.random() * 30000000),
            studios: 8000000 + Math.floor(Math.random() * 2000000),
            comments: 580000000 + Math.floor(Math.random() * 100000000)
        };

        document.getElementById('totalUsers').textContent = stats.users.toLocaleString();
        document.getElementById('totalProjects').textContent = stats.projects.toLocaleString();
        document.getElementById('totalStudios').textContent = stats.studios.toLocaleString();
        document.getElementById('totalComments').textContent = stats.comments.toLocaleString();
    } catch (error) {
        loadMockStats();
    }
}

function loadMockStats() {
    const stats = {
        users: 250000000 + Math.floor(Math.random() * 50000000),
        projects: 180000000 + Math.floor(Math.random() * 30000000),
        studios: 8000000 + Math.floor(Math.random() * 2000000),
        comments: 580000000 + Math.floor(Math.random() * 100000000)
    };

    document.getElementById('totalUsers').textContent = stats.users.toLocaleString();
    document.getElementById('totalProjects').textContent = stats.projects.toLocaleString();
    document.getElementById('totalStudios').textContent = stats.studios.toLocaleString();
    document.getElementById('totalComments').textContent = stats.comments.toLocaleString();
}

// Featured content
function loadFeaturedContent() {
    const projectsDiv = document.getElementById('featuredProjects');
    const studiosDiv = document.getElementById('featuredStudios');
    const usersDiv = document.getElementById('featuredUsers');

    if (projectsDiv) {
        projectsDiv.innerHTML =
            appData.featuredProjects.map(p =>
                `<a href="https://scratch.mit.edu/projects/${p.id}/" target="_blank" class="featured-item featured-link"><strong>${p.title}</strong><p>ID: ${p.id}</p></a>`
            ).join('') || '<p style="color:#999;">No featured projects yet</p>';
    }

    if (studiosDiv) {
        studiosDiv.innerHTML =
            appData.featuredStudios.map(s =>
                `<a href="https://scratch.mit.edu/studios/${s.id}/" target="_blank" class="featured-item featured-link"><strong>${s.title}</strong><p>ID: ${s.id}</p></a>`
            ).join('') || '<p style="color:#999;">No featured studios yet</p>';
    }

    if (usersDiv) {
        usersDiv.innerHTML =
            appData.featuredUsers.map(u =>
                `<a href="https://scratch.mit.edu/users/${u.username}/" target="_blank" class="featured-item featured-link"><strong>@${u.username}</strong><p>✓ Verified</p></a>`
            ).join('') || '<p style="color:#999;">No featured users yet</p>';
    }
}

// Admin panel
function loadAdminPanel() {
    loadVerifiedUsers();
    loadManagedFeatured();
}

function verifyUser() {
    const username = document.getElementById('verifyUsername').value.trim();
    if (!username) return alert('Please enter a username');

    if (!appData.verifiedUsers.includes(username)) {
        appData.verifiedUsers.push(username);
        saveData();
        document.getElementById('verifyUsername').value = '';
        loadVerifiedUsers();
        alert(`✓ ${username} has been verified!`);
    } else {
        alert(`${username} is already verified`);
    }
}

function loadVerifiedUsers() {
    const list = document.getElementById('verifiedUsersList');
    if (list) {
        list.innerHTML =
            appData.verifiedUsers.map(user =>
                `<div class="list-item">
                    <span>✓ @${user}</span>
                    <button class="btn btn-danger" onclick="unverifyUser('${user}')">Remove</button>
                </div>`
            ).join('') || '<p style="color:#999;">No verified users yet</p>';
    }
}

function unverifyUser(username) {
    appData.verifiedUsers = appData.verifiedUsers.filter(u => u !== username);
    saveData();
    loadVerifiedUsers();
}

function featureProject() {
    const id = document.getElementById('projectId').value.trim();
    const title = document.getElementById('projectTitle').value.trim();

    if (!id || !title) return alert('Please enter project ID and title');

    appData.featuredProjects.unshift({ id, title });
    if (appData.featuredProjects.length > 6) appData.featuredProjects.pop();
    saveData();
    document.getElementById('projectId').value = '';
    document.getElementById('projectTitle').value = '';
    loadFeaturedContent();
    loadManagedFeatured();
    alert(`✓ Project "${title}" featured!`);
}

function featureStudio() {
    const id = document.getElementById('studioId').value.trim();
    const title = document.getElementById('studioTitle').value.trim();

    if (!id || !title) return alert('Please enter studio ID and title');

    appData.featuredStudios.unshift({ id, title });
    if (appData.featuredStudios.length > 6) appData.featuredStudios.pop();
    saveData();
    document.getElementById('studioId').value = '';
    document.getElementById('studioTitle').value = '';
    loadFeaturedContent();
    loadManagedFeatured();
    alert(`✓ Studio "${title}" featured!`);
}

function featureUser() {
    const username = document.getElementById('userId').value.trim();
    if (!username) return alert('Please enter a username');

    appData.featuredUsers.unshift({ username });
    if (appData.featuredUsers.length > 6) appData.featuredUsers.pop();
    saveData();
    document.getElementById('userId').value = '';
    loadFeaturedContent();
    loadManagedFeatured();
    alert(`✓ @${username} featured!`);
}

function loadManagedFeatured() {
    const projectsDiv = document.getElementById('manageFeaturedProjects');
    const studiosDiv = document.getElementById('manageFeaturedStudios');
    const usersDiv = document.getElementById('manageFeaturedUsers');

    if (projectsDiv) {
        projectsDiv.innerHTML =
            appData.featuredProjects.map((p, i) =>
                `<div class="manage-item">
                    <span>${p.title}</span>
                    <button class="btn btn-danger" onclick="removeFeature('projects', ${i})">Remove</button>
                </div>`
            ).join('') || '<p style="color:#999;">No featured projects</p>';
    }

    if (studiosDiv) {
        studiosDiv.innerHTML =
            appData.featuredStudios.map((s, i) =>
                `<div class="manage-item">
                    <span>${s.title}</span>
                    <button class="btn btn-danger" onclick="removeFeature('studios', ${i})">Remove</button>
                </div>`
            ).join('') || '<p style="color:#999;">No featured studios</p>';
    }

    if (usersDiv) {
        usersDiv.innerHTML =
            appData.featuredUsers.map((u, i) =>
                `<div class="manage-item">
                    <span>@${u.username}</span>
                    <button class="btn btn-danger" onclick="removeFeature('users', ${i})">Remove</button>
                </div>`
            ).join('') || '<p style="color:#999;">No featured users</p>';
    }
}

function removeFeature(type, index) {
    if (type === 'projects') appData.featuredProjects.splice(index, 1);
    if (type === 'studios') appData.featuredStudios.splice(index, 1);
    if (type === 'users') appData.featuredUsers.splice(index, 1);

    saveData();
    loadFeaturedContent();
    loadManagedFeatured();
}

// Tabs
function switchTab(e) {
    const tabName = e.target.getAttribute('data-tab');

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Session
function createSession() {
    const session = {
        username: currentUser,
        createdAt: new Date(),
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    sessionStorage.setItem('adminSession', JSON.stringify(session));
}

function clearSession() {
    sessionStorage.removeItem('adminSession');
}

// Auto-refresh stats every 5 minutes
setInterval(loadPublicStats, 5 * 60 * 1000);

// Request system storage
appData.pendingVerify = appData.pendingVerify || [];
appData.pendingAdmin = appData.pendingAdmin || [];

// Open request modal
function openRequestModal(type) {
    const modal = document.getElementById('requestModal');
    const title = document.getElementById('requestTitle');
    const passwordField = document.getElementById('passwordField');

    modal.style.display = 'block';

    if (type === 'verify') {
        title.textContent = "Request Verification";
        passwordField.style.display = 'none';
        modal.setAttribute('data-type', 'verify');
    } else {
        title.textContent = "Request Admin Access";
        passwordField.style.display = 'block';
        modal.setAttribute('data-type', 'admin');
    }
}

// Close modal
document.querySelector('.close-request').addEventListener('click', () => {
    document.getElementById('requestModal').style.display = 'none';
});

// Buttons
document.getElementById('requestVerifyBtn').addEventListener('click', () => openRequestModal('verify'));
document.getElementById('requestAdminBtn').addEventListener('click', () => openRequestModal('admin'));

// Handle request form
document.getElementById('requestForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const type = document.getElementById('requestModal').getAttribute('data-type');
    const username = document.getElementById('requestUsername').value.trim();
    const reason = document.getElementById('requestReason').value.trim();
    const password = document.getElementById('requestPassword').value.trim();

    if (!username || !reason) {
        alert("Please fill out all fields.");
        return;
    }

    if (type === 'verify') {
        appData.pendingVerify.push({ username, reason });
        alert("Your verification request has been sent!");
    } else {
        appData.pendingAdmin.push({ username, password, reason });
        alert("Your admin request has been sent!");
    }

    saveData();
    document.getElementById('requestModal').style.display = 'none';
});

appData.pendingAdmin.push({
    username,
    password: btoa(password), // encoded so YOU cannot read it
    reason
});

// Ensure storage exists
appData.pendingVerify = appData.pendingVerify || [];
appData.pendingAdmin = appData.pendingAdmin || [];
appData.adminAccounts = appData.adminAccounts || [];

// Load pending requests into admin panel
function loadPendingRequests() {
    const verifyDiv = document.getElementById('pendingVerifyList');
    const adminDiv = document.getElementById('pendingAdminList');

    // Verification Requests
    verifyDiv.innerHTML = appData.pendingVerify.length > 0
        ? appData.pendingVerify.map((req, i) =>
            `<div class="list-item">
                <span><strong>@${req.username}</strong> — "${req.reason}"</span>
                <button class="btn btn-primary" onclick="approveVerify(${i})">Approve</button>
                <button class="btn btn-danger" onclick="denyVerify(${i})">Deny</button>
            </div>`
        ).join('')
        : '<p style="color:#999;">No pending verification requests</p>';

    // Admin Requests (password hidden)
    adminDiv.innerHTML = appData.pendingAdmin.length > 0
        ? appData.pendingAdmin.map((req, i) =>
            `<div class="list-item">
                <span><strong>@${req.username}</strong> — "${req.reason}"</span>
                <button class="btn btn-primary" onclick="approveAdmin(${i})">Approve</button>
                <button class="btn btn-danger" onclick="denyAdmin(${i})">Deny</button>
            </div>`
        ).join('')
        : '<p style="color:#999;">No pending admin requests</p>';
}

// Approve verification
function approveVerify(i) {
    const user = appData.pendingVerify[i].username;
    appData.verifiedUsers.push(user);
    appData.pendingVerify.splice(i, 1);
    saveData();
    loadPendingRequests();
    loadVerifiedUsers();
    alert(`@${user} is now verified!`);
}

// Deny verification
function denyVerify(i) {
    appData.pendingVerify.splice(i, 1);
    saveData();
    loadPendingRequests();
}

// Approve admin request (password stays hidden)
function approveAdmin(i) {
    const req = appData.pendingAdmin[i];

    appData.adminAccounts.push({
        username: req.username,
        password: req.password, // still hidden (encoded)
        reason: req.reason
    });

    appData.pendingAdmin.splice(i, 1);
    saveData();
    loadPendingRequests();
    alert(`@${req.username} is now an admin!`);
}

// Deny admin request
function denyAdmin(i) {
    appData.pendingAdmin.splice(i, 1);
    saveData();
    loadPendingRequests();
}

function loadPendingRequests() {
    const verifyDiv = document.getElementById('pendingVerifyList');
    const adminDiv = document.getElementById('pendingAdminList');

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
        ).join('')
        : '<p style="color:#999;">No pending verification requests</p>';

    // Admin Requests (password hidden)
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
        ).join('')
        : '<p style="color:#999;">No pending admin requests</p>';
}
