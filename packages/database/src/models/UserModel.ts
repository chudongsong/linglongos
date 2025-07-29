import { BaseModel } from './BaseModel'
import { DatabaseService } from '../services/DatabaseService'

/**
 * 用户接口
 */
export interface User {
  id: string
  username: string
  email: string
  password: string
  avatar?: string
  role: string
  status: 'active' | 'inactive' | 'banned'
  createdAt: number
  updatedAt: number
}

/**
 * 用户模型类
 */
export class UserModel extends BaseModel<User> {
  /**
   * 构造函数
   * @param dbService 数据库服务
   */
  constructor(dbService: DatabaseService) {
    super(dbService, 'users', 'id')
  }

  /**
   * 根据用户名查找用户
   * @param username 用户名
   */
  async findByUsername(username: string) {
    return this.find([this.eq('username', username)])
  }

  /**
   * 根据邮箱查找用户
   * @param email 邮箱
   */
  async findByEmail(email: string) {
    return this.find([this.eq('email', email)])
  }

  /**
   * 查找活跃用户
   */
  async findActiveUsers() {
    return this.find([this.eq('status', 'active')])
  }

  /**
   * 查找被禁用的用户
   */
  async findBannedUsers() {
    return this.find([this.eq('status', 'banned')])
  }

  /**
   * 更新用户状态
   * @param userId 用户ID
   * @param status 状态
   */
  async updateStatus(userId: string, status: User['status']) {
    return this.update(userId, {
      status,
      updatedAt: Date.now(),
    })
  }

  /**
   * 更新用户头像
   * @param userId 用户ID
   * @param avatar 头像URL
   */
  async updateAvatar(userId: string, avatar: string) {
    return this.update(userId, {
      avatar,
      updatedAt: Date.now(),
    })
  }

  /**
   * 创建新用户
   * @param userData 用户数据
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = Date.now()
    const user: User = {
      ...userData,
      id: `user_${now}_${Math.random().toString(36).substring(2, 10)}`,
      createdAt: now,
      updatedAt: now,
    }
    return this.create(user)
  }
}
