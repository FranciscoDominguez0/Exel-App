const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Database
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
const dbPath = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Setup Database Tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS license (
      id INTEGER PRIMARY KEY,
      expiration_date INTEGER
    )
  `);

  // Insert default admin if not exists
  db.get("SELECT * FROM users WHERE username = 'fran2003'", (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (username, password) VALUES ('fran2003', 'Panama26')");
    }
  });

  // Insert default license if not exists (30 days from now)
  db.get("SELECT * FROM license WHERE id = 1", (err, row) => {
    if (!row) {
      const defaultExpiration = Date.now() + (30 * 24 * 60 * 60 * 1000);
      db.run("INSERT INTO license (id, expiration_date) VALUES (1, ?)", [defaultExpiration]);
    }
  });
});

// APIs
app.get('/api/license', (req, res) => {
  db.get("SELECT expiration_date FROM license WHERE id = 1", (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.json({ valid: false, daysLeft: 0, expiration: 0 });
    
    const now = Date.now();
    const diff = row.expiration_date - now;
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    res.json({
      valid: daysLeft > 0,
      daysLeft: daysLeft,
      expiration: row.expiration_date
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (row) {
      res.json({ success: true, token: 'fake-jwt-token-for-local-use' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  });
});

app.post('/api/license/renew', (req, res) => {
  const { token } = req.body;
  if (token !== 'fake-jwt-token-for-local-use') return res.status(403).json({ error: 'Unauthorized' });

  const newExpiration = Date.now() + (30 * 24 * 60 * 60 * 1000);
  db.run("UPDATE license SET expiration_date = ? WHERE id = 1", [newExpiration], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true, expiration: newExpiration });
  });
});

app.post('/api/license/cancel', (req, res) => {
  const { token } = req.body;
  if (token !== 'fake-jwt-token-for-local-use') return res.status(403).json({ error: 'Unauthorized' });

  db.run("UPDATE license SET expiration_date = 0 WHERE id = 1", (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ success: true });
  });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
