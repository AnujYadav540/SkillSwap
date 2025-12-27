// SkillSwap Frontend JavaScript
class SkillSwapApp {
    constructor() {
        this.currentUser = null;
        this.authToken = localStorage.getItem('skillswap_token');
        this.socket = null;
        this.currentChatUser = null;
        this.userLocation = { latitude: null, longitude: null };
        this.currentMatchData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.initializeSocket();
    }

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

    setupEventListeners() {
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

        document.getElementById('switchToSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('signupSection');
        });

        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('loginSection');
        });

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

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                if (e.target.id === 'bookingModal') this.closeModal();
                else if (e.target.id === 'editSkillModal') this.closeEditSkillModal();
            }
        });

        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProfileUpdate(e);
        });

        document.getElementById('getLocationBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        document.getElementById('closeEditSkill').addEventListener('click', () => {
            this.closeEditSkillModal();
        });

        document.getElementById('editSkillForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditSkill(e);
        });
    }

    checkAuthStatus() {
        if (this.authToken) {
            this.fetchUserProfile();
        } else {
            this.showSection('heroSection');
        }
    }

    showSection(sectionId) {
        ['heroSection', 'loginSection', 'signupSection', 'dashboardSection'].forEach(s => {
            document.getElementById(s).style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';
        this.updateNavigation();
    }

    updateNavigation() {
        const isLoggedIn = !!this.authToken;
        document.getElementById('loginLink').style.display = isLoggedIn ? 'none' : 'block';
        document.getElementById('signupLink').style.display = isLoggedIn ? 'none' : 'block';
        document.getElementById('dashboardLink').style.display = isLoggedIn ? 'block' : 'none';
        document.getElementById('logoutLink').style.display = isLoggedIn ? 'block' : 'none';
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    async handleLogin(e) {
        const formData = new FormData(e.target);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password')
                })
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
        }
    }

    async handleSignup(e) {
        const formData = new FormData(e.target);
        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    bio: formData.get('bio')
                })
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
        }
    }

    logout() {
        if (this.socket) this.socket.disconnect();
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('skillswap_token');
        this.showSection('heroSection');
    }

    async fetchUserProfile() {
        try {
            const response = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
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
            this.logout();
        }
    }

    loadDashboardData() {
        this.loadProfile();
        this.loadSkills();
        this.loadMatches();
        this.loadBookings();
        this.loadConversations();
    }

    loadProfile() {
        document.getElementById('userWelcome').textContent = this.currentUser.username;
        document.getElementById('profileUsername').textContent = this.currentUser.username;
        document.getElementById('profileEmail').textContent = this.currentUser.email;
        document.getElementById('profileRating').textContent = this.currentUser.rating || '0.00';
        document.getElementById('profileBio').textContent = this.currentUser.bio || 'No bio provided';
        const location = [this.currentUser.city, this.currentUser.country].filter(Boolean).join(', ');
        document.getElementById('profileLocation').textContent = location || 'Not set';
        document.getElementById('profileBioEdit').value = this.currentUser.bio || '';
        document.getElementById('profileCity').value = this.currentUser.city || '';
        document.getElementById('profileCountry').value = this.currentUser.country || '';
        this.userLocation = { latitude: this.currentUser.latitude, longitude: this.currentUser.longitude };
    }

    getCurrentLocation() {
        if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
        document.getElementById('locationStatus').textContent = 'Getting location...';
        navigator.geolocation.getCurrentPosition(async (pos) => {
            this.userLocation.latitude = pos.coords.latitude;
            this.userLocation.longitude = pos.coords.longitude;
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
                const data = await res.json();
                document.getElementById('profileCity').value = data.address.city || data.address.town || '';
                document.getElementById('profileCountry').value = data.address.country || '';
                document.getElementById('locationStatus').textContent = '✓ Location detected';
            } catch (e) {
                document.getElementById('locationStatus').textContent = '✓ Coordinates saved';
            }
        }, () => {
            document.getElementById('locationStatus').textContent = '✗ Could not get location';
        });
    }

    async handleProfileUpdate(e) {
        const formData = new FormData(e.target);
        const profileData = {
            bio: formData.get('bio'),
            city: formData.get('city'),
            country: formData.get('country'),
            latitude: this.userLocation.latitude,
            longitude: this.userLocation.longitude
        };
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.authToken}` },
                body: JSON.stringify(profileData)
            });
            if (response.ok) {
                alert('Profile updated!');
                this.fetchUserProfile();
            } else {
                const result = await response.json();
                this.showError('profileError', result.error);
            }
        } catch (error) {
            this.showError('profileError', 'Network error');
        }
    }

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
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.authToken}` },
                body: JSON.stringify(skillData)
            });
            if (response.ok) {
                e.target.reset();
                this.loadSkills();
            } else {
                const result = await response.json();
                this.showError('skillError', result.error);
            }
        } catch (error) {
            this.showError('skillError', 'Network error');
        }
    }

    async loadSkills() {
        try {
            const response = await fetch('/api/skills', { headers: { 'Authorization': `Bearer ${this.authToken}` } });
            if (response.ok) {
                const result = await response.json();
                this.displaySkills(result.skills);
            }
        } catch (error) {}
    }

    displaySkills(skills) {
        const teachContainer = document.getElementById('teachSkills');
        const learnContainer = document.getElementById('learnSkills');
        teachContainer.innerHTML = '';
        learnContainer.innerHTML = '';
        skills.filter(s => s.type === 'teach').forEach(s => teachContainer.appendChild(this.createSkillElement(s)));
        skills.filter(s => s.type === 'learn').forEach(s => learnContainer.appendChild(this.createSkillElement(s)));
    }

    createSkillElement(skill) {
        const div = document.createElement('div');
        div.className = `skill-item ${skill.type}`;
        div.innerHTML = `
            <div class="skill-name">${this.escapeHtml(skill.skill_name)}</div>
            <div class="skill-description">${this.escapeHtml(skill.description) || 'No description'}</div>
            <div class="skill-actions">
                <button class="btn-icon" onclick="app.openEditSkillModal(${skill.id}, '${skill.skill_name.replace(/'/g, "\\'")}', '${(skill.description || '').replace(/'/g, "\\'")}')">✏️</button>
                <button class="btn-icon" onclick="app.deleteSkill(${skill.id})">🗑️</button>
            </div>
        `;
        return div;
    }

    openEditSkillModal(id, name, desc) {
        document.getElementById('editSkillId').value = id;
        document.getElementById('editSkillName').value = name;
        document.getElementById('editSkillDescription').value = desc;
        document.getElementById('editSkillModal').style.display = 'block';
    }

    closeEditSkillModal() {
        document.getElementById('editSkillModal').style.display = 'none';
    }

    async handleEditSkill(e) {
        const skillId = document.getElementById('editSkillId').value;
        const skillData = {
            skill_name: document.getElementById('editSkillName').value,
            description: document.getElementById('editSkillDescription').value
        };
        try {
            const response = await fetch(`/api/skills/${skillId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.authToken}` },
                body: JSON.stringify(skillData)
            });
            if (response.ok) {
                this.closeEditSkillModal();
                this.loadSkills();
            } else {
                alert('Error updating skill');
            }
        } catch (error) {
            alert('Network error');
        }
    }

    async deleteSkill(skillId) {
        if (!confirm('Delete this skill?')) return;
        try {
            const response = await fetch(`/api/skills/${skillId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            if (response.ok) this.loadSkills();
        } catch (error) {}
    }

    async loadMatches() {
        try {
            const response = await fetch('/api/matches', { headers: { 'Authorization': `Bearer ${this.authToken}` } });
            if (response.ok) {
                const result = await response.json();
                this.displayMatches(result.matches);
            }
        } catch (error) {}
    }

    displayMatches(matches) {
        const container = document.getElementById('matchesList');
        container.innerHTML = matches.length ? '' : '<p>No matches found. Add more skills!</p>';
        matches.forEach(m => container.appendChild(this.createMatchElement(m)));
    }

    createMatchElement(match) {
        const div = document.createElement('div');
        div.className = 'match-card';
        const locationInfo = match.city || match.country ? `<p>📍 ${[match.city, match.country].filter(Boolean).join(', ')}</p>` : '';
        const distanceInfo = match.distance ? `<p>🚗 ~${match.distance} km</p>` : '';
        const modeInfo = match.suggested_mode ? `<p>💡 ${match.suggested_mode}</p>` : '';
        div.innerHTML = `
            <div class="match-header">
                <div class="match-name">${this.escapeHtml(match.username)}</div>
                <div class="match-rating">${match.rating || '0.00'} ⭐</div>
            </div>
            <div class="match-bio">${this.escapeHtml(match.bio) || 'No bio'}</div>
            <div class="match-location">${locationInfo}${distanceInfo}${modeInfo}</div>
            <div class="match-skills">
                <p><strong>Teaches:</strong> ${this.escapeHtml(match.teaches)}</p>
                <p><strong>Learns:</strong> ${this.escapeHtml(match.learns)}</p>
            </div>
            <div class="match-actions">
                <button class="btn btn-primary" onclick='app.openBookingModal(${JSON.stringify(match).replace(/'/g, "&#39;")})'>Request Session</button>
                <button class="btn btn-secondary" onclick="app.startChat(${match.id}, '${match.username}')">Message</button>
            </div>
        `;
        return div;
    }

    openBookingModal(match) {
        document.getElementById('bookingReceiverId').value = match.id;
        document.getElementById('bookingSkill').value = match.teaches;
        const modeInfo = document.getElementById('sessionModeInfo');
        modeInfo.innerHTML = match.distance ? `🚗 ~${match.distance} km - ${match.suggested_mode}` : '💻 Online recommended';
        modeInfo.style.display = 'block';
        document.getElementById('bookingModal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('bookingModal').style.display = 'none';
    }

    async handleBookingRequest(e) {
        const formData = new FormData(e.target);
        const bookingData = {
            receiver_id: document.getElementById('bookingReceiverId').value,
            skill: formData.get('skill'),
            session_date: formData.get('session_date'),
            notes: formData.get('notes')
        };
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.authToken}` },
                body: JSON.stringify(bookingData)
            });
            if (response.ok) {
                this.closeModal();
                e.target.reset();
                this.loadBookings();
                alert('Booking request sent!');
            } else {
                const result = await response.json();
                alert(result.error);
            }
        } catch (error) {
            alert('Network error');
        }
    }

    async loadBookings() {
        try {
            const response = await fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${this.authToken}` } });
            if (response.ok) {
                const result = await response.json();
                this.displayBookings(result.bookings);
            }
        } catch (error) {}
    }

    displayBookings(bookings) {
        const container = document.getElementById('bookingsList');
        container.innerHTML = bookings.length ? '' : '<p>No bookings yet.</p>';
        bookings.forEach(b => container.appendChild(this.createBookingElement(b)));
    }

    createBookingElement(booking) {
        const div = document.createElement('div');
        div.className = `booking-item ${booking.status}`;
        const isReceiver = booking.receiver_id === this.currentUser.id;
        const otherUser = isReceiver ? booking.sender_username : booking.receiver_username;
        let actions = '';
        if (isReceiver && booking.status === 'pending') {
            actions = `<div class="booking-actions">
                <button class="btn btn-primary" onclick="app.updateBookingStatus(${booking.id}, 'accepted')">Accept</button>
                <button class="btn btn-danger" onclick="app.updateBookingStatus(${booking.id}, 'rejected')">Reject</button>
            </div>`;
        }
        if (booking.status === 'accepted') {
            actions = `<div class="booking-actions">
                <button class="btn btn-warning" onclick="app.updateBookingStatus(${booking.id}, 'completed')">Complete</button>
            </div>`;
        }
        div.innerHTML = `
            <div class="booking-header">
                <div class="booking-skill">${this.escapeHtml(booking.skill)}</div>
                <div class="booking-status ${booking.status}">${booking.status}</div>
            </div>
            <div class="booking-details">
                <p><strong>${isReceiver ? 'From' : 'To'}:</strong> ${this.escapeHtml(otherUser)}</p>
            </div>
            ${actions}
        `;
        return div;
    }

    async updateBookingStatus(bookingId, status) {
        try {
            const response = await fetch(`/api/bookings/${bookingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.authToken}` },
                body: JSON.stringify({ status })
            });
            if (response.ok) this.loadBookings();
        } catch (error) {}
    }

    startChat(userId, username) {
        this.switchTab('chat');
        this.currentChatUser = { id: userId, username };
        this.loadMessages(userId);
        document.getElementById('chatInput').style.display = 'flex';
    }

    async loadConversations() {
        try {
            const response = await fetch('/api/bookings', { headers: { 'Authorization': `Bearer ${this.authToken}` } });
            if (response.ok) {
                const result = await response.json();
                this.displayConversations(result.bookings);
            }
        } catch (error) {}
    }

    displayConversations(bookings) {
        const container = document.getElementById('conversationsList');
        container.innerHTML = '';
        const users = new Map();
        bookings.forEach(b => {
            const isReceiver = b.receiver_id === this.currentUser.id;
            const id = isReceiver ? b.sender_id : b.receiver_id;
            const name = isReceiver ? b.sender_username : b.receiver_username;
            if (!users.has(id)) users.set(id, name);
        });
        if (!users.size) { container.innerHTML = '<p>No conversations yet.</p>'; return; }
        users.forEach((name, id) => {
            const item = document.createElement('div');
            item.className = 'conversation-item';
            item.textContent = name;
            item.onclick = () => this.startChat(id, name);
            container.appendChild(item);
        });
    }

    async loadMessages(userId) {
        try {
            const response = await fetch(`/api/messages/${userId}`, { headers: { 'Authorization': `Bearer ${this.authToken}` } });
            if (response.ok) {
                const result = await response.json();
                this.displayMessages(result.messages);
            }
        } catch (error) {}
    }

    displayMessages(messages) {
        const container = document.getElementById('chatMessages');
        container.innerHTML = messages.length ? '' : '<p>No messages yet.</p>';
        messages.forEach(m => {
            const div = document.createElement('div');
            div.className = `message ${m.sender_id === this.currentUser.id ? 'sent' : 'received'}`;
            div.innerHTML = `
                <div class="message-content">${this.escapeHtml(m.message)}</div>
                <div class="message-time">${new Date(m.timestamp).toLocaleTimeString()}</div>
            `;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        if (!message || !this.currentChatUser) return;
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.authToken}` },
                body: JSON.stringify({ receiver_id: this.currentChatUser.id, message })
            });
            if (response.ok) {
                const result = await response.json();
                input.value = '';
                this.addMessageToChat(result.messageData, true);
            }
        } catch (error) {}
    }

    addMessageToChat(msg, sent) {
        const container = document.getElementById('chatMessages');
        if (container.querySelector('p')) container.innerHTML = '';
        const div = document.createElement('div');
        div.className = `message ${sent ? 'sent' : 'received'}`;
        div.innerHTML = `
            <div class="message-content">${this.escapeHtml(msg.message)}</div>
            <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    handleIncomingMessage(msg) {
        if (this.currentChatUser && msg.sender_id === this.currentChatUser.id) {
            this.addMessageToChat(msg, false);
        }
    }

    showError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) { el.textContent = message; el.style.display = 'block'; }
    }

    hideError(elementId) {
        const el = document.getElementById(elementId);
        if (el) { el.textContent = ''; el.style.display = 'none'; }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const app = new SkillSwapApp();
