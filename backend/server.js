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

// HELPER: NOTIFICATIONS
const notify = (userId, type, message) => {
    const sql = "INSERT INTO notifications (user_id, type, payload, is_read) VALUES (?, ?, ?, 0)";
    // Payload stored as JSON string for simplicity
    const payload = JSON.stringify({ message });
    db.query(sql, [userId, type, payload], (err) => {
        if(err) console.error("Notification Error:", err);
    });
};

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
    const sql = `
        SELECT r.*, u.name as client_name, u.profile_pic
        FROM requirements r
        JOIN users u ON r.client_id = u.id
        LEFT JOIN orders o ON r.id = o.requirement_id
        WHERE o.id IS NULL
        ORDER BY r.created_at DESC
    `;
    // Logic: LEFT JOIN orders... WHERE o.id IS NULL means "Keep only rows where no order exists"
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Fetch Jobs Error:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.get('/api/requirements/client/:id', (req, res) => {
    db.query("SELECT * FROM requirements WHERE client_id = ? ORDER BY created_at DESC", [req.params.id], (err, results) => res.json(results));
});

app.post('/api/bids', (req, res) => {
    const { requirement_id, freelancer_id, price, delivery_days, message } = req.body;
    db.query("SELECT * FROM bids WHERE requirement_id = ? AND freelancer_id = ?", [requirement_id, freelancer_id], (err, data) => {
        if (data.length > 0) return res.status(400).json({ error: "Already bid" });
        db.query("INSERT INTO bids (requirement_id, freelancer_id, price, delivery_days, message) VALUES (?, ?, ?, ?, ?)", 
        [requirement_id, freelancer_id, price, delivery_days, message], (err) => {
            // Notify Client
            db.query("SELECT client_id FROM requirements WHERE id = ?", [requirement_id], (e, r) => {
                notify(r[0].client_id, 'bid', `New bid received on your job!`);
            });
            res.json({ message: "Bid Submitted" });
        });
    });
});

