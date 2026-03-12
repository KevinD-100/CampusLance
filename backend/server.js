const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();

app.use(cors({
    origin: [
        "https://campus-lance-eight.vercel.app",
        "http://localhost:5173"
    ],
    credentials: true
}));

// If you want to allow ANY Vercel preview URL, you can use a fallback:
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && origin.includes('vercel.app')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    next();
});
app.use(express.json());
// 🟢 FIX: Allow Razorpay Popups to communicate
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
});
// Serve uploaded images so frontend can access them
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. DATABASE CONNECTION
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306
});

db.connect((err) => {
    if (err) console.error('❌ DB Error:', err);
    else {
        console.log('✅ Connected to MySQL Database');

        // AUTO-CLEANUP: Remove duplicate inquiries on startup
        const cleanupSql = `
            DELETE o1 FROM orders o1
            JOIN orders o2 
            ON o1.client_id = o2.client_id 
            AND o1.freelancer_id = o2.freelancer_id 
            AND o1.status = 'inquiry' 
            AND o2.status = 'inquiry'
            WHERE o1.id < o2.id;
        `;
        db.query(cleanupSql, (e, r) => {
            if (!e && r.affectedRows > 0) console.log(`🧹 Creating Gig: Cleaned up ${r.affectedRows} duplicate inquiries.`);
        });

        // 3. SETUP PORTFOLIO TABLE (Ensure exists)
        const portfolioTable = `
            CREATE TABLE IF NOT EXISTS portfolio_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                freelancer_id INT,
                title VARCHAR(255),
                category VARCHAR(100),
                description TEXT,
                image_url TEXT,
                tools VARCHAR(255),
                link VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        db.query(portfolioTable, (err) => {
            if (err) console.error("❌ Portfolio Table Error:", err);
            else {
                console.log("✅ Portfolio Table Ready");

                // 4. SETUP CATEGORIES TABLE
                const categoriesTable = `
                    CREATE TABLE IF NOT EXISTS categories (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(100) UNIQUE NOT NULL
                    )
                `;
                db.query(categoriesTable, (err) => {
                    if (err) console.error("❌ Categories Table Error:", err);
                    else {
                        db.query("INSERT IGNORE INTO categories (name) VALUES ('Web Development'), ('Graphic Design'), ('Writing'), ('Digital Marketing')");
                    }
                });

                // 5. SETUP DISPUTES TABLE
                const disputesTable = `
                    CREATE TABLE IF NOT EXISTS disputes (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        order_id INT,
                        raised_by INT,
                        reason TEXT,
                        status ENUM('open', 'resolved_refund', 'resolved_paid') DEFAULT 'open',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                        FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE CASCADE
                    )
                `;
                db.query(disputesTable, (err) => {
                    if (err) console.error("❌ Disputes Table Error:", err);
                });

                // 6. MIGRATION: Fix missing columns for existing tables
                const alterItems = [
                    "ALTER TABLE portfolio_items ADD COLUMN link VARCHAR(255);",
                    "ALTER TABLE orders ADD COLUMN milestones TEXT;",
                    "ALTER TABLE freelancer_profiles ADD COLUMN achievements TEXT;",
                    "ALTER TABLE users ADD COLUMN status ENUM('active', 'disabled') DEFAULT 'active';"
                ];
                alterItems.forEach(sql => {
                    db.query(sql, (e) => {
                        if (e && e.code !== 'ER_DUP_FIELDNAME') console.log("⚠️ Migration Note:", e.message);
                    });
                });
            }
        });
    }
});

// FILE UPLOAD CONFIG
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        // Sanitize filename and use lowercase extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'file-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

// EMAIL CONFIG
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'danielaliyas110@gmail.com', pass: 'ttvk fzur hjcy bxtk' }
});

// RAZORPAY CONFIG (TEST MODE)
const razorpay = new Razorpay({
    key_id: 'rzp_test_SKKavRDsA7hwvi',
    key_secret: 'JonxTwA09KWsOVkMB5kFkeo8'
});

console.log("💳 Payment System: Razorpay Active (Test Mode)");

// HELPER: NOTIFICATIONS
const notify = (userId, type, message) => {
    const sql = "INSERT INTO notifications (user_id, type, payload, is_read) VALUES (?, ?, ?, 0)";
    // Payload stored as JSON string for simplicity
    const payload = JSON.stringify({ message });
    db.query(sql, [userId, type, payload], (err) => {
        if (err) console.error("Notification Error:", err);
    });
};

// --- SYSTEM ---
app.get('/ping', (req, res) => res.status(200).send('pong'));

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

// 1. CREATE GIG (Professional)
app.post('/api/gigs', upload.single('image'), (req, res) => {
    const { freelancer_id, title, description, price, delivery_days, category, revisions, requirements, skills } = req.body;
    const image_url = req.file ? `https://campuslance.onrender.com/uploads/${req.file.filename}` : null;

    const sql = `
        INSERT INTO gigs 
        (freelancer_id, title, description, price, delivery_days, image_url, category, revisions, requirements, skills) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [freelancer_id, title, description, price, delivery_days, image_url, category, revisions, requirements, skills], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Gig Created", gigId: result.insertId });
    });
});

app.get('/api/gigs', (req, res) => {
    const { category, min, max, search } = req.query;
    let sql = "SELECT gigs.*, users.name as freelancer_name FROM gigs JOIN users ON gigs.freelancer_id = users.id WHERE 1=1";
    const params = [];

    if (category && category !== 'All') { sql += " AND gigs.category = ?"; params.push(category); }
    if (min) { sql += " AND gigs.price >= ?"; params.push(min); }
    if (max) { sql += " AND gigs.price <= ?"; params.push(max); }
    if (search) { sql += " AND (gigs.title LIKE ? OR gigs.description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

    sql += " ORDER BY gigs.created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/quiz/submit', (req, res) => {
    const { user_id, score } = req.body;
    // Add score to existing skill_score (simple gamification)
    db.query("UPDATE freelancer_profiles SET skill_score = skill_score + ? WHERE user_id = ?", [score, user_id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Score Updated", addedPoints: score });
    });
});

app.get('/api/gigs/my/:id', (req, res) => {
    db.query("SELECT * FROM gigs WHERE freelancer_id = ? ORDER BY created_at DESC", [req.params.id], (err, results) => res.json(results));
});

app.get('/api/gigs/single/:id', (req, res) => {
    const sql = `
        SELECT gigs.*, 
               users.name as freelancer_name, 
               users.profile_pic,
               fp.bio, 
               fp.skills as freelancer_skills,
               fp.skill_score
        FROM gigs 
        JOIN users ON gigs.freelancer_id = users.id 
        LEFT JOIN freelancer_profiles fp ON users.id = fp.user_id
        WHERE gigs.id = ?
    `;
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

app.put('/api/gigs/:id', upload.single('image'), (req, res) => {
    const { title, description, price, delivery_days } = req.body;
    let sql = "UPDATE gigs SET title=?, description=?, price=?, delivery_days=?";
    let params = [title, description, price, delivery_days];
    if (req.file) { sql += ", image_url=?"; params.push(`https://campuslance.onrender.com/uploads/${req.file.filename}`); }
    sql += " WHERE id=?"; params.push(req.params.id);
    db.query(sql, params, (err) => { if (err) return res.status(500).json(err); res.json({ message: "Updated" }); });
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
            if (err) return res.status(500).json(err); res.status(201).json({ message: "Posted" });
        });
});

