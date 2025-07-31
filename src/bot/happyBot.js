const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const db = require('../database/database');

class HappyBot {
  constructor() {
    this.name = "Happy Bot";
    this.version = "2.0.0";
    this.supportedLanguages = ['vi', 'en', 'ja', 'ko', 'zh'];
    this.currentLanguage = 'vi';
    
    // Multi-language greetings
    this.greetings = {
      vi: [
        "Xin chào! Tôi là Happy Bot, rất vui được gặp bạn! 😊",
        "Chào bạn! Tôi là Happy Bot, sẵn sàng giúp bạn quản lý task và học tập! ✨",
        "Hi there! I'm Happy Bot, ready to help you stay productive and learn! 🚀"
      ],
      en: [
        "Hello! I'm Happy Bot, nice to meet you! 😊",
        "Hi there! I'm Happy Bot, ready to help you manage tasks and learn! ✨",
        "Greetings! I'm Happy Bot, your productivity assistant! 🚀"
      ],
      ja: [
        "こんにちは！私はHappy Botです。よろしくお願いします！😊",
        "ハイ！私はHappy Botです。タスク管理と学習をお手伝いします！✨",
        "こんにちは！Happy Botです。生産性向上をお手伝いします！🚀"
      ],
      ko: [
        "안녕하세요! 저는 Happy Bot입니다. 만나서 반갑습니다! 😊",
        "안녕! 저는 Happy Bot입니다. 작업 관리와 학습을 도와드리겠습니다! ✨",
        "안녕하세요! Happy Bot입니다. 생산성 향상을 도와드리겠습니다! 🚀"
      ],
      zh: [
        "你好！我是Happy Bot，很高兴见到你！😊",
        "嗨！我是Happy Bot，随时准备帮你管理任务和学习！✨",
        "你好！我是Happy Bot，你的生产力助手！🚀"
      ]
    };

    // Smart responses based on context
    this.contextResponses = {
      vi: {
        morning: "Chào buổi sáng! Hôm nay bạn có kế hoạch gì không? 🌅",
        afternoon: "Chào buổi chiều! Bạn đã hoàn thành task nào chưa? ☀️",
        evening: "Chào buổi tối! Hãy nghỉ ngơi và chuẩn bị cho ngày mai nhé! 🌙",
        weekend: "Cuối tuần rồi! Đây là thời gian tốt để học tập và thư giãn! 🎉",
        motivation: "Bạn đang làm rất tốt! Hãy tiếp tục phấn đấu! 💪",
        tired: "Có vẻ bạn hơi mệt. Hãy nghỉ ngơi một chút và uống nước nhé! 💧"
      },
      en: {
        morning: "Good morning! What's your plan for today? 🌅",
        afternoon: "Good afternoon! Have you completed any tasks yet? ☀️",
        evening: "Good evening! Time to rest and prepare for tomorrow! 🌙",
        weekend: "It's weekend! Great time for learning and relaxation! 🎉",
        motivation: "You're doing great! Keep up the good work! 💪",
        tired: "You seem tired. Take a break and drink some water! 💧"
      }
    };

    // Learning progress tracking
    this.learningTopics = {
      vi: ['Tiếng Anh', 'Công nghệ', 'Kỹ năng mềm', 'Lập trình'],
      en: ['English', 'Technology', 'Soft Skills', 'Programming'],
      ja: ['英語', 'テクノロジー', 'ソフトスキル', 'プログラミング'],
      ko: ['영어', '기술', '소프트 스킬', '프로그래밍'],
      zh: ['英语', '技术', '软技能', '编程']
    };
  }

