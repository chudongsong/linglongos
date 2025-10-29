### 文件管理业务错误码 (51xx)

```typescript
// 文件管理 - 基础 (510x)
FILE_NOT_FOUND: 5101, // 文件或目录未找到
DIRECTORY_NOT_EMPTY: 5102, // 目录非空（删除时）
ENTRY_ALREADY_EXISTS: 5103, // 条目已存在（创建或移动时）
INVALID_PATH: 5104, // 无效的路径格式
IS_NOT_DIRECTORY: 5105, // 操作需要一个目录，但提供了文件路径
IS_NOT_FILE: 5106, // 操作需要一个文件，但提供了目录路径
COMPRESSION_FAILED: 5107, // 压缩失败
EXTRACTION_FAILED: 5108, // 解压失败
PERMISSION_DENIED: 5109, // 权限不足
INVALID_ARCHIVE: 5110, // 无效或不支持的归档文件

// 文件管理 - 回收站 (512x)
RECYCLE_BIN_DISABLED: 5120, // 回收站功能未开启
RECYCLE_BIN_ITEM_NOT_FOUND: 5121, // 在回收站中未找到该条目
RESTORE_PATH_CONFLICT: 5122, // 恢复路径冲突 (原路径已有同名条目)
RECYCLE_BIN_OPERATION_FAILED: 5123, // 回收站操作失败 (例如清空)
```

### 通用数据模型 (Typedefs)

```javascript
/**
 * @typedef fileSystemEntry
 * @property {string} name - 条目名称
 * @property {string} path - 完整路径
 * @property {string} type - 类型 ('file' 或 'directory')
 * @property {integer} size - 大小 (bytes)，目录通常为 0
 * @property {integer} modifiedTime - 修改时间 (Unix 时间戳, 毫秒)
 * @property {string} [mimeType] - MimeType (仅文件)
 * @property {object} [permissions] - 权限对象 (r, w, x)
 */

/**
 * @typedef pagination
 * @property {integer} page - 当前页码
 * @property {integer} pageSize - 每页数量
 * @property {integer} total - 总条目数
 * @property {integer} totalPages - 总页数
 */

/**
 * @typedef successResponse
 * @property {integer} code - Gong (固定 200)
 * @property {string} message - 成功信息
 * @property {object} [data] - 响应数据 (可选)
 * @property {integer} timestamp - 时间戳 (Unix 时间戳, 毫秒)
 * @property {string} requestId - 请求ID
 */

/**
 * @typedef errorResponse
 * @property {integer} code - 错误码 (例如 5101)
 * @property {string} message - 错误信息
 * @property {object} [error] - 详细错误 (可选)
 * @property {integer} timestamp - 时间戳 (Unix 时间戳, 毫秒)
 * @property {string} requestId - 请求ID
 */

/**
 * @typedef directoryStats
 * @property {integer} size - 目录总大小 (bytes)
 * @property {integer} fileCount - 包含的文件总数
 * @property {integer} directoryCount - 包含的目录总数
 */

/**
 * @typedef permissionDetails
 * @property {string} path - 条目路径
 * @property {string} owner - 所有者
 * @property {string} group - 所属组
 * @property {string} mode - 权限模式 (例如 "755" 或 "rw-r--r--")
 * @property {object[]} [acl] - (可选) 详细的 ACL 列表
 */

/**
 * @typedef mountPoint
 * @property {string} device - 设备名 (例如 /dev/sda1)
 * @property {string} mountPath - 挂载点 (例如 /)
 * @property {string} filesystem - 文件系统类型 (例如 ext4)
 * @property {integer} totalSpace - 总空间 (bytes)
 * @property {integer} usedSpace - 已用空间 (bytes)
 * @property {integer} freeSpace - 可用空间 (bytes)
 * @property {number} usePercent - 使用率 (例如 0.85)
 */

/**
 * @typedef recycledEntry
 * @property {string} id - 回收站中的唯一ID
 * @property {string} name - 条目名称
 * @property {string} originalPath - 原始路径
 * @property {integer} deletedTime - 删除时间 (Unix 时间戳, 毫秒)
 * @property {string} type - 类型 ('file' 或 'directory')
 * @property {integer} size - 大小 (bytes)
 */

/**
 * @typedef recycleBinConfig
 * @property {boolean} enabled - 回收站是否开启
 * @property {integer} [maxSize] - (可选) 回收站最大总容量 (MB)
 * @property {integer} [maxAge] - (可选) 文件在回收站中保留的最长天数 (例如 30)
 */
```

