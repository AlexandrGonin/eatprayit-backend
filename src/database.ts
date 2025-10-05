import { User } from './types';

// В реальном приложении здесь будет подключение к PostgreSQL, MongoDB и т.д.
// Сейчас мы храним пользователей в обычном объекте. При перезапуске сервера все данные пропадут.
const users: Record<number, User> = {}; // Ключ - это ID пользователя Telegram

export const db = {
  // Найти пользователя по ID
  findUserById: (id: number): User | null => {
    return users[id] || null;
  },

  // Сохранить или обновить пользователя
  saveUser: (user: User): void => {
    users[user.id] = { ...users[user.id], ...user };
  },
};