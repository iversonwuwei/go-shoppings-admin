<template>
  <div class="page">
    <el-tabs v-model="activeTab">
      <!-- 全局网关 -->
      <el-tab-pane label="短信网关（全局）" name="settings">
        <el-form :model="settings" label-width="140px" style="max-width: 640px">
          <el-form-item label="启用">
            <el-switch v-model="settings.enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="服务商">
            <el-select v-model="settings.provider" style="width: 200px">
              <el-option label="阿里云" value="aliyun" />
              <el-option label="腾讯云" value="tencent" />
              <el-option label="华为云" value="huawei" />
            </el-select>
          </el-form-item>
          <el-form-item label="AccessKey">
            <el-input v-model="settings.access_key" />
          </el-form-item>
          <el-form-item label="AccessSecret">
            <el-input v-model="settings.access_secret" placeholder="保留 ******** 表示不修改" />
          </el-form-item>
          <el-form-item label="签名">
            <el-input v-model="settings.sign_name" />
          </el-form-item>
          <el-form-item label="Region">
            <el-input v-model="settings.region" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="settings.remark" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveSettings">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 模板审核 -->
      <el-tab-pane label="模板审核" name="templates">
        <el-form inline class="filter">
          <el-form-item label="租户ID">
            <el-input v-model.number="tplTenantId" placeholder="可留空查全部" clearable style="width: 140px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadTemplates">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="templates" border size="small">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="tenant_id" label="租户" width="90" />
          <el-table-column prop="code" label="Code" width="140" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="template_id" label="平台模板号" width="160" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
                {{ row.enabled === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button size="small" @click="editTpl(row)">编辑</el-button>
              <el-button size="small" :type="row.enabled === 1 ? 'warning' : 'success'" @click="toggleTpl(row)">
                {{ row.enabled === 1 ? '停用' : '启用' }}
              </el-button>
              <el-button size="small" type="danger" @click="delTpl(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-dialog v-model="tplDialog" title="编辑模板" width="520px">
          <el-form :model="tplForm" label-width="120px">
            <el-form-item label="Code"><el-input v-model="tplForm.code" /></el-form-item>
            <el-form-item label="名称"><el-input v-model="tplForm.name" /></el-form-item>
            <el-form-item label="平台模板号"><el-input v-model="tplForm.template_id" /></el-form-item>
            <el-form-item label="内容">
              <el-input v-model="tplForm.content" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="启用">
              <el-switch v-model="tplForm.enabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="tplDialog = false">取消</el-button>
            <el-button type="primary" @click="saveTpl">保存</el-button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- 发送日志 -->
      <el-tab-pane label="发送日志" name="logs">
        <el-form inline class="filter">
          <el-form-item label="租户ID">
            <el-input v-model.number="logTenantId" clearable style="width: 120px" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="logPhone" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadLogs">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="logs" border size="small">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="tenant_id" label="租户" width="80" />
          <el-table-column prop="phone" label="手机号" width="140" />
          <el-table-column prop="code" label="Code" width="140" />
          <el-table-column prop="content" label="内容" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
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
    deleteSmsTemplate,
    getSmsSettings,
    listSmsLogs,
    listSmsTemplates,
    updateSmsSettings,
    updateSmsTemplate,
    type SmsLog,
    type SmsSettings,
    type SmsTemplate,
} from '@/api/sms'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const activeTab = ref('settings')

const settings = reactive<SmsSettings>({
  enabled: 0,
  provider: 'aliyun',
  access_key: '',
  access_secret: '',
  sign_name: '',
  region: '',
  remark: '',
})

async function loadSettings() {
  const d = await getSmsSettings()
  Object.assign(settings, d)
}
async function saveSettings() {
  const d = await updateSmsSettings({ ...settings })
  Object.assign(settings, d)
  ElMessage.success('已保存')
}

// Templates
const tplTenantId = ref<number | undefined>(undefined)
const templates = ref<SmsTemplate[]>([])
const tplDialog = ref(false)
const tplForm = reactive<Partial<SmsTemplate> & { id?: number }>({})

async function loadTemplates() {
  templates.value = await listSmsTemplates(tplTenantId.value ? { tenant_id: tplTenantId.value } : {})
}
function editTpl(row: SmsTemplate) {
  Object.assign(tplForm, row)
  tplDialog.value = true
}
async function saveTpl() {
  if (!tplForm.id) return
  await updateSmsTemplate(tplForm.id, tplForm)
  ElMessage.success('已保存')
  tplDialog.value = false
  loadTemplates()
}
async function toggleTpl(row: SmsTemplate) {
  await updateSmsTemplate(row.id, { ...row, enabled: row.enabled === 1 ? 0 : 1 })
  loadTemplates()
}
async function delTpl(row: SmsTemplate) {
  await ElMessageBox.confirm(`确认删除模板 "${row.name}"？`, '确认', { type: 'warning' })
  await deleteSmsTemplate(row.id)
  ElMessage.success('已删除')
  loadTemplates()
}

// Logs
const logTenantId = ref<number | undefined>(undefined)
const logPhone = ref('')
const logs = ref<SmsLog[]>([])
const logPage = ref(1)
const logSize = ref(20)
const logTotal = ref(0)

async function loadLogs() {
  const r = await listSmsLogs({
    tenant_id: logTenantId.value,
    phone: logPhone.value,
    page: logPage.value,
    size: logSize.value,
  })
  logs.value = r.list
  logTotal.value = r.total
}

onMounted(() => {
  loadSettings()
  loadTemplates()
  loadLogs()
})
</script>

<style scoped>
.page { padding: 16px; }
.filter { margin-bottom: 12px; }
</style>