-----

### 文件系统 API JSDoc 定义

#### 1\. 列出条目 (list\_entries)

```javascript
/**
 * @summary 列出条目 (分页)
 * @description 获取指定路径下的文件和目录列表，支持分页。
 * @router get /api/v1/files/list_entries
 * @request query listEntriesRequest
 * @response 200 listEntriesResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND, 5105: IS_NOT_DIRECTORY)
 */

/**
 * @typedef listEntriesRequest
 * @property {string} path - (必填) 要浏览的目录路径。
 * @property {integer} [page=1] - 页码 (默认 1)。
 * @property {integer} [pageSize=20] - 每页数量 (默认 20)。
 * @property {string} [sortBy='name'] - 排序字段 (name, size, modifiedTime)。
 * @property {string} [sortOrder='asc'] - 排序顺序 (asc, desc)。
 */

/**
 * @typedef listEntriesResponse
 * @property {integer} code - 200
 * @property {string} message - "查询成功"
 * @property {object} data
 * @property {fileSystemEntry[]} data.items - 条目列表
 * @property {pagination} data.pagination - 分页信息
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 2\. 创建目录 (create\_directory)

```javascript
/**
 * @summary 创建目录
 * @description 在指定路径创建一个新目录。
 * @router post /api/v1/files/create_directory
 * @request body createDirectoryRequest
 * @response 200 createDirectoryResponse
 * @response 500 errorResponse (例如 5103: ENTRY_ALREADY_EXISTS, 5104: INVALID_PATH)
 */

/**
 * @typedef createDirectoryRequest
 * @property {string} path - (必填) 要创建的新目录的完整路径。
 */

/**
 * @typedef createDirectoryResponse
 * @property {integer} code - 200
 * @property {string} message - "创建成功"
 * @property {fileSystemEntry} data - 新创建目录的元数据
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 3\. 上传文件 (upload\_file)

```javascript
/**
 * @summary 上传文件
 * @description 上传一个或多个文件到指定目录。
 * @description 注意：此接口使用 'multipart/form-data'。'path' 应作为表单字段(form field)提交，文件本身使用 'file' 字段。
 * @consumes multipart/form-data
 * @router post /api/v1/files/upload_file
 * @request body uploadFileRequest
 * @response 200 uploadFileResponse
 * @response 500 errorResponse (例如 5109: PERMISSION_DENIED, 5101: FILE_NOT_FOUND 目标路径不存在)
 */

/**
 * @typedef uploadFileRequest
 * @property {string} path - (必填) 目标目录路径。
 * @property {file} file - (必填) 要上传的文件。
 */

/**
 * @typedef uploadFileResponse
 * @property {integer} code - 200
 * @property {string} message - "上传成功"
 * @property {fileSystemEntry} data - 新上传文件的元数据
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 4\. 下载文件 (download\_file)

```javascript
/**
 * @summary 下载文件
 * @description 下载指定路径的文件。
 * @description 关键例外：成功时 (HTTP 200)，直接返回文件流 (file stream)。失败时，返回标准 JSON 错误响应体。
 * @produces application/octet-stream
 * @router get /api/v1/files/download_file
 * @request query downloadFileRequest
 * @response 200 {file} 200 - 文件流
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND, 5106: IS_NOT_FILE)
 */

/**
 * @typedef downloadFileRequest
 * @property {string} path - (必填) 要下载的文件路径。
 */
```

#### 5\. 移动/重命名 (move\_entry)

```javascript
/**
 * @summary 移动或重命名条目
 * @description 移动或重命名一个文件或目录。
 * @router post /api/v1/files/move_entry
 * @request body moveEntryRequest
 * @response 200 moveEntryResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND 源路径不存在, 5103: ENTRY_ALREADY_EXISTS 目标路径已存在)
 */

/**
 * @typedef moveEntryRequest
 * @property {string} sourcePath - (必填) 源文件或目录的路径。
 * @property {string} destinationPath - (必填) 目标路径。
 */

/**
 * @typedef moveEntryResponse
 * @property {integer} code - 200
 * @property {string} message - "移动成功"
 * @property {fileSystemEntry} data - 移动/重命名后条目的新元数据
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 6\. 复制 (copy\_entry)

```javascript
/**
 * @summary 复制条目
 * @description 复制一个文件或目录到新位置。
 * @router post /api/v1/files/copy_entry
 * @request body copyEntryRequest
 * @response 200 copyEntryResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND 源路径不存在, 5103: ENTRY_ALREADY_EXISTS 目标路径已存在)
 */

