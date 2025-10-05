import express from 'express';
import cors from 'cors';
import { db } from './database';
import { User, TelegramUser } from './types';

// Создаем Express приложение
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware (промежуточное ПО)
app.use(cors()); // Разрешаем запросы с любых источников (для разработки)
app.use(express.json()); // Позволяет серверу читать JSON из тела запроса

// ==================== РОУТЫ (Маршруты) ====================

// Роут для здоровья сервера (проверка, что он работает)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер жив!' });
});

// Роут для входа через Telegram
// В реальности здесь должна быть проверка хэша данных от Telegram для безопасности
app.post('/auth/telegram', (req, res) => {
  try {
    // Данные, которые пришли от фронтенда (от Telegram Web App)
    const telegramUser: TelegramUser = req.body;

    // Проверяем, что обязательные поля есть
    if (!telegramUser.id || !telegramUser.first_name) {
      return res.status(400).json({ error: 'Невалидные данные от Telegram' });
    }

    // Создаем или обновляем пользователя в нашей "базе"
    const user: User = {
      ...telegramUser,
      // Можно добавить дефолтные значения для своих полей
      bio: 'Привет! Я новый пользователь.',
    };
    db.saveUser(user);

    // Возвращаем пользователя клиенту (фронтенду)
    res.json({ user });
  } catch (error) {
    console.error('Ошибка в /auth/telegram:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Роут для получения профиля пользователя
app.get('/profile/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const user = db.findUserById(userId);

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  res.json({ user });
});

// Роут для обновления профиля (например, био)
app.patch('/profile/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const updates = req.body; // { bio: "Новое био..." }

  const existingUser = db.findUserById(userId);
  if (!existingUser) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  // Обновляем только разрешенные поля
  const updatedUser: User = {
    ...existingUser,
    bio: updates.bio || existingUser.bio,
  };
  db.saveUser(updatedUser);

  res.json({ user: updatedUser });
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`🚀 Бэкенд-сервер запущен на порту ${PORT}`);
});