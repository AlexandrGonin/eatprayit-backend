import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory база
const users = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Сервер работает',
    timestamp: new Date().toISOString()
  });
});

// Получить всех пользователей (для отладки)
app.get('/users', (req, res) => {
  const usersArray = Array.from(users.values());
  res.json({ users: usersArray });
});

// Авторизация через Telegram
app.post('/auth/telegram', (req, res) => {
  try {
    console.log('🔐 Получен запрос на авторизацию');
    
    const telegramUser = req.body;

    if (!telegramUser.id || !telegramUser.first_name) {
      return res.status(400).json({ 
        error: 'Невалидные данные от Telegram'
      });
    }

    const existingUser = users.get(telegramUser.id);
    
    const userData = {
      ...telegramUser,
      bio: existingUser?.bio || 'Редактируйте ваш профиль',
      updated_at: new Date()
    };

    users.set(telegramUser.id, userData);
    
    console.log('✅ Пользователь сохранен:', userData.id, userData.first_name);

    res.json({ 
      success: true,
      user: userData 
    });

  } catch (error) {
    console.error('💥 Ошибка:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Получить профиль
app.get('/profile/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Невалидный ID пользователя' });
    }

    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ 
      success: true,
      user 
    });

  } catch (error) {
    console.error('💥 Ошибка:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Обновить профиль
app.patch('/profile/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const updates = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Невалидный ID пользователя' });
    }

    const existingUser = users.get(userId);

    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const updatedUser = {
      ...existingUser,
      bio: updates.bio || existingUser.bio,
      updated_at: new Date()
    };

    users.set(userId, updatedUser);
    
    res.json({ 
      success: true,
      user: updatedUser 
    });

  } catch (error) {
    console.error('💥 Ошибка:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('🚀 Бэкенд сервер запущен!');
  console.log(`📍 Порт: ${PORT}`);
});