<template>
  <div class="page">
    <el-tabs v-model="activeTab">
      <!-- 凭据 -->
      <el-tab-pane label="API 凭据" name="tokens">
        <el-form inline class="filter">
          <el-form-item label="租户ID">
            <el-input-number v-model="tenantId" :min="1" :step="1" :controls="false" placeholder="可留空查全部" style="width: 140px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadTokens">查询</el-button>
            <el-button type="success" @click="openCreate">为租户颁发凭据</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="tokens" border size="small">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column label="租户" min-width="200">
            <template #default="{ row }"><RelatedInfo v-bind="tenantCell(row.tenant_id)" /></template>
          </el-table-column>
          <el-table-column prop="name" label="名称" width="160" />
          <el-table-column prop="app_key" label="AppKey" width="280" />
          <el-table-column prop="app_secret" label="AppSecret(已打码)" width="160" />
          <el-table-column prop="ip_whitelist" label="IP白名单" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280">
            <template #default="{ row }">
              <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleToken(row)">
                {{ row.status === 1 ? '停用' : '启用' }}
              </el-button>
              <el-button size="small" @click="regen(row)">重置密钥</el-button>
              <el-button size="small" type="danger" @click="delToken(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-dialog v-model="createDialog" title="颁发 API 凭据" width="500px">
          <el-form :model="createForm" label-width="110px">
            <el-form-item label="目标租户" required>
              <el-select
                v-model="createForm.tenant_id"
                filterable
                remote
                :remote-method="searchTenants"
                placeholder="搜索公司名/联系人"
                style="width: 100%"
              >
                <el-option
                  v-for="t in tenantOptions"
                  :key="t.id"
                  :label="`#${t.id} ${t.company_name}`"
                  :value="t.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="凭据名称" required>
              <el-input v-model="createForm.name" />
            </el-form-item>
            <el-form-item label="Scopes"><el-input v-model="createForm.scopes" placeholder="order:read,product:write" /></el-form-item>
            <el-form-item label="IP 白名单"><el-input v-model="createForm.ip_whitelist" /></el-form-item>
            <el-form-item label="有效期"><el-input v-model="createForm.expires_at" placeholder="如 2027-12-31" /></el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="createDialog = false">取消</el-button>
            <el-button type="primary" @click="submitCreate">提交</el-button>
          </template>
        </el-dialog>

        <el-dialog v-model="secretDialog" title="凭据密钥（仅此一次显示）" width="520px">
          <el-alert type="warning" :closable="false" show-icon>
            请立即妥善保存 AppSecret，关闭后将无法再次查看。
          </el-alert>
          <el-form label-width="100px" style="margin-top: 16px">
            <el-form-item label="AppKey"><el-input v-model="secretData.app_key" readonly /></el-form-item>
            <el-form-item label="AppSecret"><el-input v-model="secretData.app_secret" readonly /></el-form-item>
          </el-form>
        </el-dialog>
      </el-tab-pane>

      <!-- 调用日志 -->
      <el-tab-pane label="调用日志" name="logs">
        <el-form inline class="filter">
          <el-form-item label="租户ID">
            <el-input-number v-model="logTenantId" :min="1" :step="1" :controls="false" style="width: 120px" />
          </el-form-item>
          <el-form-item label="TokenID">
            <el-input v-model.number="logTokenId" clearable style="width: 120px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadLogs">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="logs" border size="small">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column label="租户" min-width="200">
            <template #default="{ row }"><RelatedInfo v-bind="tenantCell(row.tenant_id)" /></template>
          </el-table-column>
          <el-table-column label="Token" min-width="200">
            <template #default="{ row }"><RelatedInfo v-bind="tokenCell(row.token_id)" /></template>
          </el-table-column>
          <el-table-column prop="method" label="方法" width="80" />
          <el-table-column prop="path" label="路径" />
          <el-table-column prop="status_code" label="Status" width="80" />
          <el-table-column prop="ip" label="IP" width="140" />
          <el-table-column prop="cost_ms" label="耗时(ms)" width="90" />
          <el-table-column prop="created_at" label="时间" width="170" />
        </el-table>
        <el-pagination
          v-model:current-page="logPage"
          :page-size="logSize"
          :total="logTotal"
          layout="total, prev, pager, next"
          style="margin-top: 12px"
          @current-change="loadLogs"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import {
    createApiToken,
    deleteApiToken,
    listApiLogs,
    listApiTokens,
    regenerateApiToken,
    updateApiToken,
    type ApiRequestLog,
    type ApiToken,
} from '@/api/apiAccess'
import { listTenants, type TenantRow } from '@/api/platform'
import RelatedInfo from '@/components/RelatedInfo.vue'
import { loadTenantLookup, loadTokenLookup, tenantInfo, tokenInfo } from '@/utils/adminLookups'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const activeTab = ref('tokens')
const tenantId = ref<number | undefined>(undefined)
const tokens = ref<ApiToken[]>([])
const tenantLookup = ref(new Map<number, TenantRow>())
const tokenLookup = ref(new Map<number, ApiToken>())

