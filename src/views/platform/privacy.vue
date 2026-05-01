<template>
  <div class="privacy-page">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span>微信小程序隐私协议</span>
          <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
        title="请按微信小程序隐私协议规范维护：信息收集目的、使用方式、共享规则、存储与保护、用户权利、未成年人保护、协议更新与联系方式。"
      />

      <el-form :model="form" label-width="160px" style="max-width: 980px">
        <el-form-item label="协议标题">
          <el-input v-model="form.privacy_policy_title" placeholder="如：微信小程序隐私保护指引" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="生效日期">
          <el-input v-model="form.privacy_policy_effective_date" placeholder="如：2026-05-01" style="max-width: 240px" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.privacy_policy_contact_phone" placeholder="建议填写客服热线" style="max-width: 300px" />
        </el-form-item>
        <el-form-item label="联系邮箱">
          <el-input v-model="form.privacy_policy_contact_email" placeholder="建议填写客服邮箱" style="max-width: 360px" />
        </el-form-item>
        <el-form-item label="协议正文">
          <el-input
            v-model="form.privacy_policy_content"
            type="textarea"
            :rows="18"
            maxlength="12000"
            show-word-limit
            placeholder="请按微信小程序隐私协议标准填写完整条款"
          />
        </el-form-item>

        <el-form-item>
          <el-button @click="fillTemplate">填充标准模板</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <div class="preview-title">页面预览</div>
      </template>
      <h3 class="preview-main-title">{{ form.privacy_policy_title || '微信小程序隐私保护指引' }}</h3>
      <p class="preview-meta">生效日期：{{ form.privacy_policy_effective_date || '-' }}</p>
      <pre class="preview-content">{{ form.privacy_policy_content || '请先填写协议正文。' }}</pre>
      <p v-if="form.privacy_policy_contact_phone" class="preview-meta">联系电话：{{ form.privacy_policy_contact_phone }}</p>
      <p v-if="form.privacy_policy_contact_email" class="preview-meta">联系邮箱：{{ form.privacy_policy_contact_email }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { getPlatformPrivacyPolicy, updatePlatformPrivacyPolicy, type PlatformPrivacyPolicy } from '@/api/privacyPolicy'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const form = ref<PlatformPrivacyPolicy>({
  privacy_policy_title: '',
  privacy_policy_effective_date: '',
  privacy_policy_content: '',
  privacy_policy_contact_phone: '',
  privacy_policy_contact_email: '',
})
const saving = ref(false)

function defaultTemplate() {
  return [
    '1. 我们如何收集和使用个人信息',
    '为保障小程序基础服务，我们会在你使用注册登录、下单支付、售后服务、地址管理等功能时，按最小必要原则收集对应信息，并仅用于实现该功能。',
    '',
    '2. 我们如何共享、转让、公开披露个人信息',
    '除法律法规要求或经你单独同意外，我们不会向无关第三方共享你的个人信息。',
    '',
    '3. 我们如何存储个人信息',
    '我们仅在实现服务目的所必需期限内保存你的个人信息，并采取访问控制、传输加密等安全措施。',
    '',
    '4. 你如何管理个人信息',
    '你可以通过小程序中的个人中心功能访问、更正、删除部分信息，或通过下方联系方式申请处理。',
    '',
    '5. 未成年人保护',
    '若你是未满 14 周岁的未成年人，请在监护人指导下使用本服务。',
    '',
    '6. 协议更新',
    '当隐私协议发生重大变更时，我们将通过页面公告等方式提示你。',
  ].join('\n')
}

async function load() {
  try {
    const data = await getPlatformPrivacyPolicy()
    if (data) form.value = { ...form.value, ...data }
  } catch {
    // request interceptor already handles message and auth redirect
  }
}

function fillTemplate() {
  if (!form.value.privacy_policy_title) {
    form.value.privacy_policy_title = '微信小程序隐私保护指引'
  }
  if (!form.value.privacy_policy_effective_date) {
    form.value.privacy_policy_effective_date = '2026-05-01'
  }
  if (!form.value.privacy_policy_content) {
    form.value.privacy_policy_content = defaultTemplate()
  }
}

async function save() {
  saving.value = true
  try {
    const saved = await updatePlatformPrivacyPolicy({
      privacy_policy_title: form.value.privacy_policy_title,
      privacy_policy_effective_date: form.value.privacy_policy_effective_date,
      privacy_policy_content: form.value.privacy_policy_content,
      privacy_policy_contact_phone: form.value.privacy_policy_contact_phone,
      privacy_policy_contact_email: form.value.privacy_policy_contact_email,
    })
    if (saved) form.value = { ...form.value, ...saved }
    ElMessage.success('隐私协议已保存')
  } catch {
    // request interceptor already handles error feedback
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<style scoped>
.privacy-page {
  padding: 16px;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-title {
  font-weight: 600;
}

.preview-main-title {
  margin: 0;
  font-size: 20px;
}

.preview-meta {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}

.preview-content {
  margin: 12px 0;
  padding: 12px;
  border-radius: 8px;
  background: #f7f9fc;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.7;
}
</style>
