const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');

// Get learning progress
router.get('/progress', (req, res) => {
  const { userId = 'default' } = req.query;
  
  db.all(
    "SELECT * FROM learning_progress WHERE user_id = ? ORDER BY updated_at DESC",
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ progress: rows });
    }
  );
});

// Update learning progress
router.post('/progress', (req, res) => {
  const { userId = 'default', category, topic, progress, total_lessons, completed_lessons } = req.body;
  
  if (!category || !topic) {
    return res.status(400).json({ error: 'Category and topic are required' });
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    "INSERT OR REPLACE INTO learning_progress (id, user_id, category, topic, progress, total_lessons, completed_lessons, last_studied, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id, userId, category, topic, progress || 0, total_lessons || 0, completed_lessons || 0, now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        success: true,
        progress: {
          id,
          user_id: userId,
          category,
          topic,
          progress: progress || 0,
          total_lessons: total_lessons || 0,
          completed_lessons: completed_lessons || 0,
          last_studied: now,
          updated_at: now
        }
      });
    }
  );
});

// Get flashcards
router.get('/flashcards', (req, res) => {
  const { category, limit = 10 } = req.query;
  
  let query = "SELECT * FROM flashcards";
  let params = [];
  
  if (category) {
    query += " WHERE category = ?";
    params.push(category);
  }
  
  query += " ORDER BY RANDOM() LIMIT ?";
  params.push(limit);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ flashcards: rows });
  });
});

// Add new flashcard
router.post('/flashcards', (req, res) => {
  const { category, front, back, difficulty = 1 } = req.body;
  
  if (!category || !front || !back) {
    return res.status(400).json({ error: 'Category, front, and back are required' });
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    "INSERT INTO flashcards (id, category, front, back, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, category, front, back, difficulty, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        success: true,
        flashcard: {
          id,
          category,
          front,
          back,
          difficulty,
          created_at: now
        }
      });
    }
  );
});

// Update flashcard review
router.put('/flashcards/:id/review', (req, res) => {
  const { id } = req.params;
  const { difficulty, review_count } = req.body;
  
  const now = new Date().toISOString();
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + (difficulty || 1)); // Review in X days based on difficulty
  
  db.run(
    "UPDATE flashcards SET difficulty = ?, review_count = ?, last_reviewed = ?, next_review = ? WHERE id = ?",
    [difficulty || 1, (review_count || 0) + 1, now, nextReview.toISOString(), id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Flashcard not found' });
      }
      
      res.json({ success: true, message: 'Flashcard review updated' });
    }
  );
});

// Get daily learning suggestions
router.get('/suggestions', (req, res) => {
  const { userId = 'default' } = req.query;
  
  // Get topics with low progress
  db.all(
    "SELECT * FROM learning_progress WHERE user_id = ? AND progress < 80 ORDER BY last_studied ASC LIMIT 3",
    [userId],
    (err, progressRows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Get flashcards due for review
      db.all(
        "SELECT * FROM flashcards WHERE next_review <= datetime('now') ORDER BY last_reviewed ASC LIMIT 5",
        (err, flashcardRows) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({
            suggestions: {
              continue_learning: progressRows,
              review_flashcards: flashcardRows,
              daily_goal: "Complete 3 learning sessions today"
            }
          });
        }
      );
    }
  );
});

// Get learning statistics
router.get('/stats', (req, res) => {
  const { userId = 'default' } = req.query;
  
  db.get(
    "SELECT AVG(progress) as avg_progress, COUNT(*) as total_topics, SUM(completed_lessons) as total_completed FROM learning_progress WHERE user_id = ?",
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      const avgProgress = Math.round(row.avg_progress || 0);
      const totalTopics = row.total_topics || 0;
      const totalCompleted = row.total_completed || 0;
      
      res.json({
        average_progress: avgProgress,
        total_topics: totalTopics,
        total_completed_lessons: totalCompleted,
        learning_streak: 0, // TODO: Implement streak tracking
        weekly_goal: "Complete 5 lessons this week"
      });
    }
  );
});

// Get quiz questions
router.get('/quiz', (req, res) => {
  const { category = 'technology', count = 3 } = req.query;
  
  const quizzes = {
    technology: [
      {
        question: "React là gì?",
        options: ["A. Một ngôn ngữ lập trình", "B. Một framework JavaScript", "C. Một database", "D. Một hệ điều hành"],
        answer: "B. Một framework JavaScript",
        explanation: "React là một thư viện JavaScript được phát triển bởi Facebook để xây dựng giao diện người dùng."
      },
      {
        question: "API là viết tắt của gì?",
        options: ["A. Application Programming Interface", "B. Advanced Programming Interface", "C. Application Process Interface", "D. Advanced Process Interface"],
        answer: "A. Application Programming Interface",
        explanation: "API là giao diện lập trình ứng dụng, cho phép các ứng dụng giao tiếp với nhau."
      },
      {
        question: "Git là gì?",
        options: ["A. Một ngôn ngữ lập trình", "B. Một hệ quản lý phiên bản", "C. Một database", "D. Một web server"],
        answer: "B. Một hệ quản lý phiên bản",
        explanation: "Git là một hệ thống quản lý phiên bản phân tán, được sử dụng để theo dõi thay đổi trong mã nguồn."
      }
    ],
    english: [
      {
        question: "What does 'Hello' mean in Vietnamese?",
        options: ["A. Tạm biệt", "B. Xin chào", "C. Cảm ơn", "D. Không có gì"],
        answer: "B. Xin chào",
        explanation: "Hello = Xin chào"
      },
      {
        question: "What does 'Thank you' mean in Vietnamese?",
        options: ["A. Xin chào", "B. Tạm biệt", "C. Cảm ơn", "D. Không có gì"],
        answer: "C. Cảm ơn",
        explanation: "Thank you = Cảm ơn"
      },
      {
        question: "What does 'Goodbye' mean in Vietnamese?",
        options: ["A. Xin chào", "B. Tạm biệt", "C. Cảm ơn", "D. Không có gì"],
        answer: "B. Tạm biệt",
        explanation: "Goodbye = Tạm biệt"
      }
    ]
  };
  
  const categoryQuizzes = quizzes[category] || quizzes.technology;
  const selectedQuizzes = categoryQuizzes.slice(0, count);
  
  res.json({ quizzes: selectedQuizzes });
});

module.exports = router; 