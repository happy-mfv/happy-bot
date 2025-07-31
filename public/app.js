// Global variables
let currentSection = 'chat';
let timerInterval = null;
let timerDuration = 25 * 60; // 25 minutes in seconds
let timerRunning = false;
let currentTime = timerDuration;
let currentLanguage = 'vi'; // Default language

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load initial data
    loadTasks();
    loadTimerStats();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize socket connection
    initializeSocket();
    
    // Load saved language
    loadSavedLanguage();
}

function setupEventListeners() {
    // Chat input
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add task form
    const addTaskForm = document.getElementById('add-task-form');
    addTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        addTask();
    });

    // Modal close on outside click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function initializeSocket() {
    const socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

// Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Add active class to clicked nav item
    event.target.closest('.nav-item').classList.add('active');
    
    currentSection = sectionName;
    
    // Load section-specific data
    switch(sectionName) {
        case 'tasks':
            loadTasks();
            break;
        case 'timer':
            loadTimerStats();
            break;
        case 'learning':
            loadLearningContent();
            break;
    }
}

// Chat functionality
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    input.value = '';
    
    try {
        const response = await fetch('/api/bot/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                userId: 'default',
                language: currentLanguage
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addMessageToChat(data.response, 'bot');
        } else {
            addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `<p>${message.replace(/\n/g, '</p><p>')}</p>`;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Task management
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        const data = await response.json();
        
        displayTasks(data.tasks);
        updateTaskStats(data.tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function displayTasks(tasks) {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
        tasksList.innerHTML = `
            <div class="task-item" style="text-align: center; color: var(--text-secondary);">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>No tasks yet. Create your first task!</p>
            </div>
        `;
        return;
    }
    
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksList.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    
    const priorityClass = `priority-${task.priority}`;
    const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    
    taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-title">${task.title}</div>
            <span class="task-priority ${priorityClass}">${priorityText}</span>
        </div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        <div class="task-meta">
            ${task.category ? `<span><i class="fas fa-tag"></i> ${task.category}</span>` : ''}
            ${task.deadline ? `<span><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</span>` : ''}
            <span><i class="fas fa-clock"></i> ${formatDate(task.created_at)}</span>
        </div>
        <div class="task-actions">
            <button class="btn btn-sm btn-primary" onclick="completeTask('${task.id}')">
                <i class="fas fa-check"></i> Complete
            </button>
            <button class="btn btn-sm btn-secondary" onclick="editTask('${task.id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline" onclick="deleteTask('${task.id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    return taskDiv;
}

function updateTaskStats(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = total - completed;
    
    document.getElementById('total-tasks').textContent = total;
    document.getElementById('completed-tasks').textContent = completed;
    document.getElementById('pending-tasks').textContent = pending;
}

async function addTask() {
    const formData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value,
        category: document.getElementById('task-category').value,
        priority: document.getElementById('task-priority').value,
        deadline: document.getElementById('task-deadline').value
    };
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeModal('add-task-modal');
            document.getElementById('add-task-form').reset();
            loadTasks();
            showNotification('Task added successfully!', 'success');
        } else {
            showNotification('Error adding task', 'error');
        }
    } catch (error) {
        console.error('Error adding task:', error);
        showNotification('Error adding task', 'error');
    }
}

async function completeTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTasks();
            showNotification('Task completed!', 'success');
        } else {
            showNotification('Error completing task', 'error');
        }
    } catch (error) {
        console.error('Error completing task:', error);
        showNotification('Error completing task', 'error');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTasks();
            showNotification('Task deleted!', 'success');
        } else {
            showNotification('Error deleting task', 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error deleting task', 'error');
    }
}

// Timer functionality
function startTimer() {
    if (timerRunning) return;
    
    timerRunning = true;
    currentTime = timerDuration;
    
    document.getElementById('start-timer').style.display = 'none';
    document.getElementById('stop-timer').style.display = 'inline-flex';
    
    timerInterval = setInterval(() => {
        currentTime--;
        updateTimerDisplay();
        
        if (currentTime <= 0) {
            stopTimer();
            showNotification('Pomodoro session completed!', 'success');
            // Start server timer
            fetch('/api/timer/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    duration: timerDuration,
                    session_type: 'pomodoro'
                })
            });
        }
    }, 1000);
}

