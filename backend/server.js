const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer'); 
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
// Serve uploaded images so frontend can access them
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. DATABASE CONNECTION
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'campuslance'
});

db.connect((err) => {
    if (err) console.error('❌ DB Error:', err);
    else console.log('✅ Connected to MySQL Database');
});

// FILE UPLOAD CONFIG
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'file-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// EMAIL CONFIG
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'kevindaniel2028@mca.ajce.in', pass: 'xjgw pyeq akkh gpxf' }
});

// ================= ROUTES ================= //

// --- AUTH ---
app.post('/api/auth/google', (req, res) => {
    const { name, email, role } = req.body;
    const userRole = role || 'client';
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length > 0) return res.status(200).json({ message: "Login", user: data[0] });
        db.query("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", [name, email, userRole], (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(201).json({ message: "Registered", user: { id: result.insertId, name, email, role: userRole } });
        });
    });
});

app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, data) => {
        if (data.length > 0) return res.status(409).json({ error: "User exists" });
        db.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [name, email, password, role], (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(201).json({ message: "Registered", user: { id: result.insertId, name, email, role } });
        });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, data) => {
        if (err || data.length === 0) return res.status(404).json({ error: "User not found" });
        if (data[0].password_hash !== password) return res.status(401).json({ error: "Wrong password" });
        res.status(200).json({ message: "Login", user: data[0] });
    });
});

app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, data) => {
        if (err || data.length === 0) return res.status(404).json({ error: "User not found" });
        const resetLink = `http://localhost:5173/reset-password?email=${email}`;
        const mailOptions = {
            from: 'CampusLance <noreply@campuslance.com>', to: email, subject: 'Reset Password',
            html: `<a href="${resetLink}">Reset Password</a>`
        };
        transporter.sendMail(mailOptions, (error) => {
            if (error) return res.json({ message: "Email failed (Check console)" });
            res.json({ message: "Email sent" });
        });
    });
});

app.post('/api/auth/reset-password', (req, res) => {
    const { email, newPassword } = req.body;
    db.query("UPDATE users SET password_hash = ? WHERE email = ?", [newPassword, email], (err) => {
        if (err) return res.status(500).json(err); res.json({ message: "Updated" });
    });
});

// --- GIGS (Create, Get, Edit) ---
app.post('/api/gigs', upload.single('image'), (req, res) => {
    const { freelancer_id, title, description, price, delivery_days } = req.body;
    const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;
    db.query("INSERT INTO gigs (freelancer_id, title, description, price, delivery_days, image_url) VALUES (?, ?, ?, ?, ?, ?)", 
    [freelancer_id, title, description, price, delivery_days, image_url], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Gig Created", gigId: result.insertId });
    });
});

app.get('/api/gigs', (req, res) => {
    db.query("SELECT gigs.*, users.name as freelancer_name FROM gigs JOIN users ON gigs.freelancer_id = users.id ORDER BY gigs.created_at DESC", 
    (err, results) => { if(err) return res.status(500).json(err); res.json(results); });
});

app.get('/api/gigs/my/:id', (req, res) => {
    db.query("SELECT * FROM gigs WHERE freelancer_id = ? ORDER BY created_at DESC", [req.params.id], (err, results) => res.json(results));
});

app.get('/api/gigs/single/:id', (req, res) => {
    db.query("SELECT * FROM gigs WHERE id = ?", [req.params.id], (err, result) => res.json(result[0]));
});

app.put('/api/gigs/:id', upload.single('image'), (req, res) => {
    const { title, description, price, delivery_days } = req.body;
    let sql = "UPDATE gigs SET title=?, description=?, price=?, delivery_days=?";
    let params = [title, description, price, delivery_days];
    if (req.file) { sql += ", image_url=?"; params.push(`http://localhost:5000/uploads/${req.file.filename}`); }
    sql += " WHERE id=?"; params.push(req.params.id);
    db.query(sql, params, (err) => { if(err) return res.status(500).json(err); res.json({message:"Updated"}); });
});

