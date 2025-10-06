import express from 'express';
import cors from 'cors';
import { db } from './database';
import { User, TelegramUser } from './types';
import { LinkValidator } from './utils/validation';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Логирование
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает' });
});

// Авторизация через Telegram
app.post('/auth/telegram', (req, res) => {
  try {
    const telegramUser: TelegramUser = req.body;

    if (!telegramUser.id || !telegramUser.first_name) {
      return res.status(400).json({ error: 'Невалидные данные от Telegram' });
    }

    const existingUser = db.findUserById(telegramUser.id);
    
    // Создаем пользователя с дефолтными значениями
    const userData: User = {
      ...telegramUser,
      bio: existingUser?.bio || '',
      position: existingUser?.position || '',
      links: existingUser?.links || {
        telegram: '',
        linkedin: '',
        vk: '',
        instagram: ''
      },
      updated_at: new Date()
    };

    const savedUser = db.saveUser(userData);
    
    res.json({ 
      success: true,
      user: savedUser 
    });

  } catch (error) {
    console.error('Ошибка в /auth/telegram:', error);
    const errorMessage = error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    res.status(500).json({ error: errorMessage });
  }
});

// Получить профиль
app.get('/profile/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const user = db.findUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ 
      success: true,
      user 
    });

  } catch (error) {
    console.error('Ошибка в /profile/:userId:', error);
    const errorMessage = error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    res.status(500).json({ error: errorMessage });
  }
});

// Обновить профиль
app.patch('/profile/:userId', (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const updates = req.body;

    const existingUser = db.findUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Валидируем ссылки
    let validatedLinks = existingUser.links || {};
    if (updates.telegram || updates.linkedin || updates.vk || updates.instagram) {
      const linksToValidate = {
        telegram: updates.telegram !== undefined ? updates.telegram : existingUser.links?.telegram,
        linkedin: updates.linkedin !== undefined ? updates.linkedin : existingUser.links?.linkedin,
        vk: updates.vk !== undefined ? updates.vk : existingUser.links?.vk,
        instagram: updates.instagram !== undefined ? updates.instagram : existingUser.links?.instagram
      };
      
      validatedLinks = LinkValidator.validateUserLinks(linksToValidate);
    }

    // Обновляем пользователя
    const updatedUser: User = {
      ...existingUser,
      bio: updates.bio !== undefined ? updates.bio : existingUser.bio,
      position: updates.position !== undefined ? updates.position : existingUser.position,
      links: validatedLinks,
      updated_at: new Date()
    };

    const savedUser = db.saveUser(updatedUser);
    
    res.json({ 
      success: true,
      user: savedUser 
    });

  } catch (error) {
    console.error('Ошибка в /profile/:userId PATCH:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    res.status(400).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Бэкенд-сервер запущен на порту ${PORT}`);
});