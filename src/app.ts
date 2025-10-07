import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { LinkValidator } from './utils/validation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase клиент
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает' });
});

// Проверка доступа к Mini App
app.post('/check-access', async (req, res) => {
  try {
    const { telegram_id } = req.body;
    
    if (!telegram_id) {
      return res.status(400).json({ error: 'Не указан telegram_id' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegram_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const hasAccess = !!user && user.is_active;
    
    res.json({ 
      success: true,
      hasAccess,
      user: user || null
    });
    
  } catch (error) {
    console.error('Ошибка проверки доступа:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Авторизация через Telegram
app.post('/auth/telegram', async (req, res) => {
  try {
    const telegramUser = req.body;

    if (!telegramUser.id || !telegramUser.first_name) {
      return res.status(400).json({ error: 'Невалидные данные от Telegram' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!user) {
      return res.status(403).json({ 
        error: 'Пользователь не найден. Зарегистрируйтесь через Telegram бота.' 
      });
    }

    res.json({ 
      success: true,
      user 
    });

  } catch (error) {
    console.error('Ошибка в /auth/telegram:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить профиль
app.get('/profile/:telegramId', async (req, res) => {
  try {
    const telegramId = req.params.telegramId;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ 
      success: true,
      user 
    });

  } catch (error) {
    console.error('Ошибка в /profile/:telegramId:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Обновить профиль
app.patch('/profile/:telegramId', async (req, res) => {
  try {
    const telegramId = req.params.telegramId;
    const updates = req.body;

    // Валидация ссылок
    let validatedLinks = {};
    if (updates.links) {
      validatedLinks = LinkValidator.validateUserLinks(updates.links);
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        bio: updates.bio,
        position: updates.position,
        links: validatedLinks
      })
      .eq('telegram_id', telegramId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json({ 
      success: true,
      user 
    });

  } catch (error) {
    console.error('Ошибка в PATCH /profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Бэкенд-сервер запущен на порту ${PORT}`);
});