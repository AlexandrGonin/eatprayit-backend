import { User } from './types';

class Database {
  private users: Map<number, User> = new Map();

  findUserById(id: number): User | null {
    return this.users.get(id) || null;
  }

  saveUser(user: User): User {
    const existingUser = this.users.get(user.id);
    const updatedUser: User = {
      ...existingUser,
      ...user,
      updated_at: new Date()
    };
    this.users.set(user.id, updatedUser);
    return updatedUser;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

export const db = new Database();