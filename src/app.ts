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

    const hasAccess = !!user;
    
    res.json({ 
      success: true,
      hasAccess,
      user: user || null,
      isActive: user?.is_active || false
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

// Получить уникальные теги
app.get('/events/tags/:telegramId', async (req, res) => {
  try {
    const telegramId = req.params.telegramId;
    
    // Проверяем активность пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_active')
      .eq('telegram_id', telegramId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Для просмотра событий нужна реферальная ссылка'
      });
    }

    // Получаем текущую дату для фильтрации
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Получаем все теги из активных событий
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('tags')
      .gte('date', today.toISOString().split('T')[0]);

    if (eventsError) {
      throw eventsError;
    }

    // Извлекаем уникальные теги
    const allTags = events.flatMap(event => event.tags || []);
    const uniqueTags = [...new Set(allTags)].filter(Boolean).sort();
    
    res.json({ 
      success: true,
      tags: uniqueTags
    });

  } catch (error) {
    console.error('Ошибка в /events/tags/:telegramId:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить события с пагинацией и фильтрацией по тегам
app.get('/events/:telegramId', async (req, res) => {
  try {
    const telegramId = req.params.telegramId;
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 20;
    const tags = req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : [];
    
    // Проверяем активность пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_active')
      .eq('telegram_id', telegramId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Для просмотра событий нужна реферальная ссылка',
        hasAccess: false
      });
    }

    // Получаем текущую дату для фильтрации
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Базовый запрос
    let query = supabase
      .from('events')
      .select('*')
      .gte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .range(page * limit, (page + 1) * limit - 1);

    // Применяем фильтры по тегам
    if (tags.length > 0) {
      query = query.contains('tags', tags);
    }

    const { data: events, error: eventsError } = await query;

    if (eventsError) {
      throw eventsError;
    }

    res.json({ 
      success: true,
      events: events || [],
      hasAccess: true
    });

  } catch (error) {
    console.error('Ошибка в /events/:telegramId:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получить детали события
app.get('/events/detail/:eventId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }

    res.json({ 
      success: true,
      event 
    });

  } catch (error) {
    console.error('Ошибка в /events/detail/:eventId:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Бэкенд-сервер запущен на порту ${PORT}`);
});