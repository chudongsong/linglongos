/**
 * 数据库模块测试脚本
 * 用于测试数据库模块的基本功能
 */
import { createDatabaseService } from '../services/DatabaseService'
import { DatabaseManager } from '../core/DatabaseManager'
import { createAppDatabaseConfig } from '../utils/helpers'

/**
 * 测试数据库基本功能
 */
async function testDatabaseBasics() {
  console.log('开始测试数据库基本功能...')

  // 创建数据库服务
  const dbService = createDatabaseService()

  // 使用辅助函数创建应用数据库配置
  const dbConfig = createAppDatabaseConfig('test')

  // 初始化数据库
  console.log('初始化数据库...')
  const initialized = await dbService.init(dbConfig)
  if (!initialized) {
    console.error('初始化数据库失败')
    return
  }
  console.log('数据库初始化成功')

  // 测试添加数据
  console.log('测试添加数据...')
  const settingData = {
    key: 'theme',
    value: 'dark',
    category: 'appearance',
  }
  const addResult = await dbService.add('settings', settingData)
  if (addResult.success) {
    console.log('添加数据成功:', addResult.data)
  } else {
    console.error('添加数据失败:', addResult.error)
    return
  }

  // 测试获取数据
  console.log('测试获取数据...')
  const getResult = await dbService.get('settings', 'theme')
  if (getResult.success) {
    console.log('获取数据成功:', getResult.data)
  } else {
    console.error('获取数据失败:', getResult.error)
    return
  }

  // 测试更新数据
  console.log('测试更新数据...')
  const updateResult = await dbService.update('settings', 'theme', { value: 'light' })
  if (updateResult.success) {
    console.log('更新数据成功:', updateResult.data)
  } else {
    console.error('更新数据失败:', updateResult.error)
    return
  }

  // 测试查询数据
  console.log('测试查询数据...')
  const queryResult = await dbService.query('settings', [
    { field: 'category', operator: 'eq', value: 'appearance' },
  ])
  if (queryResult.success) {
    console.log('查询数据成功:', queryResult.data)
  } else {
    console.error('查询数据失败:', queryResult.error)
    return
  }

  // 测试批量添加数据
  console.log('测试批量添加数据...')
  const batchData = [
    { key: 'language', value: 'zh-CN', category: 'localization' },
    { key: 'fontSize', value: 14, category: 'appearance' },
    { key: 'notifications', value: true, category: 'system' },
  ]
  const batchAddResult = await dbService.addBatch('settings', batchData)
  if (batchAddResult.success) {
    console.log('批量添加数据成功:', batchAddResult.data)
  } else {
    console.error('批量添加数据失败:', batchAddResult.error)
    return
  }

  // 测试获取所有数据
  console.log('测试获取所有数据...')
  const getAllResult = await dbService.getAll('settings')
  if (getAllResult.success) {
    console.log('获取所有数据成功:', getAllResult.data)
  } else {
    console.error('获取所有数据失败:', getAllResult.error)
    return
  }

  // 测试统计数据
  console.log('测试统计数据...')
  const countResult = await dbService.count('settings')
  if (countResult.success) {
    console.log('统计数据成功, 共有记录:', countResult.data)
  } else {
    console.error('统计数据失败:', countResult.error)
    return
  }

  // 测试删除数据
  console.log('测试删除数据...')
  const deleteResult = await dbService.delete('settings', 'notifications')
  if (deleteResult.success) {
    console.log('删除数据成功')
  } else {
    console.error('删除数据失败:', deleteResult.error)
    return
  }

  // 测试条件删除
  console.log('测试条件删除...')
  const deleteWhereResult = await dbService.deleteWhere('settings', [
    { field: 'category', operator: 'eq', value: 'localization' },
  ])
  if (deleteWhereResult.success) {
    console.log('条件删除成功, 删除记录数:', deleteWhereResult.count)
  } else {
    console.error('条件删除失败:', deleteWhereResult.error)
    return
  }

  // 再次获取所有数据，验证删除结果
  console.log('验证删除结果...')
  const verifyResult = await dbService.getAll('settings')
  if (verifyResult.success) {
    console.log('当前所有数据:', verifyResult.data)
  } else {
    console.error('获取数据失败:', verifyResult.error)
    return
  }

  // 测试清空表
  console.log('测试清空表...')
  const clearResult = await dbService.clear('settings')
  if (clearResult.success) {
    console.log('清空表成功')
  } else {
    console.error('清空表失败:', clearResult.error)
    return
  }

  // 关闭数据库
  console.log('关闭数据库...')
  await dbService.close()
  console.log('数据库关闭成功')

  console.log('数据库基本功能测试完成')
}

/**
 * 测试数据库管理器
 */
async function testDatabaseManager() {
  console.log('开始测试数据库管理器...')

  // 获取数据库管理器实例
  const dbManager = DatabaseManager.getInstance()

  // 注册多个数据库
  console.log('注册多个数据库...')
  await dbManager.registerDatabase({
    name: 'test_db1',
    version: 1,
    stores: [{ name: 'test_store', keyPath: 'id' }],
  })
  await dbManager.registerDatabase({
    name: 'test_db2',
    version: 1,
    stores: [{ name: 'test_store', keyPath: 'id' }],
  })

  // 检查数据库是否注册成功
  console.log('检查数据库是否注册成功...')
  const dbNames = dbManager.getAllDatabaseNames()
  console.log('已注册的数据库:', dbNames)

  // 获取数据库实例
  console.log('获取数据库实例...')
  const db1Instance = dbManager.getDatabase('test_db1')
  console.log('获取数据库实例成功:', db1Instance !== null)

  // 移除数据库
  console.log('移除数据库...')
  await dbManager.removeDatabase('test_db1')
  console.log('移除数据库后的列表:', dbManager.getAllDatabaseNames())

  // 清空所有数据库
  console.log('清空所有数据库...')
  await dbManager.clearDatabases()
  console.log('清空后的数据库列表:', dbManager.getAllDatabaseNames())

  console.log('数据库管理器测试完成')
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  try {
    console.log('===== 开始数据库模块测试 =====')

    // 测试数据库基本功能
    await testDatabaseBasics()

    console.log('\n')

    // 测试数据库管理器
    await testDatabaseManager()

    console.log('===== 数据库模块测试完成 =====')
  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
}

// 运行测试
runAllTests().catch(console.error)
