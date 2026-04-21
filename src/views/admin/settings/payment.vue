<script setup lang="ts">
import { getPaymentConfigs, submitPaymentConfig, type PaymentConfig } from '@/api/settings'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const current = ref<PaymentConfig | null>(null)
const form = reactive({
  provider: 'wechat',
  mch_id: '',
  app_id: '',
  api_v3_key: '',
  cert_serial_no: '',
  private_key_pem: '',
  cert_pem: '',
  notify_url: '',
})

async function load() {
  loading.value = true
  try {
    const list = await getPaymentConfigs()
    const wechat = (list || []).find((x) => x.provider === 'wechat') || null
    current.value = wechat
    if (wechat) {
      form.provider = wechat.provider
      form.mch_id = wechat.mch_id
      form.app_id = wechat.app_id
      form.api_v3_key = wechat.api_v3_key
      form.cert_serial_no = wechat.cert_serial_no
      form.private_key_pem = wechat.private_key_pem
      form.cert_pem = wechat.cert_pem
      form.notify_url = wechat.notify_url
    }
  } finally { loading.value = false }
}

async function save() {
  if (!form.mch_id) return ElMessage.warning('请填写商户号')
  if (!form.api_v3_key) return ElMessage.warning('请填写 APIv3 Key')
  await submitPaymentConfig({ ...form })
  ElMessage.success('已提交，等待平台审核')
  load()
}

function auditLabel(s: number) {
  return s === 1 ? '已通过' : s === 2 ? '已驳回' : '待审核'
}
function auditType(s: number): 'success' | 'danger' | 'warning' {
  return s === 1 ? 'success' : s === 2 ? 'danger' : 'warning'
}

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <el-card>
      <template #header>
        <div class="hd">
          <span>收款配置（微信支付）</span>
          <div v-if="current">
            <el-tag :type="auditType(current.audit_status)" style="margin-right:8px">
              {{ auditLabel(current.audit_status) }}
            </el-tag>
            <el-tag :type="current.enabled === 1 ? 'success' : 'info'">
              {{ current.enabled === 1 ? '已启用' : '未启用' }}
            </el-tag>
          </div>
        </div>
      </template>

      <el-alert v-if="current?.audit_status === 2" type="error" :closable="false" style="margin-bottom:12px">
        审核驳回：{{ current.audit_remark || '（无备注）' }}
      </el-alert>
      <el-alert v-else-if="current?.audit_status === 0 && current" type="warning" :closable="false" style="margin-bottom:12px">
        正在等待平台审核，审核通过后自动启用。
      </el-alert>

      <el-form :model="form" label-width="140px">
        <el-form-item label="支付方式">
          <el-select v-model="form.provider" style="width:200px">
            <el-option label="微信支付" value="wechat" />
          </el-select>
        </el-form-item>
        <el-form-item label="商户号 mch_id">
          <el-input v-model="form.mch_id" />
        </el-form-item>
        <el-form-item label="AppID">
          <el-input v-model="form.app_id" />
        </el-form-item>
        <el-form-item label="APIv3 Key">
          <el-input v-model="form.api_v3_key" show-password />
        </el-form-item>
        <el-form-item label="证书序列号">
          <el-input v-model="form.cert_serial_no" />
        </el-form-item>
        <el-form-item label="回调地址 notify_url">
          <el-input v-model="form.notify_url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="商户私钥 PEM">
          <el-input v-model="form.private_key_pem" type="textarea" :rows="5" placeholder="-----BEGIN PRIVATE KEY-----" />
        </el-form-item>
        <el-form-item label="商户证书 PEM">
          <el-input v-model="form.cert_pem" type="textarea" :rows="5" placeholder="-----BEGIN CERTIFICATE-----" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="save">保存并提交审核</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.hd { display:flex; justify-content:space-between; align-items:center; }
</style>
