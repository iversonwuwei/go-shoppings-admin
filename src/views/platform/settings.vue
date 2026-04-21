<template>
  <div class="settings-page">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span>平台设置</span>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </div>
      </template>
      <el-form :model="form" label-width="140px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-form-item label="平台名称">
          <el-input v-model="form.platform_name" placeholder="如：WxMall SaaS" style="max-width: 420px" />
        </el-form-item>
        <el-form-item label="平台 Logo URL">
          <el-input v-model="form.platform_logo" placeholder="https://..." style="max-width: 420px" />
        </el-form-item>
        <el-form-item label="客服电话">
          <el-input v-model="form.support_phone" style="max-width: 260px" />
        </el-form-item>
        <el-form-item label="客服邮箱">
          <el-input v-model="form.support_email" style="max-width: 320px" />
        </el-form-item>

        <el-divider content-position="left">平台微信支付（订阅付费统一商户号）</el-divider>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
          title="这里配置的是平台自己收取租户订阅费用的微信支付商户号，与各租户商品订单所用的商户号相互独立。"
        />
        <el-form-item label="AppID">
          <el-input v-model="form.wxpay_app_id" style="max-width: 420px" />
        </el-form-item>
        <el-form-item label="商户号 MchID">
          <el-input v-model="form.wxpay_mch_id" style="max-width: 260px" />
        </el-form-item>
        <el-form-item label="APIv3 密钥">
          <el-input v-model="form.wxpay_apiv3_key" show-password style="max-width: 420px" />
        </el-form-item>
        <el-form-item label="证书序列号">
          <el-input v-model="form.wxpay_cert_serial" style="max-width: 420px" />
        </el-form-item>
        <el-form-item label="回调 URL">
          <el-input v-model="form.wxpay_notify_url" placeholder="https://your-domain/api/v1/public/subscription/callback" style="max-width: 560px" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPlatformSettings, updatePlatformSettings, type PlatformGlobalSettings } from '@/api/platformSettings'

const form = ref<PlatformGlobalSettings>({
  id: 1,
  platform_name: '',
  platform_logo: '',
  support_phone: '',
  support_email: '',
  wxpay_app_id: '',
  wxpay_mch_id: '',
  wxpay_apiv3_key: '',
  wxpay_cert_serial: '',
  wxpay_notify_url: '',
})
const saving = ref(false)

async function load() {
  const r = await getPlatformSettings()
  if (r) form.value = { ...form.value, ...r }
}

async function save() {
  saving.value = true
  try {
    await updatePlatformSettings(form.value)
    ElMessage.success('已保存')
    load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.settings-page { padding: 16px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
</style>
