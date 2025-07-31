# Happy Bot 🤖✨

Một chatbot thông minh giúp bạn quản lý task hàng ngày, theo dõi thời gian và học tập hiệu quả.

## Tính năng chính

### 📋 Quản lý Task
- Tạo, chỉnh sửa, xóa task
- Đặt deadline và priority
- Theo dõi tiến độ hoàn thành
- Phân loại task theo danh mục

### ⏰ Quản lý Thời gian
- Pomodoro timer
- Theo dõi thời gian làm việc
- Thống kê productivity
- Nhắc nhở và lịch trình

### 📚 Học tập
- Flashcards cho học tiếng Anh
- Quiz về công nghệ
- Theo dõi tiến độ học tập
- Gợi ý bài học hàng ngày

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Cấu trúc dự án

```
happy-bot/
├── src/
│   ├── index.js          # Entry point
│   ├── bot/              # Bot logic
│   ├── database/         # Database models
│   ├── routes/           # API routes
│   └── utils/            # Utilities
├── public/               # Frontend files
└── data/                 # Database files
```

## API Endpoints

- `GET /api/tasks` - Lấy danh sách task
- `POST /api/tasks` - Tạo task mới
- `PUT /api/tasks/:id` - Cập nhật task
- `DELETE /api/tasks/:id` - Xóa task
- `GET /api/timer` - Lấy thông tin timer
- `POST /api/timer/start` - Bắt đầu timer
- `GET /api/learning` - Lấy bài học
- `POST /api/learning/progress` - Cập nhật tiến độ học tập 