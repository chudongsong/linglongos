<template>
  <div class="l-table-container">
    <table class="l-table" :class="{ 'l-table--bordered': bordered, 'l-table--striped': striped }">
      <thead>
        <tr>
          <th v-if="selectable" class="l-table__selection">
            <LCheckbox
              v-if="data.length > 0"
              :modelValue="isAllSelected"
              @update:modelValue="handleSelectAll"
            />
          </th>
          <th
            v-for="column in columns"
            :key="column.prop"
            :class="[
              'l-table__header-cell',
              column.sortable ? 'l-table__header-cell--sortable' : '',
              column.align ? `l-table__cell--${column.align}` : ''
            ]"
            @click="column.sortable && handleSort(column.prop)"
          >
            {{ column.label }}
            <span v-if="column.sortable" class="l-table__sort-icon">
              <LIcon :name="getSortIconName(column.prop)" />
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in data"
          :key="rowKey ? row[rowKey] : rowIndex"
          :class="{ 'l-table__row--selected': isRowSelected(row) }"
          @click="handleRowClick(row, rowIndex)"
        >
          <td v-if="selectable" class="l-table__selection">
            <LCheckbox
              :modelValue="isRowSelected(row)"
              @update:modelValue="(val) => handleSelect(row, val)"
            />
          </td>
          <td
            v-for="column in columns"
            :key="column.prop"
            :class="[
              'l-table__cell',
              column.align ? `l-table__cell--${column.align}` : ''
            ]"
          >
            <slot :name="column.prop" :row="row" :index="rowIndex">
              {{ row[column.prop] }}
            </slot>
          </td>
        </tr>
        <tr v-if="data.length === 0">
          <td :colspan="columns.length + (selectable ? 1 : 0)" class="l-table__empty">
            <slot name="empty">{{ emptyText }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div v-if="pagination" class="l-table__pagination">
      <slot name="pagination">
        <div class="l-pagination">
          <button
            class="l-pagination__button"
            :disabled="currentPage <= 1"
            @click="handlePageChange(currentPage - 1)"
          >
            上一页
          </button>
          <span class="l-pagination__info">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            class="l-pagination__button"
            :disabled="currentPage >= totalPages"
            @click="handlePageChange(currentPage + 1)"
          >
            下一页
          </button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import LCheckbox from '../base/LCheckbox.vue'
import LIcon from '../base/LIcon.vue'

interface TableColumn {
  label: string
  prop: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

interface Props {
  /** 表格数据 */
  data: Record<string, any>[]
  /** 表格列配置 */
  columns: TableColumn[]
  /** 行数据的键名 */
  rowKey?: string
  /** 是否带有边框 */
  bordered?: boolean
  /** 是否为斑马纹表格 */
  striped?: boolean
  /** 是否可选择 */
  selectable?: boolean
  /** 空数据文本 */
  emptyText?: string
  /** 是否显示分页 */
  pagination?: boolean
  /** 当前页码 */
  currentPage?: number
  /** 每页条数 */
  pageSize?: number
  /** 总条数 */
  total?: number
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  columns: () => [],
  bordered: false,
  striped: false,
  selectable: false,
  emptyText: '暂无数据',
  pagination: false,
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const emit = defineEmits<{
  'row-click': [row: Record<string, any>, index: number]
  'selection-change': [selection: Record<string, any>[]]
  'sort-change': [prop: string, order: 'asc' | 'desc' | null]
  'page-change': [page: number]
}>()

// 选中的行
const selection = ref<Record<string, any>[]>([])

// 排序状态
const sortState = ref<{
  prop: string | null
  order: 'asc' | 'desc' | null
}>({
  prop: null,
  order: null
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize)
})

// 是否全选
const isAllSelected = computed(() => {
  return props.data.length > 0 && selection.value.length === props.data.length
})

// 获取排序图标
const getSortIconName = (prop: string) => {
  if (sortState.value.prop !== prop) return 'sort'
  return sortState.value.order === 'asc' ? 'sort-up' : 'sort-down'
}

// 判断行是否被选中
const isRowSelected = (row: Record<string, any>) => {
  if (!props.rowKey) {
    return selection.value.includes(row)
  }
  return selection.value.some(item => item[props.rowKey!] === row[props.rowKey!])
}

// 处理行点击
const handleRowClick = (row: Record<string, any>, index: number) => {
  emit('row-click', row, index)
}

// 处理选择行
const handleSelect = (row: Record<string, any>, selected: boolean) => {
  if (selected) {
    selection.value.push(row)
  } else {
    const index = props.rowKey
      ? selection.value.findIndex(item => item[props.rowKey!] === row[props.rowKey!])
      : selection.value.indexOf(row)
    
    if (index !== -1) {
      selection.value.splice(index, 1)
    }
  }
  
  emit('selection-change', [...selection.value])
}

// 处理全选
const handleSelectAll = (selected: boolean) => {
  selection.value = selected ? [...props.data] : []
  emit('selection-change', [...selection.value])
}

// 处理排序
const handleSort = (prop: string) => {
  let order: 'asc' | 'desc' | null = 'asc'
  
  if (sortState.value.prop === prop) {
    if (sortState.value.order === 'asc') {
      order = 'desc'
    } else if (sortState.value.order === 'desc') {
      order = null
    }
  }
  
  sortState.value = { prop, order }
  emit('sort-change', prop, order)
}

// 处理页码变化
const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  emit('page-change', page)
}

// 清空选择
const clearSelection = () => {
  selection.value = []
  emit('selection-change', [])
}

// 暴露方法
defineExpose({
  clearSelection
})
</script>

<script lang="ts">
export default {
  name: 'LTable'
}
</script>

<style scoped>
.l-table-container {
  width: 100%;
  overflow-x: auto;
}

.l-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  font-size: 14px;
  color: var(--l-text-color, #606266);
}

.l-table__header-cell,
.l-table__cell {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--l-border-color, #ebeef5);
}

.l-table__header-cell {
  font-weight: 600;
  background-color: var(--l-table-header-bg, #f5f7fa);
  color: var(--l-text-color-primary, #303133);
}

.l-table__header-cell--sortable {
  cursor: pointer;
}

.l-table__sort-icon {
  margin-left: 5px;
  vertical-align: middle;
}

.l-table__cell--center {
  text-align: center;
}

.l-table__cell--right {
  text-align: right;
}

.l-table__selection {
  width: 48px;
  text-align: center;
}

.l-table__row--selected {
  background-color: var(--l-table-row-selected-bg, #f0f7ff);
}

.l-table__empty {
  padding: 20px;
  text-align: center;
  color: var(--l-text-color-secondary, #909399);
}

.l-table--bordered {
  border: 1px solid var(--l-border-color, #ebeef5);
}

.l-table--bordered .l-table__header-cell,
.l-table--bordered .l-table__cell {
  border-right: 1px solid var(--l-border-color, #ebeef5);
}

.l-table--striped tr:nth-child(even) {
  background-color: var(--l-table-row-striped-bg, #fafafa);
}

.l-table__pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.l-pagination {
  display: flex;
  align-items: center;
}

.l-pagination__button {
  padding: 6px 12px;
  border: 1px solid var(--l-border-color, #dcdfe6);
  background-color: #fff;
  color: var(--l-text-color, #606266);
  cursor: pointer;
  border-radius: 4px;
  margin: 0 5px;
}

.l-pagination__button:hover:not(:disabled) {
  color: var(--l-primary-color, #409eff);
  border-color: var(--l-primary-color, #409eff);
}

.l-pagination__button:disabled {
  cursor: not-allowed;
  color: var(--l-disabled-text-color, #c0c4cc);
  background-color: var(--l-disabled-bg-color, #f5f7fa);
}

.l-pagination__info {
  font-size: 14px;
  color: var(--l-text-color, #606266);
}
</style>