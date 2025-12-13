const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors()); // Allow React (Port 5173) to connect
app.use(express.json()); // Parse JSON bodies

// 1. Database Connection
const db = mysql.createConnection({
    host: '127.0.0.1',     // Fixes Windows IPv6 issues
    user: 'root',          // Default XAMPP user
    password: '',          // Default XAMPP password
    database: 'campuslance' // Your database name
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err);
    } else {
        console.log('✅ Connected to MySQL Database');
    }
});

// 2. Routes

// Test Route
app.get('/', (req, res) => {
    res.send("Backend is running!");
});

// Google Login/Register Route
app.post('/api/auth/google', (req, res) => {
    const { name, email, role } = req.body;
    const userRole = role || 'client'; // Default to client if role is missing

    // Check if user exists
    const checkSql = "SELECT * FROM users WHERE email = ?";
    
    db.query(checkSql, [email], (err, data) => {
        if (err) return res.status(500).json(err);

        if (data.length > 0) {
            // User exists - Login
            return res.status(200).json({ message: "Login Successful", user: data[0] });
        } else {
            // User new - Register
            const insertSql = "INSERT INTO users (name, email, role) VALUES (?, ?, ?)";
            db.query(insertSql, [name, email, userRole], (err, result) => {
                if (err) return res.status(500).json(err);
                
                const newUser = { id: result.insertId, name, email, role: userRole };
                return res.status(201).json({ message: "Registered", user: newUser });
            });
        }
    });
});

// 3. Start Server on Port 5000
app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});