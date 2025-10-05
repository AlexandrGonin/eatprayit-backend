// Описываем, как выглядят данные пользователя, пришедшие от Telegram
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string; // ? означает, что поле необязательное
  username?: string;
  photo_url?: string;
}

// Расширяем данные пользователя для нашего приложения
export interface User extends TelegramUser {
  // Здесь можно добавить свои поля, например:
  bio?: string;
}