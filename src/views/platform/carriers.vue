<script setup lang="ts">
import {
    createCarrier,
    deleteCarrier,
    listAllCarriers,
    toggleCarrier,
    updateCarrier,
    type Carrier,
} from '@/api/settings'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const list = ref<Carrier[]>([])
const dialogVisible = ref(false)
const editing = ref<Carrier | null>(null)
const form = reactive<Partial<Carrier>>({
  code: '', name: '', api_provider: 'none',
  api_customer: '', api_key: '', api_secret: '', priority: 0, enabled: 1,
})

async function load() {
  loading.value = true
  try { list.value = await listAllCarriers() } finally { loading.value = false }
}

function openCreate() {
  editing.value = null
  Object.assign(form, { code:'', name:'', api_provider:'none', api_customer:'', api_key:'', api_secret:'', priority:0, enabled:1 })
  dialogVisible.value = true
}
function openEdit(row: Carrier) {
  editing.value = row
  Object.assign(form, {
    code: row.code, name: row.name, api_provider: row.api_provider,
    api_customer: row.api_customer, api_key: '', api_secret: '',
    priority: row.priority, enabled: row.enabled,
  })
  dialogVisible.value = true
}
async function save() {
  if (!form.code || !form.name) return ElMessage.warning('请填写编码与名称')
  if (editing.value) await updateCarrier(editing.value.id, form)
  else await createCarrier(form)
  ElMessage.success('已保存')
  dialogVisible.value = false
  load()
}
async function remove(row: Carrier) {
  await ElMessageBox.confirm(`确定删除承运商【${row.name}】?`, '提示', { type: 'warning' })
  await deleteCarrier(row.id)
  ElMessage.success('已删除')
  load()
}
async function onToggle(row: Carrier, val: string | number | boolean) {
  const enabled = !!val
  try {
    await toggleCarrier(row.id, enabled)
    row.enabled = enabled ? 1 : 0
    ElMessage.success(enabled ? '已启用' : '已停用')
  } catch { row.enabled = enabled ? 0 : 1 }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card v-loading="loading">
      <template #header>
        <div class="hd">
          <span>物流承运商（平台统一维护）</span>
          <el-button type="primary" @click="openCreate">新增承运商</el-button>
        </div>
      </template>

      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="code" label="编码" width="120" />
        <el-table-column prop="name" label="名称" width="160" />
        <el-table-column prop="api_provider" label="对接方" width="140" />
        <el-table-column prop="api_customer" label="Customer" width="160" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="90" />
        <el-table-column label="启用" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled === 1"
              @change="(v: string | number | boolean) => onToggle(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑承运商' : '新增承运商'" width="640px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="编码">
          <el-input v-model="form.code" placeholder="如 sf / yto / zto / sto" :disabled="!!editing" />
        </el-form-item>
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="顺丰/圆通/中通…" /></el-form-item>
        <el-form-item label="对接方">
          <el-select v-model="form.api_provider" style="width:220px">
            <el-option label="不对接" value="none" />
            <el-option label="快递100" value="kuaidi100" />
            <el-option label="阿里云物流查询" value="aliyun" />
            <el-option label="顺丰开放平台" value="sf" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户编号">
          <el-input v-model="form.api_customer" placeholder="快递100 customer" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="form.api_key" :placeholder="editing ? '留空表示不修改' : ''" />
        </el-form-item>
        <el-form-item label="API Secret">
          <el-input v-model="form.api_secret" show-password :placeholder="editing ? '留空表示不修改' : ''" />
        </el-form-item>
        <el-form-item label="优先级"><el-input-number v-model="form.priority" :min="0" /></el-form-item>
        <el-form-item label="启用">
          <el-switch :model-value="form.enabled === 1"
            @change="(v: string | number | boolean) => (form.enabled = v ? 1 : 0)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>.hd{display:flex;justify-content:space-between;align-items:center;}</style>
