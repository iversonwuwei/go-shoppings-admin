<script setup lang="ts">
import {
  createAfterSaleReason,
  deleteAfterSaleReason,
  listAfterSaleReasons,
  toggleAfterSaleReason,
  updateAfterSaleReason,
  type AfterSaleReason,
} from '@/api/settings'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const rows = ref<AfterSaleReason[]>([])
const dialogVisible = ref(false)
const editing = ref<AfterSaleReason | null>(null)

const form = reactive<Partial<AfterSaleReason>>({
  code: '',
  label: '',
  type: 'all',
  sort_order: 0,
  enabled: 1,
})

const typeMap: Record<string, string> = {
  all: '通用',
  refund: '仅退款',
  return_refund: '退货退款',
}

async function load() {
  loading.value = true
  try {
    rows.value = await listAfterSaleReasons()
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, { code: '', label: '', type: 'all', sort_order: 0, enabled: 1 })
}

function openCreate() {
  editing.value = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: AfterSaleReason) {
  editing.value = row
  Object.assign(form, {
    code: row.code,
    label: row.label,
    type: row.type,
    sort_order: row.sort_order,
    enabled: row.enabled,
  })
  dialogVisible.value = true
}

async function save() {
  if (!form.code || !form.label) return ElMessage.warning('请填写编码和原因文案')
  if (editing.value) await updateAfterSaleReason(editing.value.id, form)
  else await createAfterSaleReason(form)
  ElMessage.success('已保存')
  dialogVisible.value = false
  load()
}

async function onToggle(row: AfterSaleReason, val: string | number | boolean) {
  const enabled = !!val
  try {
    await toggleAfterSaleReason(row.id, enabled)
    row.enabled = enabled ? 1 : 0
    ElMessage.success(enabled ? '已启用' : '已停用')
  } catch {
    row.enabled = enabled ? 0 : 1
  }
}

async function remove(row: AfterSaleReason) {
  await ElMessageBox.confirm(`确定删除售后原因【${row.label}】？已被历史售后使用的原因不能删除。`, '提示', { type: 'warning' })
  await deleteAfterSaleReason(row.id)
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="hd">
        <span>售后原因（平台统一维护）</span>
        <el-button type="primary" @click="openCreate">新增原因</el-button>
      </div>
    </template>

    <el-table :data="rows" stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="code" label="编码" min-width="160" />
      <el-table-column prop="label" label="原因文案" min-width="180" show-overflow-tooltip />
      <el-table-column label="适用类型" width="120">
        <template #default="{ row }">{{ typeMap[row.type] || row.type }}</template>
      </el-table-column>
      <el-table-column prop="sort_order" label="排序" width="90" />
      <el-table-column label="启用" width="110">
        <template #default="{ row }">
          <el-switch :model-value="row.enabled === 1" @change="(v: string | number | boolean) => onToggle(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑售后原因' : '新增售后原因'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="编码">
          <el-input v-model="form.code" placeholder="如 quality_issue" />
        </el-form-item>
        <el-form-item label="原因文案">
          <el-input v-model="form.label" placeholder="如 商品破损" />
        </el-form-item>
        <el-form-item label="适用类型">
          <el-select v-model="form.type" style="width: 220px">
            <el-option label="通用" value="all" />
            <el-option label="仅退款" value="refund" />
            <el-option label="退货退款" value="return_refund" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch :model-value="form.enabled === 1" @change="(v: string | number | boolean) => (form.enabled = v ? 1 : 0)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
</style>
