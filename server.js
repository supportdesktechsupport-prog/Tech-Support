const express = require('express');
const cors = require('cors');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// 1. लाइफटाइम फ्री लोकल SQLite डेटाबेस फ़ाइल बनाना
const db = new Database('tech_support.db');

console.log("डेटाबेस तैयार हो रहा है...");

// 2. आपकी .dump फ़ाइल को पढ़कर लोकल डेटाबेस में डालना (सिर्फ पहली बार)
try {
    const dumpPath = 'TECH_SUPPORT_FULL_DATABASE_2026-11-02.dump';
    if (fs.existsSync(dumpPath)) {
        const sql = fs.readFileSync(dumpPath, 'utf8');
        
        // पोस्टग्रेस (Supabase) के भारी नियमों को SQLite के अनुकूल साफ़ करना
        const cleanedSql = sql
            .replace(/CREATE EXTENSION[\s\S]*?;/g, '')
            .replace(/ALTER DEFAULT PRIVILEGES[\s\S]*?;/g, '')
            .replace(/SET[\s\S]*?;/g, '')
            .replace(/OWNER TO[\s\S]*?;/g, '')
            .replace(/ROW LEVEL SECURITY/g, '');
        
        db.exec(cleanedSql);
        console.log("बधाई हो! बैकअप डम्प सफलतापूर्वक लोकल डेटाबेस में इम्पोर्ट हो गया!");
    } else {
        console.log("डम्प फ़ाइल नहीं मिली, लेकिन लोकल डेटाबेस एक्टिव है।");
    }
} catch (err) {
    console.log("डम्प लोडिंग स्टेटस:", err.message);
}

// ==========================================
// 🔐 छात्रों के लिए एपीआई रूट्स (STUDENT PANEL)
// ==========================================

// छात्रों का लॉगिन
app.post('/api/login', (req, res) => {
    const { mobile, password } = req.body;
    try {
        const student = db.prepare('SELECT * FROM students WHERE mobile = ? AND password = ?').get(mobile, password);
        if (student) {
            res.json({ success: true, user: student });
        } else {
            res.status(401).json({ success: false, message: "गलत मोबाइल नंबर या पासवर्ड!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// स्टूडेंट डैशबोर्ड प्रोफाइल डेटा
app.get('/api/student/:id', (req, res) => {
    try {
        const data = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
        if (data) {
            res.json({ success: true, student: data });
        } else {
            res.status(404).json({ success: false, message: "छात्र नहीं मिला!" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 👑 आपके लिए अलग खुफिया एडमिन रूट्स (ADMIN PANEL)
// ==========================================

// एडमिन का सीक्रेट लॉगिन (यहाँ अपना पासवर्ड बदल सकते हैं)
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // सोनपाल भाई, आप अपना खुफिया एडमिन क्रेडेंशियल्स यहाँ देख सकते हैं
    if (username === 'admin_sonpal' && password === 'Sonpal@2026') {
        res.json({ success: true, token: 'admin-secret-token-active', role: 'Founder' });
    } else {
        res.status(401).json({ success: false, message: "अनाधिकृत प्रवेश! गलत एडमिन क्रेडेंशियल्स!" });
    }
});

// एडमिन द्वारा सभी छात्रों की लिस्ट एक साथ देखना
app.get('/api/admin/students', (req, res) => {
    try {
        const allStudents = db.prepare('SELECT id, name, mobile, class, board, stream FROM students').all();
        res.json({ success: true, students: allStudents });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// सर्वर पोर्ट कॉन्फ़िगरेशन
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`लॉन्ग-टर्म फ्री बैकएंड पोर्ट ${PORT} पर लाइव है!`));