  async processMessage(message, userId = 'default') {
    const lowerMessage = message.toLowerCase();
    
    // Detect language
    this.detectLanguage(message);
    
    // Save user message to history
    await this.saveChatHistory(userId, message, '');

    let response = '';

    // Smart context detection
    const context = this.detectContext();
    
    // Greeting patterns with language support
    if (this.isGreeting(lowerMessage)) {
      response = this.getContextualGreeting(context);
    }
    // Language switching
    else if (this.isLanguageSwitch(lowerMessage)) {
      response = this.handleLanguageSwitch(message);
    }
    // Task management with smart suggestions
    else if (lowerMessage.includes('task') || lowerMessage.includes('công việc') || lowerMessage.includes('タスク') || lowerMessage.includes('작업') || lowerMessage.includes('任务')) {
      response = await this.handleTaskManagement(message, userId);
    }
    // Timer/Pomodoro with smart reminders
    else if (lowerMessage.includes('timer') || lowerMessage.includes('pomodoro') || lowerMessage.includes('thời gian') || lowerMessage.includes('タイマー') || lowerMessage.includes('타이머') || lowerMessage.includes('计时器')) {
      response = await this.handleTimer(message, userId);
    }
    // Learning with personalized recommendations
    else if (lowerMessage.includes('học') || lowerMessage.includes('learn') || lowerMessage.includes('english') || lowerMessage.includes('tiếng anh') || lowerMessage.includes('学習') || lowerMessage.includes('학습') || lowerMessage.includes('学习')) {
      response = await this.handleLearning(message, userId);
    }
    // Smart help system
    else if (lowerMessage.includes('help') || lowerMessage.includes('giúp') || lowerMessage.includes('hướng dẫn') || lowerMessage.includes('ヘルプ') || lowerMessage.includes('도움') || lowerMessage.includes('帮助')) {
      response = this.getSmartHelpMessage();
    }
    // Status with insights
    else if (lowerMessage.includes('status') || lowerMessage.includes('tiến độ') || lowerMessage.includes('progress') || lowerMessage.includes('状況') || lowerMessage.includes('상태') || lowerMessage.includes('状态')) {
      response = await this.getSmartStatus(userId);
    }
    // Mood detection and emotional support
    else if (this.detectMood(lowerMessage)) {
      response = this.getEmotionalSupport(lowerMessage);
    }
    // Smart suggestions based on time and context
    else if (lowerMessage.includes('gợi ý') || lowerMessage.includes('suggestion') || lowerMessage.includes('提案') || lowerMessage.includes('제안') || lowerMessage.includes('建议')) {
      response = await this.getSmartSuggestions(userId);
    }
    // Default intelligent response
    else {
      response = this.getIntelligentDefaultResponse(lowerMessage, context);
    }

    // Save bot response to history
    await this.saveChatHistory(userId, message, response);

    return response;
  }

