import { Database } from 'sqlite';
import { User, databaseService } from '@/services/database.service';
import { authService } from '@/auth/auth.service';
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserData {
  username: string;
  email?: string;
  password: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

export interface UserFilter {
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class UserRepository {
  private get db(): Database {
    return databaseService.getDatabase();
  }

  /**
   * Create a new user
   */
  public async create(userData: CreateUserData): Promise<User> {
    try {
      const userId = uuidv4();
      const passwordHash = await authService.hashPassword(userData.password);

      const result = await this.db.run(
        `INSERT INTO users (user_id, username, email, password_hash)
         VALUES (?, ?, ?, ?)`,
        [userId, userData.username, userData.email || null, passwordHash]
      );

      if (!result.lastID) {
        throw new Error('Failed to create user');
      }

      const user = await this.findById(result.lastID);
      if (!user) {
        throw new Error('Failed to retrieve created user');
      }

      logger.info('User created successfully', {
        userId: user.user_id,
        username: user.username,
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Find user by database ID
   */
  public async findById(id: number): Promise<User | null> {
    try {
      const user = await this.db.get<User>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by ID:', error);
      throw error;
    }
  }

  /**
   * Find user by user ID (UUID)
   */
  public async findByUserId(userId: string): Promise<User | null> {
    try {
      const user = await this.db.get<User>(
        'SELECT * FROM users WHERE user_id = ?',
        [userId]
      );
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by user ID:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   */
  public async findByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.db.get<User>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by username:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  public async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.db.get<User>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return user || null;
    } catch (error) {
      logger.error('Failed to find user by email:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  public async update(userId: string, updateData: UpdateUserData): Promise<User | null> {
    try {
      const setParts: string[] = [];
      const values: any[] = [];

      if (updateData.username !== undefined) {
        setParts.push('username = ?');
        values.push(updateData.username);
      }

      if (updateData.email !== undefined) {
        setParts.push('email = ?');
        values.push(updateData.email);
      }

      if (updateData.password !== undefined) {
        const passwordHash = await authService.hashPassword(updateData.password);
        setParts.push('password_hash = ?');
        values.push(passwordHash);
      }

      if (updateData.isActive !== undefined) {
        setParts.push('is_active = ?');
        values.push(updateData.isActive ? 1 : 0);
      }

      if (setParts.length === 0) {
        throw new Error('No update data provided');
      }

      values.push(userId);

      await this.db.run(
        `UPDATE users SET ${setParts.join(', ')} WHERE user_id = ?`,
        values
      );

      const updatedUser = await this.findByUserId(userId);

      logger.info('User updated successfully', {
        userId,
        updatedFields: Object.keys(updateData),
      });

      return updatedUser;
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete by setting is_active to false)
   */
  public async delete(userId: string): Promise<boolean> {
    try {
      const result = await this.db.run(
        'UPDATE users SET is_active = 0 WHERE user_id = ?',
        [userId]
      );

      const success = (result.changes || 0) > 0;

      if (success) {
        logger.info('User deleted successfully', { userId });
      }

      return success;
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * List users with filtering
   */
  public async list(filter: UserFilter = {}): Promise<User[]> {
    try {
      let query = 'SELECT * FROM users WHERE 1=1';
      const values: any[] = [];

      if (filter.isActive !== undefined) {
        query += ' AND is_active = ?';
        values.push(filter.isActive ? 1 : 0);
      }

      if (filter.search) {
        query += ' AND (username LIKE ? OR email LIKE ?)';
        const searchPattern = `%${filter.search}%`;
        values.push(searchPattern, searchPattern);
      }

      query += ' ORDER BY created_at DESC';

      if (filter.limit) {
        query += ' LIMIT ?';
        values.push(filter.limit);

        if (filter.offset) {
          query += ' OFFSET ?';
          values.push(filter.offset);
        }
      }

      const users = await this.db.all<User[]>(query, values);
      return users;
    } catch (error) {
      logger.error('Failed to list users:', error);
      throw error;
    }
  }

  /**
   * Get user count
   */
  public async count(filter: UserFilter = {}): Promise<number> {
    try {
      let query = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
      const values: any[] = [];

      if (filter.isActive !== undefined) {
        query += ' AND is_active = ?';
        values.push(filter.isActive ? 1 : 0);
      }

      if (filter.search) {
        query += ' AND (username LIKE ? OR email LIKE ?)';
        const searchPattern = `%${filter.search}%`;
        values.push(searchPattern, searchPattern);
      }

      const result = await this.db.get<{ count: number }>(query, values);
      return result?.count || 0;
    } catch (error) {
      logger.error('Failed to count users:', error);
      throw error;
    }
  }

  /**
   * Verify user password
   */
  public async verifyPassword(userId: string, password: string): Promise<boolean> {
    try {
      const user = await this.findByUserId(userId);
      if (!user || !user.is_active) {
        return false;
      }

      return await authService.verifyPassword(password, user.password_hash);
    } catch (error) {
      logger.error('Failed to verify password:', error);
      return false;
    }
  }

  /**
   * Check if username exists
   */
  public async usernameExists(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = 'SELECT 1 FROM users WHERE username = ?';
      const values: any[] = [username];

      if (excludeUserId) {
        query += ' AND user_id != ?';
        values.push(excludeUserId);
      }

      const result = await this.db.get(query, values);
      return !!result;
    } catch (error) {
      logger.error('Failed to check username existence:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  public async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
    try {
      let query = 'SELECT 1 FROM users WHERE email = ?';
      const values: any[] = [email];

      if (excludeUserId) {
        query += ' AND user_id != ?';
        values.push(excludeUserId);
      }

      const result = await this.db.get(query, values);
      return !!result;
    } catch (error) {
      logger.error('Failed to check email existence:', error);
      throw error;
    }
  }
}

export const userRepository = new UserRepository();