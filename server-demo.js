const express = require('express');
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Demo API endpoints (without database)
app.post('/api/signup', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.post('/api/login', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.get('/api/profile', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.post('/api/skills', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.get('/api/skills', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.get('/api/matches', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.post('/api/bookings', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.get('/api/bookings', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.put('/api/bookings/:id', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.post('/api/messages', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

app.get('/api/messages/:userId', (req, res) => {
    res.status(500).json({ error: 'Database not connected. Please start MySQL service first.' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

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
    console.log(`SkillSwap DEMO server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
    console.log('⚠️  NOTE: Database is not connected. Start MySQL service to use full functionality.');
});

module.exports = app;