function tenantCell(id: number) {
  return tenantInfo(tenantLookup.value.get(Number(id || 0)), id)
}

function tokenCell(id: number) {
  return tokenInfo(tokenLookup.value.get(Number(id || 0)), id)
}

async function loadTokens() {
  tokens.value = await listApiTokens(tenantId.value ? { tenant_id: tenantId.value } : {})
  const next = new Map(tokenLookup.value)
  for (const token of tokens.value) next.set(token.id, token)
  tokenLookup.value = next
  tenantLookup.value = await loadTenantLookup(tokens.value.map((item) => item.tenant_id), tenantLookup.value)
}

// Create
const createDialog = ref(false)
const createForm = reactive({
  tenant_id: 0,
  name: '',
  scopes: '',
  ip_whitelist: '',
  expires_at: '',
  status: 1,
})
const tenantOptions = ref<TenantRow[]>([])
async function searchTenants(q: string) {
  const r = await listTenants({ page: 1, size: 20, keyword: q })
  tenantOptions.value = r.list
}
function openCreate() {
  Object.assign(createForm, { tenant_id: 0, name: '', scopes: '', ip_whitelist: '', expires_at: '', status: 1 })
  tenantOptions.value = []
  createDialog.value = true
}
const secretDialog = ref(false)
const secretData = reactive({ app_key: '', app_secret: '' })
async function submitCreate() {
  if (!createForm.tenant_id) {
    ElMessage.error('请选择目标租户')
    return
  }
  const t = await createApiToken({ ...createForm })
  secretData.app_key = t.app_key
  secretData.app_secret = t.app_secret
  secretDialog.value = true
  createDialog.value = false
  loadTokens()
}

async function toggleToken(row: ApiToken) {
  await updateApiToken(row.id, { ...row, status: row.status === 1 ? 0 : 1 })
  loadTokens()
}
async function regen(row: ApiToken) {
  await ElMessageBox.confirm(`重置 "${row.name}" 的 AppSecret？旧密钥立即失效`, '确认', { type: 'warning' })
  const t = await regenerateApiToken(row.id)
  secretData.app_key = t.app_key
  secretData.app_secret = t.app_secret
  secretDialog.value = true
  loadTokens()
}
async function delToken(row: ApiToken) {
  await ElMessageBox.confirm(`确认删除凭据 "${row.name}"？`, '确认', { type: 'warning' })
  await deleteApiToken(row.id)
  ElMessage.success('已删除')
  loadTokens()
}

// Logs
const logTenantId = ref<number | undefined>(undefined)
const logTokenId = ref<number | undefined>(undefined)
const logs = ref<ApiRequestLog[]>([])
const logPage = ref(1)
const logSize = ref(20)
const logTotal = ref(0)
async function loadLogs() {
  const r = await listApiLogs({
    tenant_id: logTenantId.value,
    token_id: logTokenId.value,
    page: logPage.value,
    size: logSize.value,
  })
  logs.value = r.list
  logTotal.value = r.total
  tenantLookup.value = await loadTenantLookup(logs.value.map((item) => item.tenant_id), tenantLookup.value)
  tokenLookup.value = await loadTokenLookup(logs.value.map((item) => item.token_id), tokenLookup.value)
}

onMounted(() => {
  loadTokens()
  loadLogs()
})
</script>

<style scoped>
.page { padding: 16px; }
.filter { margin-bottom: 12px; }
</style>
