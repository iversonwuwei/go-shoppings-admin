<template>
  <div class="page">
    <el-tabs v-model="activeTab">
      <!-- 阿里云短信 -->
      <el-tab-pane label="阿里云短信" name="settings">
        <el-form :model="settings" label-width="140px" style="max-width: 640px">
          <el-form-item label="启用">
            <el-switch v-model="settings.enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item label="AccessKey">
            <el-input v-model="settings.access_key" placeholder="阿里云 AccessKey ID" />
          </el-form-item>
          <el-form-item label="AccessSecret">
            <el-input v-model="settings.access_secret" placeholder="保留 ******** 表示不修改" />
          </el-form-item>
          <el-form-item label="短信签名名称">
            <el-input v-model="settings.sign_name" placeholder="阿里云已审核签名名称，不含【】" />
          </el-form-item>
          <el-form-item label="TemplateCode">
            <el-input v-model="templateCode" placeholder="例如 SMS_123456789" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveSmsConfig">保存</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 平台发送日志 -->
      <el-tab-pane label="平台发送日志" name="logs">
        <el-form inline class="filter">
          <el-form-item label="手机号">
            <el-input v-model="logPhone" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadLogs">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="logs" border size="small">
          <el-table-column prop="id" label="ID" width="70" />
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
  createSmsTemplate,
  getSmsSettings,
  listSmsLogs,
  listSmsTemplates,
  updateSmsSettings,
  updateSmsTemplate,
  type SmsLog,
  type SmsSettings,
} from '@/api/sms'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const activeTab = ref('settings')

type SmsSettingsForm = Pick<SmsSettings, 'enabled' | 'provider' | 'access_key' | 'access_secret' | 'sign_name'>

const settings = reactive<SmsSettingsForm>({
  enabled: 0,
  provider: 'aliyun',
  access_key: '',
  access_secret: '',
  sign_name: '',
})

function ignoreRequestError(_error: unknown) {
  // API interceptor already shows request errors and handles login expiry.
}

async function loadSettings() {
  try {
    const d = await getSmsSettings()
    settings.enabled = d.enabled || 0
    settings.provider = d.provider || 'aliyun'
    settings.access_key = d.access_key || ''
    settings.access_secret = d.access_secret || ''
    settings.sign_name = d.sign_name || ''
  } catch (error) {
    ignoreRequestError(error)
  }
}

const bindingMeta = [
  { code: 'apply', label: '入驻申请验证码' },
  { code: 'login', label: '平台短信登录' },
  { code: 'reset_password', label: '找回密码验证码' },
]

const templateCode = ref('')
const templateIds = ref<Record<string, number>>({})

async function loadTemplates() {
  try {
    const templates = await listSmsTemplates()
    const ids: Record<string, number> = {}
    const byCode = new Map<string, string>()
    for (const item of templates) {
      if (!ids[item.code]) ids[item.code] = item.id
      if (!byCode.has(item.code) && item.template_id) byCode.set(item.code, item.template_id)
    }
    templateIds.value = ids
    templateCode.value = byCode.get('apply') || byCode.get('login') || byCode.get('reset_password') || ''
  } catch (error) {
    ignoreRequestError(error)
  }
}

async function saveTemplateCode(code: string) {
  for (const item of bindingMeta) {
    const payload = {
      code: item.code,
      name: item.label,
      template_id: code,
      content: '',
      enabled: 1,
    }
    const id = templateIds.value[item.code]
    if (id) {
      await updateSmsTemplate(id, payload)
    } else {
      const created = await createSmsTemplate(payload)
      templateIds.value[item.code] = created.id
    }
  }
}

async function saveSmsConfig() {
  const code = templateCode.value.trim()
  if (settings.enabled === 1) {
    if (!settings.access_key.trim() || !settings.access_secret.trim()) {
      ElMessage.error('请填写阿里云 AccessKey 和 AccessSecret')
      return
    }
    if (!settings.sign_name.trim()) {
      ElMessage.error('请填写阿里云短信签名名称')
      return
    }
    if (!code) {
      ElMessage.error('请填写阿里云 TemplateCode')
      return
    }
  }
  try {
    const d = await updateSmsSettings({
      enabled: settings.enabled,
      provider: settings.provider || 'aliyun',
      access_key: settings.access_key,
      access_secret: settings.access_secret,
      sign_name: settings.sign_name.trim(),
    })
    settings.enabled = d.enabled || 0
    settings.provider = d.provider || 'aliyun'
    settings.access_key = d.access_key || ''
    settings.access_secret = d.access_secret || ''
    settings.sign_name = d.sign_name || ''
    if (code) {
      await saveTemplateCode(code)
      await loadTemplates()
    }
    ElMessage.success('已保存')
  } catch (error) {
    ignoreRequestError(error)
  }
}

// Logs
const logPhone = ref('')
const logs = ref<SmsLog[]>([])
const logPage = ref(1)
const logSize = ref(20)
const logTotal = ref(0)

async function loadLogs() {
  try {
    const r = await listSmsLogs({
      phone: logPhone.value,
      page: logPage.value,
      size: logSize.value,
    })
    logs.value = r.list
    logTotal.value = r.total
  } catch (error) {
    ignoreRequestError(error)
  }
}

onMounted(() => {
  void loadSettings()
  void loadTemplates()
  void loadLogs()
})
</script>

<style scoped>
.page { padding: 16px; }
.filter { margin-bottom: 12px; }
</style>