function stopTimer() {
    if (!timerRunning) return;
    
    timerRunning = false;
    clearInterval(timerInterval);
    
    document.getElementById('start-timer').style.display = 'inline-flex';
    document.getElementById('stop-timer').style.display = 'none';
    
    // Stop server timer
    fetch('/api/timer/stop', {
        method: 'POST'
    });
}

function resetTimer() {
    stopTimer();
    currentTime = timerDuration;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    document.getElementById('timer-display').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function loadTimerStats() {
    try {
        const response = await fetch('/api/timer/stats?period=today');
        const data = await response.json();
        
        document.getElementById('today-sessions').textContent = data.total_sessions;
        document.getElementById('total-time').textContent = `${data.total_duration.hours}h ${data.total_duration.minutes}m`;
    } catch (error) {
        console.error('Error loading timer stats:', error);
    }
}

// Learning functionality
function showFlashcards() {
    const content = document.getElementById('learning-content');
    content.innerHTML = `
        <div class="flashcard-container">
            <h3>English Flashcards</h3>
            <div class="flashcard" id="current-flashcard">
                <div class="flashcard-front">
                    <h4>Loading...</h4>
                </div>
                <div class="flashcard-back" style="display: none;">
                    <h4>Loading...</h4>
                </div>
            </div>
            <div class="flashcard-controls">
                <button class="btn btn-primary" onclick="nextFlashcard()">
                    <i class="fas fa-forward"></i> Next
                </button>
            </div>
        </div>
    `;
    
    loadFlashcard();
}

async function loadFlashcard() {
    try {
        const response = await fetch('/api/learning/flashcards?category=english&limit=1');
        const data = await response.json();
        
        if (data.flashcards.length > 0) {
            const card = data.flashcards[0];
            document.querySelector('.flashcard-front h4').textContent = card.front;
            document.querySelector('.flashcard-back h4').textContent = card.back;
        }
    } catch (error) {
        console.error('Error loading flashcard:', error);
    }
}

function nextFlashcard() {
    const front = document.querySelector('.flashcard-front');
    const back = document.querySelector('.flashcard-back');
    
    if (front.style.display !== 'none') {
        front.style.display = 'none';
        back.style.display = 'block';
    } else {
        front.style.display = 'block';
        back.style.display = 'none';
        loadFlashcard();
    }
}

function showQuiz() {
    const content = document.getElementById('learning-content');
    content.innerHTML = `
        <div class="quiz-container">
            <h3>Technology Quiz</h3>
            <div class="quiz-question" id="quiz-question">
                <p>Loading quiz...</p>
            </div>
            <div class="quiz-options" id="quiz-options">
            </div>
            <div class="quiz-controls">
                <button class="btn btn-primary" onclick="loadQuiz()">
                    <i class="fas fa-refresh"></i> New Quiz
                </button>
            </div>
        </div>
    `;
    
    loadQuiz();
}

async function loadQuiz() {
    try {
        const response = await fetch('/api/learning/quiz?category=technology&count=1');
        const data = await response.json();
        
        if (data.quizzes.length > 0) {
            const quiz = data.quizzes[0];
            document.getElementById('quiz-question').innerHTML = `<p><strong>${quiz.question}</strong></p>`;
            
            const optionsContainer = document.getElementById('quiz-options');
            optionsContainer.innerHTML = '';
            
            quiz.options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'btn btn-outline quiz-option';
                button.textContent = option;
                button.onclick = () => checkAnswer(option, quiz.answer);
                optionsContainer.appendChild(button);
            });
        }
    } catch (error) {
        console.error('Error loading quiz:', error);
    }
}

function checkAnswer(selected, correct) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => {
        option.disabled = true;
        if (option.textContent === correct) {
            option.style.backgroundColor = '#10b981';
            option.style.color = 'white';
        } else if (option.textContent === selected && selected !== correct) {
            option.style.backgroundColor = '#ef4444';
            option.style.color = 'white';
        }
    });
    
    setTimeout(() => {
        loadQuiz();
    }, 2000);
}

