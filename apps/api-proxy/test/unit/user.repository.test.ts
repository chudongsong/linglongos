import { userRepository } from '@/models/user.repository';

describe('UserRepository', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  describe('User Creation', () => {
    test('should create user successfully', async () => {
      const user = await userRepository.create(testUser);
      
      expect(user).toBeDefined();
      expect(user.user_id).toBeDefined();
      expect(user.username).toBe(testUser.username);
      expect(user.email).toBe(testUser.email);
      expect(user.password_hash).toBeDefined();
      expect(user.password_hash).not.toBe(testUser.password);
      expect(user.is_active).toBe(true);
      expect(user.created_at).toBeDefined();
    });

    test('should create user without email', async () => {
      const userWithoutEmail = {
        username: 'testuser2',
        password: 'password123',
      };
      
      const user = await userRepository.create(userWithoutEmail);
      
      expect(user.username).toBe(userWithoutEmail.username);
      expect(user.email).toBeNull();
    });

    test('should throw error for duplicate username', async () => {
      await userRepository.create(testUser);
      
      await expect(userRepository.create({
        username: testUser.username,
        password: 'different-password',
      })).rejects.toThrow();
    });

    test('should throw error for duplicate email', async () => {
      await userRepository.create(testUser);
      
      await expect(userRepository.create({
        username: 'different-username',
        email: testUser.email,
        password: 'different-password',
      })).rejects.toThrow();
    });
  });

  describe('User Retrieval', () => {
    let createdUser: any;

    beforeEach(async () => {
      createdUser = await userRepository.create(testUser);
    });

    test('should find user by user ID', async () => {
      const user = await userRepository.findByUserId(createdUser.user_id);
      
      expect(user).toBeDefined();
      expect(user!.username).toBe(testUser.username);
    });

    test('should find user by username', async () => {
      const user = await userRepository.findByUsername(testUser.username);
      
      expect(user).toBeDefined();
      expect(user!.user_id).toBe(createdUser.user_id);
    });

    test('should find user by email', async () => {
      const user = await userRepository.findByEmail(testUser.email!);
      
      expect(user).toBeDefined();
      expect(user!.user_id).toBe(createdUser.user_id);
    });

    test('should return null for non-existent user ID', async () => {
      const user = await userRepository.findByUserId('non-existent-id');
      expect(user).toBeNull();
    });

    test('should return null for non-existent username', async () => {
      const user = await userRepository.findByUsername('non-existent');
      expect(user).toBeNull();
    });

    test('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('non-existent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('User Updates', () => {
    let createdUser: any;

    beforeEach(async () => {
      createdUser = await userRepository.create(testUser);
    });

    test('should update username', async () => {
      const newUsername = 'newusername';
      const updatedUser = await userRepository.update(createdUser.user_id, {
        username: newUsername,
      });
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser!.username).toBe(newUsername);
    });

    test('should update email', async () => {
      const newEmail = 'newemail@example.com';
      const updatedUser = await userRepository.update(createdUser.user_id, {
        email: newEmail,
      });
      
      expect(updatedUser!.email).toBe(newEmail);
    });

    test('should update password', async () => {
      const newPassword = 'newpassword123';
      const updatedUser = await userRepository.update(createdUser.user_id, {
        password: newPassword,
      });
      
      expect(updatedUser!.password_hash).toBeDefined();
      expect(updatedUser!.password_hash).not.toBe(createdUser.password_hash);
      
      // Verify new password works
      const isValid = await userRepository.verifyPassword(createdUser.user_id, newPassword);
      expect(isValid).toBe(true);
    });

    test('should update active status', async () => {
      const updatedUser = await userRepository.update(createdUser.user_id, {
        isActive: false,
      });
      
      expect(updatedUser!.is_active).toBe(false);
    });

    test('should throw error for empty update', async () => {
      await expect(userRepository.update(createdUser.user_id, {}))
        .rejects.toThrow('No update data provided');
    });
  });

  describe('User Deletion', () => {
    let createdUser: any;

    beforeEach(async () => {
      createdUser = await userRepository.create(testUser);
    });

    test('should soft delete user', async () => {
      const deleted = await userRepository.delete(createdUser.user_id);
      expect(deleted).toBe(true);
      
      // User should still exist but be inactive
      const user = await userRepository.findByUserId(createdUser.user_id);
      expect(user).toBeDefined();
      expect(user!.is_active).toBe(false);
    });

    test('should return false for non-existent user deletion', async () => {
      const deleted = await userRepository.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('User Listing and Counting', () => {
    beforeEach(async () => {
      // Create multiple test users
      await userRepository.create({ username: 'user1', password: 'password' });
      await userRepository.create({ username: 'user2', password: 'password' });
      await userRepository.create({ username: 'user3', email: 'user3@example.com', password: 'password' });
      
      // Create an inactive user
      const inactiveUser = await userRepository.create({ username: 'inactive', password: 'password' });
      await userRepository.delete(inactiveUser.user_id);
    });

    test('should list all active users', async () => {
      const users = await userRepository.list({ isActive: true });
      expect(users.length).toBe(3);
    });

    test('should list inactive users', async () => {
      const users = await userRepository.list({ isActive: false });
      expect(users.length).toBe(1);
      expect(users[0].username).toBe('inactive');
    });

    test('should search users by username', async () => {
      const users = await userRepository.list({ search: 'user1' });
      expect(users.length).toBe(1);
      expect(users[0].username).toBe('user1');
    });

    test('should search users by email', async () => {
      const users = await userRepository.list({ search: 'user3@example.com' });
      expect(users.length).toBe(1);
      expect(users[0].username).toBe('user3');
    });

    test('should limit results', async () => {
      const users = await userRepository.list({ limit: 2 });
      expect(users.length).toBe(2);
    });

    test('should offset results', async () => {
      const firstPage = await userRepository.list({ limit: 2, offset: 0 });
      const secondPage = await userRepository.list({ limit: 2, offset: 2 });
      
      expect(firstPage.length).toBe(2);
      expect(secondPage.length).toBeGreaterThanOrEqual(1);
      expect(firstPage[0].user_id).not.toBe(secondPage[0].user_id);
    });

    test('should count all users', async () => {
      const count = await userRepository.count();
      expect(count).toBe(4); // 3 active + 1 inactive
    });

    test('should count active users only', async () => {
      const count = await userRepository.count({ isActive: true });
      expect(count).toBe(3);
    });

    test('should count users with search filter', async () => {
      const count = await userRepository.count({ search: 'user' });
      expect(count).toBe(3); // user1, user2, user3
    });
  });

  describe('Password Verification', () => {
    let createdUser: any;

    beforeEach(async () => {
      createdUser = await userRepository.create(testUser);
    });

    test('should verify correct password', async () => {
      const isValid = await userRepository.verifyPassword(createdUser.user_id, testUser.password);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const isValid = await userRepository.verifyPassword(createdUser.user_id, 'wrongpassword');
      expect(isValid).toBe(false);
    });

    test('should reject password for non-existent user', async () => {
      const isValid = await userRepository.verifyPassword('non-existent-id', testUser.password);
      expect(isValid).toBe(false);
    });

    test('should reject password for inactive user', async () => {
      await userRepository.delete(createdUser.user_id);
      const isValid = await userRepository.verifyPassword(createdUser.user_id, testUser.password);
      expect(isValid).toBe(false);
    });
  });

  describe('Existence Checks', () => {
    let createdUser: any;

    beforeEach(async () => {
      createdUser = await userRepository.create(testUser);
    });

    test('should check username exists', async () => {
      const exists = await userRepository.usernameExists(testUser.username);
      expect(exists).toBe(true);
    });

    test('should check username does not exist', async () => {
      const exists = await userRepository.usernameExists('nonexistent');
      expect(exists).toBe(false);
    });

    test('should exclude user from username check', async () => {
      const exists = await userRepository.usernameExists(testUser.username, createdUser.user_id);
      expect(exists).toBe(false);
    });

    test('should check email exists', async () => {
      const exists = await userRepository.emailExists(testUser.email!);
      expect(exists).toBe(true);
    });

    test('should check email does not exist', async () => {
      const exists = await userRepository.emailExists('nonexistent@example.com');
      expect(exists).toBe(false);
    });

    test('should exclude user from email check', async () => {
      const exists = await userRepository.emailExists(testUser.email!, createdUser.user_id);
      expect(exists).toBe(false);
    });
  });
});