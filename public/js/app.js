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
            this.showSection('dashboardSe(x) { this.lction');ogout(); } }
    loadDashboardData() { this.loadProfile(); this.loadSkills(); this.loadMatches(); this.loadBookings(); this.loadConversations(); }
    loadProfile() { document.getElementById('userWelcome').textContent = this.currentUser.username; document.getElementById('profileUsername').textContent = this.currentUser.username; document.getElementById('profileEmail').textContent = this.currentUser.email; document.getElementById('profileRating').textContent = this.currentUser.rating || '0.00'; document.getElementById('profileBio').textContent = this.currentUser.bio || 'No bio'; document.getElementById('profileLocation').textContent = (this.currentUser.city || this.currentUser.country) ? [this.currentUser.city, this.currentUser.country].filter(Boolean).join(', ') : 'Not set'; document.getElementById('profileBioEdit').value = this.currentUser.bio || ''; document.getElementById('profileCity').value = this.currentUser.city || ''; document.getElementById('profileCountry').value = this.currentUser.country || ''; this.userLocation = { latitude: this.currentUser.latitude, longitude: this.currentUser.longitude }; }
    getCurrentLocation() { if (!navigator.geolocation) { alert('Not supported'); return; } document.getElementById('locationStatus').textContent = 'Getting...'; navigator.geolocation.getCurrentPosition(async (p) => { this.userLocation.latitude = p.coords.latitude; this.userLocation.longitude = p.coords.longitude; try { const r = await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + p.coords.latitude + '&lon=' + p.coords.longitude + '&format=json'); const d = await r.json(); document.getElementById('profileCity').value = d.address.city || d.address.town || ''; document.getElementById('profileCountry').value = d.address.country || ''; document.getElementById('locationStatus').textContent = '✓ Done'; } catch (x) { document.getElementById('locationStatus').textContent = '✓ Coords saved'; } }, () => { document.getElementById('locationStatus').textContent = '✗ Failed'; }); }
    async handleProfileUpdate(e) { const f = new FormData(e.target); const d = { bio: f.get('bio')?.trim(), city: f.get('city')?.trim(), country: f.get('country')?.trim(), latitude: this.userLocation.latitude, longitude: this.userLocation.longitude }; try { const r = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.authToken }, body: JSON.stringify(d) }); if (r.ok) { alert('Updated!'); this.fetchUserProfile(); } else { const j = await r.json(); this.showError('profileError', j.error); } } catch (x) { this.showError('profileError', 'Network error'); } }
    async handleAddSkill(e) { const f = new FormData(e.target); const d = { skill_name: f.get('skill_name').trim(), type: f.get('type'), description: f.get('description')?.trim() || '' }; if (!d.skill_name || !d.type) { this.showError('skillError', 'Name & type required'); return; } try { const r = await fetch('/api/skills', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.authToken }, body: JSON.stringify(d) }); if (r.ok) { e.target.reset(); this.loadSkills(); this.hideError('skillError'); } else { const j = await r.json(); this.showError('skillError', j.error); } } catch (x) { this.showError('skillError', 'Network error'); } }
    async loadSkills() { try { const r = await fetch('/api/skills', { headers: { 'Authorization': 'Bearer ' + this.authToken } }); if (r.ok) { const j = await r.json(); this.displaySkills(j.skills); } } catch (x) {} }
    displaySkills(s) { const t = document.getElementById('teachSkills'); const l = document.getElementById('learnSkills'); t.innerHTML = ''; l.innerHTML = ''; s.filter(x => x.type === 'teach').forEach(x => t.appendChild(this.createSkillEl(x))); s.filter(x => x.type === 'learn').forEach(x => l.appendChild(this.createSkillEl(x))); }
    createSkillEl(s) { const d = document.createElement('div'); d.className = 'skill-item ' + s.type; d.innerHTML = '<div class="skill-name">' + this.escapeHtml(s.skill_name) + '</div><div class="skill-description">' + (this.escapeHtml(s.description) || 'No desc') + '</div><div class="skill-actions"><button class="btn-icon">✏️</button><button class="btn-icon">🗑️</button></div>'; d.querySelectorAll('button')[0].onclick = () => this.openEditSkillModal(s.id, s.skill_name, s.description || ''); d.querySelectorAll('button')[1].onclick = () => this.deleteSkill(s.id); return d; }
    openEditSkillModal(id, n, desc) { document.getElementById('editSkillId').value = id; document.getElementById('editSkillName').value = n; document.getElementById('editSkillDescription').value = desc; document.getElementById('editSkillModal').style.display = 'block'; }
    closeEditSkillModal() { document.getElementById('editSkillModal').style.display = 'none'; }
    async handleEditSkill(e) { const id = document.getElementById('editSkillId').value; const d = { skill_name: document.getElementById('editSkillName').value.trim(), description: document.getElementById('editSkillDescription').value.trim() }; try { const r = await fetch('/api/skills/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.authToken }, body: JSON.stringify(d) }); if (r.ok) { this.closeEditSkillModal(); this.loadSkills(); } else { const j = await r.json(); alert(j.error); } } catch (x) { alert('Network error'); } }
    async deleteSkill(id) { if (!confirm('Delete?')) return; try { const r = await fetch('/api/skills/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + this.authToken } }); if (r.ok) this.loadSkills(); else { const j = await r.json(); alert(j.error); } } catch (x) { alert('Network error'); } }
    async loadMatches() { try { const r = await fetch('/api/matches', { headers: { 'Authorization': 'Bearer ' + this.authToken } }); if (r.ok) { const j = await r.json(); this.displayMatches(j.matches); } } catch (x) {} }
    displayMatches(m) { const c = document.getElementById('matchesList'); c.innerHTML = m.length ? '' : '<p>No matches. Add skills!</p>'; m.forEach(x => c.appendChild(this.createMatchEl(x))); }
    createMatchEl(m) { const d = document.createElement('div'); d.className = 'match-card'; let loc = ''; if (m.city || m.country) loc += '<p>📍 ' + this.escapeHtml([m.city, m.country].filter(Boolean).join(', ')) + '</p>'; if (m.distance) loc += '<p>🚗 ~' + m.distance + ' km</p>'; if (m.suggested_mode) loc += '<p>💡 ' + this.escapeHtml(m.suggested_mode) + '</p>'; d.innerHTML = '<div class="match-header"><div class="match-name">' + this.escapeHtml(m.username) + '</div><div class="match-rating">' + (m.rating || '0') + ' ⭐</div></div><div class="match-bio">' + (this.escapeHtml(m.bio) || 'No bio') + '</div><div class="match-location">' + loc + '</div><div class="match-skills"><p><b>Teaches:</b> ' + this.escapeHtml(m.teaches) + '</p><p><b>Learns:</b> ' + this.escapeHtml(m.learns) + '</p></div><div class="match-actions"><button class="btn btn-primary">Request</button><button class="btn btn-secondary">Message</button></div>'; d.querySelectorAll('button')[0].onclick = () => this.openBookingModal(m); d.querySelectorAll('button')[1].onclick = () => this.startChat(m.id, m.username); return d; }
    openBookingModal(m) { document.getElementById('bookingReceiverId').value = m.id; document.getElementById('bookingSkill').value = m.teaches; document.getElementById('sessionModeInfo').innerHTML = m.distance ? '🚗 ~' + m.distance + ' km' : '💻 Online'; document.getElementById('sessionModeInfo').style.display = 'block'; document.getElementById('bookingModal').style.display = 'block'; }
    closeModal() { document.getElementById('bookingModal').style.display = 'none'; }
    async handleBookingRequest(e) { const f = new FormData(e.target); const d = { receiver_id: document.getElementById('bookingReceiverId').value, skill: f.get('skill'), session_date: f.get('session_date'), notes: f.get('notes') }; try { const r = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.authToken }, body: JSON.stringify(d) }); if (r.ok) { this.closeModal(); e.target.reset(); this.loadBookings(); alert('Sent!'); } else { const j = await r.json(); alert(j.error); } } catch (x) { alert('Network error'); } }
    async loadBookings() { try { const r = await fetch('/api/bookings', { headers: { 'Authorization': 'Bearer ' + this.authToken } }); if (r.ok) { const j = await r.json(); this.displayBookings(j.bookings); } } catch (x) {} }
    displayBookings(b) { const c = document.getElementById('bookingsList'); c.innerHTML = b.length ? '' : '<p>No bookings.</p>'; b.forEach(x => c.appendChild(this.createBookingEl(x))); }
    createBookingEl(b) { const d = document.createElement('div'); d.className = 'booking-item ' + b.status; const isR = b.receiver_id === this.currentUser.id; const other = isR ? b.sender_username : b.receiver_username; let act = ''; if (isR && b.status === 'pending') act = '<div class="booking-actions"><button class="btn btn-primary" data-a>Accept</button><button class="btn btn-danger" data-r>Reject</button></div>'; if (b.status === 'accepted') act = '<div class="booking-actions"><button class="btn btn-warning" data-c>Complete</button></div>'; d.innerHTML = '<div class="booking-header"><div class="booking-skill">' + this.escapeHtml(b.skill) + '</div><div class="booking-status ' + b.status + '">' + b.status + '</div></div><div class="booking-details"><p><b>' + (isR ? 'From' : 'To') + ':</b> ' + this.escapeHtml(other) + '</p></div>' + act; if (d.querySelector('[data-a]')) d.querySelector('[data-a]').onclick = () => this.updateBookingStatus(b.id, 'accepted'); if (d.querySelector('[data-r]')) d.querySelector('[data-r]').onclick = () => this.updateBookingStatus(b.id, 'rejected'); if (d.querySelector('[data-c]')) d.querySelector('[data-c]').onclick = () => this.updateBookingStatus(b.id, 'completed'); return d; }
    async updateBookingStatus(id, s) { try { const r = await fetch('/api/bookings/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.authToken }, body: JSON.stringify({ status: s }) }); if (r.ok) this.loadBookings(); } catch (x) {} }
    startChat(uid, uname) { this.switchTab('chat'); this.currentChatUser = { id: uid, username: uname }; this.loadMessages(uid); document.getElementById('chatInput').style.display = 'flex'; }
    async loadConversations() { try { const r = await fetch('/api/bookings', { headers: { 'Authorization': 'Bearer ' + this.authToken } }); if (r.ok) { const j = await r.json(); this.displayConversations(j.bookings); } } catch (x) {} }
    displayConversations(b) { const c = document.getElementById('conversationsList'); c.innerHTML = ''; const u = new Map(); b.forEach(x => { const isR = x.receiver_id === this.currentUser.id; const uid = isR ? x.sender_id : x.receiver_id; const un = isR ? x.sender_username : x.receiver_username; if (!u.has(uid)) u.set(uid, un); }); if (!u.size) { c.innerHTML = '<p>No conversations.</p>'; return; } u.forEach((n, id) => { const i = document.createElement('div'); i.className = 'conversation-item'; i.textContent = n; i.onclick = () => this.startChat(id, n); c.appendChild(i); }); }
    async loadMessages(uid) { try { const r = await fetch('/api/messages/' + uid, { headers: { 'Authorization': 'Bearer ' + this.authToken } }); if (r.ok) { const j = await r.json(); this.displayMessages(j.messages); } } catch (x) {} }
    displayMessages(m) { const c = document.getElementById('chatMessages'); c.innerHTML = m.length ? '' : '<p>No messages.</p>'; m.forEach(x => { const d = document.createElement('div'); d.className = 'message ' + (x.sender_id === this.currentUser.id ? 'sent' : 'received'); d.innerHTML = '<div class="message-content">' + this.escapeHtml(x.message) + '</div><div class="message-time">' + new Date(x.timestamp).toLocaleTimeString() + '</div>'; c.appendChild(d); }); c.scrollTop = c.scrollHeight; }
    async sendMessage() { const i = document.getElementById('messageInput'); const m = i.value.trim(); if (!m || !this.currentChatUser) return; try { const r = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.authToken }, body: JSON.stringify({ receiver_id: this.currentChatUser.id, message: m }) }); if (r.ok) { const j = await r.json(); i.value = ''; this.addMsg(j.messageData, true); } } catch (x) {} }
    addMsg(d, sent) { const c = document.getElementById('chatMessages'); if (c.querySelector('p')) c.innerHTML = ''; const div = document.createElement('div'); div.className = 'message ' + (sent ? 'sent' : 'received'); div.innerHTML = '<div class="message-content">' + this.escapeHtml(d.message) + '</div><div class="message-time">' + new Date(d.timestamp).toLocaleTimeString() + '</div>'; c.appendChild(div); c.scrollTop = c.scrollHeight; }
    handleIncomingMessage(d) { if (this.currentChatUser && d.sender_id === this.currentChatUser.id) this.addMsg(d, false); }
    showError(id, m) { const e = document.getElementById(id); if (e) { e.textContent = m; e.style.display = 'block'; e.classList.add('show'); } }
    hideError(id) { const e = document.getElementById(id); if (e) { e.textContent = ''; e.style.display = 'none'; e.classList.remove('show'); } }
    showLoading(s) { const e = document.getElementById('loadingSpinner'); if (e) e.style.display = s ? 'flex' : 'none'; }
}
const app = new SkillSwapApp();
        // Update local userLocation object
        this.userLocation = {
            ...this.userLocation,
            city: city,
            country: country
        };

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Profile updated successfully!');
                this.fetchUserProfile();
                this.hideError('profileError');
            } else {
                this.showError('profileError', result.error);
            }
        } catch (error) {
            this.showError('profileError', 'Network error. Please try again.');
        }
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
            <div class="skill-actions">
                <button class="btn-icon" onclick="app.openEditSkillModal(${skill.id}, '${skill.skill_name.replace(/'/g, "\\'")}', '${(skill.description || '').replace(/'/g, "\\'")}')">✏️</button>
                <button class="btn-icon" onclick="app.deleteSkill(${skill.id})">🗑️</button>
            </div>
        `;
        return div;
    }

    // Open edit skill modal
    openEditSkillModal(skillId, skillName, description) {
        document.getElementById('editSkillId').value = skillId;
        document.getElementById('editSkillName').value = skillName;
        document.getElementById('editSkillDescription').value = description;
        document.getElementById('editSkillModal').style.display = 'block';
    }

    // Close edit skill modal
    closeEditSkillModal() {
        document.getElementById('editSkillModal').style.display = 'none';
    }

    // Handle edit skill
    async handleEditSkill(e) {
        const formData = new FormData(e.target);
        const skillId = document.getElementById('editSkillId').value;
        const skillData = {
            skill_name: formData.get('skill_name'),
            description: formData.get('description')
        };

        try {
            const response = await fetch(`/api/skills/${skillId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(skillData)
            });

            const result = await response.json();

            if (response.ok) {
                this.closeEditSkillModal();
                this.loadSkills();
                alert('Skill updated successfully!');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    }

    // Delete skill
    async deleteSkill(skillId) {
        if (!confirm('Are you sure you want to delete this skill?')) {
            return;
        }

        try {
            const response = await fetch(`/api/skills/${skillId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.loadSkills();
                alert('Skill deleted successfully!');
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
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

        const locationInfo = match.city || match.country
            ? `<p><strong>📍 Location:</strong> ${[match.city, match.country].filter(Boolean).join(', ')}</p>`
            : '';

        const distanceInfo = match.distance
            ? `<p><strong>🚗 Distance:</strong> ~${match.distance} km</p>`
            : '';

        const modeInfo = match.suggested_mode
            ? `<p><strong>💡 Suggested:</strong> <span class="suggested-mode">${match.suggested_mode}</span></p>`
            : '';

        div.innerHTML = `
            <div class="match-header">
                <div class="match-name">${match.username}</div>
                <div class="match-rating">${match.rating || '0.00'} ⭐</div>
            </div>
            <div class="match-bio">${match.bio || 'No bio provided'}</div>
            <div class="match-location">
                ${locationInfo}
                ${distanceInfo}
                ${modeInfo}
            </div>
            <div class="match-skills">
                <p><strong>Teaches:</strong> ${match.teaches}</p>
                <p><strong>Wants to learn:</strong> ${match.learns}</p>
            </div>
            <div class="match-actions">
                <button class="btn btn-primary" onclick='app.openBookingModal(${JSON.stringify(match).replace(/'/g, "&#39;")})'>Request Session</button>
                <button class="btn btn-secondary" onclick="app.startChat(${match.id}, '${match.username}')">Send Message</button>
            </div>
        `;
        return div;
    }

    // Open booking modal
    openBookingModal(matchData) {
        // Handle both old and new calling conventions
        if (typeof matchData === 'object') {
            this.currentMatchData = matchData;
            document.getElementById('bookingReceiverId').value = matchData.id;
            document.getElementById('bookingSkill').value = matchData.teaches;

            // Display session mode info
            const modeInfoDiv = document.getElementById('sessionModeInfo');
            if (matchData.distance !== null && matchData.distance !== undefined) {
                const modeIcon = matchData.suggested_mode === 'online' ? '💻' : '🤝';
                modeInfoDiv.innerHTML = `
                    ${modeIcon} <strong>Distance:</strong> ~${matchData.distance} km<br>
                    <strong>Recommended session mode:</strong> ${matchData.suggested_mode}
                `;
                modeInfoDiv.style.display = 'block';
            } else {
                modeInfoDiv.innerHTML = `💻 <strong>Recommended session mode:</strong> online (location not available)`;
                modeInfoDiv.style.display = 'block';
            }
        } else {
            // Legacy support
            document.getElementById('bookingReceiverId').value = matchData;
            document.getElementById('bookingSkill').value = arguments[1];
            document.getElementById('sessionModeInfo').style.display = 'none';
        }

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
    // Create message element
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
                const result = await response.json();
                input.value = '';

                // Display the sent message immediately
                const messageElement = this.createMessageElement(result.messageData);
                document.getElementById('chatMessages').appendChild(messageElement);
                document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
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
        } else if (tabName === 'chat') {
            this.loadConversations();
        }
    }

    // Load conversations list
    async loadConversations() {
        try {
            const response = await fetch('/api/bookings', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.displayConversations(result.bookings);
            }
        } catch (error) {
            console.error('Load conversations error:', error);
        }
    }

    // Display conversations
    displayConversations(bookings) {
        const container = document.getElementById('conversationsList');
        container.innerHTML = '';

        if (bookings.length === 0) {
            container.innerHTML = '<p style="color: #666; padding: 1rem;">No conversations yet. Connect with users from matches!</p>';
            return;
        }

        // Get unique users from bookings
        const uniqueUsers = new Map();
        bookings.forEach(booking => {
            const isReceiver = booking.receiver_id === this.currentUser.id;
            const otherUserId = isReceiver ? booking.sender_id : booking.receiver_id;
            const otherUsername = isReceiver ? booking.sender_username : booking.receiver_username;

            if (!uniqueUsers.has(otherUserId)) {
                uniqueUsers.set(otherUserId, otherUsername);
            }
        });

        uniqueUsers.forEach((username, userId) => {
            const convElement = document.createElement('div');
            convElement.className = 'conversation-item';
            convElement.innerHTML = `<strong>${username}</strong>`;
            convElement.onclick = () => this.startChat(userId, username);
            container.appendChild(convElement);
        });
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
