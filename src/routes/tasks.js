const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database/database');

// Get all tasks
router.get('/', (req, res) => {
  const { status, category, priority } = req.query;
  let query = "SELECT * FROM tasks";
  let conditions = [];
  let params = [];

  if (status) {
    conditions.push("status = ?");
    params.push(status);
  }
  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }
  if (priority) {
    conditions.push("priority = ?");
    params.push(priority);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY priority DESC, created_at DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ tasks: rows });
  });
});

// Create new task
router.post('/', (req, res) => {
  const { title, description, category, priority = 'medium', deadline } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    "INSERT INTO tasks (id, title, description, category, priority, deadline, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [id, title, description, category, priority, deadline, now, now],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.status(201).json({
        success: true,
        task: {
          id,
          title,
          description,
          category,
          priority,
          deadline,
          status: 'pending',
          created_at: now,
          updated_at: now
        }
      });
    }
  );
});

// Update task
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, category, priority, status, deadline } = req.body;
  const now = new Date().toISOString();

  let updateFields = [];
  let params = [];

  if (title !== undefined) {
    updateFields.push("title = ?");
    params.push(title);
  }
  if (description !== undefined) {
    updateFields.push("description = ?");
    params.push(description);
  }
  if (category !== undefined) {
    updateFields.push("category = ?");
    params.push(category);
  }
  if (priority !== undefined) {
    updateFields.push("priority = ?");
    params.push(priority);
  }
  if (status !== undefined) {
    updateFields.push("status = ?");
    params.push(status);
  }
  if (deadline !== undefined) {
    updateFields.push("deadline = ?");
    params.push(deadline);
  }

  updateFields.push("updated_at = ?");
  params.push(now);
  params.push(id);

  const query = `UPDATE tasks SET ${updateFields.join(", ")} WHERE id = ?`;

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ success: true, message: 'Task updated successfully' });
  });
});

// Delete task
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM tasks WHERE id = ?", [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ success: true, message: 'Task deleted successfully' });
  });
});

// Complete task
router.post('/:id/complete', (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  db.run(
    "UPDATE tasks SET status = 'completed', updated_at = ? WHERE id = ?",
    [now, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({ success: true, message: 'Task marked as completed' });
    }
  );
});

// Get task statistics
router.get('/stats', (req, res) => {
  db.get(
    "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending FROM tasks",
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        total: row.total || 0,
        completed: row.completed || 0,
        pending: row.pending || 0,
        completion_rate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0
      });
    }
  );
});

module.exports = router; 