/**
 * @typedef copyEntryRequest
 * @property {string} sourcePath - (必填) 源文件或目录的路径。
 * @property {string} destinationPath - (必填) 目标路径。
 */

/**
 * @typedef copyEntryResponse
 * @property {integer} code - 200
 * @property {string} message - "复制成功"
 * @property {fileSystemEntry} data - 新创建的副本条目的元数据
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 7\. 删除 (delete\_entry)

```javascript
/**
 * @summary 删除条目
 * @description 删除一个文件或目录。删除非空目录需要 'recursive' 标志。
 * @router post /api/v1/files/delete_entry
 * @request body deleteEntryRequest
 * @response 200 successResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND, 5102: DIRECTORY_NOT_EMPTY)
 */

/**
 * @typedef deleteEntryRequest
 * @property {string} path - (必填) 要删除的文件或目录路径。
 * @property {boolean} [recursive=false] - (可选) 是否递归删除。如果删除非空目录，此项必须为 true。
 */
```

#### 8\. 压缩 (compress\_entries)

```javascript
/**
 * @summary 压缩条目
 * @description 将多个源文件/目录压缩到一个目标 zip 文件。
 * @router post /api/v1/files/compress_entries
 * @request body compressEntriesRequest
 * @response 200 compressEntriesResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND 某个源文件不存在, 5107: COMPRESSION_FAILED)
 */

/**
 * @typedef compressEntriesRequest
 * @property {string[]} sourcePaths - (必填) 要压缩的源文件或目录的路径数组。
 * @property {string} destinationZipPath - (必填) 目标 zip 文件的完整路径 (例如 /tmp/archive.zip)。
 * @property {string} [baseDir] - (可选) 压缩时的基准目录，用于确定 zip 包内的相对路径。
 */

/**
 * @typedef compressEntriesResponse
 * @property {integer} code - 200
 * @property {string} message - "压缩成功"
 * @property {fileSystemEntry} data - 新生成的 zip 文件的元数据
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 9\. 解压 (extract\_archive)

```javascript
/**
 * @summary 解压归档
 * @description 将一个源 zip 文件解压到一个目标目录。
 * @router post /api/v1/files/extract_archive
 * @request body extractArchiveRequest
 * @response 200 successResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND 源 zip 文件不存在, 5108: EXTRACTION_FAILED, 5110: INVALID_ARCHIVE)
 */

/**
 * @typedef extractArchiveRequest
 * @property {string} sourceZipPath - (必填) 要解压的源 zip 文件路径。
 * @property {string} destinationPath - (必填) 解压到的目标目录路径。
 */
```

#### 10\. 检查条目是否存在 (check\_existence)

```javascript
/**
 * @summary 检查条目是否存在
 * @description 检查指定路径的文件或目录是否存在。
 * @router get /api/v1/files/check_existence
 * @request query checkExistenceRequest
 * @response 200 checkExistenceResponse
 * @response 500 errorResponse (例如 5104: INVALID_PATH)
 */

/**
 * @typedef checkExistenceRequest
 * @property {string} path - (必填) 要检查的路径。
 */

/**
 * @typedef checkExistenceResponse
 * @property {integer} code - 200
 * @property {string} message - "操作成功"
 * @property {object} data
 * @property {boolean} data.exists - 路径是否存在
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 11\. 计算目录统计 (calculate\_directory\_stats)

```javascript
/**
 * @summary 计算目录统计
 * @description 计算指定目录的总大小、文件数和目录数。
 * @router get /api/v1/files/calculate_directory_stats
 * @request query calculateDirectoryStatsRequest
 * @response 200 calculateDirectoryStatsResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND, 5105: IS_NOT_DIRECTORY)
 */

/**
 * @typedef calculateDirectoryStatsRequest
 * @property {string} path - (必填) 要计算的目录路径。
 */

/**
 * @typedef calculateDirectoryStatsResponse
 * @property {integer} code - 200
 * @property {string} message - "操作成功"
 * @property {directoryStats} data - 目录统计信息
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 12\. 修改条目备注 (update\_entry\_remark)

```javascript
/**
 * @summary 修改条目备注
 * @description 为文件或目录设置备注信息（如果文件系统支持）。
 * @router post /api/v1/files/update_entry_remark
 * @request body updateEntryRemarkRequest
 * @response 200 successResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND)
 */