app.get('/api/bids/job/:id', (req, res) => {
    const sql = `
        SELECT bids.*, users.name as freelancer_name, users.profile_pic, users.id as user_id 
        FROM bids 
        JOIN users ON bids.freelancer_id = users.id 
        WHERE bids.requirement_id = ? 
        ORDER BY bids.price ASC
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- ORDERS & CHAT & DELIVERY ---
app.post('/api/orders/hire', (req, res) => {
    const { requirement_id, client_id, freelancer_id, bid_id, price } = req.body;
    db.query("INSERT INTO orders (requirement_id, client_id, freelancer_id, bid_id, total_price, status) VALUES (?, ?, ?, ?, ?, 'in_progress')", 
    [requirement_id, client_id, freelancer_id, bid_id, price], (err) => {
        if(err) return res.status(500).json(err);
        notify(freelancer_id, 'order', `You have been hired!`);
        res.json({ message: "Hired!" });
    });
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

// GET MESSAGES
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

// SEND MESSAGE
app.post('/api/messages', (req, res) => {
    const { order_id, sender_id, text } = req.body;
    const now = new Date();
    const sent_date = now.toISOString().split('T')[0];
    const sent_time = now.toTimeString().split(' ')[0];

    db.query("INSERT INTO messages (order_id, sender_id, text, sent_date, sent_time) VALUES (?, ?, ?, ?, ?)", 
    [order_id, sender_id, text, sent_date, sent_time], (err) => {
        // Notify Receiver
        db.query("SELECT client_id, freelancer_id FROM orders WHERE id = ?", [order_id], (e, r) => {
            const receiver = (sender_id == r[0].client_id) ? r[0].freelancer_id : r[0].client_id;
            notify(receiver, 'message', `New message received`);
        });
        res.json({ message: "Sent" });
    });
});

// DELIVER WORK
app.post('/api/orders/deliver', upload.single('workFile'), (req, res) => {
    const { order_id, sender_id, text } = req.body;
    const file_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;
    const msgText = text + (file_url ? ` [FILE: ${file_url}]` : "");
    const now = new Date();
    const sent_date = now.toISOString().split('T')[0];
    const sent_time = now.toTimeString().split(' ')[0];

    db.query("INSERT INTO messages (order_id, sender_id, text, file_id, sent_date, sent_time) VALUES (?, ?, ?, NULL, ?, ?)", 
    [order_id, sender_id, msgText, sent_date, sent_time], (err) => {
        if(err) return res.status(500).json({ error: err.message });
        db.query("UPDATE orders SET status = 'final_delivered' WHERE id = ?", [order_id], () => {
            // Notify Client
            db.query("SELECT client_id FROM orders WHERE id = ?", [order_id], (e, r) => notify(r[0].client_id, 'delivery', 'Freelancer delivered work!'));
            res.json({ message: "Delivered" });
        });
    });
});

// CLIENT REVIEW
app.post('/api/orders/review', (req, res) => {
    const { order_id, status, client_id, feedback } = req.body;
    const msgText = status === 'completed' ? `🎉 ORDER COMPLETED!` : `⚠️ REVISION REQUESTED: ${feedback}`;
    const now = new Date();
    const sent_date = now.toISOString().split('T')[0];
    const sent_time = now.toTimeString().split(' ')[0];

    db.query("INSERT INTO messages (order_id, sender_id, text, sent_date, sent_time) VALUES (?, ?, ?, ?, ?)", 
    [order_id, client_id, msgText, sent_date, sent_time], (err) => {
        db.query("UPDATE orders SET status = ? WHERE id = ?", [status, order_id], () => {
            // Notify Freelancer
            db.query("SELECT freelancer_id FROM orders WHERE id = ?", [order_id], (e, r) => notify(r[0].freelancer_id, 'review', status === 'completed' ? 'Order Completed!' : 'Revision Requested'));
            res.json({ message: "Updated" });
        });
    });
});

// --- NOTIFICATIONS ---
app.get('/api/notifications/:userId', (req, res) => {
    db.query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [req.params.userId], (err, results) => res.json(results));
});

// Mark as Read
app.put('/api/notifications/read/all/:userId', (req, res) => {
    db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.params.userId], (err) => {
        if(err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- PROFILE ---
app.get('/api/profile/:id', (req, res) => {
    db.query(`SELECT u.id, u.name, u.email, u.role, u.profile_pic, fp.bio, fp.skills FROM users u LEFT JOIN freelancer_profiles fp ON u.id = fp.user_id WHERE u.id = ?`, 
    [req.params.id], (err, result) => res.json(result[0]));
});

app.put('/api/profile/:id', upload.single('profilePic'), (req, res) => {
    const userId = req.params.id;
    const { name, bio, skills } = req.body;
    let profile_pic_url = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : undefined;

    let userSql = "UPDATE users SET name = ?";
    let userParams = [name];
    if (profile_pic_url) { userSql += ", profile_pic = ?"; userParams.push(profile_pic_url); }
    userSql += " WHERE id = ?"; userParams.push(userId);

    db.query(userSql, userParams, () => {
        db.query(`INSERT INTO freelancer_profiles (user_id, bio, skills) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE bio = VALUES(bio), skills = VALUES(skills)`, 
        [userId, bio, skills], () => res.json({ message: "Profile Updated", newPic: profile_pic_url }));
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

// --- ADMIN ---
app.get('/api/admin/stats', (req, res) => {
    db.query("SELECT COUNT(*) as u FROM users", (e, r1) => {
        db.query("SELECT COUNT(*) as g FROM gigs", (e, r2) => {
            db.query("SELECT COUNT(*) as o FROM orders", (e, r3) => {
                res.json({ users: r1[0].u, gigs: r2[0].g, orders: r3[0].o });
            });
        });
    });
});

app.get('/api/admin/users', (req, res) => {
    db.query("SELECT * FROM users ORDER BY created_at DESC", (err, resu) => res.json(resu));
});

app.delete('/api/admin/user/:id', (req, res) => {
    db.query("DELETE FROM users WHERE id = ?", [req.params.id], () => res.json({message:"Deleted"}));
});

app.get('/api/admin/gigs', (req, res) => {
    db.query("SELECT gigs.*, users.name as freelancer_name FROM gigs JOIN users ON gigs.freelancer_id = users.id ORDER BY created_at DESC", (err, resu) => res.json(resu));
});

app.delete('/api/admin/gig/:id', (req, res) => {
    db.query("DELETE FROM gigs WHERE id = ?", [req.params.id], () => res.json({message:"Deleted"}));
});

app.put('/api/admin/user/status/:id', (req, res) => {
    const { status } = req.body;
    db.query("UPDATE users SET status = ? WHERE id = ?", [status, req.params.id], () => res.json({ message: `User ${status}` }));
});

app.get('/api/admin/disputes', (req, res) => {
    db.query(`SELECT d.*, o.total_price, u.name as raised_by_name FROM disputes d JOIN orders o ON d.order_id = o.id JOIN users u ON d.raised_by = u.id WHERE d.status = 'open'`, (err, results) => res.json(results));
});

app.post('/api/admin/dispute/resolve', (req, res) => {
    const { dispute_id, order_id, resolution } = req.body;
    const orderStatus = resolution === 'resolved_refund' ? 'cancelled' : 'completed';
    db.query("UPDATE disputes SET status = ? WHERE id = ?", [resolution, dispute_id], () => {
        db.query("UPDATE orders SET status = ? WHERE id = ?", [orderStatus, order_id], () => res.json({ message: "Resolved" }));
    });
});

app.get('/api/admin/categories', (req, res) => {
    db.query("SELECT * FROM categories", (err, results) => res.json(results));
});

app.post('/api/admin/categories', (req, res) => {
    db.query("INSERT INTO categories (name) VALUES (?)", [req.body.name], (err, result) => res.json({ id: result.insertId, name: req.body.name }));
});

app.get('/api/admin/sprint-summary', (req, res) => {
    db.query("SELECT COUNT(*) as count FROM orders WHERE status='completed'", (err, res1) => {
        const completed = res1[0].count;
        db.query("SELECT SUM(total_price) as total FROM orders", (err, res2) => {
            res.json({
                sprint_week: "Week 12 (Current)",
                orders_completed: completed,
                revenue_flow: res2[0].total || 0,
                active_freelancers: 5 
            });
        });
    });
});
// DELETE GIG (Freelancer)
app.delete('/api/gigs/:id', (req, res) => {
    db.query("DELETE FROM gigs WHERE id = ?", [req.params.id], (err) => {
        if(err) return res.status(500).json({ error: err.message });
        res.json({ message: "Gig Deleted" });
    });
});
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});