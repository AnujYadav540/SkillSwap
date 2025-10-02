const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'skillswap',
    port: process.env.DB_PORT || 3306
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database');
});

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// User Registration
app.post('/api/signup', async (req, res) => {
    try {
        const { username, email, password, bio } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if user already exists
        const checkUserQuery = 'SELECT id FROM users WHERE username = ? OR email = ?';
        db.query(checkUserQuery, [username, email], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insert new user
            const insertUserQuery = 'INSERT INTO users (username, email, password, bio) VALUES (?, ?, ?, ?)';
            db.query(insertUserQuery, [username, email, hashedPassword, bio || ''], (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to create user' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { userId: result.insertId, username: username },
                    process.env.JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.status(201).json({
                    message: 'User created successfully',
                    token: token,
                    user: {
                        id: result.insertId,
                        username: username,
                        email: email,
                        bio: bio || ''
                    }
                });
            });
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user by username or email
        const findUserQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
        db.query(findUserQuery, [username, username], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = results[0];

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    bio: user.bio,
                    rating: user.rating
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add/Update Skills
app.post('/api/skills', authenticateToken, (req, res) => {
    try {
        const { skill_name, type, description } = req.body;
        const userId = req.user.userId;

        if (!skill_name || !type || !['teach', 'learn'].includes(type)) {
            return res.status(400).json({ error: 'Valid skill name and type (teach/learn) are required' });
        }

        // Check if skill already exists for this user
        const checkSkillQuery = 'SELECT id FROM skills WHERE user_id = ? AND skill_name = ? AND type = ?';
        db.query(checkSkillQuery, [userId, skill_name, type], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length > 0) {
                return res.status(400).json({ error: 'Skill already exists for this type' });
            }

            // Insert new skill
            const insertSkillQuery = 'INSERT INTO skills (user_id, skill_name, type, description) VALUES (?, ?, ?, ?)';
            db.query(insertSkillQuery, [userId, skill_name, type, description || ''], (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to add skill' });
                }

                res.status(201).json({
                    message: 'Skill added successfully',
                    skill: {
                        id: result.insertId,
                        skill_name: skill_name,
                        type: type,
                        description: description || ''
                    }
                });
            });
        });
    } catch (error) {
        console.error('Add skill error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's skills
app.get('/api/skills', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        const getSkillsQuery = 'SELECT * FROM skills WHERE user_id = ? ORDER BY type, skill_name';
        
        db.query(getSkillsQuery, [userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ skills: results });
        });
    } catch (error) {
        console.error('Get skills error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get matched users (users who teach what I want to learn and vice versa)
app.get('/api/matches', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        
        // Complex query to find matches
        const matchQuery = `
            SELECT DISTINCT 
                u.id, u.username, u.bio, u.rating,
                teach_skills.skill_name as teaches,
                learn_skills.skill_name as learns
            FROM users u
            JOIN skills teach_skills ON u.id = teach_skills.user_id AND teach_skills.type = 'teach'
            JOIN skills learn_skills ON u.id = learn_skills.user_id AND learn_skills.type = 'learn'
            WHERE u.id != ? 
            AND (
                teach_skills.skill_name IN (
                    SELECT skill_name FROM skills WHERE user_id = ? AND type = 'learn'
                )
                OR learn_skills.skill_name IN (
                    SELECT skill_name FROM skills WHERE user_id = ? AND type = 'teach'
                )
            )
            ORDER BY u.rating DESC, u.username
        `;
        
        db.query(matchQuery, [userId, userId, userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ matches: results });
        });
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create booking request
app.post('/api/bookings', authenticateToken, (req, res) => {
    try {
        const { receiver_id, skill, session_date, notes } = req.body;
        const sender_id = req.user.userId;

        if (!receiver_id || !skill) {
            return res.status(400).json({ error: 'Receiver ID and skill are required' });
        }

        if (sender_id === parseInt(receiver_id)) {
            return res.status(400).json({ error: 'Cannot book session with yourself' });
        }

        const insertBookingQuery = `
            INSERT INTO bookings (sender_id, receiver_id, skill, session_date, notes) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        db.query(insertBookingQuery, [sender_id, receiver_id, skill, session_date || null, notes || ''], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to create booking' });
            }

            res.status(201).json({
                message: 'Booking request sent successfully',
                booking: {
                    id: result.insertId,
                    sender_id: sender_id,
                    receiver_id: receiver_id,
                    skill: skill,
                    status: 'pending'
                }
            });
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update booking status
app.put('/api/bookings/:id', authenticateToken, (req, res) => {
    try {
        const bookingId = req.params.id;
        const { status } = req.body;
        const userId = req.user.userId;

        if (!['accepted', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Check if user is the receiver of this booking
        const checkBookingQuery = 'SELECT * FROM bookings WHERE id = ? AND receiver_id = ?';
        db.query(checkBookingQuery, [bookingId, userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Booking not found or unauthorized' });
            }

            // Update booking status
            const updateBookingQuery = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            db.query(updateBookingQuery, [status, bookingId], (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to update booking' });
                }

                res.json({
                    message: 'Booking status updated successfully',
                    booking: {
                        id: bookingId,
                        status: status
                    }
                });
            });
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user's bookings
app.get('/api/bookings', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        
        const getBookingsQuery = `
            SELECT 
                b.*,
                sender.username as sender_username,
                receiver.username as receiver_username
            FROM bookings b
            JOIN users sender ON b.sender_id = sender.id
            JOIN users receiver ON b.receiver_id = receiver.id
            WHERE b.sender_id = ? OR b.receiver_id = ?
            ORDER BY b.created_at DESC
        `;
        
        db.query(getBookingsQuery, [userId, userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ bookings: results });
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send message
app.post('/api/messages', authenticateToken, (req, res) => {
    try {
        const { receiver_id, message } = req.body;
        const sender_id = req.user.userId;

        if (!receiver_id || !message) {
            return res.status(400).json({ error: 'Receiver ID and message are required' });
        }

        if (sender_id === parseInt(receiver_id)) {
            return res.status(400).json({ error: 'Cannot send message to yourself' });
        }

        const insertMessageQuery = 'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)';
        db.query(insertMessageQuery, [sender_id, receiver_id, message], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to send message' });
            }

            const messageData = {
                id: result.insertId,
                sender_id: sender_id,
                receiver_id: receiver_id,
                message: message,
                timestamp: new Date()
            };

            // Emit message to both users via WebSocket
            io.to(`user_${sender_id}`).emit('message', messageData);
            io.to(`user_${receiver_id}`).emit('message', messageData);

            res.status(201).json({
                message: 'Message sent successfully',
                messageData: messageData
            });
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get conversation with a user
app.get('/api/messages/:userId', authenticateToken, (req, res) => {
    try {
        const otherUserId = req.params.userId;
        const currentUserId = req.user.userId;

        const getMessagesQuery = `
            SELECT m.*, sender.username as sender_username, receiver.username as receiver_username
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.timestamp ASC
        `;
        
        db.query(getMessagesQuery, [currentUserId, otherUserId, otherUserId, currentUserId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ messages: results });
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        
        const getUserQuery = 'SELECT id, username, email, bio, rating FROM users WHERE id = ?';
        db.query(getUserQuery, [userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user: results[0] });
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their personal room
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room user_${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`SkillSwap server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});

module.exports = app;
