import { createDatabaseService } from '../services/DatabaseService'
import { UserModel } from '../models/UserModel'

/**
 * 基本用法示例
 */
async function basicUsageExample() {
  // 创建数据库服务
  const dbService = createDatabaseService()

  // 初始化数据库
  const initialized = await dbService.init({
    name: 'app_database',
    version: 1,
    stores: [
      {
        name: 'users',
        keyPath: 'id',
        indexes: [
          { name: 'username', keyPath: 'username', unique: true },
          { name: 'email', keyPath: 'email', unique: true },
          { name: 'status', keyPath: 'status' },
        ],
      },
      {
        name: 'posts',
        keyPath: 'id',
        indexes: [
          { name: 'userId', keyPath: 'userId' },
          { name: 'category', keyPath: 'category' },
          { name: 'createdAt', keyPath: 'createdAt' },
        ],
      },
    ],
  })

  if (!initialized) {
    console.error('初始化数据库失败')
    return
  }

  // 创建用户模型
  const userModel = new UserModel(dbService)

  // 创建用户
  const createResult = await userModel.createUser({
    username: 'test_user',
    email: 'test@example.com',
    password: 'hashed_password',
    role: 'user',
    status: 'active',
  })

  if (createResult.success) {
    console.log('创建用户成功:', createResult.data)

    // 查询用户
    const user = await userModel.get(createResult.data!.id)
    console.log('查询用户:', user.data)

    // 更新用户
    const updateResult = await userModel.updateStatus(createResult.data!.id, 'inactive')
    console.log('更新用户状态:', updateResult.data)

    // 查询所有用户
    const allUsers = await userModel.findAll()
    console.log('所有用户:', allUsers.data)

    // 根据条件查询用户
    const activeUsers = await userModel.findActiveUsers()
    console.log('活跃用户:', activeUsers.data)

    // 删除用户
    const deleteResult = await userModel.delete(createResult.data!.id)
    console.log('删除用户:', deleteResult)
  } else {
    console.error('创建用户失败:', createResult.error)
  }

  // 关闭数据库
  await dbService.close()
}

// 运行示例
basicUsageExample().catch(console.error)
