# SkillSwap - Peer-to-Peer Learning & Service Exchange Platform

A full-stack web application that connects users for skill sharing and collaborative learning. Built with Node.js, Express.js, MySQL, and vanilla JavaScript.

## Features

- **User Authentication**: Secure signup/login with JWT tokens and password hashing
- **Skill Management**: Users can add skills they can teach or want to learn
- **Smart Matching**: Algorithm matches users based on complementary skills
- **Booking System**: Request and manage learning sessions
- **Real-time Chat**: WebSocket-powered messaging between matched users
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Real-time**: Socket.IO
- **Authentication**: JWT, bcryptjs

## Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MySQL](https://dev.mysql.com/downloads/) (v8.0 or higher)
- npm (comes with Node.js)

## Installation & Setup

### 1. Clone or Download the Project

If you have the project files, navigate to the project directory:

```bash
cd SkillSwap
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

1. **Start MySQL Server**
   - Make sure your MySQL server is running
   - Default port should be 3306

2. **Create Database**
   - Open MySQL command line or a GUI tool like MySQL Workbench
   - Run the SQL script located at `database/setup.sql`:

   ```bash
   mysql -u root -p < database/setup.sql
   ```

   Or manually execute the SQL commands in your MySQL client.

3. **Configure Database Connection**
   - Open the `.env` file in the project root
   - Update the database credentials:

   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=skillswap
   DB_PORT=3306
   ```

### 4. Environment Configuration

Update the `.env` file with your settings:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=skillswap
DB_PORT=3306

# JWT Secret (Change this to a secure random string)
JWT_SECRET=your_secure_jwt_secret_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret
SESSION_SECRET=your_session_secret_here
```

**Important**: Change the `JWT_SECRET` to a secure random string in production!

### 5. Run the Application

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

### 6. Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

## Database Schema

The application uses the following database tables:

### Users Table
```sql
users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    bio TEXT,
    rating DECIMAL(3,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### Skills Table
```sql
skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    skill_name VARCHAR(100),
    type ENUM('teach', 'learn'),
    description TEXT,
    created_at TIMESTAMP
)
```

### Messages Table
```sql
messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT,
    receiver_id INT,
    message TEXT,
    timestamp TIMESTAMP,
    is_read BOOLEAN
)
```

### Bookings Table
```sql
bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT,
    receiver_id INT,
    skill VARCHAR(100),
    status ENUM('pending', 'accepted', 'rejected', 'completed'),
    session_date DATETIME,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

## API Endpoints

### Authentication
- `POST /api/signup` - Register new user
- `POST /api/login` - User login

### Skills
- `POST /api/skills` - Add new skill
- `GET /api/skills` - Get user's skills

### Matching
- `GET /api/matches` - Get matched users

### Bookings
- `POST /api/bookings` - Create booking request
- `GET /api/bookings` - Get user's bookings
- `PUT /api/bookings/:id` - Update booking status

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/:userId` - Get conversation

### Profile
- `GET /api/profile` - Get user profile

## Usage Guide

### 1. Getting Started
1. Visit the homepage
2. Click "Get Started" or "Sign Up"
3. Create an account with username, email, and password
4. Add a bio to tell others about yourself

### 2. Adding Skills
1. Go to the "My Skills" tab
2. Add skills you can teach (e.g., "Guitar", "Web Development")
3. Add skills you want to learn (e.g., "Spanish", "Photography")

### 3. Finding Matches
1. Visit the "Find Matches" tab
2. The system will show users who:
   - Teach skills you want to learn, OR
   - Want to learn skills you can teach

### 4. Requesting Sessions
1. Click "Request Session" on a match
2. Fill in the session details
3. Wait for the other user to accept/reject

### 5. Managing Bookings
1. Go to "Bookings" tab
2. Accept/reject incoming requests
3. Mark completed sessions as done

### 6. Messaging
1. Click "Send Message" on a match
2. Use the real-time chat to communicate
3. Coordinate session details

## Project Structure

```
SkillSwap/
├── database/
│   └── setup.sql          # Database schema
├── public/
│   ├── css/
│   │   └── styles.css     # Frontend styles
│   ├── js/
│   │   └── app.js         # Frontend JavaScript
│   └── index.html         # Main HTML file
├── .env                   # Environment variables
├── server.js              # Main server file
├── package.json           # Dependencies
└── README.md             # This file
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check if MySQL server is running
   - Verify credentials in `.env` file
   - Ensure database `skillswap` exists

2. **Port Already in Use**
   - Change the PORT in `.env` file
   - Kill the process using the port: `netstat -ano | findstr :3000`

3. **JWT Token Issues**
   - Clear browser localStorage
   - Check JWT_SECRET in `.env`

4. **WebSocket Connection Failed**
   - Check if server is running
   - Verify firewall settings

### Development Tips

1. **View Database Data**
   ```sql
   USE skillswap;
   SELECT * FROM users;
   SELECT * FROM skills;
   SELECT * FROM bookings;
   SELECT * FROM messages;
   ```

2. **Reset Database**
   ```sql
   DROP DATABASE skillswap;
   ```
   Then re-run the setup script.

3. **Check Server Logs**
   - Server logs appear in the terminal
   - Check browser console for frontend errors

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- SQL injection prevention with parameterized queries
- CORS enabled for cross-origin requests
- Input validation on both frontend and backend

## Future Enhancements

- User rating system after completed sessions
- File upload for profile pictures
- Advanced search and filtering
- Email notifications
- Mobile app version
- Video call integration
- Payment system for premium skills

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Review the database setup
3. Verify environment configuration
4. Check server and browser console logs

---

**Happy Learning and Skill Sharing! 🚀**
