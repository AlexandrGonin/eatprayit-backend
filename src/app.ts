import express from 'express';
import cors from 'cors';
import { db } from './database';
import { User, TelegramUser } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Body:', req.body);
  next();
});

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
  const users = db.getAllUsers();
  res.json({ users });
});

// Авторизация через Telegram
app.post('/auth/telegram', (req, res) => {
  try {
    console.log('🔐 Получен запрос на авторизацию');
    
    const telegramUser: TelegramUser = req.body;

    // Валидация обязательных полей
    if (!telegramUser.id || !telegramUser.first_name) {
      console.log('❌ Невалидные данные:', telegramUser);
      return res.status(400).json({ 
        error: 'Невалидные данные от Telegram',
        received: telegramUser 
      });
    }

    console.log('✅ Валидные данные от пользователя:', telegramUser.id, telegramUser.first_name);

    // Создаем или обновляем пользователя
    const existingUser = db.findUserById(telegramUser.id);
    
    const userData: User = {
      ...telegramUser,
      bio: existingUser?.bio || 'Редактируйте ваш профиль',
      updated_at: new Date()
    };

    const savedUser = db.saveUser(userData);
    
    console.log('✅ Пользователь сохранен:', savedUser.id, savedUser.first_name);

    res.json({ 
      success: true,
      user: savedUser 
    });

  } catch (error) {
    console.error('💥 Ошибка в /auth/telegram:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Получить профиль пользователя
app.get('/profile/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Невалидный ID пользователя' });
    }

    console.log('👤 Запрос профиля для пользователя:', userId);

    const user = db.findUserById(userId);

    if (!user) {
      console.log('❌ Пользователь не найден:', userId);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    console.log('✅ Профиль найден:', user.first_name);

    res.json({ 
      success: true,
      user 
    });

  } catch (error) {
    console.error('💥 Ошибка в /profile/:userId:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Обновить профиль пользователя
app.patch('/profile/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const updates = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Невалидный ID пользователя' });
    }

    console.log('✏️ Запрос на обновление профиля:', userId, updates);

    const existingUser = db.findUserById(userId);

    if (!existingUser) {
      console.log('❌ Пользователь не найден для обновления:', userId);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Разрешаем обновлять только определенные поля
    const allowedUpdates = ['bio'];
    const filteredUpdates: Partial<User> = {};

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        (filteredUpdates as any)[field] = updates[field];
      }
    });

    const updatedUser: User = {
      ...existingUser,
      ...filteredUpdates,
      updated_at: new Date()
    };

    const savedUser = db.saveUser(updatedUser);
    
    console.log('✅ Профиль обновлен:', savedUser.first_name);

    res.json({ 
      success: true,
      user: savedUser 
    });

  } catch (error) {
    console.error('💥 Ошибка в /profile/:userId PATCH:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Обработка несуществующих роутов
app.use('*', (req, res) => {
  console.log('❌ Запрос к несуществующему роуту:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Роут не найден',
    path: req.originalUrl 
  });
});

// Обработка ошибок
app.use((error: any, req: any, res: any, next: any) => {
  console.error('💥 Необработанная ошибка:', error);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log('🚀 Бэкенд сервер запущен!');
  console.log(`📍 Порт: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Все пользователи: http://localhost:${PORT}/users`);
});