// 5. Get Requirements (Find Work - SHOW ALL)
app.get('/api/requirements', (req, res) => {
    // Show ALL jobs, ordered by newest. 
    // Join users to get client name & pic.
    const sql = `
        SELECT r.*, u.name as client_name, u.profile_pic
        FROM requirements r
        JOIN users u ON r.client_id = u.id
        LEFT JOIN orders o ON r.id = o.requirement_id
        WHERE o.id IS NULL
        AND (r.deadline >= CURDATE() OR r.deadline IS NULL)
        ORDER BY r.created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Fetch Jobs Error:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log(`✅ Sending ${results.length} jobs to frontend.`);
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
// (Duplicate removed - integrated below)


app.get('/api/orders/freelancer/:id', (req, res) => {
    db.query(`SELECT orders.*, requirements.title as job_title, requirements.description as job_description, users.name as client_name FROM orders 
              JOIN requirements ON orders.requirement_id = requirements.id JOIN users ON orders.client_id = users.id 
              WHERE orders.freelancer_id = ? AND orders.status != 'inquiry' ORDER BY orders.created_at DESC`, [req.params.id], (err, results) => res.json(results));
});

app.get('/api/orders/client/:id', (req, res) => {
    db.query(`SELECT orders.*, requirements.title as job_title, users.name as freelancer_name FROM orders 
              JOIN requirements ON orders.requirement_id = requirements.id JOIN users ON orders.freelancer_id = users.id 
              WHERE orders.client_id = ? AND orders.status != 'inquiry' ORDER BY orders.created_at DESC`, [req.params.id], (err, results) => res.json(results));
});

// --- NEW FEATURES: DIRECT ORDER & CHAT ---

// 1. DIRECT GIG ORDER (Creates Requirement -> Bid -> Order chain)
app.post('/api/orders', (req, res) => {
    const { client_id, freelancer_id, job_title, total_price, deadline } = req.body;

    // 1. Create Requirement
    db.query("INSERT INTO requirements (client_id, title, description, deadline) VALUES (?, ?, 'Direct Order', ?)",
        [client_id, job_title, deadline], (err, resReq) => {
            if (err) return res.status(500).json(err);
            const reqId = resReq.insertId;
            res.json({ message: "Requirement created", reqId });
        });
});

// --- RAZORPAY PAYMENT INTEGRATION ---
app.post('/api/payment/create-order', async (req, res) => {
    const { amount } = req.body;
    console.log(`💳 Creating Razorpay Order for ₹${amount}...`);
    const options = {
        amount: Math.round(amount * 100), // Amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`
    };
    try {
        const order = await razorpay.orders.create(options);
        console.log(`✅ Razorpay Order Created: ${order.id}`);
        res.json(order);
    } catch (error) {
        console.error("❌ Razorpay Order Error:", error);
        res.status(500).json(error);
    }
});

