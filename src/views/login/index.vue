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

      <el-form :model="form" label-position="top" @submit.prevent="handleSubmit">
        <el-form-item v-if="role === 'tenant'" label="租户 ID">
          <el-input v-model.number="form.tenantId" placeholder="例如 1" type="number" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="用户名" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" placeholder="密码" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-button type="primary" :loading="loading" native-type="submit" class="submit">
          登录
        </el-button>
      </el-form>
      <div class="hint">
        <span v-if="role === 'platform'">默认平台账号: admin / admin123</span>
        <span v-else>商户端登录需传 X-Tenant-ID 请求头</span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { platformLogin, tenantLogin } from '@/api/auth'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const role = ref<'platform' | 'tenant'>('platform')
const loading = ref(false)
const form = reactive({ username: 'admin', password: 'admin123', tenantId: 1 })

async function handleSubmit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    if (role.value === 'platform') {
      const resp = await platformLogin(form.username, form.password)
      user.setSession(resp.token, resp.refresh_token, resp.admin, 'platform', 0)
    } else {
      if (!form.tenantId) {
        ElMessage.warning('请输入租户 ID')
        return
      }
      const resp = await tenantLogin(form.username, form.password, form.tenantId)
      user.setSession(resp.token, resp.refresh_token, resp.admin, 'tenant', form.tenantId)
    }
    const redirect = (route.query.redirect as string) || (role.value === 'platform' ? '/platform/dashboard' : '/admin/products')
    router.replace(redirect)
  } finally {
    loading.value = false
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
  width: 420px;
}
.card-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
}
.role {
  width: 100%;
  display: flex;
  margin-bottom: 20px;
  justify-content: center;
}
.submit {
  width: 100%;
}
.hint {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>