app.post('/api/gigs/duplicate/:id', (req, res) => {
    db.query("SELECT * FROM gigs WHERE id = ?", [req.params.id], (err, data) => {
        if (err || data.length === 0) return res.status(500).json({ error: "Gig not found" });
        const original = data[0];
        db.query("INSERT INTO gigs (freelancer_id, title, description, price, delivery_days, image_url) VALUES (?, ?, ?, ?, ?, ?)", 
        [original.freelancer_id, "Copy of " + original.title, original.description, original.price, original.delivery_days, original.image_url], 
        (err, result) => res.json({ message: "Duplicated" }));
    });
});

// --- REQUIREMENTS & BIDS ---
app.post('/api/requirements', (req, res) => {
    const { client_id, title, description, deadline } = req.body;
    db.query("INSERT INTO requirements (client_id, title, description, deadline) VALUES (?, ?, ?, ?)", 
    [client_id, title, description, deadline], (err, result) => {
        if(err) return res.status(500).json(err); res.status(201).json({ message: "Posted" });
    });
});

app.get('/api/requirements', (req, res) => {
    db.query("SELECT requirements.*, users.name as client_name FROM requirements JOIN users ON requirements.client_id = users.id ORDER BY requirements.created_at DESC", 
    (err, results) => res.json(results));
});

app.get('/api/requirements/client/:id', (req, res) => {
    db.query("SELECT * FROM requirements WHERE client_id = ? ORDER BY created_at DESC", [req.params.id], (err, results) => res.json(results));
});

app.post('/api/bids', (req, res) => {
    const { requirement_id, freelancer_id, price, delivery_days, message } = req.body;
    db.query("SELECT * FROM bids WHERE requirement_id = ? AND freelancer_id = ?", [requirement_id, freelancer_id], (err, data) => {
        if (data.length > 0) return res.status(400).json({ error: "Already bid" });
        db.query("INSERT INTO bids (requirement_id, freelancer_id, price, delivery_days, message) VALUES (?, ?, ?, ?, ?)", 
        [requirement_id, freelancer_id, price, delivery_days, message], (err) => res.json({ message: "Bid Submitted" }));
    });
});

app.get('/api/bids/job/:id', (req, res) => {
    db.query("SELECT bids.*, users.name as freelancer_name FROM bids JOIN users ON bids.freelancer_id = users.id WHERE requirement_id = ?", 
    [req.params.id], (err, results) => res.json(results));
});

// --- ORDERS & CHAT ---
app.post('/api/orders/hire', (req, res) => {
    const { requirement_id, client_id, freelancer_id, bid_id, price } = req.body;
    db.query("INSERT INTO orders (requirement_id, client_id, freelancer_id, bid_id, total_price, status) VALUES (?, ?, ?, ?, ?, 'in_progress')", 
    [requirement_id, client_id, freelancer_id, bid_id, price], (err) => res.json({ message: "Hired!" }));
});

app.get('/api/orders/freelancer/:id', (req, res) => {
    db.query(`SELECT orders.*, requirements.title as job_title, users.name as client_name FROM orders 
              JOIN requirements ON orders.requirement_id = requirements.id JOIN users ON orders.client_id = users.id 
              WHERE orders.freelancer_id = ? ORDER BY orders.created_at DESC`, [req.params.id], (err, results) => res.json(results));
});

app.get('/api/orders/client/:id', (req, res) => {
    db.query(`SELECT orders.*, requirements.title as job_title, users.name as freelancer_name FROM orders 
              JOIN requirements ON orders.requirement_id = requirements.id JOIN users ON orders.freelancer_id = users.id 
              WHERE orders.client_id = ? ORDER BY orders.created_at DESC`, [req.params.id], (err, results) => res.json(results));
});