/**
 * @typedef updateEntryRemarkRequest
 * @property {string} path - (必填) 要设置备注的条目路径。
 * @property {string} remark - (必填) 备注内容。
 */
```

#### 13\. 获取条目权限 (get\_entry\_permissions)

```javascript
/**
 * @summary 获取条目权限
 * @description 获取文件或目录的详细权限信息 (Owner, Group, Mode)。
 * @router get /api/v1/files/get_entry_permissions
 * @request query getEntryPermissionsRequest
 * @response 200 getEntryPermissionsResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND)
 */

/**
 * @typedef getEntryPermissionsRequest
 * @property {string} path - (必填) 要查询的条目路径。
 */

/**
 * @typedef getEntryPermissionsResponse
 * @property {integer} code - 200
 * @property {string} message - "操作成功"
 * @property {permissionDetails} data - 权限详情
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 14\. 设置条目权限 (set\_entry\_permissions)

```javascript
/**
 * @summary 设置条目权限
 * @description 修改文件或目录的权限 (Owner, Group, Mode)。
 * @router post /api/v1/files/set_entry_permissions
 * @request body setEntryPermissionsRequest
 * @response 200 successResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND, 5109: PERMISSION_DENIED)
 */

/**
 * @typedef setEntryPermissionsRequest
 * @property {string} path - (必填) 要修改的条目路径。
 * @property {string} [mode] - (可选) 权限模式 (例如 "755")。
 * @property {string} [owner] - (可选) 新的所有者。
 * @property {string} [group] - (可选) 新的所属组。
 * @property {boolean} [recursive=false] - (可选) 是否递归应用 (如果条目是目录)。
 */
```

#### 15\. 获取文件基础信息 (get\_basic\_info)

```javascript
/**
 * @summary 获取文件基础信息
 * @description 获取单个文件或目录的详细信息 (等同于 get_entry_meta)。
 * @router get /api/v1/files/get_basic_info
 * @request query getBasicInfoRequest
 * @response 200 getBasicInfoResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND)
 */

/**
 * @typedef getBasicInfoRequest
 * @property {string} path - (必填) 要获取元数据的文件或目录路径。
 */

/**
 * @typedef getBasicInfoResponse
 * @property {integer} code - 200
 * @property {string} message - "操作成功"
 * @property {fileSystemEntry} data - 文件或目录的元数据
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 16\. 获取文件内容 (get\_file\_content)

```javascript
/**
 * @summary 获取文件内容 (文本)
 * @description 以文本形式读取指定文件的内容，适用于预览。
 * @router get /api/v1/files/get_file_content
 * @request query getFileContentRequest
 * @response 200 getFileContentResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND, 5106: IS_NOT_FILE, 5104: INVALID_PATH '文件过大或非文本')
 */

/**
 * @typedef getFileContentRequest
 * @property {string} path - (必填) 要读取的文件路径。
 * @property {string} [encoding="utf8"] - (可选) 文件编码，默认 'utf8'。
 * @property {integer} [maxSize] - (可选) 允许读取的最大字节数，防止读取过大文件。
 */

/**
 * @typedef getFileContentResponse
 * @property {integer} code - 200
 * @property {string} message - "操作成功"
 * @property {object} data
 * @property {string} data.content - 文件内容
 * @property {string} data.encoding - 使用的编码
 * @property {boolean} data.truncated - 内容是否因超出 maxSize 被截断
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 17\. 保存文件内容 (save\_file\_content)

```javascript
/**
 * @summary 保存文件内容 (文本)
 * @description 覆盖写入指定文件的文本内容。
 * @router post /api/v1/files/save_file_content
 * @request body saveFileContentRequest
 * @response 200 saveFileContentResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND, 5106: IS_NOT_FILE, 5109: PERMISSION_DENIED)
 */

/**
 * @typedef saveFileContentRequest
 * @property {string} path - (必填) 要保存的文件路径。
 * @property {string} content - (必填) 要写入的文件内容。
 * @property {string} [encoding="utf8"] - (可选) 文件编码，默认 'utf8'。
 */

/**
 * @typedef saveFileContentResponse
 * @property {integer} code - 200
 * @property {string} message - "保存成功"
 * @property {fileSystemEntry} data - 更新后的文件元数据
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 18\. 获取文件收藏夹 (list\_favorites)

```javascript
/**
 * @summary 获取文件收藏夹
 * @description 列出当前用户收藏的所有文件或目录 (分页)。
 * @router get /api/v1/files/list_favorites
 * @request query listFavoritesRequest
 * @response 200 listFavoritesResponse
 * @response 500 errorResponse (例如 1000: SYSTEM_ERROR)
 */

