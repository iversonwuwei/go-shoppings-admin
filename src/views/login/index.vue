<template>
  <div class="login-wrap">
    <el-card class="login-card" shadow="always">
      <template #header>
        <div class="card-title">SaaS 微信商城 · 管理后台</div>
      </template>

      <el-radio-group v-model="role" class="role" size="large">
        <el-radio-button label="platform">平台登录</el-radio-button>
        <el-radio-button label="tenant">商户登录</el-radio-button>
      </el-radio-group>

      <el-tabs v-model="mode" class="mode-tabs">
        <el-tab-pane label="密码登录" name="password">
          <el-form :model="pwdForm" label-position="top" @submit.prevent="submitPassword">
            <el-form-item v-if="role === 'tenant'" label="租户 ID">
              <el-input v-model.number="pwdForm.tenantId" placeholder="例如 1" type="number" />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="pwdForm.username" placeholder="用户名" autocomplete="username" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="pwdForm.password" placeholder="密码" type="password" show-password autocomplete="current-password" />
            </el-form-item>
            <el-button type="primary" :loading="loading" native-type="submit" class="submit">
              登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="短信登录" name="sms">
          <el-form :model="smsForm" label-position="top" @submit.prevent="submitSMSLogin">
            <el-form-item v-if="role === 'tenant'" label="租户 ID">
              <el-input v-model.number="smsForm.tenantId" placeholder="例如 1" type="number" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="smsForm.phone" placeholder="已绑定到管理员账号的手机号" maxlength="20" />
            </el-form-item>
            <el-form-item label="验证码">
              <div class="code-row">
                <el-input v-model="smsForm.code" placeholder="6 位验证码" maxlength="6" />
                <el-button :disabled="smsCountdown > 0 || !smsForm.phone" :loading="sending" @click="sendLoginCode">
                  {{ smsCountdown > 0 ? `${smsCountdown}s 后重试` : '发送验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-button type="primary" :loading="loading" native-type="submit" class="submit">
              登录
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="hint">
        <el-link type="primary" :underline="false" @click="openForgot">忘记密码？</el-link>
        <span class="hint-tip">
          <span v-if="role === 'platform'">默认平台账号: admin / admin123</span>
          <span v-else>商户端登录需传 X-Tenant-ID 请求头</span>
        </span>
      </div>
    </el-card>

    <!-- 忘记密码对话框 -->
    <el-dialog v-model="forgotDialog" title="重置密码" width="420px">
      <el-form :model="forgotForm" label-position="top">
        <el-form-item v-if="role === 'tenant'" label="租户 ID">
          <el-input v-model.number="forgotForm.tenantId" type="number" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="forgotForm.phone" placeholder="绑定管理员账号的手机号" />
        </el-form-item>
        <el-form-item label="验证码">
          <div class="code-row">
            <el-input v-model="forgotForm.code" maxlength="6" placeholder="6 位验证码" />
            <el-button :disabled="forgotCountdown > 0 || !forgotForm.phone" :loading="sending" @click="sendForgotCode">
              {{ forgotCountdown > 0 ? `${forgotCountdown}s 后重试` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="forgotForm.newPassword" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="再次输入">
          <el-input v-model="forgotForm.confirm" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="forgotDialog = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="submitReset">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
    platformLogin,
    platformLoginBySMS,
    platformResetPassword,
    sendVerifyCode,
    tenantLogin,
    tenantLoginBySMS,
    tenantResetPassword,
    type VerifyPurpose,
} from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const role = ref<'platform' | 'tenant'>('platform')
const mode = ref<'password' | 'sms'>('password')
const loading = ref(false)
const sending = ref(false)
const resetting = ref(false)

const pwdForm = reactive({ username: 'admin', password: 'admin123', tenantId: 1 })
const smsForm = reactive({ phone: '', code: '', tenantId: 1 })

const smsCountdown = ref(0)
const forgotCountdown = ref(0)
const forgotDialog = ref(false)
const forgotForm = reactive({ phone: '', code: '', newPassword: '', confirm: '', tenantId: 1 })

function startCountdown(target: 'sms' | 'forgot') {
  const setter = target === 'sms' ? smsCountdown : forgotCountdown
  setter.value = 60
  const timer = setInterval(() => {
    setter.value--
    if (setter.value <= 0) clearInterval(timer)
  }, 1000)
}

async function handleSendCode(phone: string, purpose: VerifyPurpose, tenantId: number, target: 'sms' | 'forgot') {
  if (!phone) {
    ElMessage.warning('请先填写手机号')
    return
  }
  sending.value = true
  try {
    const scope = role.value === 'platform' ? 'platform' : 'tenant'
    const tid = role.value === 'tenant' ? tenantId : undefined
    const r = await sendVerifyCode(phone, purpose, { scope, tenantId: tid })
    startCountdown(target)
    if (r?.dev_code) {
      ElMessage.success(`验证码已发送（联调：${r.dev_code}）`)
    } else {
      ElMessage.success('验证码已发送')
    }
  } finally {
    sending.value = false
  }
}

function sendLoginCode() {
  return handleSendCode(smsForm.phone, 'login', smsForm.tenantId, 'sms')
}

function sendForgotCode() {
  return handleSendCode(forgotForm.phone, 'reset_password', forgotForm.tenantId, 'forgot')
}

async function submitPassword() {
  if (!pwdForm.username || !pwdForm.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    if (role.value === 'platform') {
      const resp = await platformLogin(pwdForm.username, pwdForm.password)
      user.setSession(resp.token, resp.refresh_token, resp.admin, 'platform', 0)
    } else {
      if (!pwdForm.tenantId) {
        ElMessage.warning('请输入租户 ID')
        return
      }
      const resp = await tenantLogin(pwdForm.username, pwdForm.password, pwdForm.tenantId)
      user.setSession(resp.token, resp.refresh_token, resp.admin, 'tenant', pwdForm.tenantId)
    }
    redirectAfterLogin()
  } finally {
    loading.value = false
  }
}

async function submitSMSLogin() {
  if (!smsForm.phone || !smsForm.code) {
    ElMessage.warning('请填写手机号和验证码')
    return
  }
  loading.value = true
  try {
    if (role.value === 'platform') {
      const resp = await platformLoginBySMS(smsForm.phone, smsForm.code)
      user.setSession(resp.token, resp.refresh_token, resp.admin, 'platform', 0)
    } else {
      if (!smsForm.tenantId) {
        ElMessage.warning('请输入租户 ID')
        return
      }
      const resp = await tenantLoginBySMS(smsForm.phone, smsForm.code, smsForm.tenantId)
      user.setSession(resp.token, resp.refresh_token, resp.admin, 'tenant', smsForm.tenantId)
    }
    redirectAfterLogin()
  } finally {
    loading.value = false
  }
}

function redirectAfterLogin() {
  const redirect = (route.query.redirect as string) || (role.value === 'platform' ? '/platform/dashboard' : '/admin/products')
  router.replace(redirect)
}

function openForgot() {
  forgotForm.phone = ''
  forgotForm.code = ''
  forgotForm.newPassword = ''
  forgotForm.confirm = ''
  forgotForm.tenantId = pwdForm.tenantId || 1
  forgotDialog.value = true
}

async function submitReset() {
  if (!forgotForm.phone || !forgotForm.code || !forgotForm.newPassword) {
    ElMessage.warning('请填写手机号、验证码和新密码')
    return
  }
  if (forgotForm.newPassword.length < 6) {
    ElMessage.warning('新密码至少 6 位')
    return
  }
  if (forgotForm.newPassword !== forgotForm.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  resetting.value = true
  try {
    if (role.value === 'platform') {
      await platformResetPassword(forgotForm.phone, forgotForm.code, forgotForm.newPassword)
    } else {
      if (!forgotForm.tenantId) {
        ElMessage.warning('请输入租户 ID')
        return
      }
      await tenantResetPassword(forgotForm.phone, forgotForm.code, forgotForm.newPassword, forgotForm.tenantId)
    }
    ElMessage.success('密码已重置，请使用新密码登录')
    forgotDialog.value = false
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped lang="scss">
.login-wrap {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  width: 460px;
}
.card-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}
.role {
  width: 100%;
  display: flex;
  margin-bottom: 12px;
  justify-content: center;
}
.mode-tabs :deep(.el-tabs__header) { margin-bottom: 16px; }
.submit { width: 100%; margin-top: 4px; }
.code-row {
  display: flex;
  gap: 8px;
  .el-input { flex: 1; }
}
.hint {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
  .hint-tip { font-size: 12px; }
}
</style>
