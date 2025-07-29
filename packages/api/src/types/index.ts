/**
 * API模块类型定义
 */

/**
 * 文件项类型
 */
export interface FileItem {
  // 文件名
  name: string
  // 文件路径
  path: string
  // 文件类型
  type: 'file' | 'directory'
  // 文件大小（字节）
  size: number
  // 修改时间
  modifiedAt: Date
  // 文件权限
  permissions?: string
  // 所有者
  owner?: string
  // 所属组
  group?: string
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  // 页码
  page: number
  // 每页数量
  pageSize: number
}

/**
 * 分页响应数据
 */
export interface PaginationResult<T> {
  // 数据列表
  list: T[]
  // 总数
  total: number
  // 页码
  page: number
  // 每页数量
  pageSize: number
  // 总页数
  totalPages: number
}

/**
 * 排序参数
 */
export interface SortParams {
  // 排序字段
  field: string
  // 排序方向
  order: 'asc' | 'desc'
}

/**
 * 查询参数
 */
export interface QueryParams {
  // 分页参数
  pagination?: PaginationParams
  // 排序参数
  sort?: SortParams
  // 过滤条件
  filters?: Record<string, any>
}
