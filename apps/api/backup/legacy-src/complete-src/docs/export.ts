/**
 * 文档导出脚本
 *
 * 将 OpenAPI 3.0 文档导出为 JSON 与 YAML 文件，输出到 public/api-docs 目录。
 * 该脚本可通过 pnpm docs:export 执行，方便团队下载或集成到其他工具。
 */
import fs from 'fs/promises'
import path from 'path'
import YAML from 'yaml'
import { getOpenApiSpec } from './openapi.js'

/**
 * ensureDir - 确保目录存在，不存在则创建
 *
 * @param dir 目标目录绝对路径
 */
async function ensureDir(dir: string): Promise<void> {
	try {
		await fs.mkdir(dir, { recursive: true })
	} catch {}
}

/**
 * exportDocs - 导出 OpenAPI 文档到 public/api-docs
 *
 * @returns Promise<void>
 */
async function exportDocs(): Promise<void> {
	const spec = getOpenApiSpec()
	const outDir = path.join(process.cwd(), 'public', 'api-docs')
	await ensureDir(outDir)

	const jsonPath = path.join(outDir, 'openapi.json')
	const yamlPath = path.join(outDir, 'openapi.yaml')

	await fs.writeFile(jsonPath, JSON.stringify(spec, null, 2), 'utf-8')
	await fs.writeFile(yamlPath, YAML.stringify(spec), 'utf-8')

	console.log(`[docs] 导出成功：\n- ${jsonPath}\n- ${yamlPath}`)
}

// 入口执行
exportDocs().catch((err) => {
	console.error('[docs] 导出失败：', err?.message || err)
	process.exit(1)
})
