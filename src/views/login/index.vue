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
            <el-form-item v-if="role === 'tenant'" label="租户编号 / 子域名">
              <el-input v-model="pwdForm.tenantCode" placeholder="例如 acme-shop" autocomplete="organization" />
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
            <el-form-item v-if="role === 'tenant'" label="租户编号 / 子域名">
              <el-input v-model="smsForm.tenantCode" placeholder="例如 acme-shop" autocomplete="organization" />
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
        <el-link type="success" :underline="false" @click="openApply">申请入驻</el-link>
        <span class="hint-tip">
          <span v-if="role === 'platform'">默认平台账号: admin / admin123</span>
          <span v-else-if="isDev">本地演示租户: TEST001 / smokeadmin22 / admin123</span>
          <span v-else>请使用申请入驻时设置的租户编号、管理员账号和密码登录</span>
        </span>
      </div>
    </el-card>

    <!-- 忘记密码对话框 -->
    <el-dialog v-model="forgotDialog" title="重置密码" width="420px">
      <el-form :model="forgotForm" label-position="top">
        <el-form-item v-if="role === 'tenant'" label="租户编号 / 子域名">
          <el-input v-model="forgotForm.tenantCode" placeholder="例如 acme-shop" />
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

    <!-- 申请入驻对话框 -->
    <el-dialog v-model="applyDialog" title="申请入驻" width="560px" :close-on-click-modal="false">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
        title="提交后进入「待审核」状态，平台审核通过后即可登录。联系电话将作为管理员账号手机号，可用于短信登录 / 找回密码。"
      />
      <el-form :model="applyForm" label-position="top">
        <el-form-item label="公司名称" required>
          <el-input v-model="applyForm.company_name" maxlength="100" placeholder="营业执照上的全称" />
        </el-form-item>
        <el-form-item label="租户编号 / 子域名" required>
          <el-input v-model="applyForm.code" maxlength="30" placeholder="小写字母/数字/连字符，例如 acme-shop" />
        </el-form-item>
        <el-form-item label="品牌名">
          <el-input v-model="applyForm.brand_name" maxlength="100" placeholder="展示在小程序的品牌名称" />
        </el-form-item>
        <div class="apply-row">
          <el-form-item label="联系人" required style="flex:1">
            <el-input v-model="applyForm.contact_name" maxlength="50" />
          </el-form-item>
          <el-form-item label="联系邮箱" style="flex:1">
            <el-input v-model="applyForm.contact_email" maxlength="100" />
          </el-form-item>
        </div>
        <el-form-item label="联系电话（同管理员手机号）" required>
          <el-input v-model="applyForm.contact_phone" maxlength="20" />
        </el-form-item>
        <div class="apply-row">
          <el-form-item label="套餐" style="flex:1">
            <el-select v-model="applyForm.plan_id" placeholder="可选，默认平台推荐" clearable style="width: 100%">
              <el-option
                v-for="p in publicPlans"
                :key="p.id"
                :label="`${p.name} — ¥${Number(p.monthly_fee || 0)}/月 · ¥${Number(p.yearly_fee || 0)}/年`"
                :value="p.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="计费周期" style="flex:1">
            <el-select v-model="applyForm.billing_cycle" style="width: 100%">
              <el-option label="按年" value="yearly" />
              <el-option label="按月" value="monthly" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="管理员账号" required>
          <el-input v-model="applyForm.username" maxlength="50" placeholder="登录用户名" />
        </el-form-item>
        <div class="apply-row">
          <el-form-item label="登录密码" required style="flex:1">
            <el-input v-model="applyForm.password" type="password" show-password maxlength="50" placeholder="至少 6 位" />
          </el-form-item>
          <el-form-item label="再次输入密码" required style="flex:1">
            <el-input v-model="applyForm.confirm" type="password" show-password maxlength="50" placeholder="再次输入以确认" />
          </el-form-item>
        </div>
        <el-form-item label="手机号验证码" required>
          <div class="code-row">
            <el-input v-model="applyForm.verify_code" maxlength="6" placeholder="6 位验证码" />
            <el-button
              :disabled="applyCountdown > 0 || !applyForm.contact_phone"
              :loading="sending"
              @click="sendApplyCode"
            >
              {{ applyCountdown > 0 ? `${applyCountdown}s 后重试` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyDialog = false">取消</el-button>
        <el-button type="primary" :loading="applying" @click="submitApply">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
    applyTenant,
    platformLogin,
    platformLoginBySMS,
    platformResetPassword,
    resolveTenantByCode,
    sendVerifyCode,
    tenantLogin,
    tenantLoginBySMS,
    tenantResetPassword,
    type ApplyTenantBody,
    type VerifyPurpose,
} from '@/api/auth'
import { listPublicPlans, type Plan } from '@/api/plans'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const user = useUserStore()
const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const demoTenant = {
  tenantCode: 'TEST001',
  username: 'smokeadmin22',
  password: 'admin123',
  phone: '13900000001',
}

const role = ref<'platform' | 'tenant'>('platform')
const mode = ref<'password' | 'sms'>('password')
const loading = ref(false)
const sending = ref(false)
const resetting = ref(false)

const pwdForm = reactive({ username: 'admin', password: 'admin123', tenantCode: '' })
const smsForm = reactive({ phone: '', code: '', tenantCode: '' })

const smsCountdown = ref(0)
const forgotCountdown = ref(0)
const forgotDialog = ref(false)
const forgotForm = reactive({ phone: '', code: '', newPassword: '', confirm: '', tenantCode: '' })

watch(role, (next) => {
  if (!isDev) return
  if (next === 'platform') {
    pwdForm.username = 'admin'
    pwdForm.password = 'admin123'
    pwdForm.tenantCode = ''
    return
  }
  pwdForm.username = demoTenant.username
  pwdForm.password = demoTenant.password
  pwdForm.tenantCode = demoTenant.tenantCode
  smsForm.phone = smsForm.phone || demoTenant.phone
  smsForm.tenantCode = demoTenant.tenantCode
  forgotForm.phone = forgotForm.phone || demoTenant.phone
  forgotForm.tenantCode = demoTenant.tenantCode
})

// 申请入驻
const applyDialog = ref(false)
const applying = ref(false)
const applyCountdown = ref(0)
const publicPlans = ref<Plan[]>([])
const applyForm = reactive<ApplyTenantBody>({
  code: '',
  company_name: '',
  brand_name: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  plan_id: undefined,
  billing_cycle: 'yearly',
  username: '',
  password: '',
  confirm: '',
  verify_code: '',
})

function startCountdown(target: 'sms' | 'forgot' | 'apply') {
  const setter =
    target === 'sms' ? smsCountdown : target === 'forgot' ? forgotCountdown : applyCountdown
  setter.value = 60
  const timer = setInterval(() => {
    setter.value--
    if (setter.value <= 0) clearInterval(timer)
  }, 1000)
}

// 按租户编号解析出内部 ID（简单内存缓存，避免重复调用）
const tenantIdCache = new Map<string, number>()
async function resolveTid(code: string): Promise<number | null> {
  const key = (code || '').trim()
  if (!key) {
    ElMessage.warning('请输入租户编号')
    return null
  }
  if (tenantIdCache.has(key)) return tenantIdCache.get(key)!
  try {
    const t = await resolveTenantByCode(key)
    tenantIdCache.set(key, t.id)
    return t.id
  } catch {
    ElMessage.error('未找到该租户编号，请确认或联系平台')
    return null
  }
}

async function handleSendCode(phone: string, purpose: VerifyPurpose, tenantId: number, target: 'sms' | 'forgot' | 'apply') {
  if (!phone) {
    ElMessage.warning('请先填写手机号')
    return
  }
  sending.value = true
  try {
    const scope = target === 'apply' ? 'public' : role.value === 'platform' ? 'platform' : 'tenant'
    const tid = target !== 'apply' && role.value === 'tenant' ? tenantId : undefined
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

async function sendLoginCode() {
  let tid = 0
  if (role.value === 'tenant') {
    const r = await resolveTid(smsForm.tenantCode)
    if (!r) return
    tid = r
  }
  return handleSendCode(smsForm.phone, 'login', tid, 'sms')
}

async function sendForgotCode() {
  let tid = 0
  if (role.value === 'tenant') {
    const r = await resolveTid(forgotForm.tenantCode)
    if (!r) return
    tid = r
  }
  return handleSendCode(forgotForm.phone, 'reset_password', tid, 'forgot')
}

function sendApplyCode() {
  return handleSendCode(applyForm.contact_phone, 'apply', 0, 'apply')
}

async function openApply() {
  Object.assign(applyForm, {
    code: '',
    company_name: '',
    brand_name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    plan_id: undefined,
    billing_cycle: 'yearly',
    username: '',
    password: '',
    confirm: '',
    verify_code: '',
  })
  applyDialog.value = true
  if (!publicPlans.value.length) {
    try {
      publicPlans.value = await listPublicPlans()
    } catch {
      publicPlans.value = []
    }
  }
}

async function submitApply() {
  const f = applyForm
  if (!f.company_name || !f.code) return ElMessage.warning('请填写公司名称和租户编号')
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(f.code)) {
    return ElMessage.warning('租户编号仅支持小写字母/数字/连字符，长度 3-30')
  }
  if (!f.contact_name || !f.contact_phone) return ElMessage.warning('请填写联系人与联系电话')
  if (!f.username || !f.password) return ElMessage.warning('请填写管理员账号和密码')
  if (f.password.length < 6) return ElMessage.warning('管理员密码至少 6 位')
  if (f.password !== f.confirm) return ElMessage.warning('两次输入的密码不一致')
  if (!f.verify_code) return ElMessage.warning('请填写手机号验证码')
  applying.value = true
  try {
    await applyTenant({ ...f })
    ElMessage.success('提交成功：请等待平台审核；审核后登录商户后台，在“订阅付费”中创建订单并完成付款')
    applyDialog.value = false
  } finally {
    applying.value = false
  }
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
      const tid = await resolveTid(pwdForm.tenantCode)
      if (!tid) return
      const resp = await tenantLogin(pwdForm.username, pwdForm.password, tid)
      user.setSession(resp.token, resp.refresh_token, resp.admin, 'tenant', tid)
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
      const tid = await resolveTid(smsForm.tenantCode)
      if (!tid) return
      const resp = await tenantLoginBySMS(smsForm.phone, smsForm.code, tid)
      user.setSession(resp.token, resp.refresh_token, resp.admin, 'tenant', tid)
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
  forgotForm.tenantCode = pwdForm.tenantCode || ''
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
      const tid = await resolveTid(forgotForm.tenantCode)
      if (!tid) return
      await tenantResetPassword(forgotForm.phone, forgotForm.code, forgotForm.newPassword, tid)
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
  gap: 12px;
  .hint-tip { font-size: 12px; margin-left: auto; }
}
.apply-row {
  display: flex;
  gap: 12px;
}
</style>
