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
    message: 'Сервер работает'
  });
});

// Авторизация через Telegram
app.post('/auth/telegram', (req, res) => {
  try {
    const telegramUser = req.body;

    if (!telegramUser.id || !telegramUser.first_name) {
      return res.status(400).json({ 
        error: 'Невалидные данные от Telegram'
      });
    }

    const existingUser = users.get(telegramUser.id);
    
    const userData = {
      ...telegramUser,
      bio: existingUser?.bio || 'Редактируйте ваш профиль'
    };

    users.set(telegramUser.id, userData);

    res.json({ 
      user: userData 
    });

  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Получить профиль
app.get('/profile/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ 
      user 
    });

  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Обновить профиль
app.patch('/profile/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const updatedUser = {
      ...user,
      bio: req.body.bio || user.bio
    };

    users.set(userId, updatedUser);
    
    res.json({ 
      user: updatedUser 
    });

  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});