/**
 * @typedef listFavoritesRequest
 * @property {integer} [page=1] - 页码 (默认 1)。
 * @property {integer} [pageSize=20] - 每页数量 (默认 20)。
 */

/**
 * @typedef listFavoritesResponse
 * @property {integer} code - 200
 * @property {string} message - "查询成功"
 * @property {object} data
 * @property {fileSystemEntry[]} data.items - 收藏的条目列表
 * @property {pagination} data.pagination - 分页信息
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 19\. 设置文件收藏 (set\_favorite)

```javascript
/**
 * @summary 设置文件收藏
 * @description 添加或取消收藏指定的文件或目录。
 * @router post /api/v1/files/set_favorite
 * @request body setFavoriteRequest
 * @response 200 successResponse
 * @response 500 errorResponse (例如 5101: FILE_NOT_FOUND)
 */

/**
 * @typedef setFavoriteRequest
 * @property {string} path - (必填) 要操作的条目路径。
 * @property {boolean} isFavorite - (必填) true 为添加收藏, false 为取消收藏。
 */
```

#### 20\. 创建文件 (create\_file)

```javascript
/**
 * @summary 创建文件
 * @description 在指定路径创建一个新文件。
 * @router post /api/v1/files/create_file
 * @request body createFileRequest
 * @response 200 createFileResponse
 * @response 500 errorResponse (例如 5103: ENTRY_ALREADY_EXISTS, 5104: INVALID_PATH)
 */

/**
 * @typedef createFileRequest
 * @property {string} path - (必填) 要创建的新文件的完整路径。
 * @property {string} [content=""] - (可选) 文件的初始文本内容。
 */

/**
 * @typedef createFileResponse
 * @property {integer} code - 200
 * @property {string} message - "创建成功"
 * @property {fileSystemEntry} data - 新创建文件的元数据
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 21\. 获取分区挂载列表 (list\_mounts)

```javascript
/**
 * @summary 获取分区挂载列表
 * @description 列出服务器上所有挂载的分区及其使用情况。
 * @router get /api/v1/files/list_mounts
 * @request query
 * @response 200 listMountsResponse
 * @response 500 errorResponse (例如 1000: SYSTEM_ERROR)
 */

/**
 * @typedef listMountsResponse
 * @property {integer} code - 200
 * @property {string} message - "查询成功"
 * @property {mountPoint[]} data - 挂载点列表
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 22\. 获取文件回收站列表 (list\_recycled\_entries)

```javascript
/**
 * @summary 获取文件回收站列表
 * @description 列出回收站中的所有条目，支持分页。
 * @router get /api/v1/files/list_recycled_entries
 * @request query listRecycledEntriesRequest
 * @response 200 listRecycledEntriesResponse
 * @response 500 errorResponse (例如 5120: RECYCLE_BIN_DISABLED)
 */

/**
 * @typedef listRecycledEntriesRequest
 * @property {integer} [page=1] - 页码 (默认 1)。
 * @property {integer} [pageSize=20] - 每页数量 (默认 20)。
 * @property {string} [sortBy='deletedTime'] - 排序字段 (deletedTime, name, size)。
 * @property {string} [sortOrder='desc'] - 排序顺序 (asc, desc)。
 */

/**
 * @typedef listRecycledEntriesResponse
 * @property {integer} code - 200
 * @property {string} message - "查询成功"
 * @property {object} data
 * @property {recycledEntry[]} data.items - 回收站条目列表
 * @property {pagination} data.pagination - 分页信息
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 23\. 恢复文件回收站文件 (restore\_recycled\_entry)

```javascript
/**
 * @summary 恢复回收站条目
 * @description 从回收站恢复一个或多个条目到其原始位置（或新位置）。
 * @router post /api/v1/files/restore_recycled_entry
 * @request body restoreRecycledEntryRequest
 * @response 200 restoreRecycledEntryResponse
 * @response 500 errorResponse (例如 5121: RECYCLE_BIN_ITEM_NOT_FOUND, 5122: RESTORE_PATH_CONFLICT)
 */

/**
 * @typedef restoreRecycledEntryRequest
 * @property {string} recycledId - (必填) 要恢复的回收站条目ID。
 * @property {string} [destinationPath] - (可选) 指定新的恢复路径。如果为空，则尝试恢复到 originalPath。
 */

