const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Required for Real Emails

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'campuslance'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err);
    } else {
        console.log('✅ Connected to MySQL Database');
    }
});

// ============================================
// 📧 EMAIL CONFIGURATION (For Real Emails)
// ============================================
// You MUST replace these with your details for it to work.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kevindaniel2028@mca.ajce.in', // 🔴 REPLACE THIS
        pass: 'xjgw pyeq akkh gpxf'   // 🔴 REPLACE THIS (16-char App Password)
    }
});

// ============================================
// 🔐 AUTH ROUTES
// ============================================

// Test Route
app.get('/', (req, res) => {
    res.send("Backend is running!");
});

// Google Login/Register
app.post('/api/auth/google', (req, res) => {
    const { name, email, role } = req.body;
    const userRole = role || 'client';

    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], (err, data) => {
        if (err) return res.status(500).json(err);

        if (data.length > 0) {
            return res.status(200).json({ message: "Login Successful", user: data[0] });
        } else {
            const insertSql = "INSERT INTO users (name, email, role) VALUES (?, ?, ?)";
            db.query(insertSql, [name, email, userRole], (err, result) => {
                if (err) return res.status(500).json(err);
                const newUser = { id: result.insertId, name, email, role: userRole };
                return res.status(201).json({ message: "Registered", user: newUser });
            });
        }
    });
});
// 1. MANUAL REGISTER
app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const checkSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkSql, [email], (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (data.length > 0) return res.status(409).json({ error: "User already exists" });

        // Insert User
        // Note: For a real app, you should hash passwords (bcrypt). 
        // For this mini-project, we are storing as plain text based on your schema.
        const insertSql = "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)";
        
        db.query(insertSql, [name, email, password, role], (err, result) => {
            if (err) return res.status(500).json({ error: "Registration failed" });
            
            const newUser = { id: result.insertId, name, email, role };
            res.status(201).json({ message: "Registered Successfully", user: newUser });
        });
    });
});

// 2. MANUAL LOGIN
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (data.length === 0) return res.status(404).json({ error: "User not found" });

        const user = data[0];

        // Check Password (Plain text comparison for now)
        if (user.password_hash !== password) {
            return res.status(401).json({ error: "Wrong password" });
        }

        // Success
        res.status(200).json({ message: "Login Successful", user: user });
    });
});

// 1. FORGOT PASSWORD (Sends Real Email)
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, data) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (data.length === 0) return res.status(404).json({ error: "User not found" });

        // Link pointing to your Frontend Reset Page
        const resetLink = `http://localhost:5173/reset-password?email=${email}`;

        const mailOptions = {
            from: 'CampusLance Support <noreply@campuslance.com>',
            to: email,
            subject: 'Reset Your Password',
            html: `
                <h3>Reset Your Password</h3>
                <p>Click the link below to set a new password:</p>
                <a href="${resetLink}" style="background:#2D3748;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
                <p>Link: ${resetLink}</p>
            `
        };

        // Send Email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Error sending email:", error);
                // Fallback for demo if email fails: Log to console so you can still test
                console.log(`fallback link: ${resetLink}`);
                return res.json({ message: "Email failed (Check console for fallback link)" });
            }
            console.log("Email sent: " + info.response);
            res.json({ message: "Reset link sent to your email." });
        });
    });
});

// 2. RESET PASSWORD (Updates DB)
app.post('/api/auth/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    const sql = "UPDATE users SET password_hash = ? WHERE email = ?";
    db.query(sql, [newPassword, email], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ message: "Password updated successfully" });
    });
});

// ============================================
// 💼 GIGS & REQUIREMENTS ROUTES
// ============================================

// Create Gig
app.post('/api/gigs', (req, res) => {
    const { freelancer_id, title, description, price, delivery_days } = req.body;
    const sql = `INSERT INTO gigs (freelancer_id, title, description, price, delivery_days) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [freelancer_id, title, description, price, delivery_days], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: "Database error" }); }
        res.status(201).json({ message: "Gig Created", gigId: result.insertId });
    });
});

// Get All Gigs
app.get('/api/gigs', (req, res) => {
    const sql = `SELECT gigs.*, users.name as freelancer_name FROM gigs JOIN users ON gigs.freelancer_id = users.id ORDER BY gigs.created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Post Requirement
app.post('/api/requirements', (req, res) => {
    const { client_id, title, description, deadline } = req.body;
    const sql = `INSERT INTO requirements (client_id, title, description, deadline) VALUES (?, ?, ?, ?)`;
    db.query(sql, [client_id, title, description, deadline], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ error: "Database error" }); }
        res.status(201).json({ message: "Requirement Posted", reqId: result.insertId });
    });
});

// ============================================
// 🚀 START SERVER
// ============================================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});