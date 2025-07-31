# Hướng dẫn cài đặt và chạy Happy Bot

## Yêu cầu hệ thống

- Node.js (version 14 trở lên)
- npm hoặc yarn

## Cài đặt Node.js

### Trên macOS (sử dụng Homebrew)
```bash
# Cài đặt Homebrew nếu chưa có
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài đặt Node.js
brew install node
```

### Trên macOS (sử dụng nvm)
```bash
# Cài đặt nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal hoặc chạy
source ~/.zshrc

# Cài đặt Node.js
nvm install 18
nvm use 18
```

### Trên Windows
Tải và cài đặt từ: https://nodejs.org/

### Trên Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Cài đặt và chạy ứng dụng

1. **Cài đặt dependencies:**
```bash
npm install
```

2. **Tạo file .env (nếu chưa có):**
```bash
echo "PORT=3000" > .env
echo "NODE_ENV=development" >> .env
```

3. **Chạy ứng dụng:**
```bash
# Development mode (với auto-reload)
npm run dev

# Hoặc production mode
npm start
```

4. **Mở trình duyệt:**
Truy cập http://localhost:3000

## Tính năng chính

### 🤖 Chat Bot
- Chat với Happy Bot bằng tiếng Việt hoặc tiếng Anh
- Hỗ trợ quản lý task, timer, và học tập
- Lưu lịch sử chat

### 📋 Task Management
- Tạo, chỉnh sửa, xóa task
- Phân loại theo priority (high, medium, low)
- Đặt deadline và category
- Theo dõi tiến độ hoàn thành

### ⏰ Pomodoro Timer
- Timer 25 phút theo phương pháp Pomodoro
- Theo dõi thống kê thời gian làm việc
- Lưu session vào database

### 📚 Learning Tools
- Flashcards tiếng Anh
- Quiz công nghệ
- Theo dõi tiến độ học tập
- Gợi ý bài học hàng ngày

## API Endpoints

### Bot Chat
- `POST /api/bot/chat` - Chat với bot
- `GET /api/bot/history/:userId` - Lấy lịch sử chat
- `GET /api/bot/info` - Thông tin bot

### Tasks
- `GET /api/tasks` - Lấy danh sách task
- `POST /api/tasks` - Tạo task mới
- `PUT /api/tasks/:id` - Cập nhật task
- `DELETE /api/tasks/:id` - Xóa task
- `POST /api/tasks/:id/complete` - Hoàn thành task
- `GET /api/tasks/stats` - Thống kê task

### Timer
- `GET /api/timer/current` - Timer hiện tại
- `POST /api/timer/start` - Bắt đầu timer
- `POST /api/timer/stop` - Dừng timer
- `GET /api/timer/stats` - Thống kê timer
- `GET /api/timer/sessions` - Lịch sử session

### Learning
- `GET /api/learning/progress` - Tiến độ học tập
- `POST /api/learning/progress` - Cập nhật tiến độ
- `GET /api/learning/flashcards` - Flashcards
- `POST /api/learning/flashcards` - Thêm flashcard
- `GET /api/learning/quiz` - Quiz
- `GET /api/learning/suggestions` - Gợi ý học tập
- `GET /api/learning/stats` - Thống kê học tập

## Cấu trúc dự án

```
happy-bot/
├── src/
│   ├── index.js              # Entry point
│   ├── bot/
│   │   └── happyBot.js       # Logic chatbot
│   ├── database/
│   │   └── database.js       # Database setup
│   └── routes/
│       ├── bot.js            # Bot API routes
│       ├── tasks.js          # Task API routes
│       ├── timer.js          # Timer API routes
│       └── learning.js       # Learning API routes
├── public/
│   ├── index.html            # Frontend HTML
│   ├── styles.css            # CSS styles
│   └── app.js               # Frontend JavaScript
├── data/                     # Database files
├── package.json              # Dependencies
├── README.md                 # Documentation
└── SETUP.md                 # Setup guide
```

## Troubleshooting

### Lỗi "command not found: npm"
- Cài đặt Node.js trước
- Kiểm tra PATH environment variable

### Lỗi database
- Đảm bảo thư mục `data/` có quyền ghi
- Xóa file database cũ nếu cần: `rm data/happy_bot.db`

### Lỗi port đã được sử dụng
- Thay đổi PORT trong file .env
- Hoặc kill process đang sử dụng port 3000

### Lỗi CORS
- Ứng dụng đã được cấu hình CORS cho development
- Kiểm tra URL trong frontend

## Phát triển thêm

### Thêm tính năng mới
1. Tạo route mới trong `src/routes/`
2. Thêm logic trong bot nếu cần
3. Cập nhật frontend trong `public/`
4. Thêm database schema nếu cần

### Customize giao diện
- Chỉnh sửa `public/styles.css`
- Thêm theme mới
- Tùy chỉnh components

### Deploy
- Sử dụng PM2: `npm install -g pm2 && pm2 start src/index.js`
- Hoặc Docker: tạo Dockerfile
- Deploy lên VPS hoặc cloud platform 