app.post('/api/payment/verify', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const hmac = crypto.createHmac('sha256', razorpay.key_secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
        res.json({ status: 'success' });
    } else {
        res.status(400).json({ status: 'failure' });
    }
});

app.post('/api/orders/hire', (req, res) => {
    const { requirement_id, client_id, freelancer_id, bid_id, price } = req.body;
    const initialMilestones = JSON.stringify([{ step: 'Hired', date: new Date().toISOString() }]);

    // Create actual order
    db.query("INSERT INTO orders (requirement_id, client_id, freelancer_id, bid_id, total_price, status, milestones) VALUES (?, ?, ?, ?, ?, 'in_progress', ?)",
        [requirement_id, client_id, freelancer_id, bid_id, price, initialMilestones], (err, result) => {
            if (err) return res.status(500).json(err);

            notify(freelancer_id, 'order', `You've been hired! New order created.`);
            res.json({ message: "Order Placed Successfully", orderId: result.insertId });
        });
});

// GET SINGLE ORDER (Missing Route Fixed)
app.get('/api/orders/single/:id', (req, res) => {
    const sql = `
        SELECT o.*, r.title as job_title, u.name as freelancer_name, c.name as client_name 
        FROM orders o
        JOIN requirements r ON o.requirement_id = r.id
        JOIN users u ON o.freelancer_id = u.id
        JOIN users c ON o.client_id = c.id
        WHERE o.id = ?
    `;
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(404).json({ error: "Order not found" });
        res.json(result[0]);
    });
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
    const { order_id, sender_id, text, type } = req.body;
    const file_url = req.file ? `https://campuslance.onrender.com/uploads/${req.file.filename}` : null;
    const msgText = text + (file_url ? ` [FILE: ${file_url}]` : "");
    const now = new Date();
    const sent_date = now.toISOString().split('T')[0];
    const sent_time = now.toTimeString().split(' ')[0];

    const newStatus = type === 'final' ? 'final_delivered' : 'draft_delivered';

    db.query("INSERT INTO messages (order_id, sender_id, text, file_id, sent_date, sent_time) VALUES (?, ?, ?, NULL, ?, ?)",
        [order_id, sender_id, msgText, sent_date, sent_time], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.query("UPDATE orders SET status = ? WHERE id = ?", [newStatus, order_id], () => {
                // Notify Client
                db.query("SELECT client_id FROM orders WHERE id = ?", [order_id], (e, r) => notify(r[0].client_id, 'delivery', `Freelancer sent a ${type} delivery!`));
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
        if (err) return res.status(500).json({ error: err.message });
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
    let profile_pic_url = req.file ? `https://campuslance.onrender.com/uploads/${req.file.filename}` : undefined;

    let userSql = "UPDATE users SET name = ?";
    let userParams = [name];
    if (profile_pic_url) { userSql += ", profile_pic = ?"; userParams.push(profile_pic_url); }
    userSql += " WHERE id = ?"; userParams.push(userId);

    db.query(userSql, userParams, () => {
        db.query(`INSERT INTO freelancer_profiles (user_id, bio, skills) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE bio = VALUES(bio), skills = VALUES(skills)`,
            [userId, bio, skills], () => res.json({ message: "Profile Updated", newPic: profile_pic_url }));
    });
});

app.post('/api/portfolio', upload.array('images'), (req, res) => {
    console.log("📥 Portfolio Upload Request:", req.body);
    console.log("📂 Files:", req.files);

    const { freelancer_id, title, category, description, tools, link } = req.body;

    // Validate required fields
    if (!freelancer_id) return res.status(400).json({ error: "Missing Freelancer ID" });

    // Handle Multiple Files
    let image_urls = [];
    if (req.files && req.files.length > 0) {
        image_urls = req.files.map(f => `https://campuslance.onrender.com/uploads/${f.filename}`);
    } else if (req.body.image_url) {
        // Manual string fallback
    }

    // Store as JSON string e.g. '["url1", "url2"]'
    const image_url_json = JSON.stringify(image_urls);

    const sql = "INSERT INTO portfolio_items (freelancer_id, title, category, description, image_url, tools, link) VALUES (?, ?, ?, ?, ?, ?, ?)";

    db.query(sql, [freelancer_id, title, category, description, image_url_json, tools, link],
        (err) => {
            if (err) {
                console.error("❌ DB Insert Error:", err);
                return res.status(500).json({ error: err.sqlMessage || err.message });
            }
            console.log("✅ Portfolio Item Saved to DB");
            res.json({ message: "Added" });
        });
});

app.get('/api/portfolio/:id', (req, res) => {
    console.log(`📥 Fetching Portfolio for Freelancer: ${req.params.id}`);
    db.query("SELECT * FROM portfolio_items WHERE freelancer_id = ? ORDER BY id DESC", [req.params.id], (err, results) => {
        if (err) {
            console.error("❌ DB Query Error:", err);
            return res.status(500).json(err);
        }
        console.log(`✅ Found ${results.length} items for Freelancer ${req.params.id}`);
        res.json(results);
    });
});

app.delete('/api/portfolio/:id', (req, res) => {
    db.query("DELETE FROM portfolio_items WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Deleted" });
    });
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


