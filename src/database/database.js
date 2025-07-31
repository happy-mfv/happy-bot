const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/happy_bot.db');

// Create database directory if it doesn't exist
const fs = require('fs');
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  // Create tasks table
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    deadline TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create timer_sessions table
  db.run(`CREATE TABLE IF NOT EXISTS timer_sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration INTEGER,
    session_type TEXT DEFAULT 'pomodoro',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create learning_progress table
  db.run(`CREATE TABLE IF NOT EXISTS learning_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default',
    category TEXT NOT NULL,
    topic TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    completed_lessons INTEGER DEFAULT 0,
    last_studied TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create flashcards table
  db.run(`CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1,
    last_reviewed TEXT,
    next_review TEXT,
    review_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create chat_history table
  db.run(`CREATE TABLE IF NOT EXISTS chat_history (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default',
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('✅ Database tables initialized');
}

module.exports = db; 