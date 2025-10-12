export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface User extends TelegramUser {
  bio?: string;
  position?: string;
  links?: {
    telegram?: string;
    linkedin?: string;
    vk?: string;
    instagram?: string;
  };
  coins?: number;
  is_active?: boolean;
  referral_code?: string;
  referral_count?: number;
  updated_at?: Date;
}

// ДОБАВЛЕНО: Интерфейс события с геолокацией
export interface Event {
  id: number;
  title: string;
  short_description: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  location_coords?: {
    lat: number;
    lng: number;
  } | null;
  event_type?: string;
  created_at: string;
}