<script setup lang="ts">
import { getPaymentConfigs, submitPaymentConfig, type PaymentConfig } from '@/api/settings'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

const loading = ref(false)
const current = ref<PaymentConfig | null>(null)
const form = reactive({
  provider: 'manual_settlement',
  mch_id: '',
  app_id: '',
  sp_appid: '',
  sp_mchid: '',
  sub_appid: '',
  sub_mchid: '',
  settlement_account_name: '',
  settlement_account_no: '',
  settlement_bank_name: '',
  settlement_remark: '',
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
    const wechat = (list || []).find((x) => x.provider === 'manual_settlement') || (list || []).find((x) => x.provider === 'wechat') || null
    current.value = wechat
    if (wechat) {
      form.provider = wechat.provider
      form.mch_id = wechat.mch_id || ''
      form.app_id = wechat.app_id || ''
      form.sp_appid = wechat.sp_appid || ''
      form.sp_mchid = wechat.sp_mchid || ''
      form.sub_appid = wechat.sub_appid || ''
      form.sub_mchid = wechat.sub_mchid || ''
      form.settlement_account_name = wechat.settlement_account_name || ''
      form.settlement_account_no = wechat.settlement_account_no || ''
      form.settlement_bank_name = wechat.settlement_bank_name || ''
      form.settlement_remark = wechat.settlement_remark || ''
      form.api_v3_key = wechat.api_v3_key || ''
      form.cert_serial_no = wechat.cert_serial_no || ''
      form.private_key_pem = wechat.private_key_pem || ''
      form.cert_pem = wechat.cert_pem || ''
      form.notify_url = wechat.notify_url || ''
    }
  } finally { loading.value = false }
}

async function save() {
  if (!form.settlement_account_name || !form.settlement_account_no) return ElMessage.warning('请填写结算户名和结算账号')
  await submitPaymentConfig({ ...form })
  ElMessage.success('结算资料已提交，等待平台审核')
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
          <span>结算资料</span>
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
        正在等待平台审核，审核通过后进入账期结算候选范围。
      </el-alert>

      <el-form :model="form" label-width="140px">
        <el-form-item label="支付方式">
          <el-select v-model="form.provider" style="width:200px">
            <el-option label="账期结算" value="manual_settlement" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">账期结算账户</el-divider>
        <el-form-item label="结算户名">
          <el-input v-model="form.settlement_account_name" maxlength="100" />
        </el-form-item>
        <el-form-item label="结算账号">
          <el-input v-model="form.settlement_account_no" maxlength="128" />
        </el-form-item>
        <el-form-item label="开户行/渠道">
          <el-input v-model="form.settlement_bank_name" maxlength="100" />
        </el-form-item>
        <el-form-item label="结算备注">
          <el-input v-model="form.settlement_remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
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
