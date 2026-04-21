<template>
  <div class="page">
    <div class="header">
      <h3>私有部署管理</h3>
      <div>
        <el-select v-model="mode" placeholder="全部" clearable style="width: 140px" @change="load">
          <el-option label="共享集群" value="shared" />
          <el-option label="私有部署" value="private" />
        </el-select>
        <el-button @click="load" style="margin-left: 8px">刷新</el-button>
        <el-button type="success" @click="openEdit()" style="margin-left: 8px">新增 / 登记</el-button>
      </div>
    </div>
    <el-table :data="rows" border size="small">
      <el-table-column prop="tenant_id" label="租户ID" width="90" />
      <el-table-column label="部署模式" width="120">
        <template #default="{ row }">
          <el-tag :type="row.deployment_mode === 'private' ? 'danger' : 'info'" size="small">
            {{ row.deployment_mode === 'private' ? '私有' : '共享' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="private_endpoint" label="私有端点" />
      <el-table-column prop="private_notes" label="运维备注" />
      <el-table-column prop="updated_at" label="最近更新" width="180" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="editDialog" title="登记 / 更新部署" width="520px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="目标租户" required>
          <el-input v-model.number="form.tenant_id" :disabled="!!form.id" placeholder="租户 ID" />
        </el-form-item>
        <el-form-item label="部署模式" required>
          <el-radio-group v-model="form.deployment_mode">
            <el-radio value="shared">共享集群</el-radio>
            <el-radio value="private">私有部署</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="私有端点">
          <el-input v-model="form.private_endpoint" placeholder="https://pri.example.com" />
        </el-form-item>
        <el-form-item label="运维备注">
          <el-input v-model="form.private_notes" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { listDeployments, updateDeployment, type TenantSiteConfig } from '@/api/platformOps'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const mode = ref('')
const rows = ref<TenantSiteConfig[]>([])

async function load() {
  rows.value = await listDeployments(mode.value ? { mode: mode.value } : {})
}

const editDialog = ref(false)
const form = reactive<{
  id?: number
  tenant_id: number
  deployment_mode: string
  private_endpoint: string
  private_notes: string
}>({ tenant_id: 0, deployment_mode: 'shared', private_endpoint: '', private_notes: '' })

function openEdit(row?: TenantSiteConfig) {
  if (row) {
    form.id = row.tenant_id
    form.tenant_id = row.tenant_id
    form.deployment_mode = row.deployment_mode || 'shared'
    form.private_endpoint = row.private_endpoint || ''
    form.private_notes = row.private_notes || ''
  } else {
    form.id = undefined
    form.tenant_id = 0
    form.deployment_mode = 'shared'
    form.private_endpoint = ''
    form.private_notes = ''
  }
  editDialog.value = true
}
async function save() {
  if (!form.tenant_id) {
    ElMessage.error('请填写租户 ID')
    return
  }
  await updateDeployment({
    tenant_id: form.tenant_id,
    deployment_mode: form.deployment_mode,
    private_endpoint: form.private_endpoint,
    private_notes: form.private_notes,
  })
  ElMessage.success('已保存')
  editDialog.value = false
  load()
}

onMounted(load)
</script>

<style scoped>
.page { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.header h3 { margin: 0; }
</style>
