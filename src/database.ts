import { User } from './types';

const users: Record<number, User> = {};

export const db = {
  findUserById: (id: number): User | null => {
    return users[id] || null;
  },

  saveUser: (user: User): void => {
    users[user.id] = { ...users[user.id], ...user };
  },
};