  detectLanguage(message) {
    // Simple language detection based on common words
    const languagePatterns = {
      vi: ['xin chào', 'cảm ơn', 'tạm biệt', 'làm gì', 'thế nào'],
      en: ['hello', 'thank you', 'goodbye', 'what', 'how'],
      ja: ['こんにちは', 'ありがとう', 'さようなら', '何', 'どう'],
      ko: ['안녕하세요', '감사합니다', '안녕히 가세요', '무엇', '어떻게'],
      zh: ['你好', '谢谢', '再见', '什么', '怎么']
    };

    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      if (patterns.some(pattern => message.toLowerCase().includes(pattern))) {
        this.currentLanguage = lang;
        break;
      }
    }
  }

  detectContext() {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    if (day === 0 || day === 6) return 'weekend';
    return 'normal';
  }

  detectMood(message) {
    const positiveWords = ['vui', 'happy', 'tốt', 'good', 'tuyệt', 'great', 'excellent'];
    const negativeWords = ['buồn', 'sad', 'mệt', 'tired', 'khó', 'difficult', 'stress'];
    const tiredWords = ['mệt', 'tired', 'kiệt sức', 'exhausted', 'mỏi', 'weary'];
    
    const lowerMsg = message.toLowerCase();
    
    if (tiredWords.some(word => lowerMsg.includes(word))) return 'tired';
    if (negativeWords.some(word => lowerMsg.includes(word))) return 'negative';
    if (positiveWords.some(word => lowerMsg.includes(word))) return 'positive';
    
    return null;
  }

  isGreeting(message) {
    const greetings = {
      vi: ['hello', 'hi', 'xin chào', 'chào', 'hey', 'good morning', 'good afternoon', 'good evening'],
      en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      ja: ['こんにちは', 'こんばんは', 'おはよう', 'hi', 'hello'],
      ko: ['안녕하세요', '안녕', 'hi', 'hello'],
      zh: ['你好', '嗨', 'hi', 'hello']
    };
    
    const currentGreetings = greetings[this.currentLanguage] || greetings.en;
    return currentGreetings.some(greeting => message.includes(greeting));
  }

  isLanguageSwitch(message) {
    const languageCommands = {
      vi: ['tiếng việt', 'vietnamese', 'việt nam'],
      en: ['english', 'tiếng anh', 'inglés'],
      ja: ['japanese', 'tiếng nhật', '日本語'],
      ko: ['korean', 'tiếng hàn', '한국어'],
      zh: ['chinese', 'tiếng trung', '中文']
    };

    for (const [lang, commands] of Object.entries(languageCommands)) {
      if (commands.some(cmd => message.toLowerCase().includes(cmd))) {
        return lang;
      }
    }
    return null;
  }

  getContextualGreeting(context) {
    const greetings = this.greetings[this.currentLanguage] || this.greetings.en;
    const contextualResponse = this.contextResponses[this.currentLanguage]?.[context];
    
    if (contextualResponse) {
      return `${greetings[Math.floor(Math.random() * greetings.length)]}\n\n${contextualResponse}`;
    }
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  handleLanguageSwitch(message) {
    const targetLang = this.isLanguageSwitch(message);
    if (targetLang && this.supportedLanguages.includes(targetLang)) {
      this.currentLanguage = targetLang;
      const languageNames = {
        vi: 'Tiếng Việt',
        en: 'English',
        ja: '日本語',
        ko: '한국어',
        zh: '中文'
      };
      return `✅ Đã chuyển sang ${languageNames[targetLang]}!\n\n${this.getContextualGreeting(this.detectContext())}`;
    }
    return this.getContextualGreeting(this.detectContext());
  }

  getEmotionalSupport(message) {
    const mood = this.detectMood(message);
    const supportMessages = {
      vi: {
        tired: "Tôi hiểu bạn đang mệt mỏi. Hãy nghỉ ngơi một chút, uống nước và thở sâu. Bạn đang làm rất tốt! 💧✨",
        negative: "Mọi thứ sẽ ổn thôi! Hãy nhớ rằng mỗi ngày là một cơ hội mới. Bạn có thể chia sẻ thêm với tôi không? 🤗",
        positive: "Tuyệt vời! Tôi rất vui khi thấy bạn có tâm trạng tốt. Hãy duy trì năng lượng tích cực này! 🌟"
      },
      en: {
        tired: "I understand you're tired. Take a break, drink some water, and take deep breaths. You're doing great! 💧✨",
        negative: "Everything will be okay! Remember that each day is a new opportunity. Would you like to share more with me? 🤗",
        positive: "Wonderful! I'm glad to see you're in a good mood. Keep up this positive energy! 🌟"
      }
    };

    const messages = supportMessages[this.currentLanguage] || supportMessages.en;
    return messages[mood] || messages.positive;
  }

  async getSmartSuggestions(userId) {
    const hour = new Date().getHours();
    const suggestions = {
      vi: {
        morning: "🌅 Buổi sáng là thời gian tốt nhất để:\n• Lập kế hoạch cho ngày\n• Học từ vựng tiếng Anh\n• Tập trung vào task quan trọng",
        afternoon: "☀️ Buổi chiều nên:\n• Review các task đã hoàn thành\n• Học công nghệ mới\n• Chuẩn bị cho ngày mai",
        evening: "🌙 Buổi tối hãy:\n• Tổng kết những gì đã làm\n• Thư giãn và đọc sách\n• Chuẩn bị cho ngày mai"
      },
      en: {
        morning: "🌅 Morning is the best time to:\n• Plan your day\n• Learn English vocabulary\n• Focus on important tasks",
        afternoon: "☀️ Afternoon should be for:\n• Review completed tasks\n• Learn new technology\n• Prepare for tomorrow",
        evening: "🌙 Evening activities:\n• Summarize what you've done\n• Relax and read\n• Prepare for tomorrow"
      }
    };

    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const currentSuggestions = suggestions[this.currentLanguage] || suggestions.en;
    
    return currentSuggestions[timeOfDay];
  }

  getIntelligentDefaultResponse(message, context) {
    // Analyze message for better understanding
    const hasQuestion = message.includes('?') || message.includes('gì') || message.includes('what') || message.includes('how');
    const hasTime = message.includes('khi nào') || message.includes('when') || message.includes('lúc nào');
    const hasProblem = message.includes('vấn đề') || message.includes('problem') || message.includes('khó khăn');

    if (hasQuestion) {
      return this.getContextualGreeting(context) + "\n\nTôi có thể giúp bạn:\n• Quản lý task\n• Timer Pomodoro\n• Học tập\n• Theo dõi tiến độ\n\nHãy cho tôi biết bạn cần gì!";
    }

    if (hasTime) {
      return "⏰ Thời gian hiện tại: " + new Date().toLocaleTimeString('vi-VN') + "\n\nBạn muốn lập lịch cho task nào không?";
    }

    if (hasProblem) {
      return "🤗 Tôi hiểu bạn đang gặp khó khăn. Hãy chia sẻ chi tiết hơn, tôi sẽ cố gắng giúp bạn tìm giải pháp!";
    }

    // Default intelligent response
    const responses = {
      vi: [
        "Tôi hiểu ý bạn. Hãy nói 'help' để xem tôi có thể giúp gì! 🤔",
        "Bạn có thể nói 'help' để xem hướng dẫn chi tiết! 💡",
        "Tôi là Happy Bot, chuyên về quản lý task, timer và học tập. Hãy nói 'help' để biết thêm! ✨",
        "Không hiểu rõ ý bạn. Hãy thử nói 'help' để xem tôi có thể làm gì nhé! 😊"
      ],
      en: [
        "I understand. Say 'help' to see what I can do! 🤔",
        "You can say 'help' to see detailed instructions! 💡",
        "I'm Happy Bot, specializing in task management, timer and learning. Say 'help' to learn more! ✨",
        "Not sure what you mean. Try saying 'help' to see what I can do! 😊"
      ]
    };

    const currentResponses = responses[this.currentLanguage] || responses.en;
    return currentResponses[Math.floor(Math.random() * currentResponses.length)];
  }

  getSmartHelpMessage() {
    const helpMessages = {
      vi: `🤖 Happy Bot - Hướng dẫn thông minh\n\n📋 Quản lý Task:\n• "Tạo task: [tên] - [mô tả] - [deadline] - [priority]"\n• "Xem danh sách task"\n• "Hoàn thành task [ID]"\n\n⏰ Timer:\n• "Bắt đầu pomodoro"\n• "Bắt đầu timer [số phút]"\n• "Dừng timer"\n• "Xem thống kê timer"\n\n📚 Học tập:\n• "Flashcard"\n• "Quiz"\n• "Xem tiến độ học tập"\n\n🌍 Đa ngôn ngữ:\n• "Tiếng Việt" / "English" / "日本語" / "한국어" / "中文"\n\n📊 Khác:\n• "Status" - Xem tổng quan\n• "Gợi ý" - Đề xuất thông minh\n• "Help" - Hướng dẫn này\n\n💡 Tip: Tôi hiểu tiếng Việt, Anh, Nhật, Hàn, Trung!`,
      en: `🤖 Happy Bot - Smart Guide\n\n📋 Task Management:\n• "Create task: [name] - [description] - [deadline] - [priority]"\n• "View task list"\n• "Complete task [ID]"\n\n⏰ Timer:\n• "Start pomodoro"\n• "Start timer [minutes]"\n• "Stop timer"\n• "View timer stats"\n\n📚 Learning:\n• "Flashcard"\n• "Quiz"\n• "View learning progress"\n\n🌍 Multi-language:\n• "Tiếng Việt" / "English" / "日本語" / "한국어" / "中文"\n\n📊 Others:\n• "Status" - Overview\n• "Suggestions" - Smart recommendations\n• "Help" - This guide\n\n💡 Tip: I understand Vietnamese, English, Japanese, Korean, Chinese!`
    };

    return helpMessages[this.currentLanguage] || helpMessages.en;
  }

  async getSmartStatus(userId) {
    return new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as pending_tasks FROM tasks WHERE status = 'pending'", (err, taskRow) => {
        if (err) {
          resolve("❌ Có lỗi khi lấy thông tin status");
        } else {
          db.get("SELECT COUNT(*) as today_sessions FROM timer_sessions WHERE date(created_at) = date('now')", (err, timerRow) => {
            if (err) {
              resolve("❌ Có lỗi khi lấy thông tin status");
            } else {
              const pendingTasks = taskRow.pending_tasks || 0;
              const todaySessions = timerRow.today_sessions || 0;
              
              const statusMessages = {
                vi: `📊 Status thông minh hôm nay:\n\n📝 Task đang chờ: ${pendingTasks}\n⏰ Session hôm nay: ${todaySessions}\n🎯 Mục tiêu: Hoàn thành ${pendingTasks} task và ${Math.max(4 - todaySessions, 0)} session nữa!\n\n💡 Gợi ý: ${this.getSmartSuggestion(pendingTasks, todaySessions)}`,
                en: `📊 Smart Status Today:\n\n📝 Pending tasks: ${pendingTasks}\n⏰ Today's sessions: ${todaySessions}\n🎯 Goal: Complete ${pendingTasks} tasks and ${Math.max(4 - todaySessions, 0)} more sessions!\n\n💡 Suggestion: ${this.getSmartSuggestion(pendingTasks, todaySessions)}`
              };
              
              resolve(statusMessages[this.currentLanguage] || statusMessages.en);
            }
          });
        }
      });
    });
  }

  getSmartSuggestion(pendingTasks, todaySessions) {
    if (pendingTasks === 0) return "Tuyệt vời! Bạn đã hoàn thành tất cả task. Hãy tạo task mới hoặc học tập!";
    if (todaySessions === 0) return "Bắt đầu Pomodoro session đầu tiên hôm nay để tăng năng suất!";
    if (pendingTasks > 5) return "Có nhiều task đang chờ. Hãy ưu tiên task quan trọng nhất!";
    if (todaySessions < 2) return "Cố gắng hoàn thành thêm 2-3 Pomodoro session nữa!";
    return "Bạn đang làm rất tốt! Hãy duy trì momentum này!";
  }

  async handleTaskManagement(message, userId) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('tạo') || lowerMessage.includes('add') || lowerMessage.includes('new')) {
      return "Để tạo task mới, hãy sử dụng format: 'Tạo task: [tên task] - [mô tả] - [deadline] - [priority]'\nVí dụ: 'Tạo task: Học React - Học hooks và state management - 2024-01-15 - high'";
    }
    else if (lowerMessage.includes('danh sách') || lowerMessage.includes('list') || lowerMessage.includes('xem')) {
      return await this.getTaskList(userId);
    }
    else if (lowerMessage.includes('hoàn thành') || lowerMessage.includes('complete')) {
      return "Để đánh dấu task hoàn thành, hãy nói: 'Hoàn thành task [ID]'";
    }
    else {
      return "Tôi có thể giúp bạn:\n- Tạo task mới\n- Xem danh sách task\n- Đánh dấu task hoàn thành\n- Xóa task\nHãy cho tôi biết bạn muốn làm gì!";
    }
  }

  async handleTimer(message, userId) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('bắt đầu') || lowerMessage.includes('start')) {
      return "Để bắt đầu Pomodoro timer, hãy nói: 'Bắt đầu timer [số phút]' hoặc 'Start pomodoro'";
    }
    else if (lowerMessage.includes('dừng') || lowerMessage.includes('stop')) {
      return "Để dừng timer, hãy nói: 'Dừng timer'";
    }
    else if (lowerMessage.includes('thống kê') || lowerMessage.includes('stats')) {
      return await this.getTimerStats(userId);
    }
    else {
      return "Tôi có thể giúp bạn:\n- Bắt đầu Pomodoro timer (25 phút)\n- Bắt đầu custom timer\n- Dừng timer\n- Xem thống kê thời gian\nHãy cho tôi biết bạn muốn làm gì!";
    }
  }

  async handleLearning(message, userId) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('flashcard') || lowerMessage.includes('thẻ')) {
      return await this.getFlashcard(userId);
    }
    else if (lowerMessage.includes('quiz') || lowerMessage.includes('câu hỏi')) {
      return await this.getQuiz();
    }
    else if (lowerMessage.includes('tiến độ') || lowerMessage.includes('progress')) {
      return await this.getLearningProgress(userId);
    }
    else {
      return "Tôi có thể giúp bạn học tập:\n- Flashcards tiếng Anh\n- Quiz công nghệ\n- Theo dõi tiến độ học tập\n- Gợi ý bài học hàng ngày\nHãy cho tôi biết bạn muốn học gì!";
    }
  }

  async getTaskList(userId) {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM tasks WHERE status != 'completed' ORDER BY priority DESC, created_at DESC", (err, rows) => {
        if (err) {
          resolve("❌ Có lỗi khi lấy danh sách task");
        } else {
          if (rows.length === 0) {
            resolve("📝 Bạn chưa có task nào. Hãy tạo task mới nhé!");
          } else {
            let response = "📋 Danh sách task của bạn:\n\n";
            rows.forEach((task, index) => {
              const priority = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
              const status = task.status === 'pending' ? '⏳' : '🔄';
              response += `${index + 1}. ${priority} ${task.title}\n`;
              response += `   📝 ${task.description || 'Không có mô tả'}\n`;
              response += `   ${status} Status: ${task.status}\n`;
              if (task.deadline) {
                response += `   📅 Deadline: ${task.deadline}\n`;
              }
              response += `   🆔 ID: ${task.id}\n\n`;
            });
            resolve(response);
          }
        }
      });
    });
  }

  async getTimerStats(userId) {
    return new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as total_sessions, SUM(duration) as total_duration FROM timer_sessions WHERE user_id = ?", [userId], (err, row) => {
        if (err) {
          resolve("❌ Có lỗi khi lấy thống kê timer");
        } else {
          const totalSessions = row.total_sessions || 0;
          const totalMinutes = Math.floor((row.total_duration || 0) / 60);
          const totalHours = Math.floor(totalMinutes / 60);
          const remainingMinutes = totalMinutes % 60;
          
          resolve(`⏰ Thống kê thời gian làm việc:\n\n📊 Tổng số session: ${totalSessions}\n⏱️ Tổng thời gian: ${totalHours}h ${remainingMinutes}m\n🎯 Trung bình: ${totalSessions > 0 ? Math.floor(totalMinutes / totalSessions) : 0}m/session`);
        }
      });
    });
  }

  async getFlashcard(userId) {
    const flashcards = [
      { front: "Hello", back: "Xin chào" },
      { front: "Goodbye", back: "Tạm biệt" },
      { front: "Thank you", back: "Cảm ơn" },
      { front: "You're welcome", back: "Không có gì" },
      { front: "How are you?", back: "Bạn khỏe không?" },
      { front: "I'm fine, thank you", back: "Tôi khỏe, cảm ơn" },
      { front: "What's your name?", back: "Tên bạn là gì?" },
      { front: "My name is...", back: "Tên tôi là..." },
      { front: "Nice to meet you", back: "Rất vui được gặp bạn" },
      { front: "See you later", back: "Hẹn gặp lại" }
    ];
    
    const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
    return `📚 Flashcard tiếng Anh:\n\n🇺🇸 ${randomCard.front}\n\n💡 Nhấn để xem nghĩa tiếng Việt\n\n🇻🇳 ${randomCard.back}`;
  }

  async getQuiz() {
    const quizzes = [
      {
        question: "React là gì?",
        options: ["A. Một ngôn ngữ lập trình", "B. Một framework JavaScript", "C. Một database", "D. Một hệ điều hành"],
        answer: "B. Một framework JavaScript"
      },
      {
        question: "API là viết tắt của gì?",
        options: ["A. Application Programming Interface", "B. Advanced Programming Interface", "C. Application Process Interface", "D. Advanced Process Interface"],
        answer: "A. Application Programming Interface"
      },
      {
        question: "Git là gì?",
        options: ["A. Một ngôn ngữ lập trình", "B. Một hệ quản lý phiên bản", "C. Một database", "D. Một web server"],
        answer: "B. Một hệ quản lý phiên bản"
      }
    ];
    
    const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
    return `🧠 Quiz công nghệ:\n\n❓ ${randomQuiz.question}\n\n${randomQuiz.options.join('\n')}\n\n💡 Đáp án: ${randomQuiz.answer}`;
  }

  async getLearningProgress(userId) {
    return new Promise((resolve, reject) => {
      db.get("SELECT AVG(progress) as avg_progress, COUNT(*) as total_topics FROM learning_progress WHERE user_id = ?", [userId], (err, row) => {
        if (err) {
          resolve("❌ Có lỗi khi lấy tiến độ học tập");
        } else {
          const avgProgress = Math.round(row.avg_progress || 0);
          const totalTopics = row.total_topics || 0;
          
          resolve(`📚 Tiến độ học tập:\n\n📊 Trung bình: ${avgProgress}%\n📖 Số chủ đề: ${totalTopics}\n🎯 Mục tiêu: 100%\n\n💪 Hãy tiếp tục học tập nhé!`);
        }
      });
    });
  }

  async saveChatHistory(userId, message, response) {
    const id = uuidv4();
    db.run("INSERT INTO chat_history (id, user_id, message, response) VALUES (?, ?, ?, ?)", 
      [id, userId, message, response]);
  }
}

module.exports = HappyBot; 