// 🔴 UPDATED: GET MESSAGES (Uses sent_date and sent_time)
app.get('/api/messages/:orderId', (req, res) => {
    const sql = `
        SELECT m.id, m.order_id, m.sender_id, m.text, m.sent_date, m.sent_time, u.name as sender_name 
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id 
        WHERE m.order_id = ? 
        ORDER BY m.sent_date ASC, m.sent_time ASC
    `;
    db.query(sql, [req.params.orderId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 🔴 UPDATED: SEND MESSAGE (Inserts sent_date and sent_time)
app.post('/api/messages', (req, res) => {
    const { order_id, sender_id, text } = req.body;
    const now = new Date();
    const sent_date = now.toISOString().split('T')[0];
    const sent_time = now.toTimeString().split(' ')[0];

    db.query("INSERT INTO messages (order_id, sender_id, text, sent_date, sent_time) VALUES (?, ?, ?, ?, ?)", 
    [order_id, sender_id, text, sent_date, sent_time], (err) => res.json({ message: "Sent" }));
});

// 🔴 UPDATED: DELIVER WORK (Inserts sent_date and sent_time)
app.post('/api/orders/deliver', upload.single('workFile'), (req, res) => {
    const { order_id, sender_id, text } = req.body;
    const file_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;
    const msgText = text + (file_url ? ` [FILE: ${file_url}]` : "");
    
    const now = new Date();
    const sent_date = now.toISOString().split('T')[0];
    const sent_time = now.toTimeString().split(' ')[0];

    // Assuming file_id is NULL for simplicity unless you insert into files table first
    db.query("INSERT INTO messages (order_id, sender_id, text, file_id, sent_date, sent_time) VALUES (?, ?, ?, NULL, ?, ?)", 
    [order_id, sender_id, msgText, sent_date, sent_time], (err) => {
        if(err) return res.status(500).json({ error: err.message });
        db.query("UPDATE orders SET status = 'final_delivered' WHERE id = ?", [order_id], () => res.json({ message: "Delivered" }));
    });
});

app.post('/api/portfolio', upload.single('image'), (req, res) => {
    const { freelancer_id, title, category, description } = req.body;
    const image_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;
    const descWithImg = image_url + "|||" + description; 
    db.query("INSERT INTO portfolio_items (freelancer_id, title, category, description) VALUES (?, ?, ?, ?)", 
    [freelancer_id, title, category, descWithImg], (err) => res.json({message:"Added"}));
});

app.get('/api/portfolio/:id', (req, res) => {
    db.query("SELECT * FROM portfolio_items WHERE freelancer_id = ?", [req.params.id], (err, results) => res.json(results));
});

// 🔴 CLIENT REVIEW (Accept or Request Revision)
app.post('/api/orders/review', (req, res) => {
    const { order_id, status, client_id, feedback } = req.body;
    // status: 'revision_requested' or 'completed'
    
    const msgText = status === 'completed' 
        ? `🎉 ORDER COMPLETED! The client accepted the work.` 
        : `⚠️ REVISION REQUESTED: ${feedback}`;

    // 1. Add System Message to Chat
    db.query("INSERT INTO messages (order_id, sender_id, text) VALUES (?, ?, ?)", [order_id, client_id, msgText], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // 2. Update Order Status
        db.query("UPDATE orders SET status = ? WHERE id = ?", [status, order_id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ message: "Order Updated Successfully" });
        });
    });
});
// ============================================
// 👤 PROFILE ROUTES
// ============================================

// 1. GET PROFILE (Joins User + Freelancer Profile)
app.get('/api/profile/:id', (req, res) => {
    const sql = `
        SELECT u.id, u.name, u.email, u.role, u.profile_pic, fp.bio, fp.skills 
        FROM users u 
        LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id 
        WHERE u.id = ?
    `;
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(result[0]);
    });
});

// 2. UPDATE PROFILE (Name, Pic, Bio, Skills)
app.put('/api/profile/:id', upload.single('profilePic'), (req, res) => {
    const userId = req.params.id;
    const { name, bio, skills } = req.body;
    
    // 1. Handle Image URL
    let profile_pic_url = undefined;
    if (req.file) {
        profile_pic_url = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    // 2. Update USERS table (Name, Pic)
    let userSql = "UPDATE users SET name = ?";
    let userParams = [name];
    
    if (profile_pic_url) {
        userSql += ", profile_pic = ?";
        userParams.push(profile_pic_url);
    }
    userSql += " WHERE id = ?";
    userParams.push(userId);

    db.query(userSql, userParams, (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // 3. Update/Insert FREELANCER_PROFILES table (Bio, Skills)
        // ON DUPLICATE KEY UPDATE ensures we create a row if it doesn't exist yet
        const profileSql = `
            INSERT INTO freelancer_profiles (user_id, bio, skills) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE bio = VALUES(bio), skills = VALUES(skills)
        `;
        db.query(profileSql, [userId, bio, skills], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            
            // Return updated info so frontend can update localStorage
            res.json({ message: "Profile Updated", newPic: profile_pic_url });
        });
    });
});
// ============================================
// 👮 ADMIN ROUTES
// ============================================

