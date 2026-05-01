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
        <el-form-item label="平台 Logo">
          <ImageUploader v-model="form.platform_logo" folder="logo" scope="platform" usage="platform-logo" :ai-prompt-subject="form.platform_name || '平台'" />
        </el-form-item>
        <el-form-item label="客服电话">
          <el-input v-model="form.support_phone" style="max-width: 260px" />
        </el-form-item>
        <el-form-item label="客服邮箱">
          <el-input v-model="form.support_email" style="max-width: 320px" />
        </el-form-item>

        <el-divider content-position="left">平台微信支付（统一收款商户号）</el-divider>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
          title="这里配置平台统一微信收款商户号，用于租户订阅付费和顾客商品订单付款。"
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
import { getPlatformSettings, updatePlatformSettings, type PlatformGlobalSettings } from '@/api/platformSettings'
import ImageUploader from '@/components/ImageUploader.vue'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const form = ref<PlatformGlobalSettings>({
  id: 1,
  platform_name: '',
  platform_logo: '',
  support_phone: '',
  support_email: '',
  privacy_policy_title: '',
  privacy_policy_effective_date: '',
  privacy_policy_content: '',
  privacy_policy_contact_phone: '',
  privacy_policy_contact_email: '',
  wxpay_app_id: '',
  wxpay_mch_id: '',
  wxpay_apiv3_key: '',
  wxpay_cert_serial: '',
  wxpay_notify_url: '',
  sp_appid: '',
  sp_mchid: '',
  sp_apiv3_key: '',
  sp_cert_serial: '',
  partner_notify_url: '',
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