// DELETE GIG (Freelancer)
app.delete('/api/gigs/:id', (req, res) => {
    db.query("DELETE FROM gigs WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Gig Deleted" });
    });
});
// ============================================
// ❤️ FAVORITES ROUTES
// ============================================

// 1. Toggle Favorite (Add/Remove)
app.post('/api/favorites', (req, res) => {
    const { user_id, target_id, fav_type } = req.body;

    // Check if already favorite
    db.query("SELECT * FROM favorites WHERE user_id=? AND target_id=? AND fav_type=?", [user_id, target_id, fav_type], (err, data) => {
        if (err) return res.status(500).json({ error: err.message });

        if (data.length > 0) {
            // Remove
            db.query("DELETE FROM favorites WHERE id=?", [data[0].id], () => res.json({ status: 'removed' }));
        } else {
            // Add
            db.query("INSERT INTO favorites (user_id, target_id, fav_type) VALUES (?, ?, ?)", [user_id, target_id, fav_type], () => res.json({ status: 'added' }));
        }
    });
});

// 2. Get Favorites for User
app.get('/api/favorites/:userId', (req, res) => {
    db.query("SELECT target_id FROM favorites WHERE user_id = ?", [req.params.userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        // Return array of IDs: [1, 5, 8]
        res.json(result.map(r => r.target_id));
    });
});

