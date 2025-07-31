const express = require('express');
const router = express.Router();
const HappyBot = require('../bot/happyBot');

const bot = new HappyBot();

// Chat with bot
router.post('/chat', async (req, res) => {
  try {
    const { message, userId = 'default', language } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set language if provided
    if (language && bot.supportedLanguages.includes(language)) {
      bot.currentLanguage = language;
    }

    const response = await bot.processMessage(message, userId);
    
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Bot chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chat history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = require('../database/database');
    
    db.all("SELECT * FROM chat_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50", [userId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        success: true,
        history: rows.reverse() // Show oldest first
      });
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bot info
router.get('/info', (req, res) => {
  res.json({
    name: bot.name,
    version: bot.version,
    features: [
      'Task Management',
      'Pomodoro Timer',
      'Learning Tools',
      'Progress Tracking'
    ]
  });
});

module.exports = router; 