/**
 * @typedef restoreRecycledEntryResponse
 * @property {integer} code - 200
 * @property {string} message - "恢复成功"
 * @property {fileSystemEntry} data - 恢复后条目的新元数据
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 24\. 下载文件回收站文件 (download\_recycled\_file)

```javascript
/**
 * @summary 下载回收站文件
 * @description 下载回收站中的指定文件。
 * @description 关键例外：成功时 (HTTP 200)，直接返回文件流 (file stream)。
 * @produces application/octet-stream
 * @router get /api/v1/files/download_recycled_file
 * @request query downloadRecycledFileRequest
 * @response 200 {file} 200 - 文件流
 * @response 500 errorResponse (例如 5121: RECYCLE_BIN_ITEM_NOT_FOUND, 5106: IS_NOT_FILE)
 */

/**
 * @typedef downloadRecycledFileRequest
 * @property {string} recycledId - (必填) 要下载的回收站条目ID。
 */
```

#### 25\. 查看文件回收站文件 (get\_recycled\_entry\_meta)

```javascript
/**
 * @summary 查看回收站条目元数据
 * @description 获取回收站中单个条目的详细信息。
 * @router get /api/v1/files/get_recycled_entry_meta
 * @request query getRecycledEntryMetaRequest
 * @response 200 getRecycledEntryMetaResponse
 * @response 500 errorResponse (例如 5121: RECYCLE_BIN_ITEM_NOT_FOUND)
 */

/**
 * @typedef getRecycledEntryMetaRequest
 * @property {string} recycledId - (必填) 要查看的回收站条目ID。
 */

/**
 * @typedef getRecycledEntryMetaResponse
 * @property {integer} code - 200
 * @property {string} message - "操作成功"
 * @property {recycledEntry} data - 回收站条目详情
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 26\. 删除文件回收站文件 (delete\_recycled\_entry)

```javascript
/**
 * @summary 彻底删除回收站条目
 * @description 永久删除回收站中的一个条目。
 * @router post /api/v1/files/delete_recycled_entry
 * @request body deleteRecycledEntryRequest
 * @response 200 successResponse
 * @response 500 errorResponse (例如 5121: RECYCLE_BIN_ITEM_NOT_FOUND)
 */

/**
 * @typedef deleteRecycledEntryRequest
 * @property {string} recycledId - (必填) 要永久删除的回收站条目ID。
 */
```

#### 27\. 清空文件回收站 (clear\_recycle\_bin)

```javascript
/**
 * @summary 清空文件回收站
 * @description 永久删除回收站中的所有条目。
 * @router post /api/v1/files/clear_recycle_bin
 * @request body
 * @response 200 successResponse
 * @response 500 errorResponse (例如 5123: RECYCLE_BIN_OPERATION_FAILED)
 */
```

#### 28\. (合并后) 配置回收站 (set\_recycle\_bin\_config)

```javascript
/**
 * @summary 配置回收站
 * @description 统一设置回收站的开启、关闭及相关配置（如容量和保留天数）。
 * @router post /api/v1/files/set_recycle_bin_config
 * @request body setRecycleBinConfigRequest
 * @response 200 setRecycleBinConfigResponse
 * @response 500 errorResponse (例如 1000: SYSTEM_ERROR)
 */

/**
 * @typedef setRecycleBinConfigRequest
 * @property {boolean} enabled - (必填) 开启 (true) 或关闭 (false) 回收站。
 * @property {integer} [maxSize] - (可选) 回收站最大总容量 (MB)。仅在 enabled=true 时有效。
 * @property {integer} [maxAge] - (可选) 文件在回收站中保留的最长天数 (例如 30)。仅在 enabled=true 时有效。
 */

/**
 * @typedef setRecycleBinConfigResponse
 * @property {integer} code - 200
 * @property {string} message - "操作成功"
 * @property {recycleBinConfig} data - 回收站当前最新配置
 * @property {integer} timestamp
 * @property {string} requestId
 */
```

#### 29\. (新增) 获取回收站配置 (get\_recycle\_bin\_config)

```javascript
/**
 * @summary 获取回收站配置
 * @description 获取当前文件回收站的配置状态（是否开启、容量、保留天数）。
 * @router get /api/v1/files/get_recycle_bin_config
 * @request query
 * @response 200 setRecycleBinConfigResponse
 * @response 500 errorResponse (例如 1000: SYSTEM_ERROR)
 */
```