function showProgress() {
    const content = document.getElementById('learning-content');
    content.innerHTML = `
        <div class="progress-container">
            <h3>Learning Progress</h3>
            <div class="progress-stats">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="avg-progress">0%</h3>
                        <p>Average Progress</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="stat-content">
                        <h3 id="total-topics">0</h3>
                        <p>Topics Studied</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadProgress();
}

async function loadProgress() {
    try {
        const response = await fetch('/api/learning/stats');
        const data = await response.json();
        
        document.getElementById('avg-progress').textContent = `${data.average_progress}%`;
        document.getElementById('total-topics').textContent = data.total_topics;
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

function loadLearningContent() {
    showProgress(); // Default to progress view
}

// Modal functions
function showAddTaskModal() {
    document.getElementById('add-task-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.querySelector('.btn-primary i');
    themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function showStats() {
    // This would show a comprehensive stats modal
    alert('Stats feature coming soon!');
}

// Language functions
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update UI language
    updateUILanguage(lang);
    
    // Send language change to bot
    sendLanguageChangeToBot(lang);
    
    // Show notification
    const languageNames = {
        vi: 'Tiếng Việt',
        en: 'English',
        ja: '日本語',
        ko: '한국어',
        zh: '中文'
    };
    
    showNotification(`🌍 Đã chuyển sang ${languageNames[lang]}!`, 'success');
}

function loadSavedLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'vi';
    currentLanguage = savedLanguage;
    
    // Update language selector
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = savedLanguage;
    }
    
    // Update UI language
    updateUILanguage(savedLanguage);
}

function updateUILanguage(lang) {
    // Update navigation labels
    const navItems = document.querySelectorAll('.nav-item span');
    const labels = {
        vi: ['Chat', 'Tasks', 'Timer', 'Learning'],
        en: ['Chat', 'Tasks', 'Timer', 'Learning'],
        ja: ['チャット', 'タスク', 'タイマー', '学習'],
        ko: ['채팅', '작업', '타이머', '학습'],
        zh: ['聊天', '任务', '计时器', '学习']
    };
    
    const currentLabels = labels[lang] || labels.en;
    navItems.forEach((item, index) => {
        if (currentLabels[index]) {
            item.textContent = currentLabels[index];
        }
    });
    
    // Update section headers
    const sectionHeaders = document.querySelectorAll('.section-header h2');
    const headers = {
        vi: ['Chat with Happy Bot', 'Task Management', 'Pomodoro Timer', 'Learning Center'],
        en: ['Chat with Happy Bot', 'Task Management', 'Pomodoro Timer', 'Learning Center'],
        ja: ['Happy Botとのチャット', 'タスク管理', 'ポモドーロタイマー', '学習センター'],
        ko: ['Happy Bot와 채팅', '작업 관리', '뽀모도로 타이머', '학습 센터'],
        zh: ['与Happy Bot聊天', '任务管理', '番茄钟计时器', '学习中心']
    };
    
    const currentHeaders = headers[lang] || headers.en;
    sectionHeaders.forEach((header, index) => {
        if (currentHeaders[index]) {
            header.innerHTML = `<i class="fas fa-${getHeaderIcon(index)}"></i> ${currentHeaders[index]}`;
        }
    });
    
    // Update placeholders
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        const placeholders = {
            vi: 'Nhập tin nhắn của bạn...',
            en: 'Type your message...',
            ja: 'メッセージを入力してください...',
            ko: '메시지를 입력하세요...',
            zh: '输入您的消息...'
        };
        chatInput.placeholder = placeholders[lang] || placeholders.en;
    }
}

function getHeaderIcon(index) {
    const icons = ['comments', 'tasks', 'clock', 'graduation-cap'];
    return icons[index] || 'info-circle';
}

async function sendLanguageChangeToBot(lang) {
    try {
        const response = await fetch('/api/bot/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Switch to ${lang}`,
                userId: 'default'
            })
        });
        
        const data = await response.json();
        if (data.success) {
            addMessageToChat(data.response, 'bot');
        }
    } catch (error) {
        console.error('Error sending language change:', error);
    }
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        const themeIcon = document.querySelector('.btn-primary i');
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style); 