// 3. Submit Rating
app.post('/api/ratings', (req, res) => {
    const { order_id, client_id, freelancer_id, stars, comment } = req.body;
    db.query("INSERT INTO ratings (order_id, client_id, freelancer_id, stars, comment) VALUES (?, ?, ?, ?, ?)",
        [order_id, client_id, freelancer_id, stars, comment], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Update Skill Score (+2 per star)
            db.query("UPDATE freelancer_profiles SET skill_score = skill_score + ? WHERE user_id = ?", [stars * 2, freelancer_id]);

            res.json({ message: "Rating Submitted" });
        });
});

// --- NEW FEATURES: LEADERBOARD, MILESTONES, MATCHMAKING ---

// 1. Leaderboard: Top 5 Freelancers
app.get('/api/analytics/leaderboard', (req, res) => {
    const sql = `
        SELECT u.id, u.name, u.profile_pic, fp.skill_score, fp.skills,
               (SELECT COUNT(*) FROM orders WHERE freelancer_id = u.id AND status = 'completed') as completions,
               (SELECT AVG(stars) FROM ratings WHERE freelancer_id = u.id) as avg_rating
        FROM users u
        JOIN freelancer_profiles fp ON u.id = fp.user_id
        WHERE u.role = 'freelancer'
        ORDER BY (fp.skill_score * 0.4 + (SELECT COUNT(*) FROM orders WHERE freelancer_id = u.id AND status = 'completed') * 10) DESC
        LIMIT 5
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 2. Project Roadmap: Update Milestones
app.post('/api/orders/:id/milestone', (req, res) => {
    const { milestones } = req.body; // Expects JSON string
    db.query("UPDATE orders SET milestones = ? WHERE id = ?", [milestones, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Milestone Updated" });
    });
});

// 3. AI Matchmaking (Skill-based)
app.post('/api/matchmaking', (req, res) => {
    const { requirements, title } = req.body;
    if (!requirements && !title) return res.json([]);

    const sql = `
        SELECT u.id, u.name, u.profile_pic, fp.skills, fp.bio, fp.skill_score
        FROM users u
        JOIN freelancer_profiles fp ON u.id = fp.user_id
        WHERE u.role = 'freelancer'
    `;

    db.query(sql, (err, freelancers) => {
        if (err) return res.status(500).json(err);

        const searchPool = ((title || "") + " " + (requirements || "")).toLowerCase();

        const scored = freelancers.map(f => {
            let matchPoints = 0;
            const matchedSkills = [];
            const skills = (f.skills || "").toLowerCase().split(",");

            skills.forEach(s => {
                const trimmed = s.trim();
                if (trimmed.length > 0) {
                    // Use word boundary regex for exact matches
                    const regex = new RegExp(`\\b${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                    if (regex.test(searchPool)) {
                        matchPoints += 1;
                        matchedSkills.push(trimmed);
                    }
                }
            });

            // Calculate Skill Match (out of 100)
            const skillMatchScore = skills.length > 0 ? (matchPoints / Math.max(skills.length, 1)) * 100 : 0;

            // Weighted Final Score: 70% skill match, 30% reputation (capped at 100)
            const finalScore = Math.round((skillMatchScore * 0.7) + (Math.min(f.skill_score, 100) * 0.3));

            return { ...f, matchScore: finalScore, matchedSkills };
        }).filter(f => f.matchScore > 10).sort((a, b) => b.matchScore - a.matchScore);

        res.json(scored.slice(0, 3));
    });
});

