// SkillSwap Frontend JavaScript
class SkillSwapApp {
    constructor() {
        this.currentUser = null;
        this.authToken = localStorage.getItem('skillswap_token');
        this.socket = null;
        this.currentChatUser = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.initializeSocket();
    }

    // Initialize Socket.IO connection
    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            if (this.currentUser) {
                this.socket.emit('join', this.currentUser.id);
            }
        });

        this.socket.on('message', (messageData) => {
            this.handleIncomingMessage(messageData);
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Navigation
        document.getElementById('loginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('loginSection');
        });

        document.getElementById('signupLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('signupSection');
        });

        document.getElementById('dashboardLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('dashboardSection');
        });

        document.getElementById('logoutLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        document.getElementById('getStartedBtn').addEventListener('click', () => {
            this.showSection('signupSection');
        });

        document.getElementById('learnMoreBtn').addEventListener('click', () => {
            this.showSection('loginSection');
        });

        // Form switches
        document.getElementById('switchToSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('signupSection');
        });

        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('loginSection');
        });

        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(e);
        });

        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup(e);
        });

        document.getElementById('skillForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddSkill(e);
        });

        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBookingRequest(e);
        });

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Chat
        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    // Check authentication status
    checkAuthStatus() {
        if (this.authToken) {
            this.fetchUserProfile();
        } else {
            this.showSection('heroSection');
        }
    }

    // Show/hide sections
    showSection(sectionId) {
        // Hide all sections
        const sections = ['heroSection', 'loginSection', 'signupSection', 'dashboardSection'];
        sections.forEach(section => {
            document.getElementById(section).style.display = 'none';
        });

        // Show target section
        document.getElementById(sectionId).style.display = 'block';

        // Update navigation
        this.updateNavigation();
    }

    // Update navigation based on auth status
    updateNavigation() {
        const isLoggedIn = !!this.authToken;
        
        document.getElementById('loginLink').style.display = isLoggedIn ? 'none' : 'block';
        document.getElementById('signupLink').style.display = isLoggedIn ? 'none' : 'block';
        document.getElementById('dashboardLink').style.display = isLoggedIn ? 'block' : 'none';
        document.getElementById('logoutLink').style.display = isLoggedIn ? 'block' : 'none';
    }

    // Handle login
    async handleLogin(e) {
        const formData = new FormData(e.target);
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            this.showLoading(true);
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (response.ok) {
                this.authToken = result.token;
                localStorage.setItem('skillswap_token', this.authToken);
                this.currentUser = result.user;
                
                this.showSection('dashboardSection');
                this.loadDashboardData();
                this.socket.emit('join', this.currentUser.id);
                
                this.hideError('loginError');
            } else {
                this.showError('loginError', result.error);
            }
        } catch (error) {
            this.showError('loginError', 'Network error. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // Handle signup
    async handleSignup(e) {
        const formData = new FormData(e.target);
        const signupData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            bio: formData.get('bio')
        };

        try {
            this.showLoading(true);
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupData)
            });

            const result = await response.json();

            if (response.ok) {
                this.authToken = result.token;
                localStorage.setItem('skillswap_token', this.authToken);
                this.currentUser = result.user;
                
                this.showSection('dashboardSection');
                this.loadDashboardData();
                this.socket.emit('join', this.currentUser.id);
                
                this.hideError('signupError');
            } else {
                this.showError('signupError', result.error);
            }
        } catch (error) {
            this.showError('signupError', 'Network error. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // Logout
    logout() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('skillswap_token');
        this.showSection('heroSection');
    }

    // Fetch user profile
    async fetchUserProfile() {
        try {
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.user;
                this.showSection('dashboardSection');
                this.loadDashboardData();
                this.socket.emit('join', this.currentUser.id);
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            this.logout();
        }
    }

    // Load dashboard data
    loadDashboardData() {
        this.loadProfile();
        this.loadSkills();
        this.loadMatches();
        this.loadBookings();
    }

    // Load profile data
    loadProfile() {
        document.getElementById('userWelcome').textContent = this.currentUser.username;
        document.getElementById('profileUsername').textContent = this.currentUser.username;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        document.getElementById('profileRating').textContent = this.currentUser.rating || '0.00';
        document.getElementById('profileBio').textContent = this.currentUser.bio || 'No bio provided';
    }

    // Handle add skill
    async handleAddSkill(e) {
        const formData = new FormData(e.target);
        const skillData = {
            skill_name: formData.get('skill_name'),
            type: formData.get('type'),
            description: formData.get('description')
        };

        try {
            const response = await fetch('/api/skills', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(skillData)
            });

            const result = await response.json();

            if (response.ok) {
                e.target.reset();
                this.loadSkills();
                this.hideError('skillError');
            } else {
                this.showError('skillError', result.error);
            }
        } catch (error) {
            this.showError('skillError', 'Network error. Please try again.');
        }
    }

    // Load skills
    async loadSkills() {
        try {
            const response = await fetch('/api/skills', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.displaySkills(result.skills);
            }
        } catch (error) {
            console.error('Load skills error:', error);
        }
    }

    // Display skills
    displaySkills(skills) {
        const teachSkills = skills.filter(skill => skill.type === 'teach');
        const learnSkills = skills.filter(skill => skill.type === 'learn');

        const teachContainer = document.getElementById('teachSkills');
        const learnContainer = document.getElementById('learnSkills');

        teachContainer.innerHTML = '';
        learnContainer.innerHTML = '';

        teachSkills.forEach(skill => {
            const skillElement = this.createSkillElement(skill);
            teachContainer.appendChild(skillElement);
        });

        learnSkills.forEach(skill => {
            const skillElement = this.createSkillElement(skill);
            learnContainer.appendChild(skillElement);
        });
    }

    // Create skill element
    createSkillElement(skill) {
        const div = document.createElement('div');
        div.className = `skill-item ${skill.type}`;
        div.innerHTML = `
            <div class="skill-name">${skill.skill_name}</div>
            <div class="skill-description">${skill.description || 'No description provided'}</div>
        `;
        return div;
    }

    // Load matches
    async loadMatches() {
        try {
            const response = await fetch('/api/matches', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.displayMatches(result.matches);
            }
        } catch (error) {
            console.error('Load matches error:', error);
        }
    }

    // Display matches
    displayMatches(matches) {
        const container = document.getElementById('matchesList');
        container.innerHTML = '';

        if (matches.length === 0) {
            container.innerHTML = '<p>No matches found. Add more skills to find potential learning partners!</p>';
            return;
        }

        matches.forEach(match => {
            const matchElement = this.createMatchElement(match);
            container.appendChild(matchElement);
        });
    }

    // Create match element
    createMatchElement(match) {
        const div = document.createElement('div');
        div.className = 'match-card';
        div.innerHTML = `
            <div class="match-header">
                <div class="match-name">${match.username}</div>
                <div class="match-rating">${match.rating || '0.00'} ⭐</div>
            </div>
            <div class="match-bio">${match.bio || 'No bio provided'}</div>
            <div class="match-skills">
                <p><strong>Teaches:</strong> ${match.teaches}</p>
                <p><strong>Wants to learn:</strong> ${match.learns}</p>
            </div>
            <div class="match-actions">
                <button class="btn btn-primary" onclick="app.openBookingModal(${match.id}, '${match.teaches}')">Request Session</button>
                <button class="btn btn-secondary" onclick="app.startChat(${match.id}, '${match.username}')">Send Message</button>
            </div>
        `;
        return div;
    }

    // Open booking modal
    openBookingModal(receiverId, skill) {
        document.getElementById('bookingReceiverId').value = receiverId;
        document.getElementById('bookingSkill').value = skill;
        document.getElementById('bookingModal').style.display = 'block';
    }

    // Close modal
    closeModal() {
        document.getElementById('bookingModal').style.display = 'none';
    }

    // Handle booking request
    async handleBookingRequest(e) {
        const formData = new FormData(e.target);
        const bookingData = {
            receiver_id: formData.get('receiver_id') || document.getElementById('bookingReceiverId').value,
            skill: formData.get('skill'),
            session_date: formData.get('session_date'),
            notes: formData.get('notes')
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (response.ok) {
                this.closeModal();
                e.target.reset();
                this.loadBookings();
                alert('Booking request sent successfully!');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    }

    // Load bookings
    async loadBookings() {
        try {
            const response = await fetch('/api/bookings', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.displayBookings(result.bookings);
            }
        } catch (error) {
            console.error('Load bookings error:', error);
        }
    }

    // Display bookings
    displayBookings(bookings) {
        const container = document.getElementById('bookingsList');
        container.innerHTML = '';

        if (bookings.length === 0) {
            container.innerHTML = '<p>No bookings yet. Request a session with a matched user!</p>';
            return;
        }

        bookings.forEach(booking => {
            const bookingElement = this.createBookingElement(booking);
            container.appendChild(bookingElement);
        });
    }

    // Create booking element
    createBookingElement(booking) {
        const div = document.createElement('div');
        div.className = `booking-item ${booking.status}`;
        
        const isReceiver = booking.receiver_id === this.currentUser.id;
        const otherUser = isReceiver ? booking.sender_username : booking.receiver_username;
        const role = isReceiver ? 'from' : 'to';

        div.innerHTML = `
            <div class="booking-header">
                <div class="booking-skill">${booking.skill}</div>
                <div class="booking-status ${booking.status}">${booking.status}</div>
            </div>
            <div class="booking-details">
                <p><strong>Session ${role}:</strong> ${otherUser}</p>
                <p><strong>Requested:</strong> ${new Date(booking.created_at).toLocaleDateString()}</p>
                ${booking.session_date ? `<p><strong>Scheduled:</strong> ${new Date(booking.session_date).toLocaleString()}</p>` : ''}
                ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
            </div>
            ${isReceiver && booking.status === 'pending' ? `
                <div class="booking-actions">
                    <button class="btn btn-primary" onclick="app.updateBookingStatus(${booking.id}, 'accepted')">Accept</button>
                    <button class="btn btn-danger" onclick="app.updateBookingStatus(${booking.id}, 'rejected')">Reject</button>
                </div>
            ` : ''}
            ${booking.status === 'accepted' ? `
                <div class="booking-actions">
                    <button class="btn btn-warning" onclick="app.updateBookingStatus(${booking.id}, 'completed')">Mark Complete</button>
                </div>
            ` : ''}
        `;
        return div;
    }

    // Update booking status
    async updateBookingStatus(bookingId, status) {
        try {
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                this.loadBookings();
            } else {
                const result = await response.json();
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    }

    // Start chat
    startChat(userId, username) {
        this.switchTab('chat');
        this.currentChatUser = { id: userId, username: username };
        this.loadMessages(userId);
        
        // Update chat UI
        document.getElementById('chatInput').style.display = 'flex';
        document.getElementById('chatMessages').innerHTML = '';
    }

    // Load messages
    async loadMessages(userId) {
        try {
            const response = await fetch(`/api/messages/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.displayMessages(result.messages);
            }
        } catch (error) {
            console.error('Load messages error:', error);
        }
    }

    // Display messages
    displayMessages(messages) {
        const container = document.getElementById('chatMessages');
        container.innerHTML = '';

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            container.appendChild(messageElement);
        });

        container.scrollTop = container.scrollHeight;
    }

    // Create message element
    createMessageElement(message) {
        const div = document.createElement('div');
        const isSent = message.sender_id === this.currentUser.id;
        div.className = `message ${isSent ? 'sent' : 'received'}`;
        
        div.innerHTML = `
            <div class="message-content">${message.message}</div>
            <div class="message-time">${new Date(message.timestamp).toLocaleString()}</div>
        `;
        
        return div;
    }

    // Send message
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message || !this.currentChatUser) return;

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    receiver_id: this.currentChatUser.id,
                    message: message
                })
            });

            if (response.ok) {
                input.value = '';
                // Message will be displayed via WebSocket
            } else {
                const result = await response.json();
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    }

    // Handle incoming message
    handleIncomingMessage(messageData) {
        if (this.currentChatUser && 
            (messageData.sender_id === this.currentChatUser.id || 
             messageData.receiver_id === this.currentChatUser.id)) {
            const messageElement = this.createMessageElement(messageData);
            document.getElementById('chatMessages').appendChild(messageElement);
            document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
        }
    }

    // Switch tabs
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Load data for specific tabs
        if (tabName === 'matches') {
            this.loadMatches();
        } else if (tabName === 'bookings') {
            this.loadBookings();
        }
    }

    // Show error message
    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    // Hide error message
    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        errorElement.classList.remove('show');
    }

    // Show/hide loading spinner
    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SkillSwapApp();
});
