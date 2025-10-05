import express from 'express';
import cors from 'cors';
import { db } from './database';
import { User, TelegramUser } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер жив!' });
});

app.post('/auth/telegram', (req, res) => {
  try {
    const telegramUser: TelegramUser = req.body;

    if (!telegramUser.id || !telegramUser.first_name) {
      return res.status(400).json({ error: 'Невалидные данные от Telegram' });
    }

    const user: User = {
      ...telegramUser,
      bio: 'Привет! Я новый пользователь.',
    };
    db.saveUser(user);

    res.json({ user });
  } catch (error) {
    console.error('Ошибка в /auth/telegram:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.get('/profile/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const user = db.findUserById(userId);

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  res.json({ user });
});

app.patch('/profile/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const updates = req.body;

  const existingUser = db.findUserById(userId);
  if (!existingUser) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const updatedUser: User = {
    ...existingUser,
    bio: updates.bio || existingUser.bio,
  };
  db.saveUser(updatedUser);

  res.json({ user: updatedUser });
});

app.listen(PORT, () => {
  console.log(`🚀 Бэкенд-сервер запущен на порту ${PORT}`);
});