// ================= ADMIN ROUTES ================= //

// 1. Get Platform Stats
app.get('/api/admin/stats', (req, res) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM users) as users,
            (SELECT COUNT(*) FROM gigs) as gigs,
            (SELECT COUNT(*) FROM orders) as orders
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results[0]);
    });
});

// 2. Get Sprint Summary (Last 7 Days)
app.get('/api/admin/sprint-summary', (req, res) => {
    const sql = `
        SELECT 
            'Current Week' as sprint_week,
            (SELECT COUNT(*) FROM orders WHERE status = 'completed' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as orders_completed,
            (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'completed' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as revenue_flow,
            (SELECT COUNT(DISTINCT freelancer_id) FROM orders WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as active_freelancers
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results[0]);
    });
});

app.get('/api/admin/timeline', (req, res) => {
    const sql = `
        SELECT 
            DAYNAME(created_at) as day,
            COUNT(*) as count
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DAYNAME(created_at)
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);

        // Format for frontend
        const defaultDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const map = {};
        defaultDays.forEach(d => map[d] = 0);

        results.forEach(r => {
            if (r.day) {
                const shortDay = r.day.substring(0, 3);
                if (map[shortDay] !== undefined) map[shortDay] = r.count;
            }
        });

        res.json(map);
    });
});

// 3. User Management
app.get('/api/admin/users', (req, res) => {
    db.query("SELECT id, name, email, role, status FROM users ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.put('/api/admin/user/status/:id', (req, res) => {
    const { status } = req.body;
    db.query("UPDATE users SET status = ? WHERE id = ?", [status, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "User status updated" });
    });
});

// 4. Manage Categories
app.get('/api/admin/categories', (req, res) => {
    db.query("SELECT * FROM categories", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/admin/categories', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    db.query("INSERT INTO categories (name) VALUES (?)", [name], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Category added" });
    });
});

// 5. Manage Disputes
app.get('/api/admin/disputes', (req, res) => {
    const sql = `
        SELECT 
            d.*, 
            u.name as raised_by_name,
            c.name as client_name,
            c.email as client_email,
            f.name as freelancer_name,
            f.email as freelancer_email,
            o.total_price as price,
            req.title as job_title
        FROM disputes d 
        JOIN users u ON d.raised_by = u.id 
        JOIN orders o ON d.order_id = o.id
        JOIN users c ON o.client_id = c.id
        JOIN users f ON o.freelancer_id = f.id
        LEFT JOIN requirements req ON o.requirement_id = req.id
        WHERE d.status = 'open'
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/admin/dispute/resolve', (req, res) => {
    const { dispute_id, order_id, resolution } = req.body;
    // resolution = 'resolved_refund' or 'resolved_paid'

    // 1. Update dispute status
    db.query("UPDATE disputes SET status = ? WHERE id = ?", [resolution, dispute_id], (err) => {
        if (err) return res.status(500).json(err);

        // 2. Update order status based on resolution
        const orderStatus = resolution === 'resolved_refund' ? 'cancelled' : 'completed';
        db.query("UPDATE orders SET status = ? WHERE id = ?", [orderStatus, order_id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Dispute resolved and order updated." });
        });
    });
});

// ================= USER DISPUTES ================= //
app.post('/api/disputes', (req, res) => {
    const { order_id, raised_by, reason } = req.body;
    db.query("INSERT INTO disputes (order_id, raised_by, reason) VALUES (?, ?, ?)", [order_id, raised_by, reason], (err) => {
        if (err) return res.status(500).json(err);

        db.query("UPDATE orders SET status = 'in_dispute' WHERE id = ?", [order_id], (err2) => {
            if (err2) console.error("Could not update order status:", err2);
            res.json({ message: "Dispute submitted to Admin" });
        });
    });
});

const PORT = 5000;

// ================= USER PROFILE ================= //
app.delete('/api/users/:id', (req, res) => {
    // Delete account
    db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Account deleted successfully." });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});