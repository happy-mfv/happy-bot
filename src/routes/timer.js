const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');

// Get current timer session
router.get('/current', (req, res) => {
  db.get(
    "SELECT * FROM timer_sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1",
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!row) {
        return res.json({ active: false });
      }
      
      const startTime = new Date(row.start_time);
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000); // seconds
      
      res.json({
        active: true,
        session: {
          ...row,
          elapsed,
          remaining: row.duration ? row.duration - elapsed : null
        }
      });
    }
  );
});

// Start timer session
router.post('/start', (req, res) => {
  const { duration = 1500, session_type = 'pomodoro', task_id } = req.body; // 1500 seconds = 25 minutes
  
  // Stop any active session first
  db.run(
    "UPDATE timer_sessions SET end_time = datetime('now'), duration = (strftime('%s', 'now') - strftime('%s', start_time)) WHERE end_time IS NULL",
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Start new session
      const id = uuidv4();
      const now = new Date().toISOString();
      
      db.run(
        "INSERT INTO timer_sessions (id, task_id, start_time, session_type, created_at) VALUES (?, ?, ?, ?, ?)",
        [id, task_id, now, session_type, now],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({
            success: true,
            session: {
              id,
              task_id,
              start_time: now,
              session_type,
              duration: null,
              end_time: null
            }
          });
        }
      );
    }
  );
});

// Stop current timer session
router.post('/stop', (req, res) => {
  db.run(
    "UPDATE timer_sessions SET end_time = datetime('now'), duration = (strftime('%s', 'now') - strftime('%s', start_time)) WHERE end_time IS NULL",
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'No active session found' });
      }
      
      res.json({ success: true, message: 'Timer stopped successfully' });
    }
  );
});

// Get timer statistics
router.get('/stats', (req, res) => {
  const { period = 'today' } = req.query;
  
  let dateFilter = "date(created_at) = date('now')";
  if (period === 'week') {
    dateFilter = "date(created_at) >= date('now', '-7 days')";
  } else if (period === 'month') {
    dateFilter = "date(created_at) >= date('now', '-30 days')";
  }
  
  db.get(
    `SELECT COUNT(*) as total_sessions, SUM(duration) as total_duration, AVG(duration) as avg_duration FROM timer_sessions WHERE ${dateFilter} AND end_time IS NOT NULL`,
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const totalSessions = row.total_sessions || 0;
      const totalSeconds = row.total_duration || 0;
      const avgSeconds = row.avg_duration || 0;
      
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      
      const avgMinutes = Math.floor(avgSeconds / 60);
      const avgSecondsRemaining = avgSeconds % 60;
      
      res.json({
        period,
        total_sessions: totalSessions,
        total_duration: {
          hours: totalHours,
          minutes: remainingMinutes,
          seconds: totalSeconds
        },
        average_duration: {
          minutes: avgMinutes,
          seconds: Math.round(avgSecondsRemaining)
        },
        productivity_score: totalSessions > 0 ? Math.min(Math.round((totalHours / totalSessions) * 10), 100) : 0
      });
    }
  );
});

// Get recent sessions
router.get('/sessions', (req, res) => {
  const { limit = 10 } = req.query;
  
  db.all(
    "SELECT * FROM timer_sessions WHERE end_time IS NOT NULL ORDER BY created_at DESC LIMIT ?",
    [limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ sessions: rows });
    }
  );
});

// Get pomodoro statistics
router.get('/pomodoro/stats', (req, res) => {
  db.get(
    "SELECT COUNT(*) as total_pomodoros, SUM(CASE WHEN duration >= 1500 THEN 1 ELSE 0 END) as completed_pomodoros FROM timer_sessions WHERE session_type = 'pomodoro' AND end_time IS NOT NULL",
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const totalPomodoros = row.total_pomodoros || 0;
      const completedPomodoros = row.completed_pomodoros || 0;
      
      res.json({
        total_pomodoros: totalPomodoros,
        completed_pomodoros: completedPomodoros,
        completion_rate: totalPomodoros > 0 ? Math.round((completedPomodoros / totalPomodoros) * 100) : 0
      });
    }
  );
});

module.exports = router; 