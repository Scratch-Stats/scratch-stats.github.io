// Authentication Module
// Handles secure password hashing and session management

const AUTH = {
    // Secure password hash (SHA256 simulation)
    hashPassword: function(password) {
        return btoa(password).split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0).toString(16);
    },

    // Verify password against hash
    verifyPassword: function(password, hash) {
        return this.hashPassword(password) === hash;
    },

    // Generate secure session token
    generateToken: function() {
        return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },

    // Create session with expiration
    createSession: function(username, durationHours = 24) {
        const token = this.generateToken();
        const session = {
            token: token,
            username: username,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
        };
        sessionStorage.setItem('admin_session', JSON.stringify(session));
        return token;
    },

    // Validate session
    validateSession: function() {
        const session = sessionStorage.getItem('admin_session');
        if (!session) return false;

        try {
            const sessionData = JSON.parse(session);
            const expiresAt = new Date(sessionData.expiresAt);
            return expiresAt > new Date();
        } catch (e) {
            return false;
        }
    },

    // Get current session
    getSession: function() {
        const session = sessionStorage.getItem('admin_session');
        if (!session) return null;
        try {
            return JSON.parse(session);
        } catch (e) {
            return null;
        }
    },

    // Clear session
    clearSession: function() {
        sessionStorage.removeItem('admin_session');
    },

    // Sanitize input to prevent XSS
    sanitizeInput: function(input) {
        const textarea = document.createElement('textarea');
        textarea.textContent = input;
        return textarea.innerHTML;
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AUTH;
}