// 1. Get Admin Stats
app.get('/api/admin/stats', (req, res) => {
    const stats = {};
    
    // We run multiple queries in sequence (simplest way for now)
    db.query("SELECT COUNT(*) as count FROM users", (err, res1) => {
        if(err) return res.status(500).json(err);
        stats.users = res1[0].count;

        db.query("SELECT COUNT(*) as count FROM gigs", (err, res2) => {
            stats.gigs = res2[0].count;

            db.query("SELECT COUNT(*) as count FROM orders", (err, res3) => {
                stats.orders = res3[0].count;
                res.json(stats);
            });
        });
    });
});

// 2. Get All Users (For Management)
app.get('/api/admin/users', (req, res) => {
    db.query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC", (err, results) => {
        if(err) return res.status(500).json(err);
        res.json(results);
    });
});

// 3. Delete a User (Ban)
app.delete('/api/admin/user/:id', (req, res) => {
    db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({ message: "User Deleted" });
    });
});

// 4. Get All Gigs (For Moderation)
app.get('/api/admin/gigs', (req, res) => {
    const sql = `SELECT gigs.*, users.name as freelancer_name FROM gigs JOIN users ON gigs.freelancer_id = users.id ORDER BY created_at DESC`;
    db.query(sql, (err, results) => {
        if(err) return res.status(500).json(err);
        res.json(results);
    });
});

// 5. Delete a Gig (Moderation)
app.delete('/api/admin/gig/:id', (req, res) => {
    db.query("DELETE FROM gigs WHERE id = ?", [req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({ message: "Gig Deleted" });
    });
});

// 1. Manage User Status (Approve / Disable)
app.put('/api/admin/user/status/:id', (req, res) => {
    const { status } = req.body; // 'active' or 'disabled'
    db.query("UPDATE users SET status = ? WHERE id = ?", [status, req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({ message: `User ${status}` });
    });
});

// 2. Get Disputes
app.get('/api/admin/disputes', (req, res) => {
    const sql = `
        SELECT d.*, o.total_price, u.name as raised_by_name 
        FROM disputes d
        JOIN orders o ON d.order_id = o.id
        JOIN users u ON d.raised_by = u.id
        WHERE d.status = 'open'
    `;
    db.query(sql, (err, results) => res.json(results));
});

// 3. Resolve Dispute
app.post('/api/admin/dispute/resolve', (req, res) => {
    const { dispute_id, order_id, resolution } = req.body; 
    // resolution: 'resolved_refund' (Cancel Order) or 'resolved_paid' (Complete Order)
    
    const orderStatus = resolution === 'resolved_refund' ? 'cancelled' : 'completed';

    db.query("UPDATE disputes SET status = ? WHERE id = ?", [resolution, dispute_id], (err) => {
        if(err) return res.status(500).json(err);
        
        // Also update the Order status based on the decision
        db.query("UPDATE orders SET status = ? WHERE id = ?", [orderStatus, order_id], (err2) => {
            if(err2) return res.status(500).json(err2);
            res.json({ message: "Dispute Resolved & Order Updated" });
        });
    });
});

// 4. Manage Categories (Rules)
app.get('/api/admin/categories', (req, res) => {
    db.query("SELECT * FROM categories", (err, results) => res.json(results));
});

app.post('/api/admin/categories', (req, res) => {
    db.query("INSERT INTO categories (name) VALUES (?)", [req.body.name], (err, result) => {
        if(err) return res.status(500).json(err);
        res.json({ id: result.insertId, name: req.body.name });
    });
});

// 5. Advanced Analytics (Sprint Summary Mock)
app.get('/api/admin/sprint-summary', (req, res) => {
    // In a real app, calculate this from dates. For now, we mock the "Sprint" logic with real counts.
    db.query("SELECT COUNT(*) as count FROM orders WHERE status='completed'", (err, res1) => {
        const completed = res1[0].count;
        db.query("SELECT SUM(total_price) as total FROM orders", (err, res2) => {
            res.json({
                sprint_week: "Week 12 (Current)",
                orders_completed: completed,
                revenue_flow: res2[0].total || 0,
                active_freelancers: 5 // Mock for complexity